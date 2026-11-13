import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

print("1. Testing GET /api/health ...")
res = client.get("/api/health")
print("Status:", res.status_code, "Body:", res.json())
assert res.status_code == 200

print("\n2. Testing POST /api/auth/login ...")
res = client.post("/api/auth/login", json={"email": "alex.chen@stanford.edu", "password": "password123"})
print("Status:", res.status_code, "User:", res.json()["user"]["name"])
assert res.status_code == 200
token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

print("\n3. Testing GET /api/dashboard ...")
res = client.get("/api/dashboard", headers=headers)
print("Status:", res.status_code, "Score:", res.json()["metrics"]["overall_knowledge_score"], "%")
assert res.status_code == 200

print("\n4. Testing GET /api/topics/map ...")
res = client.get("/api/topics/map", headers=headers)
print("Status:", res.status_code, "Units count:", len(res.json()["units"]))
assert res.status_code == 200

print("\n5. Testing GET /api/knowledge-gaps/report ...")
res = client.get("/api/knowledge-gaps/report", headers=headers)
print("Status:", res.status_code, "Diagnoses count:", len(res.json()["topic_diagnoses"]))
assert res.status_code == 200

print("\n6. Testing GET /api/revision-plans/active ...")
res = client.get("/api/revision-plans/active", headers=headers)
print("Status:", res.status_code, "Tasks count:", len(res.json()["tasks"]))
assert res.status_code == 200

print("\n7. Testing POST /api/assessments/generate ...")
res = client.post("/api/assessments/generate", headers=headers, json={"mode": "Initial Diagnostic", "question_count": 3})
print("Status:", res.status_code, "Questions generated:", len(res.json()["questions"]))
assert res.status_code == 200
questions = res.json()["questions"]
assessment_id = res.json()["assessment_id"]
assert "correct_answer" not in questions[0], "Correct answer should not be leaked to student before submission"

print("\n8. Testing POST /api/assessments/submit ...")
answers = {str(q["id"]): 0 for q in questions}
res = client.post("/api/assessments/submit", headers=headers, json={"assessment_id": assessment_id, "answers": answers})
print("Status:", res.status_code, "Overall Score:", res.json()["report"]["overall_score"], "% Evaluations count:", len(res.json()["evaluations"]))
assert res.status_code == 200

print("\n9. Testing GET /api/analytics/overview ...")
res = client.get("/api/analytics/overview", headers=headers)
print("Status:", res.status_code, "Knowledge trend points:", len(res.json()["knowledge_trend"]))
assert res.status_code == 200

print("\n10. Testing GET /api/history ...")
res = client.get("/api/history", headers=headers)
print("Status:", res.status_code, "History entries:", len(res.json()["activities"]))
assert res.status_code == 200

print("\n11. Testing POST /api/assistant/chat ...")
res = client.post("/api/assistant/chat", headers=headers, json={"topic": "Quadratic Roots & Nullity", "message": "Why do quadratic roots determine the stability of the system?"})
print("Status:", res.status_code, "Reply preview:", res.json()["reply"][:120], "...")
assert res.status_code == 200

print("\n12. Testing GET /api/personal/bookmarks & /notes ...")
res_bm = client.get("/api/personal/bookmarks", headers=headers)
res_notes = client.get("/api/personal/notes", headers=headers)
print("Bookmarks:", len(res_bm.json()["bookmarks"]), "Notes:", len(res_notes.json()["notes"]))
assert res_bm.status_code == 200 and res_notes.status_code == 200

print("\n" + "=" * 60)
print("ALL 12 FASTAPI LIVE REST ENDPOINTS TESTED AND 100% OPERATIONAL!")
print("=" * 60)
