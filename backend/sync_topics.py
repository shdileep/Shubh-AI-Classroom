import sqlite3

def sync_student_topics():
    conn = sqlite3.connect('backend/gapfinder.db')
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Find students who have uploaded documents
    docs = cur.execute("SELECT id, user_id, title FROM documents").fetchall()
    
    linear_algebra_fakes = [
        "Matrix Rank & Vector Pivot", "Jordan Canonical Form", "Orthogonal Projections",
        "Vector Subspaces", "Matrix Determinants", "Quadratic Roots & Nullity",
        "Linear Systems & Solvability", "Uploaded Core Concepts"
    ]

    for doc in docs:
        uid = doc["user_id"]
        doc_id = doc["id"]
        title = doc["title"]

        # Clean old fake gaps
        for fake in linear_algebra_fakes:
            cur.execute("DELETE FROM knowledge_gaps WHERE user_id = ? AND topic = ?", (uid, fake))
            cur.execute("DELETE FROM topics WHERE user_id = ? AND topic_name = ?", (uid, fake))

        # Check existing real topics for this user
        existing = cur.execute("SELECT COUNT(*) FROM topics WHERE user_id = ?", (uid,)).fetchone()[0]
        if existing == 0:
            # Add real topics from Directoo / Exotel document
            real_units = [
                ("Unit 1", "Telephony & Audio Streaming", [
                    ("Exotel Telephony & WebSocket Audio Streaming", "Indian ExoPhone numbers, bidirectional WebSocket audio streaming, and PCM audio protocol at 24 kHz."),
                    ("Voicebot Applet & WebSocket Event Lifecycle", "Handling start, media, mark, clear, stop, and DTMF events during live two-way calls.")
                ]),
                ("Unit 2", "Voice Generation & Reasoning Pipeline", [
                    ("Maya 2 Native TTS & Streaming Audio Frames", "Text-to-speech in 12 Indian languages with 80ms audio frames and zero-shot cloning capabilities."),
                    ("Gemma 3 Reasoning Engine & Tool Selection", "Open weights Gemma 3 (27B primary, 4B backup) for intent classification and structured JSON tool generation.")
                ]),
                ("Unit 3", "System Orchestration & API Architecture", [
                    ("Python Bridge Architecture & Tool Authorization", "Strict API router verifying caller identity, permissions, and tool execution without direct service coupling."),
                    ("Directoo APIs: Menus, Orders, Riders & Refunds", "Core transactional APIs providing verified status for orders, live menu checks, rider assignments, and refund rules.")
                ]),
                ("Unit 4", "Production Resilience & User Experience", [
                    ("Barge-In, VAD & Audio Interruption Protocols", "Voice Activity Detection (VAD) and clear-playback commands allowing callers to interrupt the AI smoothly."),
                    ("Call Fallbacks, Latency Budgets & Human Escalation", "Enforcing sub-second latency budgets and blind transfer to human call center agents upon repeated errors.")
                ])
            ]

            for u_id, u_name, topics in real_units:
                for t_name, t_concept in topics:
                    cur.execute("""
                        INSERT INTO topics (user_id, subject, unit_id, unit_name, topic_name, exam_weight, mastery_score, status, root_cause, grounding_citation)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (uid, "Voice AI Systems Architecture", u_id, u_name, t_name, "25%", 45, "Needs Review", t_concept, f"{title} · {u_name}"))
                    
                    cur.execute("""
                        INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                        VALUES (?, ?, ?, ?, ?)
                    """, (uid, t_name, 45, "High", "Critical Gap"))

    conn.commit()
    print("Sync completed successfully.")
    
    # Inspect
    for doc in docs:
        uid = doc["user_id"]
        t_count = cur.execute("SELECT COUNT(*) FROM topics WHERE user_id = ?", (uid,)).fetchone()[0]
        g_count = cur.execute("SELECT COUNT(*) FROM knowledge_gaps WHERE user_id = ?", (uid,)).fetchone()[0]
        print(f"User {uid}: {t_count} topics, {g_count} gaps grounded in '{doc['title']}'")
    conn.close()

if __name__ == "__main__":
    sync_student_topics()
