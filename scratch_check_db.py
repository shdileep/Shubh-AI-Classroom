import sqlite3

conn = sqlite3.connect('backend/gapfinder.db')
cur = conn.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print('Tables in gapfinder.db:')
for t in tables:
    count = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"  {t}: {count} rows")

cur.execute("SELECT id, name, email FROM users")
users = cur.fetchall()
print("\nUsers:")
for u in users:
    print(f"  User {u[0]}: {u[1]} ({u[2]})")
