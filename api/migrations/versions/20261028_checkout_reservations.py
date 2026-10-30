"""Prevent concurrent duplicate checkout sessions for one account.

Revision ID: 20261028_checkout
Revises: 20261028_srs
"""
from alembic import op
import sqlalchemy as sa

revision = "20261028_checkout"
down_revision = "20261028_srs"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("checkout_intents",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("request_key", sa.String(80), nullable=False, unique=True),
        sa.Column("plan_slug", sa.String(40), nullable=False),
        sa.Column("expires_at", sa.Integer(), nullable=False),
        sa.Column("checkout_url", sa.String(1000), nullable=True))


def downgrade():
    op.drop_table("checkout_intents")
