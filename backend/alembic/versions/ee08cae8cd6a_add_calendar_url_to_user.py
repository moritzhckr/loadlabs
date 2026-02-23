"""add_calendar_url_to_user

Revision ID: ee08cae8cd6a
Revises: 980a207ecda8
Create Date: 2026-02-23 21:43:21.238410

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee08cae8cd6a'
down_revision: Union[str, Sequence[str], None] = '980a207ecda8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('calendar_url', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    pass
