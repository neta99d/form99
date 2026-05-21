from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, Query

from controllers import forms_controller, submissions_controller
from database.db import get_db
from models.form_model import FormCreate, FormResponse, FormSummary, FormUpdate, SubmissionCreate, SubmissionResponse

router = APIRouter(prefix="/api")


@router.get("/form-name-check")
def check_form_name(
    server_id: str = Query(default=''),
    account_id: str = Query(...),
    name: str = Query(...),
    exclude_id: str | None = Query(default=None),
) -> dict[str, bool]:
    exclude_uuid = uuid.UUID(exclude_id) if exclude_id else None
    with get_db() as conn:
        available = forms_controller.check_name_unique(conn, server_id, account_id, name, exclude_uuid)
    return {"available": available}


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


@router.post("/forms/{form_id}/submissions", response_model=SubmissionResponse, status_code=201)
def submit_form(form_id: uuid.UUID, body: SubmissionCreate) -> SubmissionResponse:
    with get_db() as conn:
        if forms_controller.get_form(conn, form_id) is None:
            raise HTTPException(status_code=404, detail="Form not found")
        row = submissions_controller.create_submission(conn, form_id, body.account_id, body.server_id, body.answers)
    return SubmissionResponse(**row)


@router.get("/accounts/{account_id}/forms", response_model=list[FormSummary])
def get_account_forms(
    account_id: str,
    server_id: str = Query(default=''),
) -> list[FormSummary]:
    with get_db() as conn:
        rows = forms_controller.get_account_forms(conn, account_id, server_id)
    return [FormSummary(**row) for row in rows]
