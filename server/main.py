from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = Path(os.getenv("FORM99_DB_PATH", DATA_DIR / "form99.sqlite3"))
STATE_KEY = "default"


class FormBuilderState(BaseModel):
    formConfig: dict[str, Any]
    userInfo: dict[str, Any] | None = None
    isOnboarded: bool = False


class SaveStateResponse(BaseModel):
    ok: bool = True
    state: FormBuilderState


class HealthResponse(BaseModel):
    ok: bool = True
    database: str = Field(default="connected")


app = FastAPI(title="Form99 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS builder_state (
              state_key TEXT PRIMARY KEY,
              payload TEXT NOT NULL,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def load_state() -> FormBuilderState | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT payload FROM builder_state WHERE state_key = ?",
            (STATE_KEY,),
        ).fetchone()

    if row is None:
        return None

    try:
        return FormBuilderState.model_validate(json.loads(row["payload"]))
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=500, detail="Saved state is invalid") from exc


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    init_db()
    return HealthResponse()


@app.get("/state", response_model=FormBuilderState | None)
def get_state() -> FormBuilderState | None:
    return load_state()


@app.put("/state", response_model=SaveStateResponse)
def save_state(state: FormBuilderState) -> SaveStateResponse:
    payload = state.model_dump_json()

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO builder_state (state_key, payload, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(state_key) DO UPDATE SET
              payload = excluded.payload,
              updated_at = CURRENT_TIMESTAMP
            """,
            (STATE_KEY, payload),
        )

    return SaveStateResponse(state=state)


@app.delete("/state")
def delete_state() -> dict[str, bool]:
    with get_connection() as connection:
        connection.execute(
            "DELETE FROM builder_state WHERE state_key = ?",
            (STATE_KEY,),
        )

    return {"ok": True}
