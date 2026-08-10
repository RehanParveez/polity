"""0006 government_formation

Revision ID: ca50000932fa
Revises: 9b63f4e9655b
Create Date: 2026-08-10 17:46:41.124069

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'ca50000932fa'
down_revision = '9b63f4e9655b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'governments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('election_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('formed_date', sa.Date(), nullable=False),
        sa.Column('dissolved_date', sa.Date(), nullable=True),
        sa.Column('head_of_state_name', sa.String(length=150), nullable=True),
        sa.Column('head_of_government_name', sa.String(length=150), nullable=True),
        sa.Column('head_of_state_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('head_of_government_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['election_id'], ['elections.id']),
        sa.ForeignKeyConstraint(['head_of_government_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['head_of_state_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'cabinet_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('government_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('ministry_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('portfolio', sa.String(length=200), nullable=False),
        sa.Column('oath_taken', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['government_id'], ['governments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ministry_id'], ['ministries.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('cabinet_members')
    op.drop_table('governments')