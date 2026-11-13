import sqlite3

def clean_database():
    conn = sqlite3.connect('backend/gapfinder.db')
    cur = conn.cursor()

    # 1. Update all users' course to 'Diagnostic Learning Workspace'
    cur.execute("UPDATE users SET course = 'Diagnostic Learning Workspace'")

    # 2. Delete seeded fake documents (1, 2, 3)
    cur.execute("DELETE FROM documents WHERE id IN (1, 2, 3)")
    cur.execute("DELETE FROM document_chunks WHERE document_id IN (1, 2, 3)")

    # 3. Delete seeded fake knowledge gaps
    cur.execute("DELETE FROM knowledge_gaps")

    # 4. Delete seeded fake revision tasks
    cur.execute("DELETE FROM revision_tasks")

    # 5. Delete seeded fake study activities
    cur.execute("DELETE FROM study_activity")

    # 6. Delete seeded fake diagnostic sessions
    cur.execute("DELETE FROM diagnostic_sessions")

    # 7. Delete bookmarks and student notes
    cur.execute("DELETE FROM bookmarks")
    cur.execute("DELETE FROM student_notes")

    # 8. Update topics table
    cur.execute("UPDATE topics SET subject = 'Diagnostic Learning Workspace'")

    conn.commit()
    print("Database cleaned successfully! All fake user data removed.")

    cur.execute("SELECT id, name, email, course FROM users")
    print("Users in DB:", cur.fetchall())

    cur.execute("SELECT id, user_id, title FROM documents")
    print("Documents in DB:", cur.fetchall())

    cur.execute("SELECT COUNT(*) FROM knowledge_gaps")
    print("Knowledge gaps count:", cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM study_activity")
    print("Study activity count:", cur.fetchone()[0])

    cur.close()
    conn.close()

if __name__ == "__main__":
    clean_database()
