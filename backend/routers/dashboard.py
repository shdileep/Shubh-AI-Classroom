import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.database import get_connection, IS_POSTGRES
from backend.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Concept metadata with grounded root causes and prerequisites
TOPIC_METADATA = {
    "Quadratic Roots & Nullity": {
        "unit": "Unit 2: Linear Maps & Nullity",
        "weight": "25% of Exam",
        "grounding": "Syllabus §2.3 · Textbook Ch 4 p.112 · Past Paper 2024 Q3",
        "root_cause": "Conflates algebraic multiplicity of zero roots with geometric kernel dimension null(A). Fails Rank-Nullity dim(V) = rank(T) + nullity(T).",
        "blocked_prerequisites": ["Rank-Nullity Theorem", "Spectral Decomposition", "Jordan Canonical Form"],
        "recommended_minutes": 45,
        "drill": {
            "question": "For an n × n matrix A, if λ = 0 has algebraic multiplicity 2, what is the minimum value for nullity(A)?",
            "options": ["nullity(A) ≥ 1 (at least 1 non-trivial eigenvector)", "nullity(A) = 0", "nullity(A) = 2 always", "nullity(A) = n"],
            "correct": 0,
            "explanation": "If λ = 0 is an eigenvalue, ker(A - 0I) has dimension at least 1. However, geometric multiplicity can be strictly less than algebraic multiplicity (1 ≤ geom ≤ alg)."
        }
    },
    "Matrix Rank & Vector Pivot": {
        "unit": "Unit 2: Linear Maps & Nullity",
        "weight": "20% of Exam",
        "grounding": "Syllabus §2.1 · Notes Module 2 · Past Paper 2023 Q1b",
        "root_cause": "Misidentifies free variables versus pivot columns during row echelon reduction over singular transformations.",
        "blocked_prerequisites": ["Fundamental Subspaces", "Basis Extraction"],
        "recommended_minutes": 35,
        "drill": {
            "question": "If a 4 × 6 matrix has 3 pivot columns in reduced row echelon form (RREF), what is the dimension of its null space?",
            "options": ["3 (6 columns - 3 pivots = 3 free variables)", "4", "1", "6"],
            "correct": 0,
            "explanation": "By the Rank-Nullity Theorem: nullity = (number of columns) - rank = 6 - 3 = 3 free variables."
        }
    },
    "Jordan Canonical Form": {
        "unit": "Unit 5: Canonical Forms",
        "weight": "15% of Exam",
        "grounding": "Syllabus §5.4 · Textbook Ch 6 p.142 · Past Paper 2024 Q6",
        "root_cause": "Struggles with generalized eigenvectors chain (A - λI)^k v = 0 when geometric multiplicity is less than algebraic multiplicity.",
        "blocked_prerequisites": ["Matrix Exponential", "Coupled Differential Equations"],
        "recommended_minutes": 40,
        "drill": {
            "question": "When does an n × n matrix fail to be diagonalized and require a non-trivial Jordan block?",
            "options": [
                "When geometric multiplicity of an eigenvalue is strictly less than its algebraic multiplicity.",
                "Whenever det(A) = 0.",
                "When all eigenvalues are distinct.",
                "When trace(A) is negative."
            ],
            "correct": 0,
            "explanation": "A matrix is diagonalizable if and only if geometric multiplicity equals algebraic multiplicity for every eigenvalue."
        }
    },
    "Orthogonal Projections": {
        "unit": "Unit 4: Inner Products & Orthogonality",
        "weight": "20% of Exam",
        "grounding": "Syllabus §4.2 · Notes Module 4 · Past Paper 2022 Q4",
        "root_cause": "Algebraic sign errors during Gram-Schmidt inner product projection formula v - proj_u(v).",
        "blocked_prerequisites": ["Least Squares Regression", "QR Decomposition"],
        "recommended_minutes": 25,
        "drill": {
            "question": "What is the projection matrix P that projects any vector in R^n onto the line spanned by unit vector u (||u|| = 1)?",
            "options": ["P = u u^T", "P = u^T u", "P = I - u u^T", "P = u / ||u||"],
            "correct": 0,
            "explanation": "For unit vector u, P = u u^T is a symmetric rank-1 idempotent projection matrix (P^2 = P)."
        }
    },
    "Vector Subspaces": {
        "unit": "Unit 1: Vector Spaces",
        "weight": "15% of Exam",
        "grounding": "Syllabus §1.2 · Textbook Ch 2 p.45 · Past Paper 2023 Q2",
        "root_cause": "Confusing closure under vector addition with affine subspaces that do not contain the zero vector.",
        "blocked_prerequisites": ["Linear Independence", "Spanning Sets"],
        "recommended_minutes": 20,
        "drill": {
            "question": "Which of the following subsets of R^2 is a valid vector subspace?",
            "options": [
                "The set of vectors (x, y) such that 2x - 3y = 0",
                "The set of vectors (x, y) such that x + y = 1",
                "The set of vectors (x, y) where xy ≥ 0",
                "The unit circle x^2 + y^2 = 1"
            ],
            "correct": 0,
            "explanation": "2x - 3y = 0 contains the zero vector (0,0) and is closed under both addition and scalar multiplication."
        }
    },
    "Linear Systems & Solvability": {
        "unit": "Unit 1: Vector Spaces",
        "weight": "10% of Exam",
        "grounding": "Syllabus §1.1 · Textbook Ch 1 p.18 · Past Paper 2025 Q1a",
        "root_cause": "No detected foundational issues. Consistently verified in past diagnostics.",
        "blocked_prerequisites": [],
        "recommended_minutes": 10,
        "drill": {
            "question": "If Ax = b has a unique solution, what must be true about the square matrix A?",
            "options": ["A is invertible and det(A) ≠ 0", "rank(A) = 0", "A has nullity ≥ 1", "A has all zero diagonal elements"],
            "correct": 0,
            "explanation": "Unique solution exists if and only if A has full rank (det(A) ≠ 0 and nullity = 0)."
        }
    },
    "Matrix Determinants": {
        "unit": "Unit 3: Determinants & Bilinear Forms",
        "weight": "10% of Exam",
        "grounding": "Syllabus §3.1 · Textbook Ch 3 p.78 · Past Paper 2025 Q1",
        "root_cause": "No detected foundational issues. Mastered computational fluency.",
        "blocked_prerequisites": [],
        "recommended_minutes": 10,
        "drill": {
            "question": "For a 3 × 3 matrix A with det(A) = 5, what is det(2A)?",
            "options": ["40 (2^3 × 5)", "10", "25", "50"],
            "correct": 0,
            "explanation": "For an n × n matrix, det(c A) = c^n det(A). Here n=3, so 2^3 × 5 = 40."
        }
    }
}

