from app.core.database import AsyncSessionLocal
from sqlalchemy import select
from app.modules.identity.models import User
from app.modules.assistant.models import AIRequest, AIResponse
import asyncio
import app.core.model_registry 

AI_REQUESTS = [
    (
        "policy_analyst",
        "Explain policy: Clean Green Pakistan Initiative (status: approved) | Query: What are the main environmental targets?",
        "llama3:8b-instruct-q4_K_M",
        "success",
        1240,
        "policy",
        """{
  "language": "en",
  "summary": "The Clean Green Pakistan Initiative is a national policy aimed at improving environmental quality through waste management, tree plantation, and pollution control. It sets targets for solid waste collection, urban green space expansion, and industrial emission reductions. The policy emphasizes community participation and inter‑provincial coordination.",
  "evidence": ["Target: 80% solid waste collection in major cities by 2030.", "Target: 10% increase in urban green cover by 2028.", "Industrial emission standards aligned with WHO guidelines."],
  "assumptions": ["Provincial governments will allocate sufficient budget for waste infrastructure.", "Public awareness campaigns will achieve behavioral change."],
  "risks": ["Delays in waste processing plant construction.", "Insufficient enforcement of industrial emission standards."],
  "confidence": "medium",
  "requires_human_review": true
}""",
        False,
    ),
    (
        "budget_analyst",
        "Explain budget: 2025 | Ministry: Ministry of Education",
        "llama3:8b-instruct-q4_K_M",
        "success",
        980,
        "budget",
        """{
  "language": "en",
  "summary": "The 2025 education budget shows a 12% increase over 2024, with significant allocations to teacher recruitment and school infrastructure. Spending on textbooks and digital learning tools has also risen. However, some provinces are underspending on teacher training, which may affect learning outcomes.",
  "evidence": ["Total allocated: PKR 420 billion.", "Teacher recruitment: PKR 95 billion.", "Infrastructure: PKR 110 billion.", "Underspend on teacher training: 18% in two provinces."],
  "assumptions": ["Provincial execution rates will improve in Q3–Q4.", "No major fiscal shocks affecting federal transfers."],
  "risks": ["Persistent underspending on teacher training.", "Delays in infrastructure projects due to procurement bottlenecks."],
  "confidence": "medium",
  "requires_human_review": true
}""",
        False,
    ),
    (
        "citizen_assistant",
        "Citizen question: How do I apply for a B‑form for my newborn? | Language: en",
        "llama3:8b-instruct-q4_K_M",
        "success",
        720,
        None,
        """{
  "language": "en",
  "summary": "To apply for a B‑form (birth registration) for your newborn, visit the nearest Union Council office with the hospital birth slip or midwife certificate, parents' CNICs, and proof of residence. The form is usually issued within a few working days. Some districts also offer online pre‑registration through the provincial local government portal.",
  "evidence": ["Required documents: hospital birth slip/midwife certificate, parents' CNICs, proof of residence.", "Processing time: typically 3–7 working days."],
  "assumptions": ["Parents are married and both CNICs are available.", "Birth occurred in a facility or with a registered midwife."],
  "risks": ["Delays if documents are incomplete.", "Variation in processing time across districts."],
  "confidence": "high",
  "requires_human_review": false
}""",
        False,
    ),
    (
        "translation_assistant",
        "Translate: 'How do I apply for a B‑form for my newborn?' -> ur",
        "llama3:8b-instruct-q4_K_M",
        "success",
        540,
        None,
        """{
  "language": "ur",
  "summary": "اپنے نومولود کے لیے بی‑فارم کیسے حاصل کریں؟",
  "evidence": [],
  "assumptions": [],
  "risks": [],
  "confidence": "high",
  "requires_human_review": false
}""",
        False,
    ),
    (
        "simulation_explainer",
        "Explain simulation run: <uuid> | Scenario: Education Surge — 25% Budget Increase + Teacher Training",
        "llama3:8b-instruct-q4_K_M",
        "success",
        1100,
        "simulation",
        """{
  "language": "en",
  "summary": "The simulation shows that a 25% budget increase combined with 500 hours of teacher training raises literacy rate from 62.8% to 67.1%, increases total enrollment by about 8.4 million students, and expands the teacher workforce by roughly 277,500. The largest gains are in enrollment and teacher supply, with a more modest but still meaningful improvement in literacy.",
  "evidence": ["Literacy rate: 62.8% → 67.1% (+6.9%).", "Total enrollment: 42,000,000 → 50,400,000 (+20%).", "Teacher count: 1,850,000 → 2,127,500 (+15%)."],
  "assumptions": ["Budget is effectively spent on teacher hiring and training.", "Training quality translates into improved instruction.", "No major demographic shocks affecting school‑age population."],
  "risks": ["If funds are diverted, actual gains may be smaller.", "Teacher retention and distribution across districts may limit impact."],
  "confidence": "medium",
  "requires_human_review": false
}""",
        False,
    ),
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).order_by(User.created_at))).scalars().first()
        if not user:
            print("[seed] No user found in DB; create at least one user before seeding AI data.")
            return

        for (
            agent_name,
            prompt_text,
            model_used,
            status,
            latency_ms,
            entity_type,
            raw_output,
            used_fallback,
        ) in AI_REQUESTS:
            existing = (
                await db.execute(
                    select(AIRequest).where(
                        AIRequest.user_id == user.id,
                        AIRequest.agent_name == agent_name,
                        AIRequest.prompt_text == prompt_text,
                    )
                )
            ).scalars().first()
            if existing:
                continue

            req = AIRequest(
                user_id=user.id,
                agent_name=agent_name,
                prompt_text=prompt_text,
                model_used=model_used,
                status=status,
                latency_ms=latency_ms,
                entity_type=entity_type,
                tokens_prompt=120,
                tokens_completion=220,
            )
            db.add(req)
            await db.flush()

            import json

            parsed = json.loads(raw_output)

            resp = AIResponse(
                request_id=req.id,
                raw_output=raw_output,
                parsed_output=parsed,
                is_valid=True,
                validation_error=None,
                used_fallback=used_fallback,
            )
            db.add(resp)

        await db.commit()
        print(f"[seed] {len(AI_REQUESTS)} example AI request/response pairs seeded for user {user.email}")


if __name__ == "__main__":
    asyncio.run(seed())