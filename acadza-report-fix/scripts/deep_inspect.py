import json
import os
import re

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
reports = json.load(open(os.path.join(base, "data", "reports.json"), encoding="utf-8"))
questions = json.load(open(os.path.join(base, "data", "questions.json"), encoding="utf-8"))
q_map = {q["_id"]: q for q in questions}

def strip_tags(html):
    if not html: return ""
    # replace basic math tags with readable approximations
    html = re.sub(r'<mfrac><mrow>(.*?)</mrow><mrow>(.*?)</mrow></mfrac>', r'(\1)/(\2)', html)
    html = re.sub(r'<mfrac>(.*?)(.*?)</mfrac>', r'(\1)/(\2)', html)
    html = re.sub(r'<msup><mrow>(.*?)</mrow><mrow>(.*?)</mrow></msup>', r'(\1)^(\2)', html)
    html = re.sub(r'<msub><mrow>(.*?)</mrow><mrow>(.*?)</mrow></msub>', r'(\1)_(\2)', html)
    html = re.sub(r'<msqrt><mrow>(.*?)</mrow></msqrt>', r'sqrt(\1)', html)
    html = re.sub(r'<msqrt>(.*?)</msqrt>', r'sqrt(\1)', html)
    # remove all remaining tags
    text = re.sub(r'<br\s*/?>', '\n', html)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = text.replace('&nbsp;', ' ').replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&')
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

for i, r in enumerate(reports):
    q = q_map.get(r["questionId"], {})
    qtype = q.get("questionType", "unknown")
    qdata = q.get(qtype, {})
    print("="*80)
    print(f"REPORT [{i+1}/44] ID: {r['reportId']} | QID: {r['questionId']}")
    print(f"Student: {r.get('studentId')} | Src: {r.get('source')} | Time: {r.get('reportedAt')}")
    print(f"Comment: {r['comment']}")
    print(f"Subject: {q.get('subject')} | Chapter: {q.get('chapter')} | Type: {qtype} | Ans: {qdata.get('answer')}")
    print("-" * 40 + " QUESTION " + "-" * 40)
    print(strip_tags(qdata.get("question", "")))
    print("-" * 40 + " SOLUTION " + "-" * 40)
    print(strip_tags(qdata.get("solution", ""))[:600]) # first 600 chars
