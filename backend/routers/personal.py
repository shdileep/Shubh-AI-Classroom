from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.database import get_connection, IS_POSTGRES
from backend.auth import get_current_user

router = APIRouter(prefix="/api/personal", tags=["personal"])

# ----------------- BOOKMARKS -----------------
class BookmarkCreate(BaseModel):
    item_type: str # topic | question | source
    title: str
    subtitle: Optional[str] = ""
    source_ref: Optional[str] = ""
    link_tab: Optional[str] = "diagnosis"
    topic: Optional[str] = ""

@router.get("/bookmarks")
def get_bookmarks(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = "SELECT id, item_type, title, subtitle, source_ref, link_tab, topic, created_at FROM bookmarks WHERE user_id = %s ORDER BY created_at DESC" if IS_POSTGRES else "SELECT id, item_type, title, subtitle, source_ref, link_tab, topic, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC"
        cur.execute(sql, (user_id,))
        rows = cur.fetchall()

        bookmarks = []
        for r in rows:
            bookmarks.append({
                "id": r[0] if IS_POSTGRES else r["id"],
                "item_type": r[1] if IS_POSTGRES else r["item_type"],
                "title": r[2] if IS_POSTGRES else r["title"],
                "subtitle": r[3] if IS_POSTGRES else r["subtitle"],
                "source_ref": r[4] if IS_POSTGRES else r["source_ref"],
                "link_tab": r[5] if IS_POSTGRES else r["link_tab"],
                "topic": r[6] if IS_POSTGRES else r["topic"],
                "created_at": str(r[7] if IS_POSTGRES else r["created_at"])
            })

        return {"bookmarks": bookmarks, "total": len(bookmarks)}
    finally:
        cur.close()
        conn.close()

@router.post("/bookmarks")
def add_bookmark(bm: BookmarkCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
            INSERT INTO bookmarks (user_id, item_type, title, subtitle, source_ref, link_tab, topic)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """ if IS_POSTGRES else """
            INSERT INTO bookmarks (user_id, item_type, title, subtitle, source_ref, link_tab, topic)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        cur.execute(sql, (user_id, bm.item_type, bm.title, bm.subtitle, bm.source_ref, bm.link_tab, bm.topic))
        bm_id = cur.fetchone()[0] if IS_POSTGRES else cur.lastrowid

        # Log activity
        act_sql = """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (%s, %s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (?, ?, ?, ?, ?)
        """
        cur.execute(act_sql, (user_id, f"Bookmarked: {bm.title}", "Bookmarks", f"Saved {bm.item_type} for review.", "Just now"))

        conn.commit()
        return {"message": "Bookmark saved.", "id": bm_id}
    finally:
        cur.close()
        conn.close()

@router.delete("/bookmarks/{bm_id}")
def delete_bookmark(bm_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = "DELETE FROM bookmarks WHERE id = %s AND user_id = %s" if IS_POSTGRES else "DELETE FROM bookmarks WHERE id = ? AND user_id = ?"
        cur.execute(sql, (bm_id, user_id))
        conn.commit()
        return {"message": "Bookmark removed.", "id": bm_id}
    finally:
        cur.close()
        conn.close()

# ----------------- MY NOTES -----------------
class NoteCreate(BaseModel):
    topic: str
    title: str
    content: str
    tags: Optional[str] = "Concepts"

@router.get("/notes")
def get_notes(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = "SELECT id, topic, title, content, tags, updated_at FROM student_notes WHERE user_id = %s ORDER BY updated_at DESC" if IS_POSTGRES else "SELECT id, topic, title, content, tags, updated_at FROM student_notes WHERE user_id = ? ORDER BY updated_at DESC"
        cur.execute(sql, (user_id,))
        rows = cur.fetchall()

        notes = []
        for r in rows:
            notes.append({
                "id": r[0] if IS_POSTGRES else r["id"],
                "topic": r[1] if IS_POSTGRES else r["topic"],
                "title": r[2] if IS_POSTGRES else r["title"],
                "content": r[3] if IS_POSTGRES else r["content"],
                "tags": r[4] if IS_POSTGRES else r["tags"],
                "updated_at": str(r[5] if IS_POSTGRES else r["updated_at"])
            })

        return {"notes": notes, "total": len(notes)}
    finally:
        cur.close()
        conn.close()

@router.post("/notes")
def save_note(note: NoteCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
            INSERT INTO student_notes (user_id, topic, title, content, tags)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """ if IS_POSTGRES else """
            INSERT INTO student_notes (user_id, topic, title, content, tags)
            VALUES (?, ?, ?, ?, ?)
        """
        cur.execute(sql, (user_id, note.topic, note.title, note.content, note.tags))
        nid = cur.fetchone()[0] if IS_POSTGRES else cur.lastrowid

        # Log activity
        act_sql = """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (%s, %s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (?, ?, ?, ?, ?)
        """
        cur.execute(act_sql, (user_id, f"Created Note: {note.title}", "Notes", f"Synthesized concepts on {note.topic}", "Just now"))

        conn.commit()
        return {"message": "Note saved successfully.", "id": nid}
    finally:
        cur.close()
        conn.close()

@router.delete("/notes/{note_id}")
def delete_note(note_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = "DELETE FROM student_notes WHERE id = %s AND user_id = %s" if IS_POSTGRES else "DELETE FROM student_notes WHERE id = ? AND user_id = ?"
        cur.execute(sql, (note_id, user_id))
        conn.commit()
        return {"message": "Note deleted successfully.", "id": note_id}
    finally:
        cur.close()
        conn.close()

# ----------------- LEARNING PREFERENCES -----------------
class PreferencesUpdate(BaseModel):
    target_exam_date: Optional[str] = "2026-12-15"
    daily_study_minutes: Optional[int] = 90
    preferred_difficulty: Optional[str] = "Moderate"
    notifications_enabled: Optional[bool] = True

@router.get("/preferences")
def get_preferences(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = "SELECT target_exam_date, daily_study_minutes, preferred_difficulty, notifications_enabled FROM student_profiles WHERE user_id = %s" if IS_POSTGRES else "SELECT target_exam_date, daily_study_minutes, preferred_difficulty, notifications_enabled FROM student_profiles WHERE user_id = ?"
        cur.execute(sql, (user_id,))
        row = cur.fetchone()

        if row:
            return {
                "target_exam_date": row[0] if IS_POSTGRES else row["target_exam_date"],
                "daily_study_minutes": row[1] if IS_POSTGRES else row["daily_study_minutes"],
                "preferred_difficulty": row[2] if IS_POSTGRES else row["preferred_difficulty"],
                "notifications_enabled": bool(row[3] if IS_POSTGRES else row["notifications_enabled"])
            }
        else:
            return {
                "target_exam_date": "2026-12-15",
                "daily_study_minutes": 90,
                "preferred_difficulty": "Moderate",
                "notifications_enabled": True
            }
    finally:
        cur.close()
        conn.close()

@router.post("/preferences")
def update_preferences(pref: PreferencesUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        chk_sql = "SELECT id FROM student_profiles WHERE user_id = %s" if IS_POSTGRES else "SELECT id FROM student_profiles WHERE user_id = ?"
        cur.execute(chk_sql, (user_id,))
        exists = cur.fetchone()

        notif_val = pref.notifications_enabled if IS_POSTGRES else (1 if pref.notifications_enabled else 0)

        if exists:
            up_sql = """
                UPDATE student_profiles 
                SET target_exam_date = %s, daily_study_minutes = %s, preferred_difficulty = %s, notifications_enabled = %s
                WHERE user_id = %s
            """ if IS_POSTGRES else """
                UPDATE student_profiles 
                SET target_exam_date = ?, daily_study_minutes = ?, preferred_difficulty = ?, notifications_enabled = ?
                WHERE user_id = ?
            """
            cur.execute(up_sql, (pref.target_exam_date, pref.daily_study_minutes, pref.preferred_difficulty, notif_val, user_id))
        else:
            ins_sql = """
                INSERT INTO student_profiles (user_id, target_exam_date, daily_study_minutes, preferred_difficulty, notifications_enabled)
                VALUES (%s, %s, %s, %s, %s)
            """ if IS_POSTGRES else """
                INSERT INTO student_profiles (user_id, target_exam_date, daily_study_minutes, preferred_difficulty, notifications_enabled)
                VALUES (?, ?, ?, ?, ?)
            """
            cur.execute(ins_sql, (user_id, pref.target_exam_date, pref.daily_study_minutes, pref.preferred_difficulty, notif_val))

        conn.commit()
        return {"message": "Learning preferences updated successfully."}
    finally:
        cur.close()
        conn.close()
