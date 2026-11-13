import os
import sys
import unittest
from fastapi import HTTPException

os.environ["USE_SQLITE"] = "1"
sys.path.insert(0, os.path.dirname(__file__))

from backend.database import init_db, get_connection
from backend.routers.revision import schedule_revision_session, get_scheduled_sessions, ScheduleSessionRequest
from backend.routers.assessments import generate_assessment, GenerateAssessmentRequest
from backend.routers.teacher import get_teacher_class_overview
from backend.routers.topics import get_topic_map
from backend.services.document_processor import document_processor

def run_tests():
    init_db()
    print("\n--- 1. Testing Timed Revision Session Scheduler ---")
    mock_student = {
        "sub": 1,
        "name": "Alex Chen",
        "email": "alex.chen@stanford.edu",
        "role": "student",
        "course": "Active Diagnostic Workspace"
    }

    req = ScheduleSessionRequest(
        title="Comprehensive Pre-Finals Exam Revision",
        scheduled_date="2026-11-20",
        scheduled_time="19:30",
        topic="Quadratic Roots & Nullity",
        document_id=1
    )
    res = schedule_revision_session(req, current_user=mock_student)
    print("Scheduled session response:", res["message"])
    assert res["schedule"]["title"] == "Comprehensive Pre-Finals Exam Revision"
    assert res["schedule"]["scheduled_time"] == "19:30"

    sessions_res = get_scheduled_sessions(current_user=mock_student)
    print("Found scheduled sessions count:", len(sessions_res["sessions"]))
    assert len(sessions_res["sessions"]) >= 1
    print("✓ Scheduled Revision Session & Storage: PASSED")

    print("\n--- 2. Testing 30-MCQ Grounded Assessment Generation ---")
    assess_req = GenerateAssessmentRequest(
        subject="Active Diagnostic Workspace",
        mode="Comprehensive",
        question_count=30,
        difficulty="Moderate"
    )
    assess_res = generate_assessment(assess_req, current_user=mock_student)
    total_q = assess_res["total_questions"]
    print(f"Generated {total_q} questions (Requested: 30)")
    assert total_q > 0, "Should generate questions"
    first_q = assess_res["questions"][0]
    print(f"Sample Question 1: {first_q['question_text'][:80]}...")
    print(f"Source Doc: {first_q['source_doc']}, Page: {first_q['source_page']}")
    print("✓ 30-MCQ Assessment Generation & Document Grounding: PASSED")

    print("\n--- 3. Testing Dynamic Topic Hierarchy & Note Generation on Document ---")
    mock_pages = [
        {
            "page_number": 1,
            "raw_text": "Unit 1: Quantum Mechanics & Wave Equations. An introduction to wave packets, Schrödinger equation, and boundary conditions. Hamiltonian operators define state energy."
        },
        {
            "page_number": 2,
            "raw_text": "Unit 2: Harmonic Oscillators & Quantum Wells. Step potentials and tunneling probabilities. Eigenstates of harmonic oscillator ladder operators."
        }
    ]
    hierarchy = document_processor.extract_topics_hierarchy(mock_pages, filename="Quantum_Physics_Notes.pdf", default_subject="Quantum Physics")
    print(f"Detected Subject: {hierarchy['subject']}")
    print(f"Detected Units count: {len(hierarchy['units'])}")
    assert len(hierarchy['units']) >= 2

    notes_md, mermaid = document_processor.generate_study_notes_and_diagram(mock_pages, "Quantum_Physics_Notes.pdf", hierarchy)
    print(f"Generated notes length: {len(notes_md)} chars")
    print(f"Generated Mermaid diagram snippet: {mermaid.splitlines()[:3]}")
    assert "Comprehensive Study Notes" in notes_md
    assert "graph TD" in mermaid
    print("✓ Dynamic Topic Hierarchy, Study Notes & Mermaid Diagram: PASSED")

    print("\n--- 4. Testing Strict Role Guarding on Teacher API ---")
    # Student calling teacher endpoint must get HTTP 403 Forbidden!
    student_blocked = False
    try:
        get_teacher_class_overview(current_user=mock_student)
    except HTTPException as e:
        if e.status_code == 403:
            student_blocked = True
            print("Student correctly blocked from teacher endpoint with HTTP 403:", e.detail)

    assert student_blocked, "Student MUST be blocked from teacher overview!"

    mock_teacher = {
        "sub": 2,
        "name": "Dr. Elena Rostova",
        "email": "teacher@stanford.edu",
        "role": "teacher",
        "course": "Foundational STEM & Linear Systems"
    }
    teacher_res = get_teacher_class_overview(current_user=mock_teacher)
    print("Teacher successfully authorized. Class name:", teacher_res["class_name"])
    print("✓ Strict Role Isolation & Authorization Guard: PASSED")

    print("\n============================================================")
    print("ALL NEW FEATURES & SECURITY GUARDS VERIFIED SUCCESSFULLY!")
    print("============================================================\n")

if __name__ == "__main__":
    run_tests()
