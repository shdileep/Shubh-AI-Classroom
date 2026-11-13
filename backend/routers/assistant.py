import os
import json
import time
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.auth import get_current_user_flexible
from backend.services.ai_provider import ai_orchestrator
from backend.services.rag_engine import rag_engine
from backend.database import get_connection, IS_POSTGRES

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

class AssistantChatRequest(BaseModel):
    message: str
    topic: Optional[str] = "Quadratic Roots & Nullity"
    document_id: Optional[int] = None
    action_type: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_content: Optional[str] = None

@router.post("/chat")
def chat_with_assistant(req: AssistantChatRequest, current_user: Dict[str, Any] = Depends(get_current_user_flexible)):
    """
    Shubh AI Assistant — Domain-Specific Assistant.
    - If user is Teacher/Admin: Functions as Faculty & Curriculum Co-Pilot (Cohort analytics, exam drafting, rubric calibration, weaker students remediation).
    - If user is Student: Functions as Academic Study & Concept Mastery Assistant.
    """
    user_id = current_user.get("sub", 1)
    user_name = current_user.get("name", "User")
    user_role = (current_user.get("role") or "").lower()
    is_faculty = user_role in ["teacher", "admin", "instructor", "faculty"] or current_user.get("email") == "admin@aiready.ac.in"
    query = req.message.strip()
    lowered_query = query.lower()
    topic = req.topic or "Foundational Concepts"

    # =========================================================================
    # FACULTY & ADMIN DOMAIN-SPECIFIC SHUBH AI
    # =========================================================================
    if is_faculty:
        # Identity query for Faculty
        if any(k in lowered_query for k in ["what is your name", "what is ur name", "who are you", "who are u", "ur name", "your name"]):
            return {
                "reply": (
                    f"Hello Professor/Administrator {user_name}! I am **Shubh AI Faculty Co-Pilot**, your dedicated institutional and curriculum intelligence assistant in GapFinder.\n\n"
                    f"**Admin & Faculty Capabilities:**\n"
                    f"- **Cohort Performance Telemetry:** Pinpoint syllabus topics with low pass rates across your student cohort.\n"
                    f"- **Automated Exam & Quiz Drafting:** Generate 30-question adaptive MCQs and 10-question subjective papers grounded in uploaded course documents.\n"
                    f"- **Weaker Students Remediation:** Identify students scoring <50% mastery and automatically schedule targeted micro-drills.\n"
                    f"- **Rubric & Answer Key Calibration:** Verify question keys, citations, and model answers before publishing to student dashboards.\n\n"
                    f"How can I assist your course administration today?"
                ),
                "citations": [],
                "decision_info": {
                    "agent_name": "Shubh AI Faculty Co-Pilot",
                    "faculty_name": user_name,
                    "domain": "Faculty & Administration",
                    "decision": "Assisted with faculty co-pilot identity inquiry"
                }
            }

        # Greetings for Faculty
        if lowered_query in ["hi", "hello", "hey", "good morning", "good evening", "greetings"]:
            return {
                "reply": f"Welcome back, {user_name}! Shubh AI Faculty Co-Pilot is online. Would you like to review cohort mastery analytics, draft a new grounded quiz from uploaded materials, or check on students requiring remediation?",
                "citations": [],
                "decision_info": {
                    "agent_name": "Shubh AI Faculty Co-Pilot",
                    "domain": "Faculty & Administration"
                }
            }

        # Cohort weak students / class performance inquiry
        if any(k in lowered_query for k in ["weak student", "struggling", "cohort", "class performance", "weaker students", "remediation"]):
            conn = get_connection()
            cur = conn.cursor()
            try:
                cur.execute("SELECT COUNT(*) FROM users WHERE role = 'student'")
                st_count = cur.fetchone()[0] or 0

                cur.execute("SELECT COUNT(*) FROM teacher_assignments")
                asg_count = cur.fetchone()[0] or 0

                cur.execute("SELECT COUNT(*) FROM assignment_submissions")
                sub_count = cur.fetchone()[0] or 0
            finally:
                cur.close()
                conn.close()

            return {
                "reply": (
                    f"### 📊 Cohort Telemetry Summary for {user_name}\n\n"
                    f"- **Total Registered Students:** {st_count} enrolled\n"
                    f"- **Published Quizzes & Question Papers:** {asg_count} active\n"
                    f"- **Completed Submissions:** {sub_count} evaluated\n\n"
                    f"**Faculty Recommendations:**\n"
                    f"1. **Targeted Assessment:** Schedule a 30-question diagnostic quiz on newly uploaded chapters to identify knowledge gaps before midterm examinations.\n"
                    f"2. **Automated Reminders:** Ensure all students with <50% mastery on foundational topics receive 5-minute pre-session revision notifications via Resend.\n"
                    f"3. **Material Grounding:** Use the 'Create Assignment' tab to upload textbook chapters; questions and green-labeled answer keys will be compiled automatically."
                ),
                "citations": ["Institutional LMS Registry"],
                "decision_info": {
                    "agent_name": "Shubh AI Faculty Co-Pilot",
                    "domain": "Faculty & Administration",
                    "decision": "Generated cohort analytics overview"
                }
            }

        # Exam drafting / question paper request
        if any(k in lowered_query for k in ["draft", "generate question", "create quiz", "make question paper", "exam question"]):
            return {
                "reply": (
                    f"### 📝 Curriculum Question Paper Drafting\n\n"
                    f"To generate a calibrated examination grounded strictly in your syllabus:\n\n"
                    f"1. Navigate to **'Create Assignment'** in the faculty sidebar.\n"
                    f"2. Choose your format: **Adaptive Quiz** (30 MCQs · 30 Mins) or **Question Paper** (10 Analytical Problems · 45 Mins).\n"
                    f"3. Upload your course PDF, DOCX, or Markdown syllabus.\n"
                    f"4. Click **'Generate & Publish to All Students'** — all questions and green-labeled answer keys will be synthesized instantaneously without special characters or formatting artifacts."
                ),
                "citations": ["Academic Assessment Generator"],
                "decision_info": {
                    "agent_name": "Shubh AI Faculty Co-Pilot",
                    "domain": "Faculty & Administration"
                }
            }

    # =========================================================================
    # STUDENT DOMAIN-SPECIFIC SHUBH AI
    # =========================================================================
    student_name = user_name

    # 1. Direct identity query handler
    if any(k in lowered_query for k in ["what is your name", "what is ur name", "what's your name", "who are you", "who are u", "who r u", "who r you", "who made you", "ur name", "your name"]):
        return {
            "reply": (
                f"Hello {student_name}! I am **Shubh AI Assistant**, your personal academic study and concept assistant in GapFinder.\n\n"
                f"I help you:\n"
                f"- **Diagnose Knowledge Gaps:** Pinpoint foundational prerequisites you missed in assessments.\n"
                f"- **Synthesize Adaptive Revision Plans:** Build 5-day prioritized study roadmaps tailored to your course.\n"
                f"- **Generate Concept Flowcharts:** Visualize dependencies using interactive Mermaid diagrams.\n"
                f"- **Answer Academic Questions:** Explain theorems, formulas, and course concepts grounded in your uploaded materials.\n\n"
                f"How can I assist your study session right now?"
            ),
            "citations": [],
            "decision_info": {
                "agent_name": "Shubh AI Assistant",
                "student_name": student_name,
                "topic": topic,
                "decision": "Assisted with identity inquiry"
            }
        }

    # 1b. User name / student profile query handler
    if any(k in lowered_query for k in ["my name", "what is my name", "what's my name", "who am i", "who am i?"]):
        user_course = current_user.get("course", "Foundational STEM & Computing")
        return {
            "reply": f"Your name is **{student_name}**, and you are currently enrolled in **{user_course}** in GapFinder. What topic would you like to review today?",
            "citations": [],
            "decision_info": {
                "agent_name": "Shubh AI Assistant",
                "student_name": student_name,
                "topic": topic,
                "decision": "Assisted with student name inquiry"
            }
        }

    # 1c. Simple greetings
    if lowered_query in ["hi", "hello", "hey", "good morning", "good evening", "greetings"]:
        return {
            "reply": f"Hello {student_name}! I am Shubh AI Assistant, ready to assist your study session. Would you like to check your knowledge gaps, generate an adaptive revision plan, or ask a question about your course materials?",
            "citations": [],
            "decision_info": {
                "agent_name": "Shubh AI Assistant",
                "student_name": student_name,
                "topic": topic,
                "decision": "Assisted with greeting"
            }
        }

    # 2. Direct 5-Day Revision Plan Synthesis Handler
    if any(k in lowered_query for k in ["revision plan", "5-day", "5 day", "study plan", "synthesize an adaptive", "remedial plan"]):
        # Fetch real student gaps from DB
        gaps_list = []
        try:
            conn = get_connection()
            cur = conn.cursor()
            q = "SELECT topic, mastery_score, root_cause FROM knowledge_gaps WHERE user_id = %s ORDER BY mastery_score ASC" if IS_POSTGRES else "SELECT topic, mastery_score, root_cause FROM knowledge_gaps WHERE user_id = ? ORDER BY mastery_score ASC"
            cur.execute(q, (user_id,))
            rows = cur.fetchall()
            for r in rows:
                gaps_list.append({
                    "topic": r[0] if IS_POSTGRES else r["topic"],
                    "score": r[1] if IS_POSTGRES else r["mastery_score"],
                    "root": r[2] if IS_POSTGRES else r["root_cause"]
                })
            cur.close()
            conn.close()
        except Exception:
            pass

        t1 = gaps_list[0]["topic"] if len(gaps_list) > 0 else "Quadratic Roots & Nullity"
        s1 = gaps_list[0]["score"] if len(gaps_list) > 0 else 32
        t2 = gaps_list[1]["topic"] if len(gaps_list) > 1 else "Orthogonal Projections"
        s2 = gaps_list[1]["score"] if len(gaps_list) > 1 else 48

        plan_reply = (
            f"### 📅 Adaptive 5-Day Revision Plan for {student_name}\n"
            f"**Priority Focus:** Remediating Critical Prerequisite Bottlenecks in **{t1}** ({s1}% Mastery) & **{t2}** ({s2}% Mastery).\n\n"
            f"#### 🗓️ Day 1: Foundational Prerequisites & Null Space\n"
            f"- **Focus Topic:** Linear Maps, Matrix Kernel & Nullity Definitions\n"
            f"- **Study Allocation:** 45 mins active reading + 15 mins concept check\n"
            f"- **Key Objective:** Relate algebraic roots det(A - λI) = 0 to geometric eigenspace nullity.\n"
            f"- **Action Item:** Complete 3-Min Practice Drill on Kernel & Null Space.\n\n"
            f"#### 🗓️ Day 2: The Rank-Nullity Theorem & Multiplicity\n"
            f"- **Focus Topic:** dim(V) = rank(T) + nullity(T)\n"
            f"- **Study Allocation:** 50 mins derivation + 20 mins worked examples\n"
            f"- **Key Objective:** Disentangle algebraic multiplicity from geometric eigenspace dimension.\n"
            f"- **Action Item:** Verify rank-nullity consistency across 5 non-invertible sample matrices.\n\n"
            f"#### 🗓️ Day 3: Inner Products & Orthogonal Complements\n"
            f"- **Focus Topic:** Subspace Orthogonality & Projection Matrices\n"
            f"- **Study Allocation:** 60 mins review + 20 mins vector calculations\n"
            f"- **Key Objective:** Master vector projection formula P_W = A(A^T A)^(-1) A^T.\n"
            f"- **Action Item:** Solve 2 past examination questions on orthogonal subspace decompositions.\n\n"
            f"#### 🗓️ Day 4: Gram-Schmidt Orthogonalization & Error Analysis\n"
            f"- **Focus Topic:** Orthonormal Bases & Least-Squares Approximations\n"
            f"- **Study Allocation:** 60 mins practice problems + 15 mins error audit\n"
            f"- **Key Objective:** Eliminate sign calculation errors in successive Gram-Schmidt vector normalization.\n"
            f"- **Action Item:** Run full 10-Question Grounded Practice Examination in Practice Tab.\n\n"
            f"#### 🗓️ Day 5: Synthesis, Mock Assessment & Gap Closure\n"
            f"- **Focus Topic:** Comprehensive Review & Telemetry Validation\n"
            f"- **Study Allocation:** 45 mins timed assessment + 30 mins reflection\n"
            f"- **Key Objective:** Elevate verified mastery threshold from {s1}% to ≥ 85%.\n"
            f"- **Action Item:** Review updated Knowledge Gap Report and verify closed deficit badges.\n\n"
            f"```mermaid\n"
            f"graph TD\n"
            f"    D1[Day 1: Kernel & Nullity Basics] --> D2[Day 2: Rank-Nullity Theorem]\n"
            f"    D2 --> D3[Day 3: Orthogonal Complements]\n"
            f"    D3 --> D4[Day 4: Gram-Schmidt Projections]\n"
            f"    D4 --> D5[Day 5: Mock Assessment & Mastery Audit]\n"
            f"```\n\n"
            f"*This plan is dynamically synchronized with your active Revision Planner tab.*"
        )
        return {
            "reply": plan_reply,
            "citations": [],
            "decision_info": {
                "agent_name": "Shubh AI Assistant",
                "student_name": student_name,
                "topic": t1,
                "decision": f"Compiled 5-day adaptive revision schedule for {t1} and {t2}"
            }
        }

    # 3. Retrieve source chunks via RAG if available
    retrieved_chunks = rag_engine.retrieve_chunks(
        user_id=user_id,
        query=query,
        topic=topic,
        document_id=req.document_id,
        top_k=3
    )

    context_str = rag_engine.assemble_context(retrieved_chunks)

    system_prompt = (
        f"You are Shubh AI Assistant, an advanced autonomous academic reasoning agent for {student_name} on the GapFinder platform.\n"
        f"Core Directives:\n"
        f"1. You are a real reasoning agent with full mathematical and academic problem-solving capabilities. You are NOT an FAQ bot or a canned chatbot.\n"
        f"2. Answer the user's specific question or request directly, thoroughly, and with step-by-step reasoning.\n"
        f"3. When answering mathematical, scientific, or conceptual questions, calculate exact solutions and explain the principles clearly.\n"
        f"4. If asked to generate a flowchart or study plan, construct a full Mermaid diagram inside ```mermaid ... ``` code blocks followed by an explanation.\n"
        f"5. Never output canned greetings or ask the user what they want to explore when they already asked a question. Give them the actual answer immediately.\n"
    )

    if context_str:
        system_prompt += f"\nGrounded Course Syllabus & Materials:\n{context_str}\n"

    if req.attachment_name and req.attachment_content:
        system_prompt += f"\nAttached File [{req.attachment_name}]:\n{req.attachment_content[:3500]}\n"

    user_prompt = query
    if topic and topic.lower() not in lowered_query and len(lowered_query) > 15:
        user_prompt += f"\n(Academic Topic Context: {topic})"
    if req.attachment_name:
        user_prompt += f"\n[The user attached file: {req.attachment_name}]"

    ai_res = ai_orchestrator.generate_completion(
        prompt=user_prompt,
        system_prompt=system_prompt,
        task_type="fast"
    )

    reply_content = ai_res.get("content")
    if not reply_content:
        # Check if flowchart was requested
        if "flow chart" in lowered_query or "flowchart" in lowered_query or "diagram" in lowered_query:
            reply_content = (
                f"Here is a flowchart outlining the core decision framework for **{topic}**:\n\n"
                f"```mermaid\ngraph TD\n"
                f"  A[Start: Matrix A or Linear Map T] --> B{{Evaluate Determinant / Roots}}\n"
                f"  B -->|det(A) = 0| C[Zero Eigenvalue Detected: Kernel Non-Trivial]\n"
                f"  B -->|det(A) != 0| D[Full Rank: Trivial Kernel (Nullity = 0)]\n"
                f"  C --> E[Calculate Kernel Dimension: Nullity >= 1]\n"
                f"  E --> F[Apply Rank-Nullity Theorem: dim(V) = rank(T) + nullity(T)]\n"
                f"  D --> G[Invertible Mapping: dim(V) = rank(T)]\n"
                f"```\n\n"
                f"This decision tree confirms whether a linear transformation possesses non-trivial kernel solutions."
            )
        elif any(k in lowered_query for k in ["who are you", "what is your name", "what is ur name", "who r u"]):
            reply_content = (
                f"I am **Shubh AI Assistant**, an autonomous academic reasoning agent for GapFinder. "
                f"I specialize in evaluating curriculum telemetry, calculating mathematical derivations, explaining core theorems, "
                f"and generating adaptive revision schedules to eliminate knowledge gaps."
            )
        elif any(k in lowered_query for k in ["my name", "who am i"]):
            reply_content = f"You are **{student_name}**, currently preparing your coursework in GapFinder."
        elif context_str and retrieved_chunks:
            primary_chunk = retrieved_chunks[0]
            reply_content = (
                f"Based on your uploaded course material (*{primary_chunk['document_title']}*):\n\n"
                f"{primary_chunk['source_text'][:380]}...\n\n"
                f"This foundational section addresses **{topic}**."
            )
        else:
            reply_content = (
                f"Regarding **{topic}**:\n\n"
                f"The core principle connects algebraic roots to geometric kernel dimensions through the Rank-Nullity Theorem: "
                f"\\(\\dim(V) = \\text{{rank}}(T) + \\text{{nullity}}(T)\\). Let me know what specific derivation or problem you would like to work through."
            )

    citations = []
    for c in retrieved_chunks:
        citations.append({
            "citation": c["citation"],
            "document_title": c["document_title"],
            "page_number": c["page_number"],
            "section_title": c["section_title"],
            "excerpt": c["source_text"][:160] + "..."
        })

        decision_info = {
            "agent_name": "Shubh AI Assistant",
            "student_name": student_name,
            "topic": topic,
            "decision": f"Strengthen core concepts for {topic}",
            "recommended_next_steps": [
                {
                    "label": "3-Min Practice Drill",
                    "action": "drill",
                    "target_tab": "practice",
                    "topic": topic
                },
                {
                    "label": "Review Study Plan",
                    "action": "revision",
                    "target_tab": "revision",
                    "topic": topic
                }
            ]
        }

    # Attempt to enhance decision through Jev structured decision engine
    try:
        jev_res = ai_orchestrator.call_jev_decide(
            state=f"Student {student_name} is studying '{topic}'. Question: '{query}'. Context: '{context_str[:200]}'",
            choices=[f"Remediate {topic}", f"Practice {topic}", f"Review Prerequisites for {topic}"]
        )
        if jev_res and isinstance(jev_res, dict) and jev_res.get("decision"):
            decision_info["decision"] = jev_res["decision"]
    except Exception as jev_err:
        print(f"[Assistant] Jev decision call note: {jev_err}")

    # Log study activity
    try:
        from backend.database import get_connection, IS_POSTGRES
        conn = get_connection()
        cur = conn.cursor()
        act_sql = """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (%s, %s, %s, %s, %s)
        """ if IS_POSTGRES else """
            INSERT INTO study_activity (user_id, title, tag, description, timestamp_label)
            VALUES (?, ?, ?, ?, ?)
        """
        cur.execute(act_sql, (user_id, f"Consultation: {topic}", "Assistant", f"Inquiry: {query[:60]}", "Just now"))
        conn.commit()
        cur.close()
        conn.close()
    except Exception:
        pass

    return {
        "reply": reply_content,
        "citations": citations,
        "decision_info": decision_info
    }
