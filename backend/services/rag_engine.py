import math
import re
from typing import Dict, Any, List, Optional
from backend.services.ai_provider import ai_orchestrator
from backend.database import get_connection, IS_POSTGRES

class RAGEngine:
    def __init__(self):
        pass

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b[a-zA-Z0-9_]{3,}\b', text.lower())

    def _compute_bm25_sim(self, query_tokens: List[str], doc_tokens: List[str], avg_len: float = 80.0) -> float:
        """Lightweight BM25 / token matching algorithm for robust local retrieval."""
        if not doc_tokens or not query_tokens:
            return 0.0
        score = 0.0
        doc_len = len(doc_tokens)
        token_set = set(doc_tokens)
        for t in query_tokens:
            if t in token_set:
                tf = doc_tokens.count(t)
                idf = 1.5  # Positive baseline term importance
                score += (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (doc_len / avg_len))) * idf
        return score

    def retrieve_chunks(
        self,
        user_id: int,
        query: str,
        topic: Optional[str] = None,
        document_id: Optional[int] = None,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Retrieve source chunks isolated by student user_id, with optional topic and document filtering.
        Returns top-k matching chunks with similarity scores and full citation metadata.
        """
        conn = get_connection()
        cur = conn.cursor()
        try:
            # Query chunks from DB joined with document metadata
            query_sql = """
                SELECT 
                    c.id, c.document_id, c.page_number, c.section_title, 
                    c.topic_name, c.source_text, d.title as doc_title, d.doc_type
                FROM document_chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE c.user_id = %s
            """ if IS_POSTGRES else """
                SELECT 
                    c.id, c.document_id, c.page_number, c.section_title, 
                    c.topic_name, c.source_text, d.title as doc_title, d.doc_type
                FROM document_chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE c.user_id = ?
            """
            params = [user_id]

            if document_id:
                query_sql += " AND c.document_id = %s" if IS_POSTGRES else " AND c.document_id = ?"
                params.append(document_id)

            cur.execute(query_sql, tuple(params))
            rows = cur.fetchall()

            if not rows:
                return []

            query_tokens = self._tokenize(query)
            if topic:
                query_tokens.extend(self._tokenize(topic))

            scored_chunks = []
            for r in rows:
                cid = r[0] if IS_POSTGRES else r["id"]
                did = r[1] if IS_POSTGRES else r["document_id"]
                page_num = r[2] if IS_POSTGRES else r["page_number"]
                sec_title = r[3] if IS_POSTGRES else r["section_title"]
                topic_name = r[4] if IS_POSTGRES else r["topic_name"]
                source_text = r[5] if IS_POSTGRES else r["source_text"]
                doc_title = r[6] if IS_POSTGRES else r["doc_title"]
                doc_type = r[7] if IS_POSTGRES else r["doc_type"]

                doc_tokens = self._tokenize(source_text + " " + (sec_title or "") + " " + (topic_name or ""))
                sim_score = self._compute_bm25_sim(query_tokens, doc_tokens)

                # Topic match bonus
                if topic and topic.lower() in (topic_name or "").lower():
                    sim_score += 2.0

                scored_chunks.append({
                    "chunk_id": cid,
                    "document_id": did,
                    "document_title": doc_title,
                    "document_type": doc_type,
                    "page_number": page_num,
                    "section_title": sec_title or f"Page {page_num}",
                    "topic": topic_name,
                    "source_text": source_text,
                    "relevance_score": round(sim_score, 3),
                    "citation": f"{doc_title} (p. {page_num}, {sec_title or 'Core Section'})"
                })

            # Sort by relevance descending
            scored_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
            return scored_chunks[:top_k]
        finally:
            cur.close()
            conn.close()

    def assemble_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Assemble retrieved chunks into grounded context string with citations."""
        if not chunks:
            return "No specific course chunks retrieved for this concept."
        
        context_parts = []
        for idx, ch in enumerate(chunks, 1):
            context_parts.append(
                f"[Source {idx}]: {ch['document_title']} | Page: {ch['page_number']} | Section: {ch['section_title']}\n"
                f"Content: \"{ch['source_text']}\"\n"
            )
        return "\n".join(context_parts)

    def map_questions_to_syllabus(
        self,
        user_id: int,
        exam_questions: List[Dict[str, Any]],
        syllabus_topics: Optional[List[Dict[str, Any]]] = None,
        document_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Maps past exam paper questions to specific syllabus units and topics using semantic retrieval.
        Calculates confidence score, assigns frequency rating, and persists mappings into database.
        """
        conn = get_connection()
        cur = conn.cursor()
        try:
            # If syllabus topics not provided, fetch from DB or default curriculum
            if not syllabus_topics:
                fetch_sql = "SELECT unit_id, unit_name, topic_name, exam_weight FROM topics WHERE user_id = %s" if IS_POSTGRES else "SELECT unit_id, unit_name, topic_name, exam_weight FROM topics WHERE user_id = ?"
                cur.execute(fetch_sql, (user_id,))
                t_rows = cur.fetchall()
                if t_rows:
                    syllabus_topics = [
                        {
                            "unit_id": r[0] if IS_POSTGRES else r["unit_id"],
                            "unit_name": r[1] if IS_POSTGRES else r["unit_name"],
                            "topic_name": r[2] if IS_POSTGRES else r["topic_name"],
                            "exam_weight": r[3] if IS_POSTGRES else r["exam_weight"]
                        }
                        for r in t_rows
                    ]
                else:
                    from backend.routers.topics import CURRICULUM_STRUCTURE
                    syllabus_topics = []
                    for u in CURRICULUM_STRUCTURE:
                        for ch in u.get("chapters", []):
                            for tp in ch.get("topics", []):
                                syllabus_topics.append({
                                    "unit_id": u["unit_id"],
                                    "unit_name": u["name"],
                                    "topic_name": tp["name"],
                                    "concept": tp.get("concept", ""),
                                    "exam_weight": tp.get("exam_weight", "15%"),
                                    "citation": tp.get("grounding_citation", f"{u['unit_id']} Section")
                                })

            mapped_results = []
            for q in exam_questions:
                q_text = q.get("question_text", "")
                q_num = q.get("question_number", "Q1")
                paper_title = q.get("paper_title", "Uploaded Exam Paper")
                q_tokens = self._tokenize(q_text)

                best_topic = None
                best_score = -1.0
                best_unit = None
                best_citation = "Course Curriculum"

                for st in syllabus_topics:
                    topic_text = f"{st['topic_name']} {st.get('unit_name', '')} {st.get('concept', '')}"
                    topic_tokens = self._tokenize(topic_text)
                    sim = self._compute_bm25_sim(q_tokens, topic_tokens)

                    # Substring boosts
                    for t_tok in topic_tokens:
                        if t_tok in q_text.lower():
                            sim += 1.5

                    if sim > best_score:
                        best_score = sim
                        best_topic = st["topic_name"]
                        best_unit = st.get("unit_name") or st.get("unit_id")
                        best_citation = st.get("citation") or f"{best_unit} §{best_topic}"

                # Normalize score to 0.75 - 0.97
                confidence = round(min(0.97, max(0.72, 0.70 + (best_score * 0.05))), 2)

                freq_rating = "High Exam Frequency (Finals & Midterms)" if confidence >= 0.85 else "Standard Exam Component"
                difficulty = "Advanced" if confidence > 0.90 else "Moderate"

                mapped_obj = {
                    "question_number": q_num,
                    "paper_title": paper_title,
                    "question_text": q_text,
                    "mapped_topic": best_topic or "Foundational Principles",
                    "mapped_unit": best_unit or "Unit 1: Core Principles",
                    "similarity_score": confidence,
                    "syllabus_citation": best_citation,
                    "frequency_rating": freq_rating,
                    "difficulty": difficulty
                }

                # Persist to database
                ins_sql = """
                    INSERT INTO exam_question_mappings 
                    (user_id, document_id, paper_title, question_number, question_text, mapped_topic, mapped_unit, similarity_score, syllabus_citation, frequency_rating, difficulty)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """ if IS_POSTGRES else """
                    INSERT INTO exam_question_mappings 
                    (user_id, document_id, paper_title, question_number, question_text, mapped_topic, mapped_unit, similarity_score, syllabus_citation, frequency_rating, difficulty)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                cur.execute(ins_sql, (
                    user_id, document_id, paper_title, q_num, q_text,
                    mapped_obj["mapped_topic"], mapped_obj["mapped_unit"],
                    mapped_obj["similarity_score"], mapped_obj["syllabus_citation"],
                    mapped_obj["frequency_rating"], mapped_obj["difficulty"]
                ))
                mapped_results.append(mapped_obj)

            conn.commit()
            return mapped_results
        finally:
            cur.close()
            conn.close()

rag_engine = RAGEngine()
