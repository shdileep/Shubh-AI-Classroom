import os
import re
import json
import uuid
import random
import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.database import get_connection, IS_POSTGRES
from backend.auth import get_current_user
from backend.services.ai_provider import ai_orchestrator
from backend.services.rag_engine import rag_engine
from backend.services.gap_analyzer import knowledge_gap_analyzer

router = APIRouter(prefix="/api/assessments", tags=["assessments"])

# Active server-side assessment session storage to preserve dynamic answer keys
ACTIVE_ASSESSMENT_SESSIONS: Dict[str, Dict[str, Any]] = {}

def shuffle_mcq_options(q: Dict[str, Any]) -> Dict[str, Any]:
    """Randomly shuffle options so option index 0 is never consistently the correct answer."""
    if q.get("question_type") == "mcq" and len(q.get("options", [])) > 1:
        orig_opts = list(q["options"])
        corr_idx = q.get("correct_answer", 0)
        corr_text = orig_opts[corr_idx] if 0 <= corr_idx < len(orig_opts) else orig_opts[0]
        
        shuffled = list(orig_opts)
        random.shuffle(shuffled)
        new_corr_idx = shuffled.index(corr_text)
        
        q_copy = dict(q)
        q_copy["options"] = shuffled
        q_copy["correct_answer"] = new_corr_idx
        return q_copy
    return dict(q)

