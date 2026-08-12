"""0011 add registered_voters to constituency

Revision ID: 42cf5cee5714
Revises: be56cdbfd34f
Create Date: 2026-08-12 ...

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '42cf5cee5714'
down_revision: Union[str, Sequence[str], None] = 'be56cdbfd34f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'constituencies',
        sa.Column('registered_voters', sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('constituencies', 'registered_voters')