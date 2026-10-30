"""Stripe-hosted subscriptions. Redirects never grant entitlements."""
import hashlib
import hmac
import json
import os
import time
import secrets
from urllib.parse import urlsplit

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import AuthContext, current_auth, get_db, require_csrf
from database import User
from entitlements import active_plan, plans, usage
from extended_models import AuditEvent, CheckoutIntent, PaymentEvent, Subscription
from limits import enforce_rate
from settings import frontend_origin

router = APIRouter(prefix="/api/v1")


async def stripe(method: str, path: str, data=None, idempotency_key=None):
    secret = os.getenv("STRIPE_SECRET_KEY", "")
    if not secret:
        raise HTTPException(503, "Payments are not configured on this server")
    headers = {"Authorization": f"Bearer {secret}", "Stripe-Version": "2025-04-30.basil"}
    if idempotency_key:
        headers["Idempotency-Key"] = idempotency_key
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.request(method, "https://api.stripe.com/v1/" + path, data=data, headers=headers)
        if not response.is_success:
            raise HTTPException(502, "The payment provider could not complete this request")
        return response.json()
    except httpx.HTTPError:
        raise HTTPException(503, "The payment provider is temporarily unavailable") from None


@router.get("/plans")
def catalog(db: Session = Depends(get_db)):
    return {"configured": bool(os.getenv("STRIPE_SECRET_KEY") and os.getenv("STRIPE_WEBHOOK_SECRET")), "plans": [{k: v for k, v in plan.items() if k != "price_id"} for plan in plans(db)]}


class CheckoutInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    plan: str = Field(max_length=40)
    request_key: str = Field(min_length=16, max_length=80, pattern=r"^[A-Za-z0-9_-]+$")


