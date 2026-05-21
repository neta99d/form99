"""Run a migration SQL file against the configured DATABASE_URL.
Usage (from server/): python run_migration.py migrations/002_add_server_id_name.sql
"""
import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

load_dotenv()

if len(sys.argv) < 2:
    print("Usage: python run_migration.py <path_to_sql_file>")
    sys.exit(1)

sql_path = Path(sys.argv[1])
if not sql_path.exists():
    print(f"File not found: {sql_path}")
    sys.exit(1)

sql = sql_path.read_text(encoding="utf-8")

conn = psycopg2.connect(os.environ["DATABASE_URL"])
conn.autocommit = False
try:
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print(f"✓ Migration applied: {sql_path.name}")
except Exception as e:
    conn.rollback()
    print(f"✗ Failed: {e}")
    sys.exit(1)
finally:
    conn.close()
