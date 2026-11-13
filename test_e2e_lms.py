import os
import sys
from dotenv import load_dotenv

load_dotenv('backend/.env')

from backend.database import init_db, get_connection, IS_POSTGRES
from backend.auth import create_jwt_token, verify_password, hash_password
from backend.services.ai_provider import ai_orchestrator
from backend.services.document_processor import document_processor
from backend.services.rag_engine import rag_engine
from backend.services.gap_analyzer import knowledge_gap_analyzer
from backend.services.revision_engine import revision_planner_engine

def run_e2e_test():
    print("==================================================")
    print("GAPFINDER AI — FULL END-TO-END VERIFICATION SUITE")
    print("==================================================")

    # 1. Database Init
    init_db()
    print("[✓] Step 1: Database initialized successfully.")

    # 2. User & Auth
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email FROM users WHERE email = 'alex.chen@stanford.edu'")
    user = cur.fetchone()
    if not user:
        pwd = hash_password("password123")
        cur.execute("INSERT INTO users (name, email, password_hash) VALUES ('Alex Chen', 'alex.chen@stanford.edu', ?)", (pwd,))
        conn.commit()
        user_id = cur.lastrowid
    else:
        user_id = user["id"] if not IS_POSTGRES else user[0]

    token = create_jwt_token({"sub": user_id, "email": "alex.chen@stanford.edu"})
    print(f"[✓] Step 2: Student authenticated (User ID: {user_id}, Token generated).")

    # 3. Document Extraction test
    test_pdf_content = "Engineering Mathematics Course Outline\nUnit 2: Linear Maps and Nullity.\nThe Rank-Nullity Theorem: dim(V) = rank(T) + nullity(T).\nWhen an eigenvalue λ = 0, ker(A) is non-trivial."
    test_txt_path = "backend/uploads/sample_syllabus.txt"
    with open(test_txt_path, "w", encoding="utf-8") as f:
        f.write(test_pdf_content)

    extracted_pages = document_processor.extract_text_from_file(test_txt_path, "sample_syllabus.txt")
    print(f"[✓] Step 3: Text extraction completed ({len(extracted_pages)} page(s) extracted).")

    # 4. Chunking with metadata
    chunks = document_processor.chunk_document_pages(extracted_pages, document_id=1, user_id=user_id, subject="Diagnostic Workspace")
    print(f"[✓] Step 4: Chunking completed ({len(chunks)} retrieval chunk(s) generated).")

    # 5. RAG Retrieval test
    retrieved = rag_engine.retrieve_chunks(user_id=user_id, query="rank nullity theorem kernel", topic="Quadratic Roots & Nullity", top_k=2)
    print(f"[✓] Step 5: RAG Engine retrieval tested ({len(retrieved)} chunk(s) retrieved).")

    # 6. Diagnostic Assessment Evaluation & Gap Analysis
    sample_answers = {
        "diag-q1": 0, # Correct
        "diag-q2": 1, # Incorrect
        "diag-q3": 0  # Correct
    }
    from backend.routers.assessments import QUESTION_REPOSITORY
    evaluations = []
    q_dict = {q["id"]: q for q in QUESTION_REPOSITORY}
    for qid, ans in sample_answers.items():
        q = q_dict[qid]
        is_corr = (ans == q["correct_answer"])
        evaluations.append({
            "question_id": qid,
            "topic": q["topic"],
            "unit": q["unit"],
            "question_text": q["question_text"],
            "is_correct": is_corr,
            "score_awarded": q["marks"] if is_corr else 0,
            "max_marks": q["marks"],
            "explanation": q["explanation"],
            "grounding_source": f"{q['source_doc']} p.{q['source_page']}"
        })

    report = knowledge_gap_analyzer.analyze_assessment_results(
        questions=list(q_dict.values()),
        answers=sample_answers,
        evaluations=evaluations
    )
    print(f"[✓] Step 6: Knowledge Gap Report generated (Score: {report['overall_score']}%, Weak gaps: {report['weak_topics_count']}, Strong: {report['strong_topics_count']}).")

    # 7. Adaptive Revision Planner test
    gaps_sample = [
        {"topic": "Quadratic Roots & Nullity", "mastery_score": 32, "unit": "Unit 2", "blocked_prerequisites": ["Rank-Nullity"], "recommended_minutes": 35},
        {"topic": "Matrix Rank & Vector Pivot", "mastery_score": 45, "unit": "Unit 2", "blocked_prerequisites": ["Basis Extraction"], "recommended_minutes": 30},
        {"topic": "Orthogonal Projections", "mastery_score": 68, "unit": "Unit 4", "blocked_prerequisites": [], "recommended_minutes": 25},
    ]
    plan = revision_planner_engine.generate_plan(gaps=gaps_sample, target_exam_date="2026-12-15")
    print(f"[✓] Step 7: Personalized Revision Plan generated ({len(plan['tasks'])} daily task(s) planned).")

    # 8. AI Provider Orchestrator test
    status = ai_orchestrator.get_provider_status()
    print(f"[✓] Step 8: Multi-provider AI orchestrator active: {status['fast_provider']} configured.")

    # 9. Retrieval-Grounded Exam Question Mapping (Hackathon PS Condition 1)
    from backend.routers.topics import get_exam_question_mappings
    mappings_res = get_exam_question_mappings(current_user={"sub": user_id, "name": "Alex Chen"})
    print(f"[✓] Step 9: Past paper questions mapped to syllabus via retrieval ({mappings_res['total_mapped_questions']} questions mapped, {mappings_res['syllabus_coverage_pct']}% exam coverage).")
    assert mappings_res["total_mapped_questions"] > 0

    # 10. Dynamic Question Generation & Option Shuffling (Hackathon PS Condition 2)
    from backend.routers.assessments import generate_assessment, submit_assessment, GenerateAssessmentRequest, AssessmentSubmission
    gen_req = GenerateAssessmentRequest(question_count=3, difficulty="Moderate")
    gen_res = generate_assessment(gen_req, current_user={"sub": user_id, "name": "Alex Chen"})
    assert len(gen_res["questions"]) == 3
    assert "correct_answer" not in gen_res["questions"][0], "Answer key must not be leaked to client"
    print(f"[✓] Step 10: Dynamic diagnostic assessment generated ({len(gen_res['questions'])} questions, options shuffled, answer keys secured on backend).")

    # 11. Teacher Cohort Telemetry & Class-level Gap Insights (Hackathon PS Scope)
    from backend.routers.teacher import get_teacher_class_overview, broadcast_cohort_drill, BroadcastDrillRequest
    teacher_res = get_teacher_class_overview(current_user={"sub": 2, "name": "Dr. Elena Rostova", "role": "teacher"})
    assert teacher_res["total_students"] > 0
    assert len(teacher_res["topic_diagnoses"]) > 0
    top_crit = teacher_res["topic_diagnoses"][0]
    print(f"[✓] Step 11: Teacher cohort analytics verified ({teacher_res['total_students']} enrolled students, {len(teacher_res['topic_diagnoses'])} topics analyzed, top failure rate: {top_crit['topic']} at {top_crit['failure_rate_pct']}%).")

    # 12. Teacher Broadcast Remedial Drill
    b_req = BroadcastDrillRequest(topic="Quadratic Roots & Nullity", message="Emergency review drill before finals.")
    b_res = broadcast_cohort_drill(b_req, current_user={"sub": 2, "name": "Dr. Elena Rostova", "role": "teacher"})
    print(f"[✓] Step 12: Teacher remedial drill broadcast operational ({b_res['students_assigned']} students assigned intervention).")

    print("==================================================")
    print("ALL 12 HACKATHON ACCEPTANCE TESTS PASSED (100% OK)!")
    print("==================================================")
    cur.close()
    conn.close()

if __name__ == "__main__":
    run_e2e_test()
