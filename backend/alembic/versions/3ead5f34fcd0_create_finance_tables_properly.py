from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "3ead5f34fcd0"
down_revision = "96e55625fb3c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "revenue_sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("fiscal_year", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=255), nullable=False),
        sa.Column("as_of_date", sa.Date(), nullable=False),
        sa.Column("confidence", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_table(
        "budgets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("ministry_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("government_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("fiscal_year", sa.Integer(), nullable=False),
        sa.Column("total_amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["government_id"], ["governments.id"]),
        sa.ForeignKeyConstraint(["ministry_id"], ["ministries.id"]),
    )

    op.create_table(
        "budget_lines",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("budget_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("allocated_amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("spent_amount", sa.Numeric(15, 2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["budget_id"], ["budgets.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "procurement_projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("ministry_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("budget_estimate", sa.Numeric(15, 2), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("vendor_name", sa.String(length=150), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["ministry_id"], ["ministries.id"]),
    )

    op.create_table(
        "audit_findings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("audit_findings")
    op.drop_table("procurement_projects")
    op.drop_table("budget_lines")
    op.drop_table("budgets")
    op.drop_table("revenue_sources")