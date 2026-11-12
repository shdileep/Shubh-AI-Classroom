import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.database import init_db, get_connection, IS_POSTGRES
from backend.auth import hash_password
from backend.routers import auth, dashboard, llm

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
                    VALUES ('Alex Chen', 'alex.chen@stanford.edu', %s, 'student', 'MATH 204 · Multivariable Calculus')
                    RETURNING id;
                """, (pwd_hash,))
                user_id = cur.fetchone()[0]
                cur.execute("""
                    INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                    VALUES 
                    (%s, 'Quadratic Roots & Nullity', 32, 'High', 'Critical Gap'),
                    (%s, 'Matrix Rank & Vector Pivot', 41, 'High', 'Needs Review'),
                    (%s, 'Jordan Canonical Form', 45, 'High', 'Needs Review'),
                    (%s, 'Orthogonal Projections', 68, 'Medium', 'In Progress'),
                    (%s, 'Vector Subspaces', 71, 'Medium', 'In Progress'),
                    (%s, 'Linear Systems & Solvability', 96, 'Low', 'Mastered'),
                    (%s, 'Matrix Determinants', 94, 'Low', 'Mastered');
                """, (user_id, user_id, user_id, user_id, user_id, user_id, user_id))
            else:
                cur.execute("""
                    INSERT INTO users (name, email, password_hash, role, course)
                    VALUES ('Alex Chen', 'alex.chen@stanford.edu', ?, 'student', 'MATH 204 · Multivariable Calculus');
                """, (pwd_hash,))
                user_id = cur.lastrowid
                cur.executemany("""
                    INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status)
                    VALUES (?, ?, ?, ?, ?);
                """, [
                    (user_id, 'Quadratic Roots & Nullity', 32, 'High', 'Critical Gap'),
                    (user_id, 'Matrix Rank & Vector Pivot', 41, 'High', 'Needs Review'),
                    (user_id, 'Jordan Canonical Form', 45, 'High', 'Needs Review'),
                    (user_id, 'Orthogonal Projections', 68, 'Medium', 'In Progress'),
                    (user_id, 'Vector Subspaces', 71, 'Medium', 'In Progress'),
                    (user_id, 'Linear Systems & Solvability', 96, 'Low', 'Mastered'),
                    (user_id, 'Matrix Determinants', 94, 'Low', 'Mastered'),
                ])
            conn.commit()
            print("[Database] Seeded default student user: alex.chen@stanford.edu (password: password123)")
    except Exception as e:
        print(f"[Database] Error checking/seeding default user: {e}")
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
app.include_router(llm.router)

# Mount direct /api/webhooks/resend endpoint
@app.post("/api/webhooks/resend")
async def root_resend_webhook(request: Request):
    return await auth.resend_webhook(request)

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
