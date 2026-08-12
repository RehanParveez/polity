"""0008 sectors

Revision ID: 0008
Revises: 96e55625fb3c
Create Date: 2026-08-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0008'
down_revision = '96e55625fb3c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('education_institutions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('institution_type', sa.String(length=50), nullable=False),
        sa.Column('district_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('enrollment_count', sa.Integer(), nullable=False),
        sa.Column('teacher_count', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('source', sa.String(length=255), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('confidence', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['district_id'], ['districts.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('healthcare_institutions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('facility_type', sa.String(length=50), nullable=False),
        sa.Column('district_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bed_count', sa.Integer(), nullable=False),
        sa.Column('staff_count', sa.Integer(), nullable=False),
        sa.Column('daily_patient_capacity', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('source', sa.String(length=255), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('confidence', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['district_id'], ['districts.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('farms',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('district_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('area_hectares', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('primary_crop', sa.String(length=100), nullable=False),
        sa.Column('annual_yield_tons', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('irrigation_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('source', sa.String(length=255), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('confidence', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['district_id'], ['districts.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('infrastructure_assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('asset_type', sa.String(length=50), nullable=False),
        sa.Column('district_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('length_km_or_capacity', sa.String(length=100), nullable=False),
        sa.Column('condition_rating', sa.String(length=20), nullable=False),
        sa.Column('year_constructed', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('source', sa.String(length=255), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('confidence', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['district_id'], ['districts.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('labor_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('district_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_workforce', sa.Integer(), nullable=False),
        sa.Column('employed_count', sa.Integer(), nullable=False),
        sa.Column('unemployed_count', sa.Integer(), nullable=False),
        sa.Column('unemployment_rate_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('minimum_wage_pkr', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('dominant_sectors', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('source', sa.String(length=255), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('confidence', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['district_id'], ['districts.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('defense_ministries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ministry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_personnel_summary', sa.Integer(), nullable=False),
        sa.Column('annual_budget_summary', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('training_completion_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('civilian_oversight_status', sa.String(length=30), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['ministry_id'], ['ministries.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('defense_branches',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('defense_ministry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('branch_name', sa.String(length=100), nullable=False),
        sa.Column('personnel_count', sa.Integer(), nullable=False),
        sa.Column('training_completion_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('active_operations_count', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['defense_ministry_id'], ['defense_ministries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('military_personnel',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('defense_branch_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rank_category', sa.String(length=50), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False),
        sa.Column('women_count', sa.Integer(), nullable=False),
        sa.Column('training_status', sa.String(length=30), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['defense_branch_id'], ['defense_branches.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('defense_budgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('defense_ministry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('fiscal_year', sa.Integer(), nullable=False),
        sa.Column('total_allocated', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('total_spent', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('personnel_allocation_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('equipment_allocation_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('infrastructure_allocation_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('research_allocation_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['defense_ministry_id'], ['defense_ministries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('defense_procurement_projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('defense_ministry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('budget_estimate', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('contract_value', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('vendor_name', sa.String(length=150), nullable=True),
        sa.Column('approval_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['defense_ministry_id'], ['defense_ministries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('disaster_response_units',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('defense_ministry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('unit_name', sa.String(length=150), nullable=False),
        sa.Column('unit_type', sa.String(length=50), nullable=False),
        sa.Column('district_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('personnel_count', sa.Integer(), nullable=False),
        sa.Column('equipment_count', sa.Integer(), nullable=False),
        sa.Column('readiness_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('last_exercise_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['defense_ministry_id'], ['defense_ministries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['district_id'], ['districts.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('defense_indicators',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('defense_ministry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('indicator_name', sa.String(length=150), nullable=False),
        sa.Column('value', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('unit', sa.String(length=50), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('source', sa.String(length=255), nullable=False),
        sa.Column('confidence', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['defense_ministry_id'], ['defense_ministries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('defense_indicators')
    op.drop_table('disaster_response_units')
    op.drop_table('defense_procurement_projects')
    op.drop_table('defense_budgets')
    op.drop_table('military_personnel')
    op.drop_table('defense_branches')
    op.drop_table('defense_ministries')
    op.drop_table('labor_records')
    op.drop_table('infrastructure_assets')
    op.drop_table('farms')
    op.drop_table('healthcare_institutions')
    op.drop_table('education_institutions')