import os
import shutil
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Dict, Any, List, Optional
from backend.database import get_connection, IS_POSTGRES
from backend.auth import get_current_user
from backend.services.document_processor import document_processor
from backend.services.rag_engine import rag_engine

router = APIRouter(prefix="/api/documents", tags=["documents"])

if os.environ.get("VERCEL") or not os.access(os.path.dirname(os.path.dirname(__file__)), os.W_OK):
    UPLOAD_DIR = os.path.join(os.environ.get("TMPDIR", "/tmp"), "uploads")
else:
    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("")
def list_documents(current_user: Dict[str, Any] = Depends(get_current_user)):
    """List all study materials uploaded by the authenticated student."""
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        sql = """
            SELECT id, title, subject, doc_type, file_size, page_count, topics_count, status, error_message, created_at
            FROM documents
            WHERE user_id = %s
            ORDER BY created_at DESC
        """ if IS_POSTGRES else """
            SELECT id, title, subject, doc_type, file_size, page_count, topics_count, status, error_message, created_at
            FROM documents
            WHERE user_id = ?
            ORDER BY created_at DESC
        """
        cur.execute(sql, (user_id,))
        rows = cur.fetchall()

        results = []
        for r in rows:
            results.append({
                "id": r[0] if IS_POSTGRES else r["id"],
                "title": r[1] if IS_POSTGRES else r["title"],
                "subject": r[2] if IS_POSTGRES else r["subject"],
                "doc_type": r[3] if IS_POSTGRES else r["doc_type"],
                "file_size": r[4] if IS_POSTGRES else r["file_size"],
                "page_count": r[5] if IS_POSTGRES else r["page_count"],
                "topics_count": r[6] if IS_POSTGRES else r["topics_count"],
                "status": r[7] if IS_POSTGRES else r["status"],
                "error_message": r[8] if IS_POSTGRES else r["error_message"],
                "created_at": str(r[9] if IS_POSTGRES else r["created_at"])
            })
        return {"documents": results, "total": len(results)}
    finally:
        cur.close()
        conn.close()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    subject: str = Form("Diagnostic Course Materials"),
    doc_type: str = Form("Textbook"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Ingest study materials (PDF, DOCX, TXT, MD).
    Runs document extraction, scan detection, text chunking, and persists searchable chunks.
    """
    user_id = current_user["sub"]
    filename = file.filename or "uploaded_document"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".pdf", ".docx", ".txt", ".md"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, TXT, or MD.")

    safe_name = f"{user_id}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    # Save to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    # Extract text from file
    extracted_pages = document_processor.extract_text_from_file(file_path, filename)
    page_count = max(len(extracted_pages), 1)

    conn = get_connection()
    cur = conn.cursor()
    try:
        # Insert document record
        insert_doc_sql = """
            INSERT INTO documents (user_id, title, subject, doc_type, file_path, file_size, page_count, topics_count, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """ if IS_POSTGRES else """
            INSERT INTO documents (user_id, title, subject, doc_type, file_path, file_size, page_count, topics_count, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        cur.execute(insert_doc_sql, (user_id, filename, subject, doc_type, file_path, file_size, page_count, 0, "Indexed & Vector Grounded"))
        doc_id = cur.fetchone()[0] if IS_POSTGRES else cur.lastrowid

        # Chunk pages
        chunks = document_processor.chunk_document_pages(extracted_pages, doc_id, user_id, subject)

        # Insert chunks
        for chk in chunks:
            chk_sql = """
                INSERT INTO document_chunks (document_id, user_id, chunk_index, page_number, section_title, topic_name, source_text, token_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """ if IS_POSTGRES else """
                INSERT INTO document_chunks (document_id, user_id, chunk_index, page_number, section_title, topic_name, source_text, token_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """
            cur.execute(chk_sql, (
                doc_id, user_id, chk["chunk_index"], chk["page_number"],
                chk["section_title"], chk["topic_name"], chk["source_text"], chk["token_count"]
            ))

        # Update topics count on document
        unique_topics = len(set(c["topic_name"] for c in chunks))
        up_sql = "UPDATE documents SET topics_count = %s WHERE id = %s" if IS_POSTGRES else "UPDATE documents SET topics_count = ? WHERE id = ?"
        cur.execute(up_sql, (unique_topics, doc_id))

        # Extract dynamic topic hierarchy from the exact uploaded document
        hierarchy = document_processor.extract_topics_hierarchy(extracted_pages, filename=filename, default_subject=subject)
        detected_subject = hierarchy.get("subject", subject)
        detected_units = hierarchy.get("units", [])

        # Persist extracted units & topics into topics table for this student
        for unit in detected_units:
            unit_id_str = unit.get("unit_id", "Unit 1")
            unit_name_str = unit.get("name", "Core Unit")
            for t_item in unit.get("topics", []):
                t_name = t_item.get("name", "Key Concept")
                t_weight = t_item.get("exam_weight", "15%")
                ins_topic_sql = """
                    INSERT INTO topics (user_id, subject, unit_id, unit_name, topic_name, exam_weight, mastery_score, status, root_cause)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """ if IS_POSTGRES else """
                    INSERT INTO topics (user_id, subject, unit_id, unit_name, topic_name, exam_weight, mastery_score, status, root_cause)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                try:
                    cur.execute(ins_topic_sql, (
                        user_id, detected_subject, unit_id_str, unit_name_str,
                        t_name, t_weight, 0, "Untested", f"Extracted from uploaded document '{filename}'"
                    ))
                except Exception as t_err:
                    print(f"[Documents] Topic insert notice: {t_err}")

                # Ensure topic is recorded in knowledge gaps as untested
                chk_gap_sql = "SELECT id FROM knowledge_gaps WHERE user_id = %s AND topic = %s" if IS_POSTGRES else "SELECT id FROM knowledge_gaps WHERE user_id = ? AND topic = ?"
                cur.execute(chk_gap_sql, (user_id, t_name))
                if not cur.fetchone():
                    ins_gap_sql = """
                        INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                        VALUES (%s, %s, %s, %s, %s)
                    """ if IS_POSTGRES else """
                        INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                        VALUES (?, ?, ?, ?, ?)
                    """
                    cur.execute(ins_gap_sql, (user_id, t_name, 0, "High", "Untested"))

        # Generate comprehensive study notes and visual concept diagram
        study_notes_md, mermaid_diag = document_processor.generate_study_notes_and_diagram(extracted_pages, filename, hierarchy)

        # Save study notes into student_notes table
        ins_notes_sql = """
            INSERT INTO student_notes (user_id, topic, title, content, tags)
            VALUES (%s, %s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO student_notes (user_id, topic, title, content, tags)
            VALUES (?, ?, ?, ?, ?)
        """
        try:
            cur.execute(ins_notes_sql, (
                user_id, detected_subject, f"Key Concepts: {filename}", study_notes_md, "Summary, Grounded, Formulas, Auto-Generated"
            ))
        except Exception as n_err:
            print(f"[Documents] Note insert notice: {n_err}")

        # If document is an Exam Paper or Past Paper, extract questions and map to syllabus via retrieval
        mapped_questions_count = 0
        if any(k in doc_type.lower() or k in filename.lower() for k in ["exam", "paper", "test", "midterm", "final", "quiz"]):
            try:
                exam_questions = document_processor.extract_exam_questions(extracted_pages, paper_title=filename)
                if exam_questions:
                    mapped_list = rag_engine.map_questions_to_syllabus(user_id=user_id, exam_questions=exam_questions, document_id=doc_id)
                    mapped_questions_count = len(mapped_list)
            except Exception as map_err:
                print(f"[Documents] Exam question mapping note: {map_err}")

        # Log activity
        act_sql = """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (%s, %s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (?, ?, ?, ?, ?)
        """
        log_desc = f"Extracted {page_count} pages, {len(detected_units)} units, and created study notes + concept diagram."
        if mapped_questions_count > 0:
            log_desc += f" Mapped {mapped_questions_count} exam questions to syllabus."
        cur.execute(act_sql, (user_id, f"Uploaded {filename}", "Materials", log_desc, "Just now"))

        conn.commit()

        return {
            "message": "Document processed, indexed, and retrieval-grounded successfully.",
            "document": {
                "id": doc_id,
                "title": filename,
                "pages": page_count,
                "chunks": len(chunks),
                "topics_detected": unique_topics,
                "mapped_exam_questions": mapped_questions_count,
                "status": "Indexed & Vector Grounded",
                "hierarchy": hierarchy,
                "study_notes_preview": study_notes_md[:500] + "...",
                "mermaid_diagram": mermaid_diag
            }
        }
    finally:
        cur.close()
        conn.close()

@router.get("/{doc_id}/preview")
def preview_document(doc_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Preview extracted text chunks and document metadata."""
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        doc_sql = "SELECT id, title, subject, doc_type, page_count FROM documents WHERE id = %s AND user_id = %s" if IS_POSTGRES else "SELECT id, title, subject, doc_type, page_count FROM documents WHERE id = ? AND user_id = ?"
        cur.execute(doc_sql, (doc_id, user_id))
        doc = cur.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        chunks_sql = "SELECT id, page_number, section_title, topic_name, source_text FROM document_chunks WHERE document_id = %s ORDER BY chunk_index ASC LIMIT 8" if IS_POSTGRES else "SELECT id, page_number, section_title, topic_name, source_text FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC LIMIT 8"
        cur.execute(chunks_sql, (doc_id,))
        chunks_rows = cur.fetchall()

        preview_chunks = []
        for c in chunks_rows:
            preview_chunks.append({
                "id": c[0] if IS_POSTGRES else c["id"],
                "page_number": c[1] if IS_POSTGRES else c["page_number"],
                "section_title": c[2] if IS_POSTGRES else c["section_title"],
                "topic": c[3] if IS_POSTGRES else c["topic_name"],
                "source_text": c[4] if IS_POSTGRES else c["source_text"]
            })

        return {
            "document_id": doc_id,
            "title": doc[1] if IS_POSTGRES else doc["title"],
            "subject": doc[2] if IS_POSTGRES else doc["subject"],
            "page_count": doc[4] if IS_POSTGRES else doc["page_count"],
            "preview_chunks": preview_chunks
        }
    finally:
        cur.close()
        conn.close()

@router.delete("/{doc_id}")
def delete_document(doc_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete uploaded document and remove from RAG vector store."""
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        del_chunks = "DELETE FROM document_chunks WHERE document_id = %s AND user_id = %s" if IS_POSTGRES else "DELETE FROM document_chunks WHERE document_id = ? AND user_id = ?"
        cur.execute(del_chunks, (doc_id, user_id))

        del_doc = "DELETE FROM documents WHERE id = %s AND user_id = %s" if IS_POSTGRES else "DELETE FROM documents WHERE id = ? AND user_id = ?"
        cur.execute(del_doc, (doc_id, user_id))
        conn.commit()

        return {"message": "Document and associated chunks deleted successfully.", "deleted_id": doc_id}
    finally:
        cur.close()
        conn.close()
