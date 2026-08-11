import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

CREATE_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS revenue_sources (
        id UUID PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        fiscal_year INTEGER NOT NULL,
        source VARCHAR(255) NOT NULL,
        as_of_date DATE NOT NULL,
        confidence VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY,
        ministry_id UUID NULL,
        government_id UUID NULL,
        fiscal_year INTEGER NOT NULL,
        total_amount NUMERIC(15, 2) NOT NULL,
        status VARCHAR(30) NOT NULL,
        description VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT fk_budgets_government FOREIGN KEY (government_id) REFERENCES governments (id),
        CONSTRAINT fk_budgets_ministry FOREIGN KEY (ministry_id) REFERENCES ministries (id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS budget_lines (
        id UUID PRIMARY KEY,
        budget_id UUID NOT NULL,
        category VARCHAR(100) NOT NULL,
        allocated_amount NUMERIC(15, 2) NOT NULL,
        spent_amount NUMERIC(15, 2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT fk_budget_lines_budget FOREIGN KEY (budget_id) REFERENCES budgets (id) ON DELETE CASCADE
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS procurement_projects (
        id UUID PRIMARY KEY,
        ministry_id UUID NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        budget_estimate NUMERIC(15, 2) NOT NULL,
        status VARCHAR(30) NOT NULL,
        vendor_name VARCHAR(150),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT fk_procurement_projects_ministry FOREIGN KEY (ministry_id) REFERENCES ministries (id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS audit_findings (
        id UUID PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        severity VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(30) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """
]

async def main():
    async with AsyncSessionLocal() as session:
        for stmt in CREATE_STATEMENTS:
            await session.execute(text(stmt))
        await session.commit()
        result = await session.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        )
        tables = [row[0] for row in result]
        print("Tables:", tables)

if __name__ == "__main__":
    asyncio.run(main())
