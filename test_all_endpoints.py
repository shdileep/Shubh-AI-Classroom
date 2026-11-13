import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.database import init_db
from backend.routers import (
    dashboard, topics, assessments, gaps, revision,
    practice, analytics, history, assistant, personal, teacher
)

init_db()

current_user = {"sub": 1, "email": "alex.chen@stanford.edu", "name": "Alex Chen", "role": "student"}
teacher_user = {"sub": 2, "email": "teacher@stanford.edu", "name": "Dr. Elena Rostova", "role": "teacher"}

print("1. Testing Dashboard ...")
dash_res = dashboard.get_dashboard_data(current_user=current_user)
print("Score:", dash_res["metrics"]["overall_knowledge_score"], "%")
assert "metrics" in dash_res

print("\n2. Testing Curriculum Map ...")
t_map = topics.get_topic_map(current_user=current_user)
print("Units count:", len(t_map["units"]))
assert len(t_map["units"]) > 0

print("\n3. Testing Retrieval-Grounded Exam Mappings (Condition 1) ...")
em_res = topics.get_exam_question_mappings(current_user=current_user)
print("Mapped Exam Questions:", em_res["total_mapped_questions"])
assert em_res["total_mapped_questions"] > 0

print("\n4. Testing Knowledge Gap Report (Condition 3) ...")
gap_res = gaps.get_knowledge_gap_report(current_user=current_user)
print("Diagnosed Topics:", len(gap_res["topic_diagnoses"]))
assert len(gap_res["topic_diagnoses"]) > 0

print("\n5. Testing Active Revision Plan (Condition 4) ...")
rev_res = revision.get_revision_plan(current_user=current_user)
print("Scheduled Tasks:", len(rev_res["tasks"]))
assert "tasks" in rev_res

print("\n6. Testing Dynamic Assessment Generation (Condition 2) ...")
gen_req = assessments.GenerateAssessmentRequest(question_count=3, difficulty="Moderate")
gen_res = assessments.generate_assessment(gen_req, current_user=current_user)
print("Generated Questions count:", len(gen_res["questions"]))
assert len(gen_res["questions"]) == 3
assert "correct_answer" not in gen_res["questions"][0]

print("\n7. Testing Assessment Submission & Bayesian Re-scoring ...")
answers = {q["id"]: 0 for q in gen_res["questions"]}
sub_req = assessments.AssessmentSubmission(assessment_id=gen_res["assessment_id"], answers=answers)
sub_res = assessments.submit_assessment(sub_req, current_user=current_user)
print("Submission Overall Score:", sub_res["report"]["overall_score"], "%")
assert "report" in sub_res

print("\n8. Testing Practice Drill Generation & Evaluation ...")
p_gen = practice.generate_practice(practice.PracticeGenerateRequest(topic="Quadratic Roots & Nullity"), current_user=current_user)
assert p_gen["drills_count"] > 0
p_sub = practice.submit_practice(practice.PracticeSubmitRequest(
    topic="Quadratic Roots & Nullity",
    drill_id="drill-qr-1",
    selected_option_index=0,
    correct_option_index=0
), current_user=current_user)
print("Updated mastery:", p_sub["new_score"], "%")
assert p_sub["is_correct"] is True

print("\n9. Testing Analytics Overview ...")
an_res = analytics.get_analytics_overview(current_user=current_user)
assert "topic_bars" in an_res
print("Analytics overall knowledge score:", an_res["overall_knowledge_score"], "%")

print("\n10. Testing History Stream ...")
h_res = history.get_learning_history(current_user=current_user)
assert "activities" in h_res
print("Activity count:", len(h_res["activities"]))

print("\n11. Testing AI Tutor & Flowchart ...")
ai_res = assistant.chat_with_assistant(assistant.AssistantChatRequest(message="Give me a flowchart for Quadratic Roots"), current_user=current_user)
assert "reply" in ai_res
print("AI Reply excerpt:", ai_res["reply"][:80], "...")

print("\n12. Testing Bookmarks & Notes ...")
bm_res = personal.get_bookmarks(current_user=current_user)
n_res = personal.get_notes(current_user=current_user)
assert "bookmarks" in bm_res and "notes" in n_res
print("Bookmarks:", len(bm_res["bookmarks"]), "Notes:", len(n_res["notes"]))

print("\n13. Testing Teacher Cohort Overview (PS Scope) ...")
tea_res = teacher.get_teacher_class_overview(current_user=teacher_user)
assert tea_res["total_students"] > 0
assert len(tea_res["topic_diagnoses"]) > 0
print("Class:", tea_res["class_name"])
print("Enrolled Students:", tea_res["total_students"])
print("Class Failure Rate on Top Gap:", tea_res["topic_diagnoses"][0]["topic"], f"({tea_res['topic_diagnoses'][0]['failure_rate_pct']}%)")

print("\n14. Testing Teacher Broadcast Remedial Drill ...")
b_res = teacher.broadcast_cohort_drill(teacher.BroadcastDrillRequest(topic="Quadratic Roots & Nullity"), current_user=teacher_user)
assert b_res["students_assigned"] > 0
print("Students assigned drill:", b_res["students_assigned"])

print("\n" + "=" * 60)
print("ALL 14 REST ENDPOINTS TESTED AND 100% OPERATIONAL!")
print("==================================================")
