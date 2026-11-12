import json
import os
import re

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, "data")

with open(os.path.join(data_dir, "reports.json"), encoding="utf-8") as f:
    reports = json.load(f)

with open(os.path.join(data_dir, "questions.json"), encoding="utf-8") as f:
    questions = json.load(f)

q_map = {q["_id"]: q for q in questions}

output_path = os.path.join(base_dir, "scripts", "all_reports_detail.txt")

def clean_html(text):
    if not text:
        return ""
    # Simplify common math tags for terminal readability
    t = text.replace("&nbsp;", " ")
    t = re.sub(r'<math[^>]*>.*?</math>', '[MATH]', t, flags=re.DOTALL)
    t = re.sub(r'<[^>]+>', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

with open(output_path, "w", encoding="utf-8") as out:
    for idx, r in enumerate(reports):
        q = q_map.get(r["questionId"])
        out.write(f"================================================================================\n")
        out.write(f"INDEX: {idx} | REPORT ID: {r['reportId']} | QUESTION ID: {r['questionId']}\n")
        out.write(f"STUDENT: {r.get('studentId')} | SOURCE: {r.get('source')} | REPORTED AT: {r.get('reportedAt')}\n")
        out.write(f"STUDENT COMMENT: \"{r['comment']}\"\n")
        if not q:
            out.write("QUESTION NOT FOUND IN DATABASE!\n\n")
            continue
        qtype = q.get("questionType")
        qdata = q.get(qtype, {})
        out.write(f"SUBJECT: {q.get('subject')} | CHAPTER: {q.get('chapter')} | TYPE: {qtype}\n")
        out.write(f"STORED ANSWER: {qdata.get('answer')}\n")
        out.write(f"QUESTION TEXT (RAW):\n{qdata.get('question')}\n\n")
        out.write(f"SOLUTION TEXT (RAW):\n{qdata.get('solution')}\n\n")

print(f"Dumped details to {output_path}")
