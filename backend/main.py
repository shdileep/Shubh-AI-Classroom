import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.database import init_db, get_connection, IS_POSTGRES
from backend.auth import hash_password
from backend.routers import (
    auth, dashboard, llm, documents, topics,
    assessments, gaps, revision, practice,
    analytics, history, assistant, personal, teacher, student_assignments
)

def seed_default_user():
    conn = get_connection()
    cur = conn.cursor()
    try:
        check_query = "SELECT id FROM users WHERE email = %s" if IS_POSTGRES else "SELECT id FROM users WHERE email = ?"
        cur.execute(check_query, ("alex.chen@stanford.edu",))
        if not cur.fetchone():
            pwd_hash = hash_password("password123")
            if IS_POSTGRES:
                cur.execute("""
                    INSERT INTO users (name, email, password_hash, role, course)
                    VALUES ('Alex Chen', 'alex.chen@stanford.edu', %s, 'student', 'Foundational STEM & Computing');
                """, (pwd_hash,))
            else:
                cur.execute("""
                    INSERT INTO users (name, email, password_hash, role, course)
                    VALUES ('Alex Chen', 'alex.chen@stanford.edu', ?, 'student', 'Foundational STEM & Computing');
                """, (pwd_hash,))
            conn.commit()
            print("[Database] Ensured student user account exists: alex.chen@stanford.edu")
    except Exception as e:
        print(f"[Database] Error checking default user: {e}")
    finally:
        cur.close()
        conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    seed_default_user()
    print("[FastAPI] GapFinder AI Backend initialized and ready on port 8000.")
    yield
    # Shutdown
    print("[FastAPI] Backend shutting down.")

app = FastAPI(
    title="GapFinder AI EdTech Platform API",
    description="Modern FastAPI & LLM REST API with PostgreSQL integration & JWT Authentication.",
    version="2.4.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development allow all; in production allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(documents.router)
app.include_router(topics.router)
app.include_router(assessments.router)
app.include_router(gaps.router)
app.include_router(revision.router)
app.include_router(practice.router)
app.include_router(analytics.router)
app.include_router(history.router)
app.include_router(assistant.router)
app.include_router(personal.router)
app.include_router(teacher.router)
app.include_router(student_assignments.router)
app.include_router(llm.router)

# Mount direct /api/webhooks/resend and /api/webhooks/clerk endpoints
@app.post("/api/webhooks/resend")
async def root_resend_webhook(request: Request):
    return await auth.resend_webhook(request)

@app.post("/api/webhooks/clerk")
async def root_clerk_webhook(request: Request):
    return await auth.clerk_webhook(request)

@app.get("/")
def root():
    index_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "gapfinder-app", "dist", "index.html")
    if os.path.exists(index_file):
        from fastapi.responses import FileResponse
        return FileResponse(index_file)
    return {
        "status": "online",
        "service": "GapFinder AI EdTech Backend & API",
        "version": "2.4.0",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "GapFinder AI EdTech Backend",
        "version": "2.4.0",
        "database": "PostgreSQL (psycopg2)" if IS_POSTGRES else "SQLite Fallback (gapfinder.db)",
        "postgres_configured": IS_POSTGRES
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
