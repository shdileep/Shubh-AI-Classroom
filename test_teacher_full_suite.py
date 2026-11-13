import os
import sys
import json
import datetime
from starlette.datastructures import UploadFile
import io

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from backend.database import init_db, get_connection, IS_POSTGRES
from backend.routers import auth, teacher, student_assignments

def run_suite():
    init_db()
    print("Database initialized successfully.", flush=True)

    print("\n--- 1. Testing Teacher Login with admin@aiready.ac.in / Admin@123ai ---", flush=True)
    req = auth.LoginRequest(email="admin@aiready.ac.in", password="Admin@123ai")
    login_res = auth.login(req)
    print(f" Teacher login successful! Role: {login_res.user['role']}, Name: {login_res.user['name']}", flush=True)
    assert login_res.user["role"] == "teacher"
    teacher_user = {"sub": login_res.user["id"], "email": login_res.user["email"], "name": login_res.user["name"], "role": "teacher"}

    print("\n--- 2. Testing Student Login with alex.chen@stanford.edu ---", flush=True)
    s_req = auth.LoginRequest(email="alex.chen@stanford.edu", password="password123")
    s_login_res = auth.login(s_req)
    print(f" Student login successful! Role: {s_login_res.user['role']}, Name: {s_login_res.user['name']}", flush=True)
    assert s_login_res.user["role"] == "student"
    student_user = {"sub": s_login_res.user["id"], "email": s_login_res.user["email"], "name": s_login_res.user["name"], "role": "student"}

    print("\n--- 3. Testing GET /api/teacher/overview (Top 3 KPI Cards) ---", flush=True)
    ov = teacher.get_teacher_class_overview(current_user=teacher_user)
    print(f" Top 3 Cards Verified:", flush=True)
    print(f"  • Total Students: {ov['total_students']}", flush=True)
    print(f"  • Total Assignments: {ov['total_assignments']}", flush=True)
    print(f"  • Overall Class Mastery: {ov['overall_class_mastery']}%", flush=True)
    assert "total_students" in ov
    assert "total_assignments" in ov
    assert "overall_class_mastery" in ov

    print("\n--- 4. Testing GET /api/teacher/students (Tabular Directory) ---", flush=True)
    dir_res = teacher.get_teacher_students_directory(current_user=teacher_user)
    students = dir_res["students"]
    print(f" Total Registered Students in Directory: {len(students)}", flush=True)
    assert len(students) > 0
    first_st = students[0]
    print(f"  First Student Row: S.No={first_st['s_no']}, Name='{first_st['name']}', Email='{first_st['email']}', Materials={first_st['materials_count']}, Topics={first_st['topics_count']}", flush=True)

    print("\n--- 5. Testing GET /api/teacher/students/{id}/materials (Floating Eye Modal) ---", flush=True)
    mat_res = teacher.get_student_materials_summary(student_id=first_st["id"], current_user=teacher_user)
    print(f" Eye Modal Data for '{mat_res['student_name']}':", flush=True)
    print(f"  • Documents Uploaded: {mat_res['total_documents']}", flush=True)
    print(f"  • Total Pages: {mat_res['total_pages']}", flush=True)
    print(f"  • Active Gap Topics: {len(mat_res['active_topics'])}", flush=True)
    assert "materials" in mat_res

    print("\n--- 6. Testing GET /api/teacher/cohort-progress-graph (0-100% Graph) ---", flush=True)
    graph_res = teacher.get_cohort_progress_graph(current_user=teacher_user)
    print(f" Cohort Progress Graph: {len(graph_res['students'])} students, Criteria: {graph_res['criteria_y_axis']}", flush=True)
    assert len(graph_res["students"]) > 0
    assert graph_res["criteria_y_axis"] == [0, 20, 40, 60, 80, 100]

    print("\n--- 7. Testing GET /api/teacher/weaker-students ---", flush=True)
    weak_res = teacher.get_weaker_students_list(current_user=teacher_user)
    weaker_list = weak_res["weaker_students"]
    print(f" Weaker Students (<50% Mastery): {len(weaker_list)} students detected", flush=True)
    for ws in weaker_list[:3]:
        print(f"  • Student: {ws['name']} | Topic: '{ws['topic']}' | Score: {ws['score']}% | Severity: {ws['severity']}", flush=True)

    print("\n--- 8. Testing POST /api/teacher/assignments/create (30 MCQs Quiz) ---", flush=True)
    sample_content = (
        "Linear Algebra and Spectral Decomposition. "
        "A square matrix A is diagonalizable if and only if there exists an invertible matrix P such that P^-1 A P = D. "
        "The eigenvalues of a triangular matrix are the entries on its main diagonal. "
        "The null space of A contains all vectors x such that Ax = 0. "
        "Rank-Nullity theorem states that dim Col(A) + dim Null(A) = number of columns. "
        "Orthogonal projections map vectors to the nearest subspace minimizing Euclidean distance."
    )
    now = datetime.datetime.now()
    start_time = (now - datetime.timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M")
    end_time = (now + datetime.timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M")

    upload_file = UploadFile(file=io.BytesIO(sample_content.encode("utf-8")), filename="Linear_Algebra_Chapter2.txt")

    created_assignment = teacher.create_teacher_assignment(
        file=upload_file,
        title="Unit 2 Linear Transformations & Rank-Nullity Quiz",
        topic="Matrix Rank & Vector Pivot",
        start_time=start_time,
        end_time=end_time,
        faculty_name="Faculty Administrator",
        subject="Foundational STEM & Linear Systems",
        assignment_type="quiz",
        current_user=teacher_user
    )

    print(f" Created Assignment: ID={created_assignment['assignment_id']}, Title='{created_assignment['title']}', Total Questions={created_assignment['total_questions']}, Duration={created_assignment['duration_minutes']} min", flush=True)
    assert created_assignment["total_questions"] == 30
    assert created_assignment["duration_minutes"] == 30
    assign_id = created_assignment["assignment_id"]

    print("\n--- 9. Testing Student View: GET /api/student/assignments ---", flush=True)
    st_assigns_res = student_assignments.list_student_assignments(current_user=student_user)
    print(f" Student sees {len(st_assigns_res['assignments'])} assignments. Pending notification count: {st_assigns_res['pending_notification_count']}", flush=True)
    target = next((a for a in st_assigns_res["assignments"] if a["id"] == assign_id), None)
    assert target is not None
    assert target["can_attempt"] is True
    print(f"  Assignment Time Window Status: '{target['time_status_label']}', Can Attempt: {target['can_attempt']}", flush=True)

    print("\n--- 10. Testing Student Attempt & Submit ---", flush=True)
    attempt_data = student_assignments.get_assignment_for_attempt(assignment_id=assign_id, current_user=student_user)
    print(f"  Loaded {len(attempt_data['questions'])} questions for student attempt", flush=True)
    assert len(attempt_data["questions"]) == 30

    # Submit answers
    mock_answers = {str(q["id"]): 0 for q in attempt_data["questions"]}
    submit_req = student_assignments.AssignmentSubmitRequest(answers=mock_answers, time_spent_seconds=820)
    sub_res = student_assignments.submit_student_assignment(assignment_id=assign_id, req=submit_req, current_user=student_user)
    print(f"  Submission Evaluated: Score={sub_res['score']}/{sub_res['total_marks']} ({sub_res['percentage']}%), Time Spent: {sub_res['time_spent_seconds']}s", flush=True)
    assert "submission_id" in sub_res

    print("\n--- 11. Testing Teacher View: GET /api/teacher/assignments/{id}/submissions (Sorting) ---", flush=True)
    teacher_sub_res = teacher.get_assignment_submissions(assignment_id=assign_id, sort="high_to_low", current_user=teacher_user)
    print(f"  Teacher Submissions Table: Total Attempts={teacher_sub_res['total_attempted']}", flush=True)
    assert len(teacher_sub_res["submissions"]) >= 1
    sub_row = teacher_sub_res["submissions"][0]
    print(f"  Row 1: S.No={sub_row['s_no']}, Student='{sub_row['student_name']}', Pct={sub_row['percentage']}%, Time Spent='{sub_row['time_spent_formatted']}'", flush=True)

    print("\n--- 12. Testing GET /api/teacher/history (Dedicated Admin Audit Log) ---", flush=True)
    hist_res = teacher.get_teacher_admin_history(current_user=teacher_user)
    print(f"  Admin History entries: {len(hist_res['history'])} records", flush=True)
    assert len(hist_res["history"]) >= 2
    for h in hist_res["history"][:3]:
        print(f"   • [{h['action_type']}] {h['title']} - {h['details'][:70]}...", flush=True)

    print("\n ALL 12 TEACHER & STUDENT ASSIGNMENT SUITE TESTS PASSED 100%!\n", flush=True)

if __name__ == "__main__":
    run_suite()
