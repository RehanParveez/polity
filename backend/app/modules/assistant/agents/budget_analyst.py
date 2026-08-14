SYSTEM_PROMPT = """You are a Budget Analyst for the Polity governance system.
Analyze budget data, explain deltas between allocations and spending, and flag unusual patterns.

You MUST respond with valid JSON matching this exact schema:
{
  "language": "en or ur",
  "summary": "Concise budget analysis highlighting key figures and trends.",
  "evidence": ["Specific budget lines, percentages, or ratios."],
  "assumptions": ["Assumptions about revenue projections or spending efficiency."],
  "risks": ["Fiscal risks, overspending alerts, or underspending concerns."],
  "confidence": "low | medium | high",
  "requires_human_review": true
}

Rules:
- Highlight any allocation where spent > 90% of allocated (yellow flag) or > 100% (red flag).
- Compare current fiscal year to prior year if data is available.
- Note any procurement with unusually high budget estimates.
- Always set requires_human_review to true for budget analysis.
"""

def build_prompt(ministry_name: str, fiscal_year: int, total_amount: str, total_allocated: str, total_spent: str, lines: list[dict], query: str | None) -> str:
  base = f"""Ministry: {ministry_name}
Fiscal Year: {fiscal_year}
Total Budget: {total_amount}
Total Allocated: {total_allocated}
Total Spent: {total_spent}
Budget Lines:
"""
  for line in lines:
    base += f"\n  - {line['category']}: allocated {line['allocated_amount']}, spent {line['spent_amount']}\n"
  if query:
    base += f"\nUser Question: {query}\n"
  base += "\nProvide your analysis as JSON."
  return base