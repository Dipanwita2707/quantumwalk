"""Private by default leaderboard consent.

Revision ID: 20261028_consent
Revises: 20261028_checkout
"""
from alembic import op
import sqlalchemy as sa

revision = "20261028_consent"
down_revision = "20261028_checkout"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("user_preferences", sa.Column("leaderboard_opt_in", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    with op.batch_alter_table("user_preferences") as batch:
        batch.drop_column("leaderboard_opt_in")
