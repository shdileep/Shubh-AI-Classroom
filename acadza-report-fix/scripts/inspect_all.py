import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, "data")

with open(os.path.join(data_dir, "reports.json"), encoding="utf-8") as f:
    reports = json.load(f)

with open(os.path.join(data_dir, "questions.json"), encoding="utf-8") as f:
    questions = json.load(f)

with open(os.path.join(data_dir, "taxonomy.json"), encoding="utf-8") as f:
    taxonomy = json.load(f)

q_map = {q["_id"]: q for q in questions}

print(f"Total reports: {len(reports)}")
print(f"Total questions: {len(questions)}")

# Check report distribution by question
from collections import Counter
q_counter = Counter(r["questionId"] for r in reports)
print(f"Unique questions reported: {len(q_counter)}")
print("Questions reported multiple times:")
for qid, count in q_counter.items():
    if count > 1:
        print(f"  {qid}: {count} reports")

unreported = [q["_id"] for q in questions if q["_id"] not in q_counter]
print(f"Unreported questions ({len(unreported)}): {unreported}")

print("\n--- SAMPLE REPORTS AND THEIR QUESTIONS ---")
for i, r in enumerate(reports[:10]):
    q = q_map.get(r["questionId"])
    q_type = q.get("questionType") if q else "UNKNOWN"
    q_data = q.get(q_type, {}) if q else {}
    print(f"\n[{i+1}] Report {r['reportId']} on Q {r['questionId']} (Type: {q_type}):")
    print(f"    Comment: {r['comment']}")
    print(f"    Current Answer: {q_data.get('answer')}")
