from __future__ import annotations

import json
import uuid

import psycopg2.errors
import psycopg2.extensions
import psycopg2.extras
from fastapi import HTTPException

from models.form_model import FormCreate, FormUpdate


def _cursor(conn: psycopg2.extensions.connection) -> psycopg2.extras.RealDictCursor:
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


def _deserialize(row: dict) -> dict:
    row = dict(row)
    if isinstance(row.get("fields"), str):
        row["fields"] = json.loads(row["fields"])
    return row


def _unique_copy_name(
    conn: psycopg2.extensions.connection,
    server_id: str,
    account_id: str,
    base_name: str,
) -> str:
    candidate = f"{base_name} - עותק"
    with _cursor(conn) as cur:
        cur.execute(
            "SELECT name FROM forms WHERE server_id = %s AND account_id = %s AND name LIKE %s",
            (server_id, account_id, f"{base_name} - עותק%"),
        )
        existing = {row["name"] for row in cur.fetchall()}
    if candidate not in existing:
        return candidate
    i = 2
    while f"{base_name} - עותק {i}" in existing:
        i += 1
    return f"{base_name} - עותק {i}"


def check_name_unique(
    conn: psycopg2.extensions.connection,
    server_id: str,
    account_id: str,
    name: str,
    exclude_id: uuid.UUID | None = None,
) -> bool:
    with _cursor(conn) as cur:
        if exclude_id:
            cur.execute(
                "SELECT 1 FROM forms WHERE server_id = %s AND account_id = %s AND name = %s AND id != %s",
                (server_id, account_id, name, str(exclude_id)),
            )
        else:
            cur.execute(
                "SELECT 1 FROM forms WHERE server_id = %s AND account_id = %s AND name = %s",
                (server_id, account_id, name),
            )
        return cur.fetchone() is None


def create_form(conn: psycopg2.extensions.connection, data: FormCreate) -> dict:
    try:
        with _cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO forms
                    (account_id, server_id, name, title, description, submit_button_text, direction, fields)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    data.account_id,
                    data.server_id,
                    data.name,
                    data.title,
                    data.description,
                    data.submit_button_text,
                    data.direction,
                    json.dumps(data.fields),
                ),
            )
            return _deserialize(cur.fetchone())
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=409, detail="שם הטופס כבר בשימוש עבור חשבון זה")


def get_form(conn: psycopg2.extensions.connection, form_id: uuid.UUID) -> dict | None:
    with _cursor(conn) as cur:
        cur.execute("SELECT * FROM forms WHERE id = %s", (str(form_id),))
        row = cur.fetchone()
    return _deserialize(row) if row else None


def update_form(
    conn: psycopg2.extensions.connection, form_id: uuid.UUID, data: FormUpdate
) -> dict | None:
    updates: dict[str, object] = {
        k: v for k, v in data.model_dump().items() if v is not None
    }
    if not updates:
        return get_form(conn, form_id)

    if "fields" in updates:
        updates["fields"] = json.dumps(updates["fields"])

    set_clause = ", ".join(f"{col} = %s" for col in updates) + ", updated_at = NOW()"
    values = list(updates.values()) + [str(form_id)]

    try:
        with _cursor(conn) as cur:
            cur.execute(
                f"UPDATE forms SET {set_clause} WHERE id = %s RETURNING *",  # noqa: S608
                values,
            )
            row = cur.fetchone()
        return _deserialize(row) if row else None
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=409, detail="שם הטופס כבר בשימוש עבור חשבון זה")


def delete_form(conn: psycopg2.extensions.connection, form_id: uuid.UUID) -> bool:
    with _cursor(conn) as cur:
        cur.execute("DELETE FROM forms WHERE id = %s RETURNING id", (str(form_id),))
        return cur.fetchone() is not None


def get_account_forms(
    conn: psycopg2.extensions.connection,
    account_id: str,
    server_id: str = '',
) -> list[dict]:
    with _cursor(conn) as cur:
        cur.execute(
            """
            SELECT id, account_id, server_id, name, title, updated_at
            FROM forms
            WHERE account_id = %s AND server_id = %s
            ORDER BY updated_at DESC
            """,
            (str(account_id), server_id),
        )
        return [dict(row) for row in cur.fetchall()]


def duplicate_form(
    conn: psycopg2.extensions.connection, form_id: uuid.UUID
) -> dict | None:
    original = get_form(conn, form_id)
    if not original:
        return None

    copy_name = _unique_copy_name(
        conn, original["server_id"], original["account_id"], original["name"]
    )

    with _cursor(conn) as cur:
        cur.execute(
            """
            INSERT INTO forms
                (account_id, server_id, name, title, description, submit_button_text, direction, fields)
            SELECT account_id, server_id, %s, title, description, submit_button_text, direction, fields
            FROM forms
            WHERE id = %s
            RETURNING *
            """,
            (copy_name, str(form_id)),
        )
        row = cur.fetchone()
    return _deserialize(row) if row else None