# Bank of verified retrieval-grounded diagnostic questions across curriculum
QUESTION_REPOSITORY = [
    {
        "id": "diag-q1",
        "topic": "Quadratic Roots & Nullity",
        "subtopic": "Kernel Dimension & Zero Multiplicity",
        "unit": "Unit 2: Linear Maps & Nullity",
        "question_type": "mcq",
        "difficulty": "Moderate",
        "marks": 5,
        "question_text": "For an n × n real matrix A, if λ = 0 is an eigenvalue of algebraic multiplicity 3, which statement is mathematically guaranteed?",
        "options": [
            "dim(null(A)) is between 1 and 3, and det(A) = 0.",
            "dim(null(A)) is strictly equal to 3 under all conditions.",
            "A is invertible because 0 is a valid real characteristic root.",
            "The matrix rank of A must equal n."
        ],
        "correct_answer": 0,
        "rubric": {"required_key_points": ["Geometric multiplicity <= algebraic multiplicity", "det(A) = 0 when 0 is eigenvalue"]},
        "source_doc": "Strang_Linear_Algebra_Ch1-6.pdf",
        "source_page": 112,
        "source_section": "Chapter 4 §4.3: Eigenvalues & Multiplicities",
        "source_excerpt": "The geometric multiplicity of an eigenvalue cannot exceed its algebraic multiplicity: 1 <= dim(null(A - λI)) <= alg(λ). When λ = 0, ker(A) is non-trivial.",
        "explanation": "Since 0 is an eigenvalue, ker(A) is non-trivial (dim >= 1). Geometric multiplicity is bounded above by algebraic multiplicity (1 <= dim(null(A)) <= 3), and det(A) = 0."
    },
    {
        "id": "diag-q2",
        "topic": "Matrix Rank & Vector Pivot",
        "subtopic": "Rank-Nullity Dimension Formula",
        "unit": "Unit 2: Linear Maps & Nullity",
        "question_type": "mcq",
        "difficulty": "Moderate",
        "marks": 5,
        "question_text": "A linear transformation T: R^5 → R^3 has a 2-dimensional kernel (null space). By the Rank-Nullity theorem, what is the dimension of the range of T?",
        "options": [
            "3 (since dim(Domain) = dim(Kernel) + dim(Range) => 5 = 2 + 3)",
            "2 (equal to the nullity of the transformation)",
            "5 (the dimension of the codomain)",
            "Cannot be determined without explicit matrix entries."
        ],
        "correct_answer": 0,
        "rubric": {"required_key_points": ["dim(V) = nullity(T) + rank(T)"]},
        "source_doc": "Course_Syllabus_Curriculum.pdf",
        "source_page": 14,
        "source_section": "Unit 2: Linear Maps & Dimension Theorems",
        "source_excerpt": "The Fundamental Theorem of Linear Maps states: if V is finite-dimensional and T: V -> W, then dim V = dim null T + dim range T.",
        "explanation": "By the Rank-Nullity Theorem: dim(V) = nullity(T) + rank(T). With dim(V)=5 and nullity=2, rank = 5 - 2 = 3."
    },
    {
        "id": "diag-q3",
        "topic": "Jordan Canonical Form",
        "subtopic": "Diagonalizability & Defective Matrices",
        "unit": "Unit 5: Canonical Forms",
        "question_type": "mcq",
        "difficulty": "Advanced",
        "marks": 5,
        "question_text": "A 3 × 3 matrix A has characteristic polynomial p(λ) = (λ - 4)^3. Under what exact condition is A diagonalizable rather than possessing non-trivial Jordan blocks?",
        "options": [
            "Only if dim(ker(A - 4I)) = 3 (i.e., A = 4I is a scalar matrix)",
            "Whenever trace(A) = 12 regardless of eigenspace dimension",
            "As long as det(A) = 64",
            "Any matrix with a single eigenvalue is automatically diagonalizable."
        ],
        "correct_answer": 0,
        "rubric": {"required_key_points": ["Geometric multiplicity must equal algebraic multiplicity (3)"]},
        "source_doc": "Strang_Linear_Algebra_Ch1-6.pdf",
        "source_page": 142,
        "source_section": "Chapter 6 §6.4: The Jordan Canonical Form",
        "source_excerpt": "A matrix is defective and requires Jordan blocks if geometric multiplicity < algebraic multiplicity for any eigenvalue.",
        "explanation": "Diagonalizability requires the geometric multiplicity of λ=4 to equal its algebraic multiplicity (3). The only 3×3 matrix where ker(A-4I)=3 is the scalar matrix A = 4I."
    },
    {
        "id": "diag-q4",
        "topic": "Orthogonal Projections",
        "subtopic": "Projection Matrix Properties",
        "unit": "Unit 4: Inner Products & Orthogonality",
        "question_type": "mcq",
        "difficulty": "Moderate",
        "marks": 5,
        "question_text": "Let W be a subspace of R^n and P_W be the standard orthogonal projection matrix onto W. What algebraic properties must P_W satisfy?",
        "options": [
            "P_W is symmetric (P_W^T = P_W) and idempotent (P_W^2 = P_W)",
            "P_W is always invertible with det(P_W) = 1",
            "P_W v = -v for any vector in W",
            "P_W has eigenvalues equal to strictly +1 and -1"
        ],
        "correct_answer": 0,
        "rubric": {"required_key_points": ["Symmetric: P^T = P", "Idempotent: P^2 = P"]},
        "source_doc": "Course_Exam_Archive.pdf",
        "source_page": 22,
        "source_section": "Final Exam 2022 Q4: Projection Operators",
        "source_excerpt": "An orthogonal projection matrix satisfies P = P^T and P^2 = P. The eigenvalues of any projection matrix are only 0 and 1.",
        "explanation": "An orthogonal projection matrix is both self-adjoint (symmetric) and idempotent: P^2 = P and P^T = P."
    },
    {
        "id": "diag-q5",
        "topic": "Vector Subspaces",
        "subtopic": "Subspace Axioms & Closure",
        "unit": "Unit 1: Vector Spaces",
        "question_type": "mcq",
        "difficulty": "Foundational",
        "marks": 5,
        "question_text": "Which of the following subsets of R^2 is a valid vector subspace?",
        "options": [
            "The set of vectors (x, y) satisfying 2x - 3y = 0",
            "The affine line of vectors (x, y) satisfying x + y = 1",
            "The quadrant set where xy ≥ 0",
            "The unit circle described by x^2 + y^2 = 1"
        ],
        "correct_answer": 0,
        "rubric": {"required_key_points": ["Contains zero vector (0,0)", "Closed under addition and scalar multiplication"]},
        "source_doc": "Strang_Linear_Algebra_Ch1-6.pdf",
        "source_page": 45,
        "source_section": "Chapter 2 §2.1: Vector Spaces and Subspaces",
        "source_excerpt": "A subset W of a vector space V is a subspace if and only if 0 ∈ W, u + v ∈ W, and c u ∈ W.",
        "explanation": "2x - 3y = 0 passes through (0,0) and is closed under both addition and scalar multiplication."
    },
    {
        "id": "diag-q6",
        "topic": "Matrix Determinants",
        "subtopic": "Multilinear Scaling Property",
        "unit": "Unit 3: Determinants & Bilinear Forms",
        "question_type": "mcq",
        "difficulty": "Moderate",
        "marks": 5,
        "question_text": "If A and B are 3 × 3 invertible matrices with det(A) = 3 and det(B) = -2, what is the value of det(2 A B^(-1))?",
        "options": [
            "-12  (since 2^3 × 3 × (-1/2) = 8 × -1.5 = -12)",
            "-3",
            "12",
            "-24"
        ],
        "correct_answer": 0,
        "rubric": {"required_key_points": ["det(c A) = c^n det(A)", "det(B^-1) = 1/det(B)"]},
        "source_doc": "Course_Exam_Archive.pdf",
        "source_page": 5,
        "source_section": "Midterm 2025 Q1: Determinant Multiplicativity",
        "source_excerpt": "For an n × n matrix, det(c A) = c^n det(A). For inverse matrices, det(B^-1) = 1/det(B).",
        "explanation": "For 3×3: det(2 A B^-1) = 2^3 × det(A) × (1/det(B)) = 8 × 3 × (-1/2) = -12."
    },
    {
        "id": "diag-q7",
        "topic": "Quadratic Roots & Nullity",
        "subtopic": "Descriptive Concept Check",
        "unit": "Unit 2: Linear Maps & Nullity",
        "question_type": "short_answer",
        "difficulty": "Moderate",
        "marks": 5,
        "question_text": "Explain in one or two sentences why having λ = 0 as an eigenvalue guarantees that a square matrix is non-invertible.",
        "options": [],
        "correct_answer": "λ = 0 means there exists a non-zero vector v such that Av = 0v = 0, which means ker(A) is non-trivial and nullity(A) >= 1, so det(A) = 0 and A is singular.",
        "rubric": {"required_key_points": ["non-zero vector v such that Av = 0", "null space has dimension at least 1 / determinant is 0"]},
        "source_doc": "Strang_Linear_Algebra_Ch1-6.pdf",
        "source_page": 112,
        "source_section": "Chapter 4 §4.1: Introduction to Eigenvalues",
        "source_excerpt": "If Av = 0v = 0 for some v ≠ 0, then the nullspace contains non-zero vectors. Hence A is not invertible.",
        "explanation": "If λ = 0 is an eigenvalue, non-trivial eigenvectors exist in the kernel of A, meaning nullity >= 1 and det(A) = 0."
    }
]

