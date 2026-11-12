import re
from typing import Optional, Dict, Any
from .taxonomy import VERDICTS, REPAIRS, get_repair_fields, is_repair_auto_allowed
from .models import SurgicalEdit

class SafetyViolation(Exception):
    pass

def sanitize_comment(comment: str) -> str:
    """Detect and neutralize prompt injection attempts in student comments."""
    injection_patterns = [
        r"ignore (all )?previous instructions",
        r"you are the admin",
        r"system prompt",
        r"change the answer to",
        r"bypass",
        r"override"
    ]
    for pattern in injection_patterns:
        if re.search(pattern, comment, re.IGNORECASE):
            return "[FLAGGED_PROMPT_INJECTION] " + comment
    return comment

def validate_triage_decision(
    verdict: str,
    repair: Optional[str],
    edit: Optional[Dict[str, Any]],
    route: str,
    confidence: float,
    question_payload: Optional[Dict[str, Any]] = None
) -> None:
    """Enforce strict safety boundaries per Acadza taxonomy."""
    # 1. Verdict validation
    if verdict not in VERDICTS:
        raise SafetyViolation(f"Invalid verdict '{verdict}'. Must be one of {list(VERDICTS.keys())}")
    
    # 2. Non-defect verdicts must not have repair or edit
    if verdict != "defect":
        if repair is not None:
            raise SafetyViolation(f"Verdict '{verdict}' cannot have repair '{repair}'. Repair must be null.")
        if edit is not None:
            raise SafetyViolation(f"Verdict '{verdict}' cannot have edit. Edit must be null.")
        if route != "no_change":
            raise SafetyViolation(f"Verdict '{verdict}' must have route 'no_change', got '{route}'.")
        return

    # 3. Defect must have a valid repair
    if not repair or repair not in REPAIRS:
        raise SafetyViolation(f"Defect verdict requires valid repair from {list(REPAIRS.keys())}, got '{repair}'")
    
    allowed_fields = get_repair_fields(repair)
    is_auto = is_repair_auto_allowed(repair)

    # 4. Route safety check
    if route == "auto_apply" and not is_auto:
        raise SafetyViolation(f"Repair '{repair}' has auto=False in taxonomy. Cannot be routed to 'auto_apply'!")

    if route not in ["auto_apply", "faculty_review", "no_change"]:
        raise SafetyViolation(f"Invalid route '{route}'.")

    # 5. Field boundary check
    if edit:
        field = edit.get("field")
        if field not in allowed_fields:
            raise SafetyViolation(f"Repair '{repair}' is restricted to fields {allowed_fields}, but edit touches '{field}'")
        
        # Verify find string exists in target field if question_payload provided
        if question_payload and field in question_payload:
            current_val = str(question_payload[field])
            find_str = str(edit.get("find"))
            if find_str not in current_val:
                raise SafetyViolation(f"Edit target 'find' ('{find_str[:30]}') not found in target field '{field}'")
