import re
from typing import Tuple, List

# NeMo Guardrails deterministic blacklist blocking prescription drug names and dosage measurements
# As defined in Section 8 of the specification
RESTRICTED_DRUG_PATTERNS = [
    # Analgesics & Antipyretics
    r"\bparacetamol\b", r"\bacetaminophen\b", r"\bibuprofen\b", r"\baspirin\b", r"\bdiclofenac\b",
    # Antibiotics
    r"\bamoxicillin\b", r"\bazithromycin\b", r"\bampicillin\b", r"\bcephalexin\b", r"\bciprofloxacin\b",
    r"\bdoxycycline\b", r"\bmetronidazole\b",
    # Antihypertensives & Cardiac
    r"\bamlodipine\b", r"\batenolol\b", r"\btelmisartan\b", r"\blosartan\b", r"\benalapril\b", r"\bfurosemide\b",
    # Antidiabetics
    r"\bmetformin\b", r"\bglimepiride\b", r"\binsulin\b",
    # Steroids & Others
    r"\bprednisolone\b", r"\bdexamethasone\b", r"\bomeprazole\b", r"\bpantoprazole\b",
    # Dosages and metric units
    r"\b\d+\s*(?:mg|milligram|mcg|ml|tablet|tab|capsule|cap|injection|dose)\b",
    r"\b(?:take|prescribe|administer|inject)\s+\d+\b"
]

COMPILED_RESTRICTED_REGEX = re.compile("|".join(RESTRICTED_DRUG_PATTERNS), re.IGNORECASE)


def filter_prescription_guardrails(text: str) -> Tuple[str, List[str], bool]:
    """
    Scans generated clinical or vernacular guidance for unauthorized drug prescriptions or dosage advice.
    If detected, scrubs the medication text and appends strict redirection to registered medical professionals.
    
    Returns:
        (sanitized_text, list_of_blocked_violations, was_blocked)
    """
    matches = list(COMPILED_RESTRICTED_REGEX.finditer(text))
    if not matches:
        return text, [], False

    blocked_terms = [m.group(0) for m in matches]
    
    # Redaction & Redirect substitution
    sanitized = COMPILED_RESTRICTED_REGEX.sub("[PRESCRIPTION DRUG BLOCKED BY CLINICAL SAFETY GATE]", text)
    sanitized += (
        "\n\n[CLINICAL SAFETY DIRECTIVE]: Medication names and specific dosages have been blocked by the automated safety guardrail. "
        "Only a licensed physician at your Primary Health Centre (PHC) can prescribe or adjust pharmaceutical treatments."
    )

    return sanitized, blocked_terms, True
