"""Server-owned plan configuration and atomic daily usage reservations."""
import json
import os
from datetime import datetime, timezone
from time import time

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from extended_models import Plan, Subscription, UsageBucket


def plans(db: Session | None = None) -> list[dict]:
    catalog = [{"slug": "explorer", "title": "Free Explorer", "amount_minor": 0, "currency": "usd", "interval": "month", "features": {"lab.run": 30, "report.pdf": 5, "batch.run": 0, "class.dashboard": 0}, "price_id": None}]
    configured = json.loads(os.getenv("QUANTUMWALK_PAID_PLANS", "[]"))
    if db is not None:
        saved = list(db.scalars(select(Plan)))
        if saved:
            configured = [row.configuration for row in saved]
    for plan in configured:
        if (not isinstance(plan, dict) or not isinstance(plan.get("slug"), str) or plan["slug"] == "explorer" or not isinstance(plan.get("amount_minor"), int) or plan["amount_minor"] <= 0 or plan.get("interval") not in ("month", "year") or not isinstance(plan.get("currency"), str) or len(plan["currency"]) != 3 or not isinstance(plan.get("features"), dict) or any(not isinstance(v, int) or v < 0 for v in plan["features"].values()) or not isinstance(plan.get("price_id"), str) or not plan["price_id"].startswith("price_")):
            raise RuntimeError("Invalid paid plan configuration")
        catalog.append(plan)
    return catalog


def active_plan(db: Session, user_id: str) -> dict:
    subscription = db.scalar(select(Subscription).where(Subscription.owner_user_id == user_id))
    if subscription and subscription.status in ("active", "trialing", "institution_granted") and subscription.period_end > time():
        return next((p for p in plans(db) if p["slug"] == subscription.plan_slug), plans(db)[0])
    return plans(db)[0]


def consume(db: Session, user_id: str, feature: str, units: int = 1):
    limit = active_plan(db, user_id)["features"].get(feature, 0)
    if units < 1 or units > limit:
        raise HTTPException(403, "This feature is outside your current plan allowance")
    period = datetime.now(timezone.utc).date().isoformat()
    key = (user_id, feature, period)
    if db.get(UsageBucket, key) is None:
        try:
            with db.begin_nested():
                db.add(UsageBucket(user_id=user_id, feature=feature, period=period, used=0))
                db.flush()
        except IntegrityError:
            pass
    statement = update(UsageBucket).where(UsageBucket.user_id == user_id, UsageBucket.feature == feature, UsageBucket.period == period, UsageBucket.used <= limit - units).values(used=UsageBucket.used + units)
    if db.execute(statement).rowcount != 1:
        raise HTTPException(429, "Daily allowance reached. It resets at 00:00 UTC")


def usage(db: Session, user_id: str) -> dict:
    period = datetime.now(timezone.utc).date().isoformat()
    return {row.feature: row.used for row in db.scalars(select(UsageBucket).where(UsageBucket.user_id == user_id, UsageBucket.period == period))}
