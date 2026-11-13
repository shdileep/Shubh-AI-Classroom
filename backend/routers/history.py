import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from backend.database import get_connection, IS_POSTGRES
from backend.auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("")
def get_learning_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Retrieve full chronological activity log of student's actual completed diagnostic events,
    quizzes with achievement badges (e.g. 100% mastery), revision tasks, and uploaded documents.
    """
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        activities = []

        # 1. Fetch completed diagnostic sessions (quizzes & assessments)
        sess_sql = (
            "SELECT id, topic, score, feedback, created_at FROM diagnostic_sessions WHERE user_id = %s ORDER BY created_at DESC"
            if IS_POSTGRES else
            "SELECT id, topic, score, feedback, created_at FROM diagnostic_sessions WHERE user_id = ? ORDER BY created_at DESC"
        )
        cur.execute(sess_sql, (user_id,))
        for s in cur.fetchall():
            s_id = s[0] if IS_POSTGRES else s["id"]
            topic = s[1] if IS_POSTGRES else s["topic"]
            score = s[2] if IS_POSTGRES else s["score"]
            feedback = s[3] if IS_POSTGRES else s["feedback"]
            ts = s[4] if IS_POSTGRES else s["created_at"]
            ts_str = str(ts)[:16].replace("T", " ") if ts else "Recent"

            badge = "100% Score Achieved" if score >= 95 else (f"{score}% Score Achieved" if score >= 80 else f"{score}% Diagnostic Score")
            badge_color = "bg-emerald-100 text-emerald-800 border-emerald-300" if score >= 80 else "bg-amber-100 text-amber-800 border-amber-300"

            activities.append({
                "id": f"sess-{s_id}",
                "topic_heading": topic,
                "title": f"Diagnostic Assessment: {topic}",
                "tag": "Diagnostic Quiz",
                "aspect_completed": f"Completed 5-question diagnostic on {topic}",
                "achievement": badge,
                "badge_color": badge_color,
                "score": score,
                "description": feedback or f"Demonstrated {score}% concept accuracy with grounded textbook derivations.",
                "timestamp_label": ts_str,
                "created_at": ts_str
            })

        # 2. Fetch completed revision tasks
        task_sql = (
            "SELECT id, day_number, topic, objective, completed_at FROM revision_tasks WHERE user_id = %s AND completed = TRUE ORDER BY completed_at DESC"
            if IS_POSTGRES else
            "SELECT id, day_number, topic, objective, completed_at FROM revision_tasks WHERE user_id = ? AND completed = 1 ORDER BY completed_at DESC"
        )
        cur.execute(task_sql, (user_id,))
        for t in cur.fetchall():
            t_id = t[0] if IS_POSTGRES else t["id"]
            day_num = t[1] if IS_POSTGRES else t["day_number"]
            topic = t[2] if IS_POSTGRES else t["topic"]
            obj = t[3] if IS_POSTGRES else t["objective"]
            ts = t[4] if IS_POSTGRES else t["completed_at"]
            ts_str = str(ts)[:16].replace("T", " ") if ts else "Today"

            activities.append({
                "id": f"task-{t_id}",
                "topic_heading": topic,
                "title": f"Revision Completed: Day {day_num} — {topic}",
                "tag": "Revision Plan",
                "aspect_completed": f"Completed foundational remediation drill for Day {day_num}",
                "achievement": "Task 100% Completed",
                "badge_color": "bg-blue-100 text-blue-800 border-blue-300",
                "score": 100,
                "description": obj or f"Closed conceptual gap in {topic} and unlocked downstream course prerequisites.",
                "timestamp_label": ts_str,
                "created_at": ts_str
            })

        # 3. Fetch uploaded course documents
        doc_sql = (
            "SELECT id, file_path, title, page_count, created_at FROM documents WHERE user_id = %s ORDER BY created_at DESC"
            if IS_POSTGRES else
            "SELECT id, file_path, title, page_count, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC"
        )
        cur.execute(doc_sql, (user_id,))
        for d in cur.fetchall():
            d_id = d[0] if IS_POSTGRES else d["id"]
            fpath = d[1] if IS_POSTGRES else d["file_path"]
            title = d[2] if IS_POSTGRES else d["title"]
            pages = d[3] if IS_POSTGRES else d["page_count"]
            ts = d[4] if IS_POSTGRES else d["created_at"]
            fname = title or (os.path.basename(fpath) if fpath else "Course Document")
            ts_str = str(ts)[:16].replace("T", " ") if ts else "Recent"

            activities.append({
                "id": f"doc-{d_id}",
                "topic_heading": title or fname,
                "title": f"Material Grounded: {title or fname}",
                "tag": "Course Material",
                "aspect_completed": f"Processed {pages} page(s) and assembled learning concept chunks",
                "achievement": "Indexed & Vector Grounded",
                "badge_color": "bg-purple-100 text-purple-800 border-purple-300",
                "score": 100,
                "description": f"Extracted syllabus and problem-set references for retrieval-grounded diagnostic scoring.",
                "timestamp_label": ts_str,
                "created_at": ts_str
            })

        # 4. Fetch general study activities
        act_sql = (
            "SELECT id, title, tag, description, timestamp_label, created_at FROM study_activity WHERE user_id = %s ORDER BY created_at DESC"
            if IS_POSTGRES else
            "SELECT id, title, tag, description, timestamp_label, created_at FROM study_activity WHERE user_id = ? ORDER BY created_at DESC"
        )
        cur.execute(act_sql, (user_id,))
        for a in cur.fetchall():
            a_id = a[0] if IS_POSTGRES else a["id"]
            title = a[1] if IS_POSTGRES else a["title"]
            tag = a[2] if IS_POSTGRES else a["tag"]
            desc = a[3] if IS_POSTGRES else a["description"]
            ts_label = a[4] if IS_POSTGRES else a["timestamp_label"]
            created = a[5] if IS_POSTGRES else a["created_at"]
            created_str = str(created)[:16].replace("T", " ") if created else (ts_label or "Recent")

            activities.append({
                "id": f"act-{a_id}",
                "topic_heading": title.split(":")[-1].strip() if ":" in title else title,
                "title": title,
                "tag": tag or "Study Event",
                "aspect_completed": desc[:80] + ("..." if len(desc) > 80 else ""),
                "achievement": "Logged Activity",
                "badge_color": "bg-stone-100 text-stone-800 border-stone-300",
                "score": 85,
                "description": desc,
                "timestamp_label": ts_label or created_str,
                "created_at": created_str
            })

        return {"activities": activities, "total": len(activities)}
    finally:
        cur.close()
        conn.close()
