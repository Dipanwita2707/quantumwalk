"""Approved additive completion schema; preserve all existing product data."""
import json
from pathlib import Path
from alembic import op
import sqlalchemy as sa

revision = "20261030_completion"
down_revision = "20261028_consent"
branch_labels = None
depends_on = None


def frozen_metadata():
    snapshot = json.loads(Path(__file__).with_suffix(".json").read_text())
    metadata = sa.MetaData()
    for table in snapshot:
        columns = []
        for column in table["columns"]:
            constructor = getattr(sa, column["type"])
            datatype = constructor(column["length"]) if column.get("length") else constructor(timezone=column["timezone"]) if column["type"] == "DateTime" else constructor()
            foreign = [sa.ForeignKey(column["foreign_key"], ondelete=column["ondelete"])] if column["foreign_key"] else []
            columns.append(sa.Column(column["name"], datatype, *foreign, primary_key=column["primary_key"], nullable=column["nullable"]))
        constraints = [sa.UniqueConstraint(*values, name=name) for name, values in table["unique"]]
        constraints.extend(sa.CheckConstraint(expression, name=name) for name, expression in table["checks"])
        target = sa.Table(table["name"], metadata, *columns, *constraints)
        for name, values, unique in table["indexes"]:
            sa.Index(name, *(target.c[value] for value in values), unique=unique)
    for name in ("users", "assignments", "submissions", "lab_runs"):
        sa.Table(name, metadata, sa.Column("id", sa.String(36), primary_key=True))
    return metadata, {table["name"] for table in snapshot}


def upgrade():
    metadata, names = frozen_metadata()
    metadata.create_all(op.get_bind(), tables=[table for table in metadata.sorted_tables if table.name in names], checkfirst=False)


def downgrade():
    metadata, names = frozen_metadata()
    metadata.drop_all(op.get_bind(), tables=[table for table in reversed(metadata.sorted_tables) if table.name in names], checkfirst=False)
