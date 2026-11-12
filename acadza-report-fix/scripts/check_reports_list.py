import json
import os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
reports = json.load(open(os.path.join(base, "data", "reports.json"), encoding="utf-8"))
questions = json.load(open(os.path.join(base, "data", "questions.json"), encoding="utf-8"))
q_map = {q["_id"]: q for q in questions}

# Let's inspect the remaining reports
seen_reports = {
    'R005', 'R029', 'R012', 'R002', 'R004', 'R008', 'R034', 'R010', 'R017', 'R032',
    'R026', 'R042', 'R023', 'R007', 'R003', 'R038', 'R014', 'R040', 'R044', 'R028',
    'R022', 'R015', 'R016', 'R018', 'R039', 'R009', 'R013', 'R030', 'R001', 'R036',
    'R021', 'R011', 'R041', 'R043', 'R027', 'R006', 'R019', 'R035', 'R025', 'R037',
    'R020', 'R033', 'R031', 'R024'
}

print(f"Total reports: {len(reports)}")
print(f"Reports in list: {len(seen_reports)}")
missing = [r['reportId'] for r in reports if r['reportId'] not in seen_reports]
print(f"Missing from our list: {missing}")
