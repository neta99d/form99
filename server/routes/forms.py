from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException

from controllers import forms_controller
from database.db import get_db
from models.form_model import FormCreate, FormResponse, FormSummary, FormUpdate

router = APIRouter(prefix="/api")


@router.post("/forms", response_model=FormResponse, status_code=201)
def create_form(body: FormCreate) -> FormResponse:
    with get_db() as conn:
        row = forms_controller.create_form(conn, body)
    return FormResponse(**row)


@router.get("/forms/{form_id}", response_model=FormResponse)
def get_form(form_id: uuid.UUID) -> FormResponse:
    with get_db() as conn:
        row = forms_controller.get_form(conn, form_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return FormResponse(**row)


@router.put("/forms/{form_id}", response_model=FormResponse)
def update_form(form_id: uuid.UUID, body: FormUpdate) -> FormResponse:
    with get_db() as conn:
        row = forms_controller.update_form(conn, form_id, body)
    if row is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return FormResponse(**row)


@router.delete("/forms/{form_id}")
def delete_form(form_id: uuid.UUID) -> dict[str, bool]:
    with get_db() as conn:
        deleted = forms_controller.delete_form(conn, form_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Form not found")
    return {"ok": True}


@router.post("/forms/{form_id}/duplicate", response_model=FormResponse, status_code=201)
def duplicate_form(form_id: uuid.UUID) -> FormResponse:
    with get_db() as conn:
        row = forms_controller.duplicate_form(conn, form_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return FormResponse(**row)


@router.get("/accounts/{account_id}/forms", response_model=list[FormSummary])
def get_account_forms(account_id: str) -> list[FormSummary]:
    with get_db() as conn:
        rows = forms_controller.get_account_forms(conn, account_id)
    return [FormSummary(**row) for row in rows]
