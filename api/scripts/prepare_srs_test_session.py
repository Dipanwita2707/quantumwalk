"""Create synthetic browser credentials only in the workspace's isolated preview DB."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlalchemy import select
from sqlalchemy.engine import make_url

from auth import create_session
from database import SessionLocal, User, database_url


def main():
    root = Path(__file__).resolve().parents[2]
    isolated = (root / ".preview").resolve()
    url = make_url(database_url)
    if url.drivername != "sqlite" or not url.database or not Path(url.database).resolve().is_relative_to(isolated):
        raise SystemExit("Refusing to create test credentials outside .preview SQLite databases")
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == "srs-browser@example.test"))
        if user is None:
            user = User(display_name="Reference Learner", email="srs-browser@example.test")
            db.add(user); db.commit()
        token = create_session(db, user)
    cookie = {"name": "qw_session", "value": token, "domain": "localhost", "path": "/", "httpOnly": True, "secure": False, "sameSite": "Lax"}
    isolated.mkdir(exist_ok=True)
    (isolated / "srs-test-cookie.json").write_text(json.dumps(cookie), encoding="utf-8")
    print("Prepared an isolated synthetic session. Credentials were written only under .preview.")


if __name__ == "__main__":
    main()
