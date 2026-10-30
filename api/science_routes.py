"""Public bounded science previews; persistence is separate and owner scoped."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from auth import get_db
from extended_models import LabDefinition

from limits import enforce_rate, simulation_slot
from science_models import LABS, ScienceRequest, definition, run_model

router = APIRouter(prefix="/api/science")


def published_definition(slug, record):
    base = definition(LABS[slug])
    if not record or record.version != LABS[slug].version:
        return base
    published = record.content.get("published", {})
    return {**base, **published, "content_version": record.content.get("published_version", 0), "review_status": record.status}


@router.get("/labs")
def catalog(db: Session = Depends(get_db)):
    records = {row.slug: row for row in db.scalars(select(LabDefinition))}
    return [published_definition(slug, records.get(slug)) for slug in LABS if slug not in records or records[slug].status != "retired"]


@router.get("/labs/{slug}")
def detail(slug: str, db: Session = Depends(get_db)):
    if slug not in LABS:
        raise HTTPException(404, "Lab not found")
    record = db.scalar(select(LabDefinition).where(LabDefinition.slug == slug))
    if record and record.status == "retired":
        raise HTTPException(404, "Lab not available")
    return published_definition(slug, record)


@router.post("/labs/{slug}/run")
def run(slug: str, body: ScienceRequest, request: Request, db: Session = Depends(get_db)):
    if slug not in LABS:
        raise HTTPException(404, "Lab not found")
    card = detail(slug, db)
    enforce_rate(request, "science-demo", 20)
    try:
        with simulation_slot():
            result = run_model(slug, body)
            result["model_card"] = card
            return result
    except ValueError as error:
        raise HTTPException(422, str(error)) from None
