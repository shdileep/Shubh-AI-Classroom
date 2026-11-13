import os
import json
import time
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.auth import get_current_user
from backend.services.ai_provider import ai_orchestrator
from backend.services.rag_engine import rag_engine

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

class AssistantChatRequest(BaseModel):
    message: str
    topic: Optional[str] = "Quadratic Roots & Nullity"
    document_id: Optional[int] = None
    action_type: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_content: Optional[str] = None

@router.post("/chat")
def chat_with_assistant(req: AssistantChatRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Shubh AI Assistant — Autonomous Personalized Learning Companion.
    Provides concise, professional, grounded explanations and decisions.
    """
    user_id = current_user["sub"]
    student_name = current_user.get("name", "Student")
    query = req.message.strip()
    topic = req.topic or "Foundational Concepts"

    # Retrieve source chunks via RAG if available
    retrieved_chunks = rag_engine.retrieve_chunks(
        user_id=user_id,
        query=query,
        topic=topic,
        document_id=req.document_id,
        top_k=3
    )

    context_str = rag_engine.assemble_context(retrieved_chunks)

    system_prompt = (
        f"You are Shubh AI Assistant, a personal learning companion for {student_name}.\n"
        f"Core Behavior:\n"
        f"1. Reply concisely, professionally, and directly to the point. No fluff or repetitive meta-talk.\n"
        f"2. Deeply understand the student's question and explain concepts clearly.\n"
        f"3. When the user asks for a flowchart, roadmap, or diagram, output a clean Mermaid diagram enclosed in ```mermaid ... ``` code block, followed by a brief summary.\n"
        f"4. Never mention internal model names, architecture dumps, or backends.\n"
    )

    if context_str:
        system_prompt += f"\nGrounded Course Syllabus & Materials:\n{context_str}\n"

    if req.attachment_name and req.attachment_content:
        system_prompt += f"\nAttached File [{req.attachment_name}]:\n{req.attachment_content[:3500]}\n"

    user_prompt = f"Topic: {topic}\nQuestion/Request: {query}"
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
        lowered_query = query.lower()
        if "flow chart" in lowered_query or "flowchart" in lowered_query or "diagram" in lowered_query:
            reply_content = (
                f"Here is a flowchart outlining the core decision framework for **{topic}**:\n\n"
                f"```mermaid\ngraph TD\n"
                f"  A[Start: Matrix A or Equation] --> B{{Evaluate Determinant / Roots}}\n"
                f"  B -->|det(A) = 0| C[Zero Eigenvalue Detected]\n"
                f"  B -->|det(A) != 0| D[Full Rank / Invertible]\n"
                f"  C --> E[Calculate Eigenspace Dimension: Nullity >= 1]\n"
                f"  E --> F[Apply Rank-Nullity: dim(V) = rank + nullity]\n"
                f"  D --> G[Trivial Kernel: Nullity = 0]\n"
                f"```\n\n"
                f"This decision tree ensures you verify whether a matrix possesses zero eigenvalues before calculating eigenspaces."
            )
        else:
            reply_content = (
                f"Hello {student_name}. Regarding **{topic}**:\n\n"
                f"The core principle lies in relating the algebraic multiplicity of eigenvalues to their geometric eigenspace dimension (nullity). "
                f"Under the Rank-Nullity Theorem, dim(V) = rank(T) + nullity(T). "
                f"A zero root indicates non-trivial nullity (dim >= 1), implying non-invertibility and det(A) = 0."
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
