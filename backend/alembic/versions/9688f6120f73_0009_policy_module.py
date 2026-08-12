"""0009 policy module

Revision ID: 9688f6120f73
Revises: 0008
Create Date: 2026-08-12 14:33:04.944447

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '9688f6120f73'
down_revision: Union[str, Sequence[str], None] = '0008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'policies',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('ministry_id', sa.Uuid(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('current_approval_step', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(length=255), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('confidence', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=True),
        sa.Column('updated_by', sa.Uuid(), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('jurisdiction_id', sa.Uuid(), nullable=True),
        sa.Column('institution_id', sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(['ministry_id'], ['ministries.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'policy_approvals',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('policy_id', sa.Uuid(), nullable=False),
        sa.Column('approver_id', sa.Uuid(), nullable=True),
        sa.Column('approval_step', sa.Integer(), nullable=False),
        sa.Column('step_name', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('decided_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['approver_id'], ['users.id']),
        sa.ForeignKeyConstraint(['policy_id'], ['policies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'policy_evaluations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('policy_id', sa.Uuid(), nullable=False),
        sa.Column('evaluator_id', sa.Uuid(), nullable=True),
        sa.Column('effectiveness_score', sa.Integer(), nullable=True),
        sa.Column('efficiency_score', sa.Integer(), nullable=True),
        sa.Column('impact_summary', sa.Text(), nullable=True),
        sa.Column('recommendations', sa.Text(), nullable=True),
        sa.Column('evaluated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['evaluator_id'], ['users.id']),
        sa.ForeignKeyConstraint(['policy_id'], ['policies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'policy_implementations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('policy_id', sa.Uuid(), nullable=False),
        sa.Column('milestone', sa.String(length=300), nullable=False),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('completion_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('budget_utilized', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['policy_id'], ['policies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'policy_indicators',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('policy_id', sa.Uuid(), nullable=False),
        sa.Column('indicator_name', sa.String(length=150), nullable=False),
        sa.Column('target_value', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('current_value', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('unit', sa.String(length=50), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('source', sa.String(length=255), nullable=False),
        sa.Column('confidence', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['policy_id'], ['policies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'policy_reviews',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('policy_id', sa.Uuid(), nullable=False),
        sa.Column('reviewer_id', sa.Uuid(), nullable=True),
        sa.Column('review_round', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['policy_id'], ['policies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('policy_reviews')
    op.drop_table('policy_indicators')
    op.drop_table('policy_implementations')
    op.drop_table('policy_evaluations')
    op.drop_table('policy_approvals')
    op.drop_table('policies')