import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, "data")

with open(os.path.join(data_dir, "reports.json"), encoding="utf-8") as f:
    reports = json.load(f)

with open(os.path.join(data_dir, "questions.json"), encoding="utf-8") as f:
    questions = json.load(f)

reported_qids = set(r["questionId"] for r in reports)
unreported = [q for q in questions if q["_id"] not in reported_qids]

output_path = os.path.join(base_dir, "scripts", "unreported_questions.txt")
with open(output_path, "w", encoding="utf-8") as out:
    for q in unreported:
        qtype = q.get("questionType")
        qdata = q.get(qtype, {})
        out.write(f"================================================================================\n")
        out.write(f"QUESTION ID: {q['_id']} | TYPE: {qtype} | SUBJECT: {q.get('subject')} | CHAPTER: {q.get('chapter')}\n")
        out.write(f"ANSWER: {qdata.get('answer')}\n")
        out.write(f"QUESTION RAW:\n{qdata.get('question')}\n\n")
        out.write(f"SOLUTION RAW:\n{qdata.get('solution')}\n\n")

print(f"Dumped {len(unreported)} unreported questions to {output_path}")
