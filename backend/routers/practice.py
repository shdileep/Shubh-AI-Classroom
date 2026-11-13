from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.database import get_connection, IS_POSTGRES
from backend.auth import get_current_user

router = APIRouter(prefix="/api/practice", tags=["practice"])

PRACTICE_DRILLS_BANK = {
    "Quadratic Roots & Nullity": [
        {
            "id": "drill-qr-1",
            "question": "For an n × n matrix A, if λ = 0 has algebraic multiplicity 2, what is the mathematically guaranteed minimum value for nullity(A)?",
            "options": [
                "nullity(A) ≥ 1 (at least 1 non-trivial eigenvector exists in ker(A))",
                "nullity(A) = 0 always",
                "nullity(A) = 2 always without exception",
                "nullity(A) = n"
            ],
            "correct_option_index": 0,
            "explanation": "If λ = 0 is an eigenvalue, ker(A - 0I) has dimension at least 1. However, geometric multiplicity can be strictly less than algebraic multiplicity (1 <= geom <= alg).",
            "source_citation": "Strang Linear Algebra Ch 4 p.112"
        },
        {
            "id": "drill-qr-2",
            "question": "If matrix A has rank 3 and size 5 × 5, what is the geometric multiplicity of the zero eigenvalue (i.e. dim of kernel)?",
            "options": [
                "2 (by Rank-Nullity: 5 - 3 = 2)",
                "3",
                "5",
                "0"
            ],
            "correct_option_index": 0,
            "explanation": "By the Rank-Nullity Theorem: nullity = n - rank = 5 - 3 = 2. The kernel dimension is 2.",
            "source_citation": "Course Syllabus §2.3"
        }
    ],
    "Matrix Rank & Vector Pivot": [
        {
            "id": "drill-mr-1",
            "question": "If a 4 × 6 matrix has 3 pivot columns in reduced row echelon form (RREF), what is the dimension of its null space?",
            "options": [
                "3 (6 columns - 3 pivots = 3 free variables)",
                "4",
                "1",
                "6"
            ],
            "correct_option_index": 0,
            "explanation": "By the Rank-Nullity Theorem: nullity = (number of columns) - rank = 6 - 3 = 3 free variables.",
            "source_citation": "Notes Module 2 §2.1"
        },
        {
            "id": "drill-mr-2",
            "question": "True or False: The rank of a matrix equals the number of non-zero rows in any row echelon form of A.",
            "options": [
                "True",
                "False"
            ],
            "correct_option_index": 0,
            "explanation": "Every non-zero row in row echelon form contains a leading entry (pivot), so the number of non-zero rows equals the rank.",
            "source_citation": "Strang Ch 2 p.62"
        }
    ],
    "Jordan Canonical Form": [
        {
            "id": "drill-jcf-1",
            "question": "When does an n × n matrix fail to be diagonalizable and require a non-trivial Jordan block?",
            "options": [
                "When the geometric multiplicity of an eigenvalue is strictly less than its algebraic multiplicity.",
                "Whenever det(A) = 0.",
                "When all eigenvalues are distinct.",
                "When the trace of A is zero."
            ],
            "correct_option_index": 0,
            "explanation": "A matrix is diagonalizable if and only if geometric multiplicity equals algebraic multiplicity for every eigenvalue.",
            "source_citation": "Strang Ch 6 p.142"
        }
    ],
    "Orthogonal Projections": [
        {
            "id": "drill-op-1",
            "question": "What is the projection matrix P that projects any vector in R^n onto the line spanned by unit vector u (||u|| = 1)?",
            "options": [
                "P = u u^T",
                "P = u^T u",
                "P = I - u u^T",
                "P = u / ||u||"
            ],
            "correct_option_index": 0,
            "explanation": "For unit vector u, P = u u^T is a symmetric rank-1 idempotent projection matrix (P^2 = P).",
            "source_citation": "Past Paper 2022 Q4"
        }
    ],
    "Vector Subspaces": [
        {
            "id": "drill-vs-1",
            "question": "Which of the following subsets of R^2 is a valid vector subspace?",
            "options": [
                "The set of vectors (x, y) such that 2x - 3y = 0",
                "The set of vectors (x, y) such that x + y = 1",
                "The quadrant set where xy ≥ 0",
                "The unit circle x^2 + y^2 = 1"
            ],
            "correct_option_index": 0,
            "explanation": "2x - 3y = 0 contains the zero vector (0,0) and is closed under both addition and scalar multiplication.",
            "source_citation": "Textbook Ch 2 p.45"
        }
    ]
}

class PracticeGenerateRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "Medium"

@router.post("/generate")
def generate_practice(req: PracticeGenerateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Generate targeted adaptive micro-drills tailored to remediate identified gaps."""
    topic = req.topic.strip()
    drills = PRACTICE_DRILLS_BANK.get(topic, [
        {
            "id": f"drill-gen-1",
            "question": f"Review core definition: In the context of {topic}, which foundational property is essential for mathematical solvability?",
            "options": [
                f"Closure under linear operations and non-trivial subspace dimension in {topic}.",
                "Having strictly real coefficients on the main diagonal.",
                "Non-zero determinant under all transformations.",
                "Orthogonality to all basis vectors."
            ],
            "correct_option_index": 0,
            "explanation": f"Foundational understanding of {topic} requires verifying closure and dimension properties.",
            "source_citation": f"Course Materials §{topic}"
        }
    ])

    return {
        "topic": topic,
        "difficulty": req.difficulty,
        "drills_count": len(drills),
        "drills": drills
    }

class PracticeSubmitRequest(BaseModel):
    topic: str
    drill_id: str
    selected_option_index: int
    correct_option_index: int

@router.post("/submit")
def submit_practice(req: PracticeSubmitRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Adaptive Retesting Evaluation:
    When a student correctly solves targeted practice on a gap, their mastery score
    is updated in the database, moving them from Weak -> Medium or Medium -> Strong!
    """
    user_id = current_user["sub"]
    topic = req.topic.strip()
    is_correct = (req.selected_option_index == req.correct_option_index)

    conn = get_connection()
    cur = conn.cursor()
    try:
        # Fetch current score
        fetch_sql = "SELECT mastery_score FROM knowledge_gaps WHERE user_id = %s AND topic = %s" if IS_POSTGRES else "SELECT mastery_score FROM knowledge_gaps WHERE user_id = ? AND topic = ?"
        cur.execute(fetch_sql, (user_id, topic))
        row = cur.fetchone()

        current_score = (row[0] if IS_POSTGRES else row["mastery_score"]) if row else 35

        if is_correct:
            # Boost score adaptively
            new_score = min(95, current_score + 25)
        else:
            new_score = max(20, current_score - 10)

        new_priority = "High" if new_score < 50 else ("Medium" if new_score < 80 else "Low")
        new_status = "Critical Gap" if new_score < 50 else ("Needs Review" if new_score < 80 else "Mastered")

        # Update or Insert in DB
        if row:
            up_sql = """
                UPDATE knowledge_gaps SET mastery_score = %s, priority = %s, status = %s
                WHERE user_id = %s AND topic = %s
            """ if IS_POSTGRES else """
                UPDATE knowledge_gaps SET mastery_score = ?, priority = ?, status = ?
                WHERE user_id = ? AND topic = ?
            """
            cur.execute(up_sql, (new_score, new_priority, new_status, user_id, topic))
        else:
            ins_sql = """
                INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                VALUES (%s, %s, %s, %s, %s)
            """ if IS_POSTGRES else """
                INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                VALUES (?, ?, ?, ?, ?)
            """
            cur.execute(ins_sql, (user_id, topic, new_score, new_priority, new_status))

        # Log session
        sess_sql = """
            INSERT INTO diagnostic_sessions (user_id, topic, score, feedback)
            VALUES (%s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO diagnostic_sessions (user_id, topic, score, feedback)
            VALUES (?, ?, ?, ?)
        """
        cur.execute(sess_sql, (user_id, topic, new_score, f"Practice drill {'passed' if is_correct else 'failed'}: mastery updated to {new_score}%"))

        # Log activity
        act_sql = """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (%s, %s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (?, ?, ?, ?, ?)
        """
        cur.execute(act_sql, (user_id, f"Practiced {topic}", "Practice", f"Drill result: {'Correct' if is_correct else 'Incorrect'}. Mastery updated from {current_score}% to {new_score}%.", "Just now"))

        conn.commit()

        return {
            "topic": topic,
            "is_correct": is_correct,
            "previous_score": current_score,
            "new_score": new_score,
            "new_status": new_status,
            "message": f"Practice evaluated! Topic '{topic}' mastery updated from {current_score}% to {new_score}%."
        }
    finally:
        cur.close()
        conn.close()
