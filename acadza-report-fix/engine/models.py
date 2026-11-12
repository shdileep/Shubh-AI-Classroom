from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class SurgicalEdit(BaseModel):
    field: str
    find: Any
    replace: Any

class Report(BaseModel):
    reportId: str
    questionId: str
    studentId: Optional[str] = None
    source: Optional[str] = "web"
    reportedAt: Optional[str] = None
    comment: str

class TriageDecision(BaseModel):
    reportId: str
    questionId: str
    verdict: str
    repair: Optional[str] = None
    edit: Optional[SurgicalEdit] = None
    route: str
    confidence: float
    evidence: str
    student_reply: str

class AuditAction(BaseModel):
    action: str  # approve, reject, edit
    faculty_id: str
    timestamp: str
    comment: Optional[str] = None
    applied_edit: Optional[Dict[str, Any]] = None
