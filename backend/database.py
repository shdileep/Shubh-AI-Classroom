import os
import sqlite3
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gapfinder_db")
IS_POSTGRES = False

if os.getenv("USE_SQLITE", "0") != "1":
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
else:
    print("[Database] USE_SQLITE=1 set. Using embedded SQLite database (backend/gapfinder.db).")

if os.environ.get("VERCEL"):
    SQLITE_PATH = "/tmp/gapfinder.db"
    src_db = os.path.join(os.path.dirname(__file__), "gapfinder.db")
    if os.path.exists(src_db) and not os.path.exists(SQLITE_PATH):
        try:
            import shutil
            shutil.copyfile(src_db, SQLITE_PATH)
        except Exception:
            pass
else:
    SQLITE_PATH = os.path.join(os.path.dirname(__file__), "gapfinder.db")

def get_connection():
    if IS_POSTGRES:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    else:
        conn = sqlite3.connect(SQLITE_PATH, timeout=20.0, check_same_thread=False)
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
                course VARCHAR(255) DEFAULT 'Active Diagnostic Workspace',
                clerk_id VARCHAR(255) UNIQUE,
                email_verified BOOLEAN DEFAULT FALSE,
                welcome_email_sent BOOLEAN DEFAULT FALSE,
                welcome_email_resend_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS student_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                target_exam_date VARCHAR(50) DEFAULT '2026-12-15',
                daily_study_minutes INTEGER DEFAULT 90,
                preferred_difficulty VARCHAR(50) DEFAULT 'Moderate',
                notifications_enabled BOOLEAN DEFAULT TRUE,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                subject VARCHAR(255) DEFAULT 'Mathematics & Linear Algebra',
                doc_type VARCHAR(100) DEFAULT 'Textbook',
                file_path TEXT,
                file_size INTEGER DEFAULT 0,
                page_count INTEGER DEFAULT 1,
                topics_count INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Indexed & Grounded',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS document_chunks (
                id SERIAL PRIMARY KEY,
                document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                chunk_index INTEGER DEFAULT 0,
                page_number INTEGER DEFAULT 1,
                section_title VARCHAR(255),
                topic_name VARCHAR(255),
                source_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS topics (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                subject VARCHAR(255) DEFAULT 'Active Diagnostic Workspace',
                unit_id VARCHAR(50) DEFAULT 'Unit 1',
                unit_name VARCHAR(255),
                topic_name VARCHAR(255) NOT NULL,
                exam_weight VARCHAR(50) DEFAULT '15%',
                mastery_score INTEGER DEFAULT 50,
                status VARCHAR(50) DEFAULT 'In Progress',
                root_cause TEXT,
                blocked_prerequisites TEXT,
                grounding_citation TEXT,
                recommended_minutes INTEGER DEFAULT 30,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS knowledge_gaps (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic VARCHAR(255) NOT NULL,
                mastery_score INTEGER NOT NULL,
                priority VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS diagnostic_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic VARCHAR(255) NOT NULL,
                score INTEGER NOT NULL,
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS study_activity (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                tag VARCHAR(100),
                description TEXT,
                timestamp_label VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS revision_plans (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                target_exam_date VARCHAR(50),
                daily_hours REAL DEFAULT 1.5,
                status VARCHAR(50) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS revision_tasks (
                id SERIAL PRIMARY KEY,
                plan_id INTEGER,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                day_number INTEGER DEFAULT 1,
                topic VARCHAR(255) NOT NULL,
                subject VARCHAR(255) DEFAULT 'Active Diagnostic Workspace',
                priority VARCHAR(50) DEFAULT 'High',
                estimated_minutes INTEGER DEFAULT 30,
                objective TEXT,
                source_section TEXT,
                practice_question_count INTEGER DEFAULT 3,
                completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS bookmarks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                item_type VARCHAR(50) DEFAULT 'topic',
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255),
                source_ref TEXT,
                link_tab VARCHAR(50) DEFAULT 'diagnosis',
                topic VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS student_notes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                tags VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS exam_question_mappings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                document_id INTEGER,
                paper_title VARCHAR(255) NOT NULL,
                question_number VARCHAR(50) DEFAULT 'Q1',
                question_text TEXT NOT NULL,
                mapped_topic VARCHAR(255) NOT NULL,
                mapped_unit VARCHAR(255),
                similarity_score REAL DEFAULT 0.85,
                syllabus_citation TEXT,
                frequency_rating VARCHAR(100) DEFAULT 'High Frequency (Finals)',
                difficulty VARCHAR(50) DEFAULT 'Moderate',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS revision_schedules (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                scheduled_date VARCHAR(50) NOT NULL,
                scheduled_time VARCHAR(50) NOT NULL,
                document_id INTEGER,
                topic VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Scheduled',
                reminder_sent BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS teacher_assignments (
                id SERIAL PRIMARY KEY,
                teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                topic VARCHAR(255) NOT NULL,
                subject VARCHAR(255) DEFAULT 'Core Curriculum',
                faculty_name VARCHAR(255) DEFAULT 'Faculty Administrator',
                assignment_type VARCHAR(50) DEFAULT 'quiz',
                document_id INTEGER,
                document_title VARCHAR(255),
                start_time VARCHAR(100) NOT NULL,
                end_time VARCHAR(100) NOT NULL,
                duration_minutes INTEGER DEFAULT 30,
                questions_json TEXT NOT NULL,
                total_questions INTEGER DEFAULT 30,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS assignment_submissions (
                id SERIAL PRIMARY KEY,
                assignment_id INTEGER REFERENCES teacher_assignments(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                student_name VARCHAR(255) NOT NULL,
                student_email VARCHAR(255) NOT NULL,
                score INTEGER DEFAULT 0,
                total_marks INTEGER DEFAULT 100,
                answers_json TEXT,
                time_spent_seconds INTEGER DEFAULT 0,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS admin_history (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                action_type VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS practice_question_papers (
                id SERIAL PRIMARY KEY,
                document_id INTEGER,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                questions_json TEXT NOT NULL,
                total_questions INTEGER DEFAULT 10,
                total_marks INTEGER DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS practice_submissions (
                id SERIAL PRIMARY KEY,
                paper_id INTEGER REFERENCES practice_question_papers(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic VARCHAR(255) NOT NULL,
                answers_json TEXT NOT NULL,
                score INTEGER DEFAULT 0,
                total_marks INTEGER DEFAULT 100,
                percentage INTEGER DEFAULT 0,
                evaluation_json TEXT,
                weakest_points_json TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
    else:
        # SQLite Schema
        cur.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'student',
                course TEXT DEFAULT 'Active Diagnostic Workspace',
                clerk_id TEXT,
                email_verified INTEGER DEFAULT 0,
                welcome_email_sent INTEGER DEFAULT 0,
                welcome_email_resend_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS student_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                target_exam_date TEXT DEFAULT '2026-12-15',
                daily_study_minutes INTEGER DEFAULT 90,
                preferred_difficulty TEXT DEFAULT 'Moderate',
                notifications_enabled INTEGER DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                subject TEXT DEFAULT 'Mathematics & Linear Algebra',
                doc_type TEXT DEFAULT 'Textbook',
                file_path TEXT,
                file_size INTEGER DEFAULT 0,
                page_count INTEGER DEFAULT 1,
                topics_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'Indexed & Grounded',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS document_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                chunk_index INTEGER DEFAULT 0,
                page_number INTEGER DEFAULT 1,
                section_title TEXT,
                topic_name TEXT,
                source_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                subject TEXT DEFAULT 'Active Diagnostic Workspace',
                unit_id TEXT DEFAULT 'Unit 1',
                unit_name TEXT,
                topic_name TEXT NOT NULL,
                exam_weight TEXT DEFAULT '15%',
                mastery_score INTEGER DEFAULT 50,
                status TEXT DEFAULT 'In Progress',
                root_cause TEXT,
                blocked_prerequisites TEXT,
                grounding_citation TEXT,
                recommended_minutes INTEGER DEFAULT 30,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS knowledge_gaps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic TEXT NOT NULL,
                mastery_score INTEGER NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS diagnostic_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic TEXT NOT NULL,
                score INTEGER NOT NULL,
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS study_activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                tag TEXT,
                description TEXT,
                timestamp_label TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS revision_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                target_exam_date TEXT,
                daily_hours REAL DEFAULT 1.5,
                status TEXT DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS revision_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plan_id INTEGER,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                day_number INTEGER DEFAULT 1,
                topic TEXT NOT NULL,
                subject TEXT DEFAULT 'Active Diagnostic Workspace',
                priority TEXT DEFAULT 'High',
                estimated_minutes INTEGER DEFAULT 30,
                objective TEXT,
                source_section TEXT,
                practice_question_count INTEGER DEFAULT 3,
                completed INTEGER DEFAULT 0,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                item_type TEXT DEFAULT 'topic',
                title TEXT NOT NULL,
                subtitle TEXT,
                source_ref TEXT,
                link_tab TEXT DEFAULT 'diagnosis',
                topic TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS student_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                tags TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS exam_question_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                document_id INTEGER,
                paper_title TEXT NOT NULL,
                question_number TEXT DEFAULT 'Q1',
                question_text TEXT NOT NULL,
                mapped_topic TEXT NOT NULL,
                mapped_unit TEXT,
                similarity_score REAL DEFAULT 0.85,
                syllabus_citation TEXT,
                frequency_rating TEXT DEFAULT 'High Frequency (Finals)',
                difficulty TEXT DEFAULT 'Moderate',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS revision_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                scheduled_date TEXT NOT NULL,
                scheduled_time TEXT NOT NULL,
                document_id INTEGER,
                topic TEXT,
                status TEXT DEFAULT 'Scheduled',
                reminder_sent INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS teacher_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                topic TEXT NOT NULL,
                subject TEXT DEFAULT 'Core Curriculum',
                faculty_name TEXT DEFAULT 'Faculty Administrator',
                assignment_type TEXT DEFAULT 'quiz',
                document_id INTEGER,
                document_title TEXT,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                duration_minutes INTEGER DEFAULT 30,
                questions_json TEXT NOT NULL,
                total_questions INTEGER DEFAULT 30,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS assignment_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id INTEGER REFERENCES teacher_assignments(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                student_name TEXT NOT NULL,
                student_email TEXT NOT NULL,
                score INTEGER DEFAULT 0,
                total_marks INTEGER DEFAULT 100,
                answers_json TEXT,
                time_spent_seconds INTEGER DEFAULT 0,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS admin_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                action_type TEXT NOT NULL,
                title TEXT NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS practice_question_papers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic TEXT NOT NULL,
                title TEXT NOT NULL,
                questions_json TEXT NOT NULL,
                total_questions INTEGER DEFAULT 10,
                total_marks INTEGER DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS practice_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paper_id INTEGER REFERENCES practice_question_papers(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                topic TEXT NOT NULL,
                answers_json TEXT NOT NULL,
                score INTEGER DEFAULT 0,
                total_marks INTEGER DEFAULT 100,
                percentage INTEGER DEFAULT 0,
                evaluation_json TEXT,
                weakest_points_json TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
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
            CREATE INDEX IF NOT EXISTS idx_verif_email ON email_verifications(email);
        """)

    conn.commit()

    # Seed Initial Cohort and Past-Paper Question Mappings
    try:
        seed_cohort_and_mappings(cur, conn)
    except Exception as e:
        print(f"[Database] Warning: Seed cohort note: {e}")

    cur.close()
    conn.close()
    print("[Database] All LMS tables initialized and verified.")

def seed_cohort_and_mappings(cur, conn):
    from backend.auth import hash_password
    default_pwd = hash_password("password123")
    admin_pwd = hash_password("Admin@123ai")

    users_to_seed = [
        ("Faculty Administrator", "admin@aiready.ac.in", "teacher", "Engineering & Computing Cohort", admin_pwd),
        ("Alex Chen", "alex.chen@stanford.edu", "student", "Active Diagnostic Workspace", default_pwd),
        ("Dr. Elena Rostova", "teacher@stanford.edu", "teacher", "Foundational STEM & Linear Systems", default_pwd),
        ("Priya Patel", "priya.patel@stanford.edu", "student", "Active Diagnostic Workspace", default_pwd),
        ("Marcus Vance", "marcus.vance@stanford.edu", "student", "Active Diagnostic Workspace", default_pwd),
        ("Sarah Jenkins", "sarah.jenkins@stanford.edu", "student", "Active Diagnostic Workspace", default_pwd)
    ]

    user_ids = {}
    for name, email, role, course, pwd_hash in users_to_seed:
        chk_sql = "SELECT id, password_hash FROM users WHERE email = %s" if IS_POSTGRES else "SELECT id, password_hash FROM users WHERE email = ?"
        cur.execute(chk_sql, (email,))
        row = cur.fetchone()
        if not row:
            ins_sql = """
                INSERT INTO users (name, email, password_hash, role, course, email_verified)
                VALUES (%s, %s, %s, %s, %s, TRUE) RETURNING id
            """ if IS_POSTGRES else """
                INSERT INTO users (name, email, password_hash, role, course, email_verified)
                VALUES (?, ?, ?, ?, ?, 1)
            """
            cur.execute(ins_sql, (name, email, pwd_hash, role, course))
            uid = cur.fetchone()[0] if IS_POSTGRES else cur.lastrowid
            user_ids[email] = uid
        else:
            uid = row[0] if IS_POSTGRES else row["id"]
            user_ids[email] = uid
            if email == "admin@aiready.ac.in":
                up_sql = "UPDATE users SET password_hash = %s, role = %s WHERE id = %s" if IS_POSTGRES else "UPDATE users SET password_hash = ?, role = ? WHERE id = ?"
                cur.execute(up_sql, (pwd_hash, "teacher", uid))

    conn.commit()
