from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


class FormCreate(BaseModel):
    account_id: uuid.UUID
    title: str
    description: str | None = None
    submit_button_text: str
    direction: Literal["ltr", "rtl"]
    fields: list[Any]


class FormUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    submit_button_text: str | None = None
    direction: Literal["ltr", "rtl"] | None = None
    fields: list[Any] | None = None


class FormResponse(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    title: str
    description: str | None
    submit_button_text: str
    direction: str
    fields: list[Any]
    created_at: datetime
    updated_at: datetime


class FormSummary(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    title: str
    updated_at: datetime
