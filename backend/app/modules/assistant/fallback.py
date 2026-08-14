from app.modules.assistant.schemas import AIOutputContract

FALLBACK_RESPONSES = {
  "policy_analyst": AIOutputContract(language = "en", summary = "The AI analysis service is currently unavailable. A human analyst will need to review this policy manually.",
    evidence=["AI service offline or unreachable."], assumptions=["No automated assumptions could be generated."], risks=["Delayed policy review due to AI unavailability."],
    confidence = "low", requires_human_review=True,
  ),
  "budget_analyst": AIOutputContract(language = "en", summary = "Budget analysis is temporarily unavailable. Please consult the finance ministry for a manual review.",
    evidence=["AI service offline."], assumptions=["Baseline budget figures remain unchanged."], risks=["Unusual allocations may go unflagged without AI assistance."],
     confidence = "low", requires_human_review=True,
  ),
  "citizen_assistant": AIOutputContract(language = "en", summary = "I apologize, but I am unable to process your question right now. Please try again in a few moments.",
    evidence=[], assumptions=[], risks=[], confidence = "low", requires_human_review=False,
  ),
  "translation_assistant": AIOutputContract(language = "ur", summary = "ترجمہ سروس اس وقت دستیاب نہیں ہے۔ براہ کرم بعد میں دوبارہ کوشش کریں۔", evidence=[],
    assumptions=[], risks=[], confidence = "low", requires_human_review=False,
  ),
  "report_generator": AIOutputContract(language = "en", summary = "Report generation is temporarily unavailable. Please retry or draft the report manually.",
    evidence=[], assumptions=[], risks=["Report may be delayed."], confidence = "low",
    requires_human_review=True,
  ),
  "legislative_assistant": AIOutputContract(language = "en", summary = "Legislative assistance is offline. Please consult the parliamentary affairs office.",
    evidence=[], assumptions=[], risks=["Drafting assistance unavailable."], confidence = "low", requires_human_review=True,
  ),
  "simulation_explainer": AIOutputContract(language = "en", summary = "Process explanation is unavailable. The numeric results are still valid and can be reviewed directly.",
    evidence=[], assumptions=[], risks=[], confidence = "low", requires_human_review=False,
  ),
}

def get_fallback(agent_name: str, language: str = "en") -> AIOutputContract:
  fb = FALLBACK_RESPONSES.get(agent_name, FALLBACK_RESPONSES["citizen_assistant"])
  if language == "ur" and agent_name == "translation_assistant":
    return fb 
  return fb.model_copy(update={"language": language})