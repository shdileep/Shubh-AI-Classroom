import json
import os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
reports = json.load(open(os.path.join(base, "data", "reports.json"), encoding="utf-8"))
questions = json.load(open(os.path.join(base, "data", "questions.json"), encoding="utf-8"))
q_map = {q["_id"]: q for q in questions}

for i, r in enumerate(reports):
    q = q_map.get(r["questionId"], {})
    qtype = q.get("questionType", "unknown")
    qdata = q.get(qtype, {})
    ans = qdata.get("answer")
    subj = q.get("subject", "N/A")
    print(f"[{i+1:02d}] {r['reportId']} | QID: {r['questionId']} | Subj: {subj} | Type: {qtype} | Ans: {ans}")
    print(f"     Comment: {r['comment']}")
