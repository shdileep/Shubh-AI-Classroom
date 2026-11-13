import datetime
from typing import Dict, Any, List, Optional

class RevisionPlannerEngine:
    def __init__(self):
        pass

    def generate_plan(
        self,
        gaps: List[Dict[str, Any]],
        target_exam_date: Optional[str] = None,
        daily_available_hours: float = 1.5,
        existing_tasks: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate or adapt a personalized revision plan prioritizing:
        1. Foundational prerequisite gaps
        2. Lowest demonstrated mastery (weakest first)
        3. High examination weighting
        4. Reinforcement of medium topics
        Preserves previously completed tasks.
        """
        # Collect previously completed tasks so they are never lost
        completed_tasks = []
        completed_topics = set()
        if existing_tasks:
            for t in existing_tasks:
                if t.get("completed"):
                    completed_tasks.append(t)
                    completed_topics.add(t.get("topic"))

        # Filter topics that need revision (< 80% mastery)
        candidates = [g for g in gaps if g.get("mastery_score", 0) < 80]

        # Sorting score: lower mastery score + higher priority
        def priority_key(item):
            score = item.get("mastery_score", 50)
            # Prerequisite blockers give additional boost in urgency
            prereqs_count = len(item.get("blocked_prerequisites", []))
            weight_str = item.get("weight", "15%")
            try:
                weight_val = int("".join(filter(str.isdigit, weight_str)))
            except Exception:
                weight_val = 15
            # Urgent formula: lower score + more blocked prereqs + higher exam weight
            return (score - (prereqs_count * 5) - (weight_val * 0.5))

        sorted_candidates = sorted(candidates, key=priority_key)

        tasks = []
        day_counter = 1

        # Re-attach existing completed tasks first or keep their day index
        for ct in completed_tasks:
            tasks.append(ct)
            if ct.get("day_number", 0) >= day_counter:
                day_counter = ct["day_number"] + 1

        # Plan remaining uncompleted candidates
        for cand in sorted_candidates:
            topic_name = cand["topic"]
            # Skip if already completed recently unless still marked < 50%
            is_already_done = topic_name in completed_topics and cand.get("mastery_score", 0) >= 50
            if is_already_done:
                continue

            score = cand.get("mastery_score", 35)
            is_critical = score < 50
            duration_mins = cand.get("recommended_minutes", 35)

            tasks.append({
                "id": f"task-{day_counter}-{topic_name.replace(' ', '-').lower()[:15]}",
                "day": f"Day {day_counter}",
                "day_number": day_counter,
                "topic": topic_name,
                "subject": "Active Diagnostic Workspace",
                "unit": cand.get("unit", "Curriculum Core"),
                "priority": "High" if is_critical else "Medium",
                "estimated_duration_minutes": duration_mins,
                "revision_objective": f"Remediate root cause: {cand.get('root_cause', 'Foundational concept review')}",
                "recommended_source_section": cand.get("grounding", "Syllabus & Textbook Core"),
                "practice_question_count": 5 if is_critical else 3,
                "completed": False,
                "completed_at": None,
                "drill": cand.get("drill"),
                "blocked_prerequisites": cand.get("blocked_prerequisites", [])
            })
            day_counter += 1

        # If no gaps are yet recorded, supply a structured baseline diagnostic revision plan
        if len(tasks) == 0:
            baseline_curriculum = [
                {"topic": "Linear Systems & Matrix Transformations", "unit": "Unit 1: Linear Transformations", "obj": "Review matrix representation, row operations, and kernel foundations.", "mins": 35, "q": 5},
                {"topic": "Vector Subspaces & Linear Independence", "unit": "Unit 1: Vector Spaces", "obj": "Verify span, basis dimension, and subspace closure criteria.", "mins": 35, "q": 5},
                {"topic": "Matrix Determinants & Characteristic Polynomials", "unit": "Unit 3: Bilinear Forms", "obj": "Compute eigenvalues and solve det(A - λI) = 0 for algebraic multiplicity.", "mins": 40, "q": 5},
                {"topic": "Orthogonal Projections & Gram-Schmidt", "unit": "Unit 4: Inner Products", "obj": "Master projection operators and orthogonal complement decompositions.", "mins": 35, "q": 4},
                {"topic": "Curriculum Diagnostic Practice Exam", "unit": "Unit 5: Synthesis", "obj": "Attempt 10-Question formal assessment to identify critical knowledge gaps.", "mins": 45, "q": 10}
            ]
            for idx, item in enumerate(baseline_curriculum, start=1):
                tasks.append({
                    "id": f"task-baseline-{idx}",
                    "day": f"Day {idx}",
                    "day_number": idx,
                    "topic": item["topic"],
                    "subject": "Linear Algebra & STEM Core",
                    "unit": item["unit"],
                    "priority": "High" if idx == 1 or idx == 5 else "Medium",
                    "estimated_duration_minutes": item["mins"],
                    "revision_objective": item["obj"],
                    "recommended_source_section": "Course Outline §1.1 · Verified Syllabus",
                    "practice_question_count": item["q"],
                    "completed": False,
                    "completed_at": None,
                    "drill": None,
                    "blocked_prerequisites": []
                })
            day_counter = 6

        # Calculate estimated completion
        total_days = max(day_counter - 1, 1)
        exam_date_str = target_exam_date or (datetime.date.today() + datetime.timedelta(days=14)).isoformat()

        return {
            "title": "Adaptive Gap-Closure Revision Plan",
            "target_exam_date": exam_date_str,
            "daily_available_hours": daily_available_hours,
            "total_days": total_days,
            "completed_tasks_count": len(completed_tasks),
            "remaining_tasks_count": len([t for t in tasks if not t.get("completed")]),
            "tasks": tasks,
            "adaptation_reason": "Baseline diagnostic revision schedule active. Adapts dynamically with your assessment scores." if not candidates else "Prioritized foundational prerequisite blockers and topics under 80% mastery."
        }

revision_planner_engine = RevisionPlannerEngine()
