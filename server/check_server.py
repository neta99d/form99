"""
Checks the live server and DB state.
Run from server/ directory: python check_server.py
"""
import json
import os

import psycopg2
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

BASE = "http://localhost:8000"


def req(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


# ── DB schema ──────────────────────────────────────────────────────────────
print("=== DB columns in 'forms' table ===")
conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()
cur.execute("""
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'forms'
    ORDER BY ordinal_position
""")
for row in cur.fetchall():
    print(f"  {row[0]:30s}  {row[1]:20s}  nullable={row[2]}  default={row[3]}")

print()

cur.execute("""
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'forms'
""")
print("=== Indexes ===")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")
conn.close()

print()

# ── Live server ────────────────────────────────────────────────────────────
print("=== GET /health ===")
status, body = req("GET", "/health")
print(f"  {status}: {body}")

print()
print("=== GET /api/accounts/0/forms ===")
status, body = req("GET", "/api/accounts/0/forms")
print(f"  {status}: {json.dumps(body, ensure_ascii=False, indent=2)}")

print()
print("=== POST /api/forms (create test form) ===")
status, body = req("POST", "/api/forms", {
    "account_id": "0",
    "title": "טופס בדיקה",
    "submit_button_text": "שליחה",
    "direction": "rtl",
    "fields": []
})
print(f"  {status}: {json.dumps(body, ensure_ascii=False, indent=2)}")