class GenerateAssessmentRequest(BaseModel):
    subject: Optional[str] = "Active Diagnostic Workspace"
    mode: Optional[str] = "Initial Diagnostic" # Initial Diagnostic | Topic-specific | Weak-topic Practice | Comprehensive
    topic_filter: Optional[str] = None
    question_count: Optional[int] = 5
    difficulty: Optional[str] = "Moderate"

@router.post("/generate")
def generate_assessment(req: GenerateAssessmentRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Generate retrieval-grounded diagnostic assessment dynamically.
    - Retrieves source material chunks for the student via BM25 RAG engine
    - Formulates novel questions via Groq/OpenAI or synthesizes from grounded chunks
    - Randomly shuffles options so option index 0 is not the predictable answer
    - Stores answer keys in server-side session cache for test integrity
    """
    user_id = current_user["sub"]
    target_topic = req.topic_filter if req.topic_filter and req.topic_filter != "all" else None
    count = min(max(req.question_count or 5, 1), 30)

    # 1. Retrieve grounded source chunks from student's uploaded materials
    retrieved_chunks = rag_engine.retrieve_chunks(
        user_id=user_id,
        query=target_topic or req.subject or "Fundamental Principles",
        topic=target_topic,
        top_k=min(max(count, 8), 25)
    )

    generated_questions = []

    # 2. If chunks exist and AI provider is active, attempt dynamic LLM question generation
    if retrieved_chunks and ai_orchestrator.get_provider_status().get("groq"):
        try:
            # Batch size of up to 10 questions per LLM call to guarantee high quality and stay within token window
            batch_target = min(count, 10)
            context_str = rag_engine.assemble_context(retrieved_chunks[:6])
            prompt = f"""You are an expert academic diagnostic examiner.
Generate {batch_target} diagnostic multiple-choice questions strictly grounded in the following course material excerpts:
{context_str}

Target Topic: {target_topic or 'Course Fundamental Concepts'}

Return strictly a JSON object with this exact structure:
{{
  "questions": [
    {{
      "topic": "{target_topic or 'Core Concept'}",
      "subtopic": "Specific Subtopic",
      "unit": "Unit 2: Linear Maps & Systems",
      "question_type": "mcq",
      "difficulty": "{req.difficulty}",
      "marks": 5,
      "question_text": "Conceptual question testing understanding...",
      "options": ["Distractor A", "Correct Answer B", "Distractor C", "Distractor D"],
      "correct_answer": 1,
      "explanation": "Detailed explanation grounded in the text...",
      "source_doc": "{retrieved_chunks[0]['document_title']}",
      "source_page": {retrieved_chunks[0]['page_number']},
      "source_section": "{retrieved_chunks[0]['section_title']}",
      "source_excerpt": "Grounded citation excerpt..."
    }}
  ]
}}"""
            res_json = ai_orchestrator.call_groq(prompt, model="llama-3.1-8b-instant", json_mode=True)
            if res_json:
                parsed = json.loads(res_json)
                if "questions" in parsed and isinstance(parsed["questions"], list):
                    for idx, q_item in enumerate(parsed["questions"]):
                        q_item["id"] = f"dyn-q{idx+1}-{uuid.uuid4().hex[:6]}"
                        shuffled_q = shuffle_mcq_options(q_item)
                        generated_questions.append(shuffled_q)
        except Exception as gen_err:
            print(f"[Assessments] Dynamic LLM generation error: {gen_err}")

    # 3. If dynamic LLM didn't produce all required questions and user has uploaded chunks,
    # synthesize questions directly from their uploaded chunks sentences/paragraphs!
    if len(generated_questions) < count and retrieved_chunks:
        for idx in range(len(generated_questions), count):
            chk = retrieved_chunks[idx % len(retrieved_chunks)]
            source_txt = chk["source_text"].strip()
            sentences = [s.strip() for s in re.split(r'\. |\n', source_txt) if len(s.strip()) > 35]
            if not sentences:
                sentences = [source_txt[:120]]
            key_sentence = sentences[idx % len(sentences)]
            
            q_topic = chk.get("topic_name", target_topic or "Uploaded Core Concepts")
            q_sec = chk.get("section_title", "Document Section")
            q_doc = chk.get("document_title", "Uploaded Document")
            q_page = chk.get("page_number", 1)

            correct_ans = f"Affirms: {key_sentence[:95]}."
            distractor1 = f"Contradicts: Assumes inverse of {key_sentence[:70]} under standard conditions."
            distractor2 = f"Restricts: Claims this principle only applies to trivial boundary cases."
            distractor3 = f"Unrelated: Claims no operational dependency exists in {q_sec}."

            syn_q = {
                "id": f"syn-q{idx+1}-{uuid.uuid4().hex[:6]}",
                "topic": q_topic,
                "subtopic": q_sec,
                "unit": chk.get("unit_name", f"Unit {1 + (idx % 3)}"),
                "question_type": "mcq",
                "difficulty": req.difficulty,
                "marks": 5,
                "question_text": f"According to '{q_doc}' (§{q_sec}), which statement accurately reflects the principles established regarding {q_topic}?",
                "options": [distractor1, correct_ans, distractor2, distractor3],
                "correct_answer": 1,
                "explanation": f"Grounded in page {q_page}: \"{key_sentence[:140]}\"",
                "source_doc": q_doc,
                "source_page": q_page,
                "source_section": q_sec,
                "source_excerpt": key_sentence[:200]
            }
            shuffled_syn = shuffle_mcq_options(syn_q)
            generated_questions.append(shuffled_syn)

    # 4. If student has NO uploaded materials at all, draw from verified curriculum repository
    if len(generated_questions) < count:
        filtered = list(QUESTION_REPOSITORY)
        if target_topic:
            matched = [q for q in filtered if q["topic"] == target_topic]
            if matched:
                filtered = matched

        for q in filtered:
            if len(generated_questions) >= count:
                break
            if not any(g.get("question_text") == q["question_text"] for g in generated_questions):
                shuffled_q = shuffle_mcq_options(q)
                generated_questions.append(shuffled_q)

    assessment_id = f"assess-{uuid.uuid4().hex[:8]}"

    # Store full generated questions in server-side session cache
    ACTIVE_ASSESSMENT_SESSIONS[assessment_id] = {q["id"]: q for q in generated_questions}

    # Mask correct answers before delivering to client
    client_questions = []
    for q in generated_questions:
        client_questions.append({
            "id": q["id"],
            "topic": q["topic"],
            "subtopic": q.get("subtopic", "Core Subtopic"),
            "unit": q.get("unit", "Curriculum Core"),
            "question_type": q["question_type"],
            "difficulty": q.get("difficulty", req.difficulty),
            "marks": q.get("marks", 5),
            "question_text": q["question_text"],
            "options": q["options"],
            "source_doc": q.get("source_doc", "Course Textbook"),
            "source_page": q.get("source_page", 1),
            "source_section": q.get("source_section", "Core Section"),
            "source_excerpt": q.get("source_excerpt", ""),
        })

    return {
        "assessment_id": assessment_id,
        "title": f"{req.mode} — {req.subject}",
        "mode": req.mode,
        "difficulty": req.difficulty,
        "total_questions": len(client_questions),
        "duration_minutes": len(client_questions) * 3,
        "questions": client_questions,
        "grounded_chunk_count": len(retrieved_chunks)
    }

class AssessmentSubmission(BaseModel):
    assessment_id: str
    answers: Dict[str, Any] # question_id -> selected_index or text answer
    time_spent_seconds: Optional[int] = 180

@router.post("/submit")
def submit_assessment(sub: AssessmentSubmission, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Evaluate assessment answers on backend.
    - Deterministic evaluation for MCQ with dynamically shuffled option keys
    - Rubric-driven evaluation for short answers
    - Calculates topic masteries with Bayesian confidence
    - Produces explainable Knowledge Gap Report with dynamic misconception diagnosis
    - Persists results to PostgreSQL / SQLite
    """
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Fetch student's prior mastery baseline
        fetch_gaps = "SELECT topic, mastery_score FROM knowledge_gaps WHERE user_id = %s" if IS_POSTGRES else "SELECT topic, mastery_score FROM knowledge_gaps WHERE user_id = ?"
        cur.execute(fetch_gaps, (user_id,))
        prior_rows = cur.fetchall()
        prior_masteries = {}
        for r in prior_rows:
            prior_masteries[r[0] if IS_POSTGRES else r["topic"]] = r[1] if IS_POSTGRES else r["mastery_score"]

        evaluations = []
        
        # Look up session-specific questions first (with their shuffled answer keys)
        session_qs = ACTIVE_ASSESSMENT_SESSIONS.get(sub.assessment_id, {})
        repo_qs = {q["id"]: q for q in QUESTION_REPOSITORY}
        q_dict = {**repo_qs, **session_qs}

        for qid, student_ans in sub.answers.items():
            q = q_dict.get(qid)
            if not q:
                continue

            is_correct = False
            score_awarded = 0
            max_marks = q["marks"]
            feedback = ""

            if q["question_type"] == "mcq":
                try:
                    ans_idx = int(student_ans)
                except (ValueError, TypeError):
                    ans_idx = -1

                is_correct = (ans_idx == q["correct_answer"])
                score_awarded = max_marks if is_correct else 0
                feedback = q["explanation"]
                student_display_ans = q["options"][ans_idx] if 0 <= ans_idx < len(q["options"]) else f"Option {student_ans}"
                correct_display_ans = q["options"][q["correct_answer"]] if 0 <= q["correct_answer"] < len(q["options"]) else "Correct Option"
            else:
                # Descriptive answer evaluation
                ans_str = str(student_ans).lower()
                key_pts = q.get("rubric", {}).get("required_key_points", [])
                hits = sum(1 for kp in key_pts if any(word in ans_str for word in kp.lower().split() if len(word) > 3))
                if hits >= len(key_pts):
                    is_correct = True
                    score_awarded = max_marks
                elif hits > 0:
                    is_correct = False
                    score_awarded = round(max_marks * 0.5)
                else:
                    is_correct = False
                    score_awarded = 0
                feedback = q["explanation"]
                student_display_ans = str(student_ans)
                correct_display_ans = str(q.get("correct_answer", ""))

            evaluations.append({
                "question_id": qid,
                "topic": q["topic"],
                "unit": q.get("unit", "Curriculum Core"),
                "question_text": q["question_text"],
                "is_correct": is_correct,
                "score_awarded": score_awarded,
                "max_marks": max_marks,
                "student_answer": student_display_ans,
                "correct_answer": correct_display_ans,
                "explanation": feedback,
                "grounding_source": f"{q.get('source_doc', 'Course Text')} p.{q.get('source_page', 1)}"
            })

        # Generate comprehensive Knowledge Gap Report via analyzer
        gap_report = knowledge_gap_analyzer.analyze_assessment_results(
            questions=list(q_dict.values()),
            answers=sub.answers,
            evaluations=evaluations,
            previous_masteries=prior_masteries
        )

        # Update topic mastery in database for each diagnosed topic
        for diag in gap_report["topic_diagnoses"]:
            topic_name = diag["topic"]
            new_score = diag["estimated_mastery"]
            priority = "High" if new_score < 50 else ("Medium" if new_score < 80 else "Low")
            status = "Critical Gap" if new_score < 50 else ("Needs Review" if new_score < 80 else "Mastered")

            # Check if exists
            chk_sql = "SELECT id FROM knowledge_gaps WHERE user_id = %s AND topic = %s" if IS_POSTGRES else "SELECT id FROM knowledge_gaps WHERE user_id = ? AND topic = ?"
            cur.execute(chk_sql, (user_id, topic_name))
            exists = cur.fetchone()

            if exists:
                up_sql = """
                    UPDATE knowledge_gaps SET mastery_score = %s, priority = %s, status = %s
                    WHERE user_id = %s AND topic = %s
                """ if IS_POSTGRES else """
                    UPDATE knowledge_gaps SET mastery_score = ?, priority = ?, status = ?
                    WHERE user_id = ? AND topic = ?
                """
                cur.execute(up_sql, (new_score, priority, status, user_id, topic_name))
            else:
                ins_sql = """
                    INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                    VALUES (%s, %s, %s, %s, %s)
                """ if IS_POSTGRES else """
                    INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                    VALUES (?, ?, ?, ?, ?)
                """
                cur.execute(ins_sql, (user_id, topic_name, new_score, priority, status))

            # Record session log
            sess_sql = """
                INSERT INTO diagnostic_sessions (user_id, topic, score, feedback)
                VALUES (%s, %s, %s, %s)
            """ if IS_POSTGRES else """
                INSERT INTO diagnostic_sessions (user_id, topic, score, feedback)
                VALUES (?, ?, ?, ?)
            """
            cur.execute(sess_sql, (user_id, topic_name, new_score, f"Diagnostic evaluated: {new_score}% mastery"))

        # Log overall learning activity
        act_sql = """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (%s, %s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (?, ?, ?, ?, ?)
        """
        cur.execute(act_sql, (
            user_id,
            "Completed Diagnostic Assessment",
            "Diagnostic",
            f"Achieved {gap_report['overall_score']}% overall accuracy. Identified {gap_report['weak_topics_count']} knowledge gap(s).",
            "Just now"
        ))

        conn.commit()

        return {
            "message": "Diagnostic assessment evaluated successfully.",
            "assessment_id": sub.assessment_id,
            "report": gap_report,
            "evaluations": evaluations
        }
    finally:
        cur.close()
        conn.close()
