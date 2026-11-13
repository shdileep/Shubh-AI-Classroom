import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.database import get_connection, IS_POSTGRES
from backend.auth import get_current_user
from backend.services.revision_engine import revision_planner_engine

router = APIRouter(prefix="/api/revision-plans", tags=["revision"])

@router.get("")
@router.get("/active")
def get_revision_plan(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve the student's active personalized revision plan with completed status."""
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Check if student has taken any assessments
        cur.execute("SELECT COUNT(*) FROM diagnostic_sessions WHERE user_id = %s" if IS_POSTGRES else "SELECT COUNT(*) FROM diagnostic_sessions WHERE user_id = ?", (user_id,))
        diag_count = cur.fetchone()[0] or 0

        cur.execute("SELECT COUNT(*) FROM assignment_submissions WHERE user_id = %s" if IS_POSTGRES else "SELECT COUNT(*) FROM assignment_submissions WHERE user_id = ?", (user_id,))
        sub_count = cur.fetchone()[0] or 0

        cur.execute("SELECT COUNT(*) FROM practice_submissions WHERE user_id = %s" if IS_POSTGRES else "SELECT COUNT(*) FROM practice_submissions WHERE user_id = ?", (user_id,))
        prac_count = cur.fetchone()[0] or 0

        if (diag_count + sub_count + prac_count) == 0:
            rows = []
        else:
            gaps_sql = "SELECT topic, mastery_score, priority, status FROM knowledge_gaps WHERE user_id = %s AND status != 'Untested' ORDER BY mastery_score ASC" if IS_POSTGRES else "SELECT topic, mastery_score, priority, status FROM knowledge_gaps WHERE user_id = ? AND status != 'Untested' ORDER BY mastery_score ASC"
            cur.execute(gaps_sql, (user_id,))
            rows = cur.fetchall()

        gaps = []
        for r in rows:
            gaps.append({
                "topic": r[0] if IS_POSTGRES else r["topic"],
                "mastery_score": r[1] if IS_POSTGRES else r["mastery_score"],
                "priority": r[2] if IS_POSTGRES else r["priority"],
                "status": r[3] if IS_POSTGRES else r["status"]
            })

        # Fetch completed tasks for user
        tasks_sql = "SELECT id, day_number, topic, priority, estimated_minutes, objective, source_section, practice_question_count, completed FROM revision_tasks WHERE user_id = %s" if IS_POSTGRES else "SELECT id, day_number, topic, priority, estimated_minutes, objective, source_section, practice_question_count, completed FROM revision_tasks WHERE user_id = ?"
        cur.execute(tasks_sql, (user_id,))
        task_rows = cur.fetchall()

        existing_tasks = []
        for tr in task_rows:
            existing_tasks.append({
                "id": str(tr[0] if IS_POSTGRES else tr["id"]),
                "day_number": tr[1] if IS_POSTGRES else tr["day_number"],
                "topic": tr[2] if IS_POSTGRES else tr["topic"],
                "priority": tr[3] if IS_POSTGRES else tr["priority"],
                "estimated_duration_minutes": tr[4] if IS_POSTGRES else tr["estimated_minutes"],
                "revision_objective": tr[5] if IS_POSTGRES else tr["objective"],
                "recommended_source_section": tr[6] if IS_POSTGRES else tr["source_section"],
                "practice_question_count": tr[7] if IS_POSTGRES else tr["practice_question_count"],
                "completed": bool(tr[8] if IS_POSTGRES else tr["completed"])
            })

        # Generate fresh or adapted plan
        plan = revision_planner_engine.generate_plan(
            gaps=gaps,
            target_exam_date="2026-12-15",
            daily_available_hours=1.5,
            existing_tasks=existing_tasks
        )

        return plan
    finally:
        cur.close()
        conn.close()

class TaskCompleteRequest(BaseModel):
    task_id: str
    completed: bool

@router.post("/tasks/{task_id}/complete")
def toggle_task_complete(task_id: str, req: TaskCompleteRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Toggle completion status of a revision study task with Postgres & SQLite type safety."""
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Safely check if task matches by integer ID or by task key/topic
        is_int = task_id.isdigit()
        if is_int:
            chk_sql = "SELECT id FROM revision_tasks WHERE id = %s AND user_id = %s" if IS_POSTGRES else "SELECT id FROM revision_tasks WHERE id = ? AND user_id = ?"
            cur.execute(chk_sql, (int(task_id), user_id))
        else:
            chk_sql = "SELECT id FROM revision_tasks WHERE (topic = %s OR source_section = %s) AND user_id = %s" if IS_POSTGRES else "SELECT id FROM revision_tasks WHERE (topic = ? OR source_section = ?) AND user_id = ?"
            cur.execute(chk_sql, (task_id, task_id, user_id))

        exists = cur.fetchone()
        rec_id = (exists[0] if IS_POSTGRES else exists["id"]) if exists else None

        completed_val = req.completed if IS_POSTGRES else (1 if req.completed else 0)
        now_ts = datetime.datetime.now()

        if rec_id:
            up_sql = "UPDATE revision_tasks SET completed = %s, completed_at = %s WHERE id = %s AND user_id = %s" if IS_POSTGRES else "UPDATE revision_tasks SET completed = ?, completed_at = ? WHERE id = ? AND user_id = ?"
            cur.execute(up_sql, (completed_val, now_ts, rec_id, user_id))
        else:
            # Insert record for this task key safely without hardcoding primary key id
            ins_sql = """
                INSERT INTO revision_tasks (user_id, day_number, topic, source_section, completed, completed_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """ if IS_POSTGRES else """
                INSERT INTO revision_tasks (user_id, day_number, topic, source_section, completed, completed_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """
            cur.execute(ins_sql, (user_id, 1, task_id, task_id, completed_val, now_ts))

        # Log activity
        if req.completed:
            act_sql = """
                INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
                VALUES (%s, %s, %s, %s, %s)
            """ if IS_POSTGRES else """
                INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
                VALUES (?, ?, ?, ?, ?)
            """
            cur.execute(act_sql, (user_id, f"Completed Revision Task", "Revision", f"Marked task {task_id} as finished.", "Just now"))

        conn.commit()
        return {"message": f"Task {task_id} marked as {'completed' if req.completed else 'in progress'}.", "task_id": task_id, "completed": req.completed}
    finally:
        cur.close()
        conn.close()

@router.post("/regenerate")
def regenerate_plan(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Regenerate revision plan adapting to latest diagnostic knowledge improvements."""
    return get_revision_plan(current_user=current_user)

class ScheduleSessionRequest(BaseModel):
    title: str
    scheduled_date: str
    scheduled_time: str
    document_id: Optional[int] = None
    topic: Optional[str] = "Core Concepts"

@router.post("/schedule-session")
def schedule_revision_session(req: ScheduleSessionRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Schedule a timed revision session with target document and topic.
    Dispatches exciting 5-minute pre-session reminder email via Resend to student's verified email.
    """
    user_id = current_user["sub"]
    student_name = current_user.get("name", "Student")
    student_email = current_user.get("email", "")

    conn = get_connection()
    cur = conn.cursor()
    try:
        ins_sql = """
            INSERT INTO revision_schedules (user_id, title, scheduled_date, scheduled_time, document_id, topic, status, reminder_sent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """ if IS_POSTGRES else """
            INSERT INTO revision_schedules (user_id, title, scheduled_date, scheduled_time, document_id, topic, status, reminder_sent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        reminder_sent_val = True if IS_POSTGRES else 1
        cur.execute(ins_sql, (user_id, req.title, req.scheduled_date, req.scheduled_time, req.document_id, req.topic, "Scheduled", reminder_sent_val))
        schedule_id = cur.fetchone()[0] if IS_POSTGRES else cur.lastrowid

        # Log study activity
        act_sql = """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (%s, %s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (?, ?, ?, ?, ?)
        """
        cur.execute(act_sql, (user_id, f"Scheduled Revision: {req.title}", "Revision", f"Targeting {req.topic} on {req.scheduled_date} at {req.scheduled_time}.", "Just now"))
        conn.commit()

        # Send exciting reminder email to student via Resend
        email_result = {"success": False}
        if student_email and "@" in student_email:
            try:
                from backend.email_service import send_revision_reminder_email
                email_result = send_revision_reminder_email(
                    name=student_name,
                    email=student_email,
                    session_title=req.title,
                    scheduled_date=req.scheduled_date,
                    scheduled_time=req.scheduled_time,
                    topic_name=req.topic or "Course Materials"
                )
            except Exception as e:
                print(f"[Revision] Reminder email notice: {e}")

        return {
            "message": f"Revision session '{req.title}' successfully scheduled for {req.scheduled_date} at {req.scheduled_time}.",
            "schedule": {
                "id": schedule_id,
                "title": req.title,
                "scheduled_date": req.scheduled_date,
                "scheduled_time": req.scheduled_time,
                "topic": req.topic,
                "document_id": req.document_id,
                "status": "Scheduled",
                "reminder_sent": email_result.get("success", False),
                "resend_email_id": email_result.get("id")
            }
        }
    finally:
        cur.close()
        conn.close()

@router.get("/scheduled-sessions")
def get_scheduled_sessions(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch all scheduled revision sessions for the authenticated student."""
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
            SELECT id, title, scheduled_date, scheduled_time, document_id, topic, status, reminder_sent, created_at
            FROM revision_schedules
            WHERE user_id = %s
            ORDER BY id DESC
        """ if IS_POSTGRES else """
            SELECT id, title, scheduled_date, scheduled_time, document_id, topic, status, reminder_sent, created_at
            FROM revision_schedules
            WHERE user_id = ?
            ORDER BY id DESC
        """
        cur.execute(sql, (user_id,))
        rows = cur.fetchall()
        sessions = []
        for r in rows:
            sessions.append({
                "id": r[0] if IS_POSTGRES else r["id"],
                "title": r[1] if IS_POSTGRES else r["title"],
                "scheduled_date": r[2] if IS_POSTGRES else r["scheduled_date"],
                "scheduled_time": r[3] if IS_POSTGRES else r["scheduled_time"],
                "document_id": r[4] if IS_POSTGRES else r["document_id"],
                "topic": r[5] if IS_POSTGRES else r["topic"],
                "status": r[6] if IS_POSTGRES else r["status"],
                "reminder_sent": bool(r[7] if IS_POSTGRES else r["reminder_sent"]),
                "created_at": str(r[8] if IS_POSTGRES else r["created_at"])[:16].replace("T", " ")
            })
        return {"sessions": sessions, "total": len(sessions)}
    finally:
        cur.close()
        conn.close()
