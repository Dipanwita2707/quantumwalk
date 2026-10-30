"""Add SRS laboratory, notebook, billing, organization and identity tables.

Revision ID: 20261028_srs
Revises: cb150cf3a553
"""
from alembic import op
from sqlalchemy import MetaData

revision = "20261028_srs"
down_revision = "cb150cf3a553"
branch_labels = None
depends_on = None


def new_metadata():
    # Importing current ORM definitions would make historical migrations drift.
    # The frozen schema snapshot is maintained alongside this migration.
    from pathlib import Path
    import json
    import sqlalchemy as sa
    metadata = MetaData()
    snapshot = json.loads(Path(__file__).with_suffix(".json").read_text())
    for table in snapshot:
        columns = []
        for column in table["columns"]:
            kind = column["type"]
            datatype = getattr(sa, kind)(column["length"]) if column.get("length") else getattr(sa, kind)()
            args = [sa.ForeignKey(column["foreign_key"], ondelete=column["ondelete"])] if column.get("foreign_key") else []
            columns.append(sa.Column(column["name"], datatype, *args, primary_key=column["primary_key"], nullable=column["nullable"]))
        constraints = [sa.UniqueConstraint(*values, name=name) for name, values in table["unique"]]
        constraints += [sa.CheckConstraint(expression, name=name) for name, expression in table["checks"]]
        target = sa.Table(table["name"], metadata, *columns, *constraints)
        for name, values, unique in table["indexes"]:
            sa.Index(name, *(target.c[value] for value in values), unique=unique)
    # Resolve references to pre-existing users without including it in the upgrade.
    sa.Table("users", metadata, sa.Column("id", sa.String(36), primary_key=True))
    return metadata


def upgrade():
    metadata = new_metadata()
    tables = [table for table in metadata.sorted_tables if table.name != "users"]
    metadata.create_all(op.get_bind(), tables=tables, checkfirst=False)


def downgrade():
    metadata = new_metadata()
    tables = [table for table in reversed(metadata.sorted_tables) if table.name != "users"]
    metadata.drop_all(op.get_bind(), tables=tables, checkfirst=False)
