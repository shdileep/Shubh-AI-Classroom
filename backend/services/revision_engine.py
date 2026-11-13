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

        # If no real evaluated gaps exist, do NOT supply fake curriculum days.
        # Revision must be strictly grounded in actual completed quizzes and question papers.
        if len(tasks) == 0:
            return {
                "title": "Evidence-Grounded Revision Plan",
                "target_exam_date": target_exam_date or (datetime.date.today() + datetime.timedelta(days=14)).isoformat(),
                "daily_available_hours": daily_available_hours,
                "total_days": 0,
                "completed_tasks_count": 0,
                "remaining_tasks_count": 0,
                "tasks": [],
                "adaptation_reason": "No active revision tasks. Complete a quiz or question paper to generate your evidence-grounded revision plan based on questions you missed."
            }

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
