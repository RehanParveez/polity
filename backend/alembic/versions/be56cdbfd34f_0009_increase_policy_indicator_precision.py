"""0009 increase policy_indicator precision

Revision ID: be56cdbfd34f
Revises: 9688f6120f73
Create Date: 2026-08-12 14:43:04.619453

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'be56cdbfd34f'
down_revision: Union[str, Sequence[str], None] = '9688f6120f73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'policy_indicators',
        'target_value',
        existing_type=sa.Numeric(precision=10, scale=2),
        type_=sa.Numeric(precision=15, scale=2),
        existing_nullable=False,
    )
    op.alter_column(
        'policy_indicators',
        'current_value',
        existing_type=sa.Numeric(precision=10, scale=2),
        type_=sa.Numeric(precision=15, scale=2),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        'policy_indicators',
        'current_value',
        existing_type=sa.Numeric(precision=15, scale=2),
        type_=sa.Numeric(precision=10, scale=2),
        existing_nullable=False,
    )
    op.alter_column(
        'policy_indicators',
        'target_value',
        existing_type=sa.Numeric(precision=15, scale=2),
        type_=sa.Numeric(precision=10, scale=2),
        existing_nullable=False,
    )