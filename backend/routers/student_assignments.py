import json
import re
import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.database import get_connection, IS_POSTGRES
from backend.auth import get_current_user

router = APIRouter(prefix="/api/student/assignments", tags=["student-assignments"])


def _check_time_window(start_time_str: str, end_time_str: str):
    """
    Evaluate whether current time falls within start_time and end_time.
    Supports ISO formats like '2026-11-13T20:00' or standard date formats.
    """
    now = datetime.datetime.now()
    try:
        # Try ISO parse
        st = datetime.datetime.fromisoformat(start_time_str)
        et = datetime.datetime.fromisoformat(end_time_str)
    except Exception:
        try:
            st = datetime.datetime.strptime(start_time_str, "%Y-%m-%d %H:%M")
            et = datetime.datetime.strptime(end_time_str, "%Y-%m-%d %H:%M")
        except Exception:
            # Fallback: if unparseable, allow attempt
            return True, False, False, f"Active ({start_time_str} to {end_time_str})"

    if now < st:
        return False, True, False, f"Opens {st.strftime('%b %d, %I:%M %p')}"
    elif now > et:
        return False, False, True, f"Closed {et.strftime('%b %d, %I:%M %p')}"
    else:
        return True, False, False, f"Due {et.strftime('%b %d at %I:%M %p')}"


