"""Discovery objects derived only from the learner's validated mission evidence."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import AuthContext, current_auth, get_db
from database import utc_value
from extended_models import MissionEvent
from laboratory_routes import PREREQUISITES
from science_models import LABS

router = APIRouter(prefix="/api/v1/discovery")
OBJECTS = (
    ("double-slit", "Interference laboratory", 18, 18),
    ("tunnelling", "Tunnelling gateway", 50, 18),
    ("hydrogen", "Hydrogen cloud", 82, 18),
    ("oscillator", "Oscillator chamber", 18, 50),
    ("bell", "Bell bridge", 50, 50),
    ("lensing", "Gravitational lens", 82, 50),
    ("fusion", "Fusion core", 18, 82),
    ("spectrum", "Spectrum prism", 50, 82),
    ("cosmic-structure", "Cosmic web", 82, 82),
)


@router.get("/universe")
def universe(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    evidence = {row.mission_slug: row for row in db.scalars(select(MissionEvent).where(
        MissionEvent.user_id == auth.user.id, MissionEvent.completed.is_(True)
    ))}
    objects = []
    for slug, title, x, y in OBJECTS:
        prerequisite = PREREQUISITES.get(slug)
        discovered = slug in evidence
        state = "discovered" if discovered else "locked" if prerequisite and prerequisite not in evidence else "available"
        objects.append({
            "id": slug, "title": title, "concept": LABS[slug].title,
            "domain": LABS[slug].domain, "position": {"x": x, "y": y}, "state": state,
            "prerequisite": prerequisite,
            "criteria": "Complete the experiment, correct checkpoint and evidence-based reflection.",
            "requirement": f"First master {LABS[prerequisite].title}." if state == "locked" else "Your validated mission evidence reveals this discovery.",
            "discovered_at": utc_value(evidence[slug].created_at) if discovered else None,
            "href": f"/lab/{slug}",
        })
    return {"version": 1, "discovered": sum(item["state"] == "discovered" for item in objects),
            "total": len(objects), "objects": objects,
            "note": "Concept map, not a physical map of the universe. Opening an object does not award mastery or XP."}
