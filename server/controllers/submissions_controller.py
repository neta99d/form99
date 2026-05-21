from __future__ import annotations

import json
import uuid

import psycopg2.extensions
import psycopg2.extras


def _cursor(conn: psycopg2.extensions.connection) -> psycopg2.extras.RealDictCursor:
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


def create_submission(
    conn: psycopg2.extensions.connection,
    form_id: uuid.UUID,
    account_id: str,
    server_id: str,
    answers: dict,
) -> dict:
    with _cursor(conn) as cur:
        cur.execute(
            """
            INSERT INTO submissions (form_id, account_id, server_id, answers)
            VALUES (%s, %s, %s, %s)
            RETURNING id, form_id, account_id, server_id, submitted_at
            """,
            (str(form_id), account_id, server_id, json.dumps(answers)),
        )
        return dict(cur.fetchone())
