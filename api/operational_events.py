"""Small redacted incident records; never store prediction text or raw exceptions."""
import logging
from sqlalchemy.exc import SQLAlchemyError
from extended_models import AuditEvent


def record_simulation_failure(db, user_id, slug, status, code):
    db.rollback()
    try:
        db.add(AuditEvent(actor_user_id=user_id, action="quota.denied" if status in (403, 429) else "simulation.failed",
                          target_id=slug, details={"status": status, "code": code}))
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logging.getLogger("uvicorn.error").warning("Unable to persist a redacted simulation incident")
