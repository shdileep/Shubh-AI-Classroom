import json
import os
import re

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
questions = json.load(open(os.path.join(base, "data", "questions.json"), encoding="utf-8"))
q_map = {q["_id"]: q for q in questions}

# Check exact target strings in each question to make edits purely surgical
for qid in ['60f744b3f1b9bc7cc7b4a949', '68e870ef42c06737d6e565c4', '68dea616d0cda73d07e93ae6', 
            '61dffbec08489156b684bd22', '60f742f6660d187cc13a8078', '622f08d7b70e4b50e4500a1b',
            '63765a28f1d8416ae0408d89', '61ee6c9d90a1a968a168686b', '6263d75bdd44e265ef926d97',
            '612151a6a34397610a9a2e58', '617fa18efd53ff1629ed890f', '68f21caf941cda588bc04365',
            '68e872546e45ba37dcc16bc0', '696a866665252c04fc1f81c2', '68c8153cfb6b2f16e2d3ceaf',
            '5fc60508028950133eac8963']:
    q = q_map.get(qid)
    qtype = q.get("questionType")
    payload = q.get(qtype, {})
    print(f"=== QID {qid} ({qtype}) ===")
    print(f"Answer: {repr(payload.get('answer'))}")
    if qid == '61dffbec08489156b684bd22':
        print("Spelling target found:", "Epithellial tisue" in payload.get('question', ''))
    if qid == '63765a28f1d8416ae0408d89':
        print("Markup target found:", "\\frac{7}{8}" in payload.get('question', ''))
    if qid == '61ee6c9d90a1a968a168686b':
        print("Plexux target found:", "Choroid plexux" in payload.get('question', ''))
    if qid == '617fa18efd53ff1629ed890f':
        print("Exam ref found:", "(NEET 2019)" in payload.get('question', ''))
    if qid == '6263d75bdd44e265ef926d97':
        print("Solution fix target found:", "a = 40 cm" in payload.get('solution', ''))
    if qid == '68e872546e45ba37dcc16bc0':
        print("Blank C target in question:", repr(payload.get('question', ''))[-150:])
    if qid == '696a866665252c04fc1f81c2':
        print("Cube stem in question:", repr(payload.get('question', '')))
    if qid == '5fc60508028950133eac8963':
        print("Frictional force target:", "frictional force is equal to" in payload.get('question', ''))
    if qid == '60f742f6660d187cc13a8078':
        print("Inductance stem target:", "and an inductance are connected" in payload.get('question', ''))