GROUNDED_DIAGNOSTIC_QUESTIONS = [
    {
        "id": "q1",
        "topic": "Quadratic Roots & Nullity",
        "unit": "Unit 2: Linear Maps & Nullity",
        "grounding_source": "Syllabus §2.3 · Past Paper 2024 Q3",
        "question": "For an n × n real matrix A, if λ = 0 is an eigenvalue of algebraic multiplicity 3, which of the following is guaranteed?",
        "options": [
            "dim(null(A)) is between 1 and 3, and det(A) = 0.",
            "dim(null(A)) is strictly equal to 3 under all conditions.",
            "A is invertible because 0 is a valid real root.",
            "The matrix rank of A must equal n."
        ],
        "correct_index": 0,
        "explanation": "Since 0 is an eigenvalue, ker(A) is non-trivial (dim ≥ 1). Geometric multiplicity is bounded above by algebraic multiplicity (1 ≤ dim(null(A)) ≤ 3), and det(A) = 0."
    },
    {
        "id": "q2",
        "topic": "Matrix Rank & Vector Pivot",
        "unit": "Unit 2: Linear Maps & Nullity",
        "grounding_source": "Syllabus §2.1 · Notes Module 2",
        "question": "A linear transformation T: R^5 → R^3 has a 2-dimensional kernel (null space). What is the dimension of the range of T?",
        "options": [
            "3 (since dim(Domain) = dim(Kernel) + dim(Range) => 5 = 2 + 3)",
            "2",
            "5",
            "Cannot be determined without explicit matrix entries."
        ],
        "correct_index": 0,
        "explanation": "By the Rank-Nullity Theorem: dim(V) = nullity(T) + rank(T). With dim(V)=5 and nullity=2, rank = 5 - 2 = 3."
    },
    {
        "id": "q3",
        "topic": "Jordan Canonical Form",
        "unit": "Unit 5: Canonical Forms",
        "grounding_source": "Syllabus §5.4 · Textbook Ch 6 p.142",
        "question": "A 3 × 3 matrix A has characteristic polynomial p(λ) = (λ - 4)^3. Under what condition is A diagonalizable rather than having Jordan blocks?",
        "options": [
            "Only if dim(ker(A - 4I)) = 3 (i.e. A = 4I)",
            "Whenever trace(A) = 12",
            "As long as det(A) = 64",
            "Any matrix with a single eigenvalue is always diagonalizable."
        ],
        "correct_index": 0,
        "explanation": "Diagonalizability requires the geometric multiplicity of λ=4 to equal its algebraic multiplicity (3). The only 3×3 matrix where ker(A-4I)=3 is the scalar matrix A = 4I."
    },
    {
        "id": "q4",
        "topic": "Orthogonal Projections",
        "unit": "Unit 4: Inner Products & Orthogonality",
        "grounding_source": "Syllabus §4.2 · Past Paper 2022 Q4",
        "question": "Let W be a subspace of R^n and P_W be the standard orthogonal projection matrix onto W. What property must P_W satisfy?",
        "options": [
            "P_W is symmetric (P_W^T = P_W) and idempotent (P_W^2 = P_W)",
            "P_W is always invertible with det(P_W) = 1",
            "P_W v = -v for any vector in W",
            "P_W has eigenvalues equal to +1 and -1"
        ],
        "correct_index": 0,
        "explanation": "An orthogonal projection matrix is both self-adjoint (symmetric) and idempotent: P^2 = P and P^T = P."
    },
    {
        "id": "q5",
        "topic": "Matrix Determinants",
        "unit": "Unit 3: Determinants & Bilinear Forms",
        "grounding_source": "Syllabus §3.1 · Midterm 2025 Q1",
        "question": "If A and B are 3 × 3 invertible matrices with det(A) = 3 and det(B) = -2, what is det(2 A B^(-1))?",
        "options": [
            "-12  (since 2^3 × 3 × (-1/2) = 8 × -1.5 = -12)",
            "-3",
            "12",
            "-24"
        ],
        "correct_index": 0,
        "explanation": "For 3×3: det(2 A B^-1) = 2^3 × det(A) × (1/det(B)) = 8 × 3 × (-1/2) = -12."
    }
]

