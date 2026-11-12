import os
import sqlite3
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gapfinder_db")
IS_POSTGRES = False
pg_conn = None

# Try PostgreSQL first
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    test_conn = psycopg2.connect(DATABASE_URL, connect_timeout=1)
    test_conn.close()
    IS_POSTGRES = True
    print(f"[Database] Successfully connected to PostgreSQL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'localhost'}")
except Exception as e:
    IS_POSTGRES = False
    print(f"[Database] PostgreSQL connection unviable ({e}). Using embedded SQLite database (backend/gapfinder.db).")

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "gapfinder.db")

def get_connection():
    if IS_POSTGRES:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    else:
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()
    
    if IS_POSTGRES:
        # PostgreSQL Schema
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'student',
                course VARCHAR(255) DEFAULT 'MATH 204 · Multivariable Calculus',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_gaps (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic VARCHAR(255) NOT NULL,
                mastery_score INTEGER NOT NULL,
                priority VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS diagnostic_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic VARCHAR(255) NOT NULL,
                score INTEGER NOT NULL,
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS study_activity (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                tag VARCHAR(100),
                description TEXT,
                timestamp_label VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
    else:
        # SQLite Schema
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'student',
                course TEXT DEFAULT 'MATH 204 · Multivariable Calculus',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_gaps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic TEXT NOT NULL,
                mastery_score INTEGER NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS diagnostic_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic TEXT NOT NULL,
                score INTEGER NOT NULL,
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS study_activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                tag TEXT,
                description TEXT,
                timestamp_label TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS email_verifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                otp_hash TEXT,
                purpose TEXT DEFAULT 'verification',
                expires_at REAL NOT NULL,
                attempts INTEGER DEFAULT 0,
                cooldown_until REAL DEFAULT 0,
                verified INTEGER DEFAULT 0,
                verified_at REAL,
                resend_email_id TEXT,
                delivery_status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_verif_email ON email_verifications(email);")

    conn.commit()

    # Safely ensure clerk_id, email_verified, and welcome_email columns exist
    try:
        if IS_POSTGRES:
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE;")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;")
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_resend_id VARCHAR(255);")
        else:
            try:
                cur.execute("ALTER TABLE users ADD COLUMN clerk_id TEXT;")
                cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);")
            except Exception:
                pass
            try:
                cur.execute("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;")
            except Exception:
                pass
            try:
                cur.execute("ALTER TABLE users ADD COLUMN welcome_email_sent INTEGER DEFAULT 0;")
            except Exception:
                pass
            try:
                cur.execute("ALTER TABLE users ADD COLUMN welcome_email_resend_id TEXT;")
            except Exception:
                pass
        conn.commit()
    except Exception as e:
        print("[Database] Migration note:", e)

    cur.close()
    conn.close()
    print("[Database] Schema tables verified and initialized successfully.")
