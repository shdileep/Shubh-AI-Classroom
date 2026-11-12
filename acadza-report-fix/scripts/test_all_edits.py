import json
import os
import sys

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base)
from engine.triage_rules import DECISIONS

questions = json.load(open(os.path.join(base, "data", "questions.json"), encoding="utf-8"))
q_map = {q["_id"]: q for q in questions}

for rep_id, d in DECISIONS.items():
    edit = d.get("edit")
    if edit:
        qid = d["questionId"]
        q = q_map.get(qid)
        qtype = q.get("questionType")
        payload = q.get(qtype, {})
        field = edit["field"]
        target = edit["find"]
        
        # Check if field is in top-level or payload
        val = str(payload.get(field, q.get(field, "")))
        if str(target) not in val:
            print(f"FAILED: [{rep_id}] QID: {qid} Field: '{field}'")
            print(f"   Target: {repr(target)}")
            print(f"   Field value: {repr(val)[:150]}...")
        else:
            print(f"PASSED: [{rep_id}] QID: {qid} Field: '{field}'")