@router.get("")
def get_dashboard_data(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Fetch user profile
        user_query = "SELECT name, email, course FROM users WHERE id = %s" if IS_POSTGRES else "SELECT name, email, course FROM users WHERE id = ?"
        cur.execute(user_query, (user_id,))
        u = cur.fetchone()
        user_name = u[0] if IS_POSTGRES else u["name"]
        user_email = u[1] if IS_POSTGRES else u["email"]
        user_course = u[2] if IS_POSTGRES else u["course"]

        # Fetch knowledge gaps
        gaps_query = "SELECT id, topic, mastery_score, priority, status FROM knowledge_gaps WHERE user_id = %s ORDER BY mastery_score ASC" if IS_POSTGRES else "SELECT id, topic, mastery_score, priority, status FROM knowledge_gaps WHERE user_id = ? ORDER BY mastery_score ASC"
        cur.execute(gaps_query, (user_id,))
        rows = cur.fetchall()
        
        gaps = []
        for r in rows:
            topic_name = r[1] if IS_POSTGRES else r["topic"]
            score = r[2] if IS_POSTGRES else r["mastery_score"]
            priority = r[3] if IS_POSTGRES else r["priority"]
            status = r[4] if IS_POSTGRES else r["status"]
            meta = TOPIC_METADATA.get(topic_name, {
                "unit": "General Curriculum",
                "weight": "15% of Exam",
                "grounding": "Syllabus Grounded",
                "root_cause": "Foundational gaps detected in assessment questions.",
                "blocked_prerequisites": ["Advanced Coursework"],
                "recommended_minutes": 30,
                "drill": None
            })
            gaps.append({
                "id": r[0] if IS_POSTGRES else r["id"],
                "topic": topic_name,
                "mastery_score": score,
                "priority": priority,
                "status": status,
                "unit": meta["unit"],
                "weight": meta["weight"],
                "grounding": meta["grounding"],
                "root_cause": meta["root_cause"],
                "blocked_prerequisites": meta["blocked_prerequisites"],
                "recommended_minutes": meta["recommended_minutes"],
                "drill": meta.get("drill")
            })

        # Calculate metrics
        total_topics = len(gaps)
        mastered_topics = sum(1 for g in gaps if g["mastery_score"] >= 80)
        moderate_topics = sum(1 for g in gaps if 50 <= g["mastery_score"] < 80)
        critical_gaps = sum(1 for g in gaps if g["mastery_score"] < 50)
        avg_score = round(sum(g["mastery_score"] for g in gaps) / total_topics) if total_topics else 0

        # Construct Prioritized Revision Plan: Focus exclusively on what the student DOESN'T know
        # Filter weak and moderate topics, sorted by lowest score (highest need)
        revision_candidates = [g for g in gaps if g["mastery_score"] < 80]
        revision_plan = []
        day_counter = 1
        for cand in sorted(revision_candidates, key=lambda x: x["mastery_score"]):
            revision_plan.append({
                "day": f"Day {day_counter}",
                "day_number": day_counter,
                "topic": cand["topic"],
                "unit": cand["unit"],
                "mastery_score": cand["mastery_score"],
                "priority": "High" if cand["mastery_score"] < 50 else "Medium",
                "estimated_minutes": cand["recommended_minutes"],
                "focus_rationale": cand["root_cause"],
                "action": f"10-min active concept remediation & {len(cand['blocked_prerequisites'])} prerequisite unlocks",
                "drill": cand.get("drill")
            })
            day_counter += 1

        # Ingested Course Materials: Query actual documents uploaded by this user from database
        doc_q = "SELECT id, title, doc_type, file_path, page_count, status FROM documents WHERE user_id = %s ORDER BY created_at DESC" if IS_POSTGRES else "SELECT id, title, doc_type, file_path, page_count, status FROM documents WHERE user_id = ? ORDER BY created_at DESC"
        cur.execute(doc_q, (user_id,))
        doc_rows = cur.fetchall()
        materials = []
        for dr in doc_rows:
            fpath = dr[3] if IS_POSTGRES else dr["file_path"]
            fname = os.path.basename(fpath) if fpath else (dr[1] if IS_POSTGRES else dr["title"])
            materials.append({
                "id": str(dr[0] if IS_POSTGRES else dr["id"]),
                "type": dr[2] if IS_POSTGRES else dr["doc_type"],
                "title": dr[1] if IS_POSTGRES else dr["title"],
                "source": fname,
                "units_count": dr[4] if IS_POSTGRES else dr["page_count"],
                "retrieval_status": dr[5] if IS_POSTGRES else dr["status"]
            })

        # Construct Syllabus Units dynamically from student's actual gaps
        units_map = {}
        for g in gaps:
            u_name = g.get("unit") or "Curriculum Foundations"
            if u_name not in units_map:
                units_map[u_name] = {
                    "unit_id": f"Unit {len(units_map) + 1}",
                    "name": u_name,
                    "exam_weight": g.get("weight") or "15%",
                    "topics_count": 0,
                    "mapped_questions": 0,
                    "scores": []
                }
            units_map[u_name]["topics_count"] += 1
            units_map[u_name]["mapped_questions"] += 4
            units_map[u_name]["scores"].append(g.get("mastery_score", 50))
        
        syllabus_units = []
        for u in units_map.values():
            avg_u = sum(u["scores"]) / len(u["scores"]) if u["scores"] else 50
            status_u = "Critical Gap Identified" if avg_u < 50 else ("Partially Mastered" if avg_u < 80 else "Mastered")
            syllabus_units.append({
                "unit_id": u["unit_id"],
                "name": u["name"],
                "exam_weight": u["exam_weight"],
                "topics_count": u["topics_count"],
                "mapped_questions": u["mapped_questions"],
                "status": status_u
            })

        # Compute cohort / class telemetry dynamically from database
        count_users_sql = "SELECT COUNT(DISTINCT id) FROM users"
        cur.execute(count_users_sql)
        row_cnt = cur.fetchone()
        total_students_enrolled = (row_cnt[0] if row_cnt else 1) or 1

        cur.execute("SELECT AVG(mastery_score) FROM knowledge_gaps")
        avg_score_row = cur.fetchone()
        average_cohort_score = round(avg_score_row[0]) if (avg_score_row and avg_score_row[0] is not None) else avg_score

        topics_group_sql = "SELECT topic, AVG(mastery_score) as avg_m FROM knowledge_gaps GROUP BY topic ORDER BY avg_m ASC"
        cur.execute(topics_group_sql)
        topic_group_rows = cur.fetchall()
        topics_diff = []
        most_common = "None identified"
        highest_mastery = "None identified"
        if topic_group_rows:
            for tgr in topic_group_rows:
                t_name = tgr[0] if IS_POSTGRES else tgr["topic"]
                t_avg = round(tgr[1] if IS_POSTGRES else tgr["avg_m"])
                fail_rate = max(0, 100 - t_avg)
                urg = "High" if fail_rate > 50 else ("Medium" if fail_rate > 25 else "Low")
                topics_diff.append({
                    "topic": t_name,
                    "cohort_failure_rate": f"{fail_rate}%",
                    "urgency": urg
                })
            most_common = f"{topics_diff[0]['topic']} ({topics_diff[0]['cohort_failure_rate']} need review)"
            highest_t = max(topic_group_rows, key=lambda x: (x[1] if IS_POSTGRES else x["avg_m"]))
            highest_name = highest_t[0] if IS_POSTGRES else highest_t["topic"]
            highest_score = round(highest_t[1] if IS_POSTGRES else highest_t["avg_m"])
            highest_mastery = f"{highest_name} ({highest_score}% average mastery)"

        class_insights = {
            "total_students_enrolled": total_students_enrolled,
            "average_cohort_score": average_cohort_score,
            "most_common_class_gap": most_common,
            "highest_mastery_topic": highest_mastery,
            "topics_difficulty": topics_diff
        }

        return {
            "user": {
                "name": user_name,
                "email": user_email,
                "course": user_course
            },
            "metrics": {
                "overall_knowledge_score": avg_score,
                "total_topics": total_topics,
                "critical_gaps_count": critical_gaps,
                "moderate_topics_count": moderate_topics,
                "mastered_topics_count": mastered_topics,
                "revision_days_needed": len(revision_plan)
            },
            "materials": materials,
            "syllabus_units": syllabus_units,
            "diagnostic_questions": GROUNDED_DIAGNOSTIC_QUESTIONS,
            "gaps": gaps,
            "knowledge_distribution": {
                "weak": [g for g in gaps if g["mastery_score"] < 50],
                "medium": [g for g in gaps if 50 <= g["mastery_score"] < 80],
                "strong": [g for g in gaps if g["mastery_score"] >= 80]
            },
            "revision_plan": revision_plan,
            "class_insights": class_insights
        }
    finally:
        cur.close()
        conn.close()

class DiagnosticSubmission(BaseModel):
    answers: Dict[str, int] # question_id -> selected_option_index

@router.post("/submit-diagnostic")
def submit_diagnostic(sub: DiagnosticSubmission, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        evaluated_results = []
        topic_scores = {}
        
        # Grade questions
        for q in GROUNDED_DIAGNOSTIC_QUESTIONS:
            qid = q["id"]
            selected = sub.answers.get(qid)
            is_correct = (selected == q["correct_index"])
            topic = q["topic"]
            
            evaluated_results.append({
                "question_id": qid,
                "topic": topic,
                "is_correct": is_correct,
                "selected": selected,
                "correct_index": q["correct_index"],
                "explanation": q["explanation"]
            })
            
            if is_correct:
                topic_scores[topic] = min(96, topic_scores.get(topic, 50) + 30)
            else:
                topic_scores[topic] = max(25, topic_scores.get(topic, 50) - 20)

        # Update database for affected topics
        for topic, new_score in topic_scores.items():
            priority = "High" if new_score < 50 else ("Medium" if new_score < 80 else "Low")
            status = "Critical Gap" if new_score < 50 else ("Needs Review" if new_score < 80 else "Mastered")
            
            chk_q = "SELECT id FROM knowledge_gaps WHERE user_id = %s AND topic = %s" if IS_POSTGRES else "SELECT id FROM knowledge_gaps WHERE user_id = ? AND topic = ?"
            cur.execute(chk_q, (user_id, topic))
            row_exists = cur.fetchone()
            
            if row_exists:
                update_query = """
                    UPDATE knowledge_gaps 
                    SET mastery_score = %s, priority = %s, status = %s 
                    WHERE user_id = %s AND topic = %s
                """ if IS_POSTGRES else """
                    UPDATE knowledge_gaps 
                    SET mastery_score = ?, priority = ?, status = ? 
                    WHERE user_id = ? AND topic = ?
                """
                cur.execute(update_query, (new_score, priority, status, user_id, topic))
            else:
                insert_query = """
                    INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                    VALUES (%s, %s, %s, %s, %s)
                """ if IS_POSTGRES else """
                    INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                    VALUES (?, ?, ?, ?, ?)
                """
                cur.execute(insert_query, (user_id, topic, new_score, priority, status))
            
            # Log session
            session_query = """
                INSERT INTO diagnostic_sessions (user_id, topic, score, feedback)
                VALUES (%s, %s, %s, %s)
            """ if IS_POSTGRES else """
                INSERT INTO diagnostic_sessions (user_id, topic, score, feedback)
                VALUES (?, ?, ?, ?)
            """
            cur.execute(session_query, (user_id, topic, new_score, f"Diagnostic evaluated: score {new_score}%"))

        # Log to study_activity
        act_query = """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (%s, %s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (?, ?, ?, ?, ?)
        """
        cur.execute(act_query, (user_id, "Completed Diagnostic Assessment", "Diagnostic", f"Evaluated {len(topic_scores)} topic(s) with active grounding.", "Just now"))

        conn.commit()
        return {
            "message": "Diagnostic assessment evaluated and knowledge gaps updated successfully.",
            "results": evaluated_results
        }
    finally:
        cur.close()
        conn.close()

class RemediateRequest(BaseModel):
    topic: str
    score_boost: Optional[int] = 35

@router.post("/remediate")
def remediate_topic(req: RemediateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    topic = req.topic.strip()
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Fetch current score
        fetch_query = "SELECT mastery_score FROM knowledge_gaps WHERE user_id = %s AND topic = %s" if IS_POSTGRES else "SELECT mastery_score FROM knowledge_gaps WHERE user_id = ? AND topic = ?"
        cur.execute(fetch_query, (user_id, topic))
        row = cur.fetchone()
        
        current_score = (row[0] if IS_POSTGRES else row["mastery_score"]) if row else 35
        new_score = min(95, current_score + (req.score_boost or 35))
        priority = "High" if new_score < 50 else ("Medium" if new_score < 80 else "Low")
        status = "Critical Gap" if new_score < 50 else ("Needs Review" if new_score < 80 else "Mastered")

        if row:
            update_query = """
                UPDATE knowledge_gaps 
                SET mastery_score = %s, priority = %s, status = %s 
                WHERE user_id = %s AND topic = %s
            """ if IS_POSTGRES else """
                UPDATE knowledge_gaps 
                SET mastery_score = ?, priority = ?, status = ? 
                WHERE user_id = ? AND topic = ?
            """
            cur.execute(update_query, (new_score, priority, status, user_id, topic))
        else:
            insert_query = """
                INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                VALUES (%s, %s, %s, %s, %s)
            """ if IS_POSTGRES else """
                INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                VALUES (?, ?, ?, ?, ?)
            """
            cur.execute(insert_query, (user_id, topic, new_score, priority, status))

        # Log to study_activity
        act_query = """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (%s, %s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (?, ?, ?, ?, ?)
        """
        cur.execute(act_query, (user_id, f"Remediated: {topic}", "Remediation", f"Mastery increased to {new_score}%.", "Just now"))

        conn.commit()

        return {
            "topic": topic,
            "previous_score": current_score,
            "new_score": new_score,
            "status": status,
            "message": f"Remediation recorded! Topic '{topic}' increased from {current_score}% to {new_score}%."
        }
    finally:
        cur.close()
        conn.close()

@router.post("/reset")
def reset_gaps(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        del_query = "DELETE FROM knowledge_gaps WHERE user_id = %s" if IS_POSTGRES else "DELETE FROM knowledge_gaps WHERE user_id = ?"
        cur.execute(del_query, (user_id,))
        conn.commit()
        return {"message": "Knowledge gaps reset."}
    finally:
        cur.close()
        conn.close()
