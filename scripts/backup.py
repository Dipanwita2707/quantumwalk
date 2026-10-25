"""Create an application-schema PostgreSQL archive without logging credentials."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from urllib.parse import parse_qs, unquote, urlsplit

from dotenv import load_dotenv


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    dump = shutil.which("pg_dump")
    restore = shutil.which("pg_restore")
    if not dump or not restore:
        print(json.dumps({"status": "blocked", "reason": "Install PostgreSQL client tools: pg_dump and pg_restore"}))
        return 2
    parts = urlsplit(os.getenv("DATABASE_URL", "").replace("postgresql+psycopg://", "postgresql://", 1))
    if parts.scheme != "postgresql" or not parts.hostname or not parts.path.strip("/"):
        print(json.dumps({"status": "blocked", "reason": "A PostgreSQL DATABASE_URL is required"}))
        return 2
    output = args.output.resolve()
    if output.exists() or output.with_suffix(output.suffix + ".sha256").exists() or not output.parent.is_dir():
        print(json.dumps({"status": "blocked", "reason": "Use a new archive filename in an existing restricted backup directory"}))
        return 2
    task_env = os.environ.copy()
    for key in ("PGSERVICE", "PGSERVICEFILE", "PGOPTIONS"):
        task_env.pop(key, None)
    task_env.update({"PGHOST": parts.hostname, "PGPORT": str(parts.port or 5432),
                     "PGDATABASE": unquote(parts.path.lstrip("/")), "PGUSER": unquote(parts.username or ""),
                     "PGPASSWORD": unquote(parts.password or ""), "PGCONNECT_TIMEOUT": "10",
                     "PGSSLMODE": parse_qs(parts.query).get("sslmode", ["require"])[0]})
    try:
        # Reserve the filename first, preventing accidental overwrite of existing backups.
        with output.open("xb") as archive:
            result = subprocess.run([dump, "--format=custom", "--schema=public", "--no-acl", "--no-password"],
                                    env=task_env, stdout=archive, stderr=subprocess.PIPE, timeout=300, check=False)
        if result.returncode:
            print(json.dumps({"status": "failed", "reason": "Database export failed; archive is incomplete"}))
            return 1
        listing = subprocess.run([restore, "--list", str(output)], stdout=subprocess.DEVNULL,
                                 stderr=subprocess.PIPE, timeout=30, check=False)
        if listing.returncode:
            print(json.dumps({"status": "failed", "reason": "Archive validation failed"}))
            return 1
        with output.open("rb") as archive:
            digest = hashlib.file_digest(archive, "sha256").hexdigest()
        output.with_suffix(output.suffix + ".sha256").write_text(digest + "\n", encoding="ascii")
        print(json.dumps({"status": "archive_created", "bytes": output.stat().st_size,
                          "sha256": digest, "restore_rehearsal": "not_performed", "warnings_present": bool(result.stderr)}))
        return 0
    except (OSError, subprocess.TimeoutExpired, ValueError):
        print(json.dumps({"status": "failed", "reason": "Backup could not finish; any output archive may be incomplete"}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
