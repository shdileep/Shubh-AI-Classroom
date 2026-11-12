from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from backend.database import get_connection, IS_POSTGRES
from backend.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

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
            if IS_POSTGRES:
                gaps.append({
                    "id": r[0],
                    "topic": r[1],
                    "mastery_score": r[2],
                    "priority": r[3],
                    "status": r[4]
                })
            else:
                gaps.append({
                    "id": r["id"],
                    "topic": r["topic"],
                    "mastery_score": r["mastery_score"],
                    "priority": r["priority"],
                    "status": r["status"]
                })

        # Calculate metrics
        total_topics = len(gaps) if gaps else 24
        mastered_topics = sum(1 for g in gaps if g["mastery_score"] >= 80) if gaps else 18
        critical_gaps = sum(1 for g in gaps if g["mastery_score"] < 50) if gaps else 6
        avg_score = round(sum(g["mastery_score"] for g in gaps) / len(gaps)) if gaps else 74

        return {
            "user": {
                "name": user_name,
                "email": user_email,
                "course": user_course
            },
            "metrics": {
                "overall_knowledge_score": avg_score,
                "score_trend": "+6%",
                "topics_mastered": f"{mastered_topics} / {total_topics}",
                "topics_mastered_ratio": f"{round((mastered_topics/total_topics)*100)}%",
                "critical_gaps_count": critical_gaps,
                "study_volume_hours": 28.5,
                "active_streak_days": 8
            },
            "active_module": {
                "module_id": "03 / 08",
                "course": "MATH 204: Linear Algebra & Diff Eq",
                "title": "Eigenvalues & Matrix Diagonalization",
                "focus": "Resolving spectral decomposition confusion identified in your Multivariable Diagnostic #3.",
                "progress_percent": 65,
                "estimated_time_remaining": "12 min drill left",
                "micro_problems_completed": "8/12"
            },
            "knowledge_distribution": {
                "weak": [g for g in gaps if g["mastery_score"] < 50],
                "medium": [g for g in gaps if 50 <= g["mastery_score"] < 80],
                "strong": [g for g in gaps if g["mastery_score"] >= 80]
            }
        }
    finally:
        cur.close()
        conn.close()
