import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAXONOMY_PATH = os.path.join(BASE_DIR, "data", "taxonomy.json")

with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
    TAXONOMY_DATA = json.load(f)

VERDICTS = TAXONOMY_DATA["verdicts"]
REPAIRS = TAXONOMY_DATA["repairs"]

def validate_verdict(verdict: str) -> bool:
    return verdict in VERDICTS

def validate_repair(repair: str) -> bool:
    if repair is None:
        return True
    return repair in REPAIRS

def get_repair_fields(repair: str) -> list:
    if not repair or repair not in REPAIRS:
        return []
    return REPAIRS[repair].get("fields", [])

def is_repair_auto_allowed(repair: str) -> bool:
    if not repair or repair not in REPAIRS:
        return False
    return REPAIRS[repair].get("auto", False)
