import sqlite3

conn = sqlite3.connect("zoom.db")
for (sql,) in conn.execute("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL"):
    print(sql)
    print("-" * 60)
conn.close()