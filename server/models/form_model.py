from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


class FormCreate(BaseModel):
    account_id: str
    server_id: str = ''
    name: str
    title: str
    description: str | None = None
    submit_button_text: str
    direction: Literal["ltr", "rtl"]
    fields: list[Any]
    theme: dict[str, Any] | None = None


class FormUpdate(BaseModel):
    name: str | None = None
    title: str | None = None
    description: str | None = None
    submit_button_text: str | None = None
    direction: Literal["ltr", "rtl"] | None = None
    fields: list[Any] | None = None
    theme: dict[str, Any] | None = None


class FormResponse(BaseModel):
    id: uuid.UUID
    account_id: str
    server_id: str
    name: str
    title: str
    description: str | None
    submit_button_text: str
    direction: str
    fields: list[Any]
    theme: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime


class FormSummary(BaseModel):
    id: uuid.UUID
    account_id: str
    server_id: str
    name: str
    title: str
    updated_at: datetime


class SubmissionCreate(BaseModel):
    account_id: str
    server_id: str
    answers: dict


class SubmissionResponse(BaseModel):
    id: uuid.UUID
    form_id: uuid.UUID
    account_id: str
    server_id: str
    submitted_at: datetime
