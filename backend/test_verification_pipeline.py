import os
import sys
import json
from backend.database import init_db, get_connection
from backend.routers.auth import login, LoginRequest
from backend.routers.practice import get_practice_topics, get_practice_paper, submit_practice_paper, SubmitPaperRequest
from backend.routers.topics import get_topic_map
from backend.routers.teacher import get_teacher_class_overview, get_teacher_students_directory, get_cohort_progress_graph, get_weaker_students_list

def test_full_pipeline():
    print("=== 1. Testing Teacher Capabilities ===")
    t_res = login(LoginRequest(email="admin@aiready.ac.in", password="Admin@123ai"))
    assert t_res.token is not None, "Teacher login failed"
    t_user = t_res.user if isinstance(t_res.user, dict) else t_res.user.dict()
    print(f"Teacher authenticated: {t_user['name']} ({t_user['role']})")

    token_payload = {"sub": t_user["id"], "role": t_user["role"], "name": t_user["name"]}
    
    overview = get_teacher_class_overview(token_payload)
    print("Teacher overview total students:", overview["total_students"], "Mastery:", overview["overall_class_mastery"])
    assert overview["total_students"] >= 9

    students = get_teacher_students_directory(token_payload)
    print(f"Teacher directory has {len(students['students'])} students.")
    assert len(students['students']) >= 9

    graph = get_cohort_progress_graph(token_payload)
    print(f"Teacher progress graph has {len(graph['students'])} student curves.")
    assert len(graph['students']) >= 9

    weaker = get_weaker_students_list(token_payload)
    print(f"Weaker students radar incidents: {len(weaker['weaker_students'])}")

    print("\n=== 2. Testing Student Grounded Topics & Practice Paper ===")
    st_payload = {"sub": 1, "role": "student", "name": "Alex Chen"}
    print(f"Student testing: {st_payload['name']} (ID: {st_payload['sub']})")

    # Grounded topics
    p_topics = get_practice_topics(st_payload)
    print(f"Grounded practice topics count: {len(p_topics['topics'])}")
    for t in p_topics["topics"]:
        print(f"  - {t['topic']} (Citation: {t['citation']})")
        assert "quadratic roots" not in t["topic"].lower(), "Fake topic found"
        assert "matrix rank" not in t["topic"].lower(), "Fake topic found"

    assert len(p_topics["topics"]) > 0, "No grounded topics found for student"
    test_topic = p_topics["topics"][0]["topic"]

    # Grounded paper
    paper = get_practice_paper(test_topic, st_payload)
    print(f"Paper Title: {paper['title']}")
    print(f"Total Questions: {paper['total_questions']}, Total Marks: {paper['total_marks']}")
    assert paper["total_questions"] == 10
    assert paper["total_marks"] == 100
    assert len(paper["questions"]) == 10
    for q in paper["questions"][:3]:
        qnum = q.get("question_number") or q.get("number") or "Q"
        qtxt = q.get("question_text") or q.get("question") or ""
        qmarks = q.get("marks", 10)
        print(f"  {qnum}: {qtxt[:80]}... [{qmarks} Marks]")

    # Submit practice answers (Harsh grading test)
    sample_answers = {
        "1": "WebSocket audio streaming uses bidirectional TCP sockets carrying 16kHz PCM audio frames between Exotel gateway and Maya voice server.",
        "2": "Event lifecycle begins with call initiation, SIP handshake, audio stream opening, chunked buffer transmission, and terminates upon hangup event.",
        "3": "Maya 2 synthesizes speech natively with low latency sub-200ms frame chunking to maintain interactive conversation pace."
    }
    
    # Check if already submitted or submit fresh
    if not paper["has_submitted"]:
        sub_res = submit_practice_paper(
            SubmitPaperRequest(
                paper_id=paper["paper_id"],
                topic=test_topic,
                answers=sample_answers
            ),
            st_payload
        )
        print(f"\nSubmission Harsh Result: Score {sub_res['score']}/{sub_res['total_marks']} ({sub_res['percentage']}%)")
        print("Weakest points identified:", len(sub_res.get("weakest_points", [])))
        assert sub_res["score"] >= 0
    else:
        print("\nStudent has already submitted this paper. Verified locked state.")

    # Re-fetch paper to verify read-only lock
    re_paper = get_practice_paper(test_topic, st_payload)
    assert re_paper["has_submitted"] is True, "Submission state should be True"
    assert re_paper["can_edit"] is False, "Paper must be locked in read-only mode"
    print(f"Verified paper lock: has_submitted={re_paper['has_submitted']}, can_edit={re_paper['can_edit']}")
    print(f"Submitted score: {re_paper['submission']['score']}/{re_paper['submission']['total_marks']} ({re_paper['submission']['percentage']}%)")

    # Grounded topic map
    t_map = get_topic_map(st_payload)
    print(f"\nTopic Map units count: {len(t_map['units'])}")
    assert len(t_map["units"]) > 0
    for u in t_map["units"]:
        print(f"  Unit: {u['name']} ({len(u['chapters'][0]['topics'])} topics)")
        for top in u["chapters"][0]["topics"]:
            assert "quadratic roots" not in top["name"].lower(), "Fake topic found in topic map"
            assert "matrix rank" not in top["name"].lower(), "Fake topic found in topic map"

    print("\nALL VERIFICATION CHECKS PASSED 100%!")

if __name__ == "__main__":
    test_full_pipeline()