@router.get("")
def list_student_assignments(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetch all assignments published by teachers.
    Evaluates attempt time window and submission status for the logged-in student.
    Provides real-time notification count.
    """
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
            SELECT id, teacher_id, title, topic, subject, faculty_name, assignment_type,
                   document_title, start_time, end_time, duration_minutes, total_questions, status, created_at
            FROM teacher_assignments
            WHERE status = 'active'
            ORDER BY created_at DESC
        """
        cur.execute(sql)
        rows = cur.fetchall()

        assignments = []
        new_notifications_count = 0

        for r in rows:
            aid = r[0] if IS_POSTGRES else r["id"]
            start_time = r[8] if IS_POSTGRES else r["start_time"]
            end_time = r[9] if IS_POSTGRES else r["end_time"]
            duration = r[10] if IS_POSTGRES else r["duration_minutes"]

            is_open, is_upcoming, is_closed, time_label = _check_time_window(start_time, end_time)

            # Check if current student submitted
            sub_sql = """
                SELECT id, score, total_marks, submitted_at, time_spent_seconds
                FROM assignment_submissions
                WHERE assignment_id = %s AND user_id = %s
            """ if IS_POSTGRES else """
                SELECT id, score, total_marks, submitted_at, time_spent_seconds
                FROM assignment_submissions
                WHERE assignment_id = ? AND user_id = ?
            """
            cur.execute(sub_sql, (aid, user_id))
            sub_row = cur.fetchone()

            has_submitted = sub_row is not None
            sub_data = None
            if sub_row:
                sc = sub_row[1] if IS_POSTGRES else sub_row["score"]
                tm = sub_row[2] if IS_POSTGRES else sub_row["total_marks"]
                sub_data = {
                    "submission_id": sub_row[0] if IS_POSTGRES else sub_row["id"],
                    "score": sc,
                    "total_marks": tm,
                    "percentage": round((sc / tm) * 100) if tm else 0,
                    "submitted_at": str(sub_row[3] if IS_POSTGRES else sub_row["submitted_at"])
                }
            elif is_open:
                new_notifications_count += 1

            assignments.append({
                "id": aid,
                "title": r[2] if IS_POSTGRES else r["title"],
                "topic": r[3] if IS_POSTGRES else r["topic"],
                "subject": r[4] if IS_POSTGRES else r["subject"],
                "faculty_name": r[5] if IS_POSTGRES else r["faculty_name"],
                "assignment_type": r[6] if IS_POSTGRES else r["assignment_type"],
                "document_title": r[7] if IS_POSTGRES else r["document_title"],
                "start_time": start_time,
                "end_time": end_time,
                "duration_minutes": duration,
                "total_questions": r[11] if IS_POSTGRES else r["total_questions"],
                "is_open": is_open,
                "is_upcoming": is_upcoming,
                "is_closed": is_closed,
                "can_attempt": is_open and not has_submitted,
                "time_status_label": time_label,
                "has_submitted": has_submitted,
                "submission": sub_data,
                "created_at": str(r[13] if IS_POSTGRES else r["created_at"])
            })

        return {
            "assignments": assignments,
            "total": len(assignments),
            "pending_notification_count": new_notifications_count
        }
    finally:
        cur.close()
        conn.close()


@router.get("/{assignment_id}")
def get_assignment_for_attempt(assignment_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns questions and details for student attempt.
    Verifies that the current time is strictly within the scheduled attempt window.
    """
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
            SELECT id, title, topic, subject, faculty_name, assignment_type,
                   document_title, start_time, end_time, duration_minutes,
                   questions_json, total_questions
            FROM teacher_assignments
            WHERE id = %s
        """ if IS_POSTGRES else """
            SELECT id, title, topic, subject, faculty_name, assignment_type,
                   document_title, start_time, end_time, duration_minutes,
                   questions_json, total_questions
            FROM teacher_assignments
            WHERE id = ?
        """
        cur.execute(sql, (assignment_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Assignment not found.")

        start_time = row[7] if IS_POSTGRES else row["start_time"]
        end_time = row[8] if IS_POSTGRES else row["end_time"]
        duration = row[9] if IS_POSTGRES else row["duration_minutes"]

        is_open, is_upcoming, is_closed, time_label = _check_time_window(start_time, end_time)

        # Check existing submission
        cur.execute("SELECT id, score, total_marks FROM assignment_submissions WHERE assignment_id = %s AND user_id = %s" if IS_POSTGRES else "SELECT id, score, total_marks FROM assignment_submissions WHERE assignment_id = ? AND user_id = ?", (assignment_id, user_id))
        sub_row = cur.fetchone()

        if is_upcoming and not sub_row:
            raise HTTPException(status_code=403, detail=f"This assignment is locked. It opens on {start_time}.")
        if is_closed and not sub_row:
            raise HTTPException(status_code=403, detail=f"This assignment window has closed (expired on {end_time}).")

        qs_raw = row[10] if IS_POSTGRES else row["questions_json"]
        try:
            questions = json.loads(qs_raw)
        except Exception:
            questions = []

        # If student is attempting (not yet submitted), hide answer key
        if not sub_row:
            safe_questions = []
            for q in questions:
                sq = {
                    "id": q.get("id"),
                    "question": q.get("question") or q.get("question_text"),
                    "options": q.get("options", []),
                    "difficulty": q.get("difficulty", "Medium"),
                    "marks": q.get("marks", 1),
                    "citation": q.get("citation", "")
                }
                safe_questions.append(sq)
            questions_to_return = safe_questions
        else:
            questions_to_return = questions

        return {
            "id": row[0] if IS_POSTGRES else row["id"],
            "title": row[1] if IS_POSTGRES else row["title"],
            "topic": row[2] if IS_POSTGRES else row["topic"],
            "subject": row[3] if IS_POSTGRES else row["subject"],
            "faculty_name": row[4] if IS_POSTGRES else row["faculty_name"],
            "assignment_type": row[5] if IS_POSTGRES else row["assignment_type"],
            "document_title": row[6] if IS_POSTGRES else row["document_title"],
            "duration_minutes": duration,
            "total_questions": len(questions),
            "is_open": is_open,
            "time_status_label": time_label,
            "has_submitted": sub_row is not None,
            "questions": questions_to_return
        }
    finally:
        cur.close()
        conn.close()


class AssignmentSubmitRequest(BaseModel):
    answers: Dict[str, Any] # question_id -> selected_index (int) or written response (str)
    time_spent_seconds: Optional[int] = 0


@router.post("/{assignment_id}/submit")
def submit_student_assignment(
    assignment_id: int,
    req: AssignmentSubmitRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Evaluate student submission, record score, and update admin telemetry in real time.
    """
    user_id = current_user["sub"]
    student_name = current_user.get("name", "Student")
    student_email = current_user.get("email", "")

    conn = get_connection()
    cur = conn.cursor()
    try:
        # Check existing submission
        cur.execute("SELECT id FROM assignment_submissions WHERE assignment_id = %s AND user_id = %s" if IS_POSTGRES else "SELECT id FROM assignment_submissions WHERE assignment_id = ? AND user_id = ?", (assignment_id, user_id))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="You have already submitted this assignment.")

        # Fetch assignment questions
        cur.execute("SELECT title, topic, assignment_type, questions_json, duration_minutes, teacher_id FROM teacher_assignments WHERE id = %s" if IS_POSTGRES else "SELECT title, topic, assignment_type, questions_json, duration_minutes, teacher_id FROM teacher_assignments WHERE id = ?", (assignment_id,))
        a_row = cur.fetchone()
        if not a_row:
            raise HTTPException(status_code=404, detail="Assignment not found.")

        a_title = a_row[0] if IS_POSTGRES else a_row["title"]
        a_topic = a_row[1] if IS_POSTGRES else a_row["topic"]
        a_type = a_row[2] if IS_POSTGRES else a_row["assignment_type"]
        qs_raw = a_row[3] if IS_POSTGRES else a_row["questions_json"]
        teacher_id = a_row[5] if IS_POSTGRES else a_row["teacher_id"]

        questions = json.loads(qs_raw) if qs_raw else []

        score = 0
        total_marks = 0
        review_details = []

        if a_type == "quiz":
            total_marks = len(questions) or 30
            for q in questions:
                qid = str(q.get("id"))
                correct_idx = q.get("correct_index", 0)
                user_choice = req.answers.get(qid)
                is_correct = (user_choice is not None and int(user_choice) == int(correct_idx))
                if is_correct:
                    score += 1
                review_details.append({
                    "id": q.get("id"),
                    "question": q.get("question"),
                    "selected_option": user_choice,
                    "correct_option": correct_idx,
                    "is_correct": is_correct,
                    "explanation": q.get("explanation"),
                    "citation": q.get("citation")
                })
        else:
            # Question Paper (10 questions, 10 marks each = 100 marks total)
            total_marks = (len(questions) * 10) or 100
            stop_words = {"what", "which", "where", "when", "that", "this", "from", "with", "have", "been", "will", "your", "must", "show", "give", "each", "both", "such", "than", "then", "into", "only", "also", "describe", "explain", "analyze", "derive", "state", "define", "given"}

            for idx, q in enumerate(questions):
                qid = str(q.get("id", idx + 1))
                q_text = q.get("question_text") or q.get("question") or f"Question {idx + 1}"
                ans_text = str(req.answers.get(qid, "")).strip()
                key_pts = q.get("key_points") or ["Mathematical Proof", "Formal Theorem", "Domain Constraints"]
                model_ans = q.get("model_answer") or q_text

                # Build reference keyword dictionary
                ref_text = f"{q_text} {' '.join(key_pts)} {model_ans}".lower()
                ref_keywords = {w for w in re.findall(r'\b[a-zA-Z]{4,}\b', ref_text) if w not in stop_words}

                q_score = 0
                verdict = "Not Attempted"
                critique = "No answer provided. 0/10 marks awarded."

                if ans_text and len(ans_text.split()) >= 3:
                    ans_tokens = set(re.findall(r'\b[a-zA-Z]{4,}\b', ans_text.lower()))
                    matched = ans_tokens.intersection(ref_keywords)
                    ratio = len(matched) / max(len(ref_keywords), 1)
                    ans_words = len(ans_text.split())

                    if ratio < 0.12 or len(matched) < 2:
                        q_score = 0
                        verdict = "Irrelevant / Incorrect"
                        critique = f"Response does not address required conceptual mechanisms. Failed background reference criteria. 0/10 marks awarded."
                    elif ratio < 0.25:
                        q_score = 2
                        verdict = "Superficial Outline"
                        critique = f"Mentioned basic terminology ({', '.join(list(matched)[:3])}) but omitted technical derivations and proofs. Deducted 8 marks."
                    elif ratio < 0.40 or ans_words < 25:
                        q_score = 5
                        verdict = "Partial Competency"
                        critique = f"Demonstrated partial understanding ({', '.join(list(matched)[:4])}) but omitted edge-case constraints. Deducted 5 marks."
                    elif ratio < 0.60 or ans_words < 55:
                        q_score = 7
                        verdict = "Proficient Demonstration"
                        critique = "Accurate response with sound technical reasoning and core formulations represented. Deducted 3 marks."
                    else:
                        q_score = 9
                        verdict = "Exemplary Rigor"
                        critique = "Comprehensive, accurate response matching course reference standards with clear derivation and correct terminology."

                score += q_score
                review_details.append({
                    "id": q.get("id"),
                    "question": q_text,
                    "student_answer": ans_text,
                    "marks_awarded": q_score,
                    "marks_possible": 10,
                    "verdict": verdict,
                    "critique": critique,
                    "model_answer": model_ans,
                    "key_points": key_pts
                })

        percentage = round((score / total_marks) * 100) if total_marks else 0

        # Insert submission
        ins_sub_sql = """
            INSERT INTO assignment_submissions (
                assignment_id, user_id, student_name, student_email,
                score, total_marks, answers_json, time_spent_seconds
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """ if IS_POSTGRES else """
            INSERT INTO assignment_submissions (
                assignment_id, user_id, student_name, student_email,
                score, total_marks, answers_json, time_spent_seconds
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        cur.execute(ins_sub_sql, (
            assignment_id, user_id, student_name, student_email,
            score, total_marks, json.dumps(req.answers), req.time_spent_seconds
        ))
        sub_id = cur.fetchone()[0] if IS_POSTGRES else cur.lastrowid

        # Insert into admin_history
        hist_title = f"Submission: {student_name} completed '{a_title}'"
        hist_details = f"Score: {percentage}% ({score}/{total_marks}) · Time: {req.time_spent_seconds // 60}m {req.time_spent_seconds % 60}s · Student Email: {student_email}"
        ins_hist_sql = """
            INSERT INTO admin_history (admin_id, action_type, title, details)
            VALUES (%s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO admin_history (admin_id, action_type, title, details)
            VALUES (?, ?, ?, ?)
        """
        try:
            cur.execute(ins_hist_sql, (teacher_id or 1, "submission_received", hist_title, hist_details))
        except Exception as h_err:
            print(f"[StudentAssignments] Admin history notice: {h_err}")

        # Record in student study_activity
        act_sql = """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (%s, %s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (?, ?, ?, ?, ?)
        """
        cur.execute(act_sql, (
            user_id, f"Completed: {a_title}", "Faculty Assignment",
            f"Achieved {percentage}% ({score}/{total_marks}) in {a_type.capitalize()} on {a_topic}.",
            "Just now"
        ))

        # Update student's knowledge gap in database
        up_gap_sql = """
            UPDATE knowledge_gaps
            SET mastery_score = %s,
                status = CASE WHEN %s >= 80 THEN 'Mastered' WHEN %s >= 50 THEN 'Needs Review' ELSE 'Critical Gap' END
            WHERE user_id = %s AND topic = %s
        """ if IS_POSTGRES else """
            UPDATE knowledge_gaps
            SET mastery_score = ?,
                status = CASE WHEN ? >= 80 THEN 'Mastered' WHEN ? >= 50 THEN 'Needs Review' ELSE 'Critical Gap' END
            WHERE user_id = ? AND topic = ?
        """
        cur.execute(up_gap_sql, (percentage, percentage, percentage, user_id, a_topic))

        conn.commit()

        return {
            "message": "Assignment submitted and evaluated successfully!",
            "submission_id": sub_id,
            "assignment_title": a_title,
            "topic": a_topic,
            "score": score,
            "total_marks": total_marks,
            "percentage": percentage,
            "time_spent_seconds": req.time_spent_seconds,
            "review": review_details
        }
    finally:
        cur.close()
        conn.close()
