import json
import os
import re

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
questions = json.load(open(os.path.join(base, "data", "questions.json"), encoding="utf-8"))

print(f"Auditing all {len(questions)} questions for potential defects...\n")

for q in questions:
    qid = q["_id"]
    qtype = q.get("questionType", "unknown")
    qdata = q.get(qtype, {})
    qtext = qdata.get("question", "")
    sol = qdata.get("solution", "")
    ans = qdata.get("answer")
    
    issues = []
    
    # 1. Check for diagram references without images
    if re.search(r'\b(figure|diagram|shown in (the )?(figure|diagram))\b', qtext, re.I):
        if not qdata.get("quesImages"):
            issues.append("References figure/diagram but quesImages is empty")
            
    # 2. Check for raw LaTeX leakage
    if re.search(r'\\[a-zA-Z]+', qtext):
        latex_matches = re.findall(r'\\[a-zA-Z]+(?:\{[^}]*\})*', qtext)
        issues.append(f"Raw LaTeX in question: {latex_matches[:3]}")
    if re.search(r'\\[a-zA-Z]+', sol):
        latex_matches = re.findall(r'\\[a-zA-Z]+(?:\{[^}]*\})*', sol)
        issues.append(f"Raw LaTeX in solution: {latex_matches[:3]}")
        
    # 3. Check for exam references
    if re.search(r'\((JEE|NEET|AIEEE|AIIMS)[^)]*\)', qtext, re.I):
        issues.append("Contains exam reference tag")
        
    # 4. Check for option issues in SCQ
    if qtype == "scq":
        options = re.findall(r'\([A-D]\)[^(\n<]*', qtext)
        # Check blank options
        for opt_letter in ['A', 'B', 'C', 'D']:
            pattern = rf'\({opt_letter}\)\s*(?:<[^>]+>\s*)*(&nbsp;|\s)*(?:<br\s*/?>|<\/h3>|\([A-D]\)|$)'
            if re.search(pattern, qtext):
                issues.append(f"Option {opt_letter} appears blank or empty")
                
    # 5. Check mcq with single answer
    if qtype == "mcq":
        if isinstance(ans, list) and (len(ans) == 1 or '' in ans):
            issues.append(f"MCQ with potential single answer or blank entry: {ans}")
            
    if issues:
        print(f"[{qid}] Type: {qtype} | Subject: {q.get('subject')} | Chapter: {q.get('chapter')}")
        for iss in issues:
            print(f"   -> {iss}")
        print()
