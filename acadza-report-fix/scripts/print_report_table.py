import json
import os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
reports = json.load(open(os.path.join(base, "data", "reports.json"), encoding="utf-8"))
questions = json.load(open(os.path.join(base, "data", "questions.json"), encoding="utf-8"))
q_map = {q["_id"]: q for q in questions}

print(f"{'#':<3} | {'RepID':<5} | {'QID':<25} | {'Comment':<40}")
print("-" * 80)
for idx, r in enumerate(reports):
    comment = r['comment']
    if len(comment) > 38:
        comment = comment[:35] + "..."
    print(f"{idx+1:<3} | {r['reportId']:<5} | {r['questionId']:<25} | {comment:<40}")