@router.post("/billing/checkout")
async def checkout(body: CheckoutInput, request: Request, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    enforce_rate(request, "checkout", 5)
    plan = next((p for p in plans(db) if p["slug"] == body.plan and p["price_id"]), None)
    if not plan or not os.getenv("STRIPE_WEBHOOK_SECRET"):
        raise HTTPException(503, "This subscription is not available for checkout")
    subscription = db.scalar(select(Subscription).where(Subscription.owner_user_id == auth.user.id))
    if subscription and subscription.status in ("active", "trialing", "past_due"):
        raise HTTPException(409, "Manage your existing subscription before starting another")
    price = await stripe("GET", "prices/" + plan["price_id"])
    if price.get("unit_amount") != plan["amount_minor"] or price.get("currency") != plan["currency"] or price.get("recurring", {}).get("interval") != plan["interval"] or not price.get("active"):
        raise HTTPException(503, "Plan pricing needs to be reconciled with the payment provider")
    intent = db.get(CheckoutIntent, auth.user.id)
    if intent and intent.expires_at <= int(time.time()):
        db.delete(intent); db.flush(); intent = None
    if not intent:
        intent = CheckoutIntent(user_id=auth.user.id, request_key=secrets.token_urlsafe(24), plan_slug=plan["slug"], expires_at=int(time.time()) + 1800)
        try:
            db.add(intent); db.commit()
        except IntegrityError:
            db.rollback(); intent = db.get(CheckoutIntent, auth.user.id)
    if not intent or intent.plan_slug != plan["slug"]:
        raise HTTPException(409, "An unfinished checkout for another plan is still active. It expires within 30 minutes")
    if intent.checkout_url:
        return {"url": intent.checkout_url}
    session = await stripe("POST", "checkout/sessions", {
        "mode": "subscription", "line_items[0][price]": plan["price_id"], "line_items[0][quantity]": "1",
        "client_reference_id": auth.user.id, "subscription_data[metadata][user_id]": auth.user.id,
        "success_url": frontend_origin + "/billing?checkout=returned", "cancel_url": frontend_origin + "/pricing?checkout=cancelled",
        "expires_at": str(intent.expires_at),
    }, f"checkout-{auth.user.id}-{intent.request_key}")
    url = session.get("url", "")
    if urlsplit(url).scheme != "https" or urlsplit(url).hostname != "checkout.stripe.com":
        raise HTTPException(502, "The payment provider returned an invalid checkout link")
    intent.checkout_url = url; db.commit()
    return {"url": url}


@router.get("/billing/subscription")
def status(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    subscription = db.scalar(select(Subscription).where(Subscription.owner_user_id == auth.user.id))
    return {"plan": {k: v for k, v in active_plan(db, auth.user.id).items() if k != "price_id"}, "status": subscription.status if subscription else "free", "period_end": subscription.period_end if subscription else None, "cancel_at_period_end": subscription.cancel_at_period_end if subscription else False, "usage": usage(db, auth.user.id), "reset": "00:00 UTC"}


@router.post("/billing/cancel")
async def cancel(auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    subscription = db.scalar(select(Subscription).where(Subscription.owner_user_id == auth.user.id))
    if not subscription:
        raise HTTPException(404, "No paid subscription exists")
    if subscription.status == "institution_granted":
        raise HTTPException(403, "Contact your institution administrator to change institutional access")
    await stripe("POST", "subscriptions/" + subscription.provider_id, {"cancel_at_period_end": "true"})
    # Access/status is updated by a verified provider webhook, not the button response.
    return {"status": "requested", "message": "Cancellation requested. Provider-confirmed status will appear after the webhook arrives."}


@router.post("/billing/webhook")
async def webhook(request: Request, db: Session = Depends(get_db)):
    secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    if not secret:
        raise HTTPException(503, "Webhook verification is not configured")
    raw = await request.body()
    pairs = [part.split("=", 1) for part in request.headers.get("Stripe-Signature", "").split(",") if "=" in part]
    timestamps = [value for key, value in pairs if key == "t"]
    try:
        timestamp = int(timestamps[0])
    except (ValueError, IndexError):
        raise HTTPException(400, "Invalid webhook signature") from None
    expected = hmac.new(secret.encode(), str(timestamp).encode() + b"." + raw, hashlib.sha256).hexdigest()
    if abs(time.time() - timestamp) > 300 or not any(key == "v1" and hmac.compare_digest(value, expected) for key, value in pairs):
        raise HTTPException(400, "Invalid webhook signature")
    try:
        event = json.loads(raw)
        event_id, kind = event["id"], event["type"]
        if not isinstance(event_id, str) or len(event_id) > 120 or not isinstance(kind, str) or len(kind) > 80:
            raise ValueError()
    except (ValueError, KeyError, TypeError):
        raise HTTPException(400, "Invalid webhook event") from None
    if db.scalar(select(PaymentEvent).where(PaymentEvent.provider_event_id == event_id)):
        return {"received": True, "duplicate": True}
    if kind.startswith("customer.subscription."):
        resource = event.get("data", {}).get("object", {})
        provider_id = resource.get("id", "")
        if not isinstance(provider_id, str) or not provider_id.startswith("sub_") or len(provider_id) > 120:
            raise HTTPException(400, "Invalid subscription event")
        # Retrieve current provider state to avoid granting stale/out-of-order entitlements.
        live = await stripe("GET", "subscriptions/" + provider_id)
        user_id = live.get("metadata", {}).get("user_id")
        if not isinstance(user_id, str) or db.get(User, user_id) is None:
            raise HTTPException(400, "Subscription owner could not be resolved")
        items = live.get("items", {}).get("data", [])
        price_id = items[0].get("price", {}).get("id") if items else None
        plan = next((p for p in plans(db) if p["price_id"] and p["price_id"] == price_id), None)
        if not plan:
            raise HTTPException(400, "Subscription price is not configured")
        record = db.scalar(select(Subscription).where(Subscription.owner_user_id == user_id).with_for_update())
        if not record:
            record = Subscription(owner_user_id=user_id, provider_id=provider_id); db.add(record)
        elif record.provider_id != provider_id:
            raise HTTPException(409, "Subscription reconciliation required")
        record.customer_id = live["customer"]; record.plan_slug = plan["slug"]; record.status = live["status"]
        record.period_end = live.get("current_period_end") or max((item.get("current_period_end", 0) for item in items), default=0)
        record.cancel_at_period_end = bool(live.get("cancel_at_period_end"))
        db.add(AuditEvent(actor_user_id=None, action="billing.subscription_sync", target_id=record.id or provider_id, details={"status": record.status, "plan": record.plan_slug}))
    db.add(PaymentEvent(provider_event_id=event_id, event_type=kind, provider_created=int(event.get("created", timestamp))))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if not db.scalar(select(PaymentEvent).where(PaymentEvent.provider_event_id == event_id)):
            raise HTTPException(409, "Billing event needs reconciliation") from None
    return {"received": True}
