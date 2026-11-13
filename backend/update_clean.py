import sqlite3

def run():
    conn = sqlite3.connect("backend/gapfinder.db")
    cur = conn.cursor()
    cur.execute("UPDATE users SET course = ? WHERE course LIKE ?", ("Foundational STEM & Computing", "%Diagnostic%"))
    cur.execute("UPDATE topics SET subject = ? WHERE subject LIKE ?", ("Foundational STEM & Computing", "%Diagnostic%"))
    conn.commit()
    conn.close()
    print("Database courses cleaned from 'Diagnostic' terminology.")

if __name__ == "__main__":
    run()
