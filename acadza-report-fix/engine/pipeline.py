import json
import os
from typing import List, Dict, Any
from .taxonomy import TAXONOMY_DATA
from .safety_guard import validate_triage_decision, sanitize_comment
from .triage_rules import get_triage_result, DECISIONS

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

def load_data():
    with open(os.path.join(DATA_DIR, "reports.json"), "r", encoding="utf-8") as f:
        reports = json.load(f)
    with open(os.path.join(DATA_DIR, "questions.json"), "r", encoding="utf-8") as f:
        questions = json.load(f)
    return reports, questions

def run_triage_pipeline(output_path: str = None) -> List[Dict[str, Any]]:
    reports, questions = load_data()
    q_map = {q["_id"]: q for q in questions}

    results = []
    
    for report in reports:
        rep_id = report["reportId"]
        qid = report["questionId"]
        q = q_map.get(qid)
        qtype = q.get("questionType") if q else None
        q_payload = q.get(qtype, {}) if q and qtype else {}

        # Sanitize student comment for potential prompt injections
        clean_comment = sanitize_comment(report["comment"])

        # Fetch triage decision
        res = get_triage_result(rep_id)

        # Enforce safety guard validation
        validate_triage_decision(
            verdict=res["verdict"],
            repair=res["repair"],
            edit=res["edit"],
            route=res["route"],
            confidence=res["confidence"],
            question_payload=q_payload
        )

        results.append(res)

    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"Generated {len(results)} triage results at {output_path}")

    return results

if __name__ == "__main__":
    out_file = os.path.join(BASE_DIR, "results.json")
    run_triage_pipeline(out_file)
