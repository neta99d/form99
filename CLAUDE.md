# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Form99 is a bilingual (Hebrew/English) drag-and-drop form builder with RTL support, conditional field visibility, live preview, and HTML export. The stack is Next.js 16 (frontend) + FastAPI (backend).

## Commands

All frontend commands run from `client/`:

```bash
npm run dev          # Start Next.js on port 3000
npm run build        # Production build
npm run lint         # ESLint
npm run dev:server   # Start FastAPI backend on port 8000 (runs from ../server)
```

Backend commands run from `server/`:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Run the migration manually before starting the server (no migration runner exists):

```bash
psql $DATABASE_URL -f migrations/001_create_forms_table.sql
```

Environment: copy `server/.env.example` to `server/.env` and set `DATABASE_URL`.

## Architecture

### Frontend (`client/`)

**State management** lives entirely in `lib/form-builder-store.tsx` as a React Context. It holds `formConfig`, `selectedFieldId`, `previewMode`, `previewDevice`, `accountId`, `mode` (`create`|`edit`), and `formId`. All mutations go through named callbacks (addField, removeField, updateField, moveField, duplicateField, etc.). The store loads the form from the API on mount in edit mode.

**Types and core logic** are in `lib/form-builder-types.ts`:
- `FieldType` union: `text | email | number | phone | textarea | select | checkbox | radio | date | heading | paragraph`
- `generateFieldId(type, existingFields)` — generates type-based IDs (`text`, `text1`, `text2`, …)
- `sanitizeFieldVisibilityRules(fields)` — strips visibility conditions that reference invalid/later fields
- `generateFormHTML(config)` — exports to a standalone HTML file with inline styles and a JS-driven conditional visibility engine

**API client** is in `lib/forms-api.ts`. It maps camelCase `FormConfig` to snake_case payloads for the backend. The base URL is `process.env.NEXT_PUBLIC_FORM99_API_URL` (default: `http://localhost:8000`).

**Form builder UI** (`components/form-builder/`) is composed of four panels wired to the store:
- `field-library.tsx` — palette of draggable field types
- `form-canvas.tsx` — live editing canvas
- `field-settings.tsx` — settings for the selected field, including options editor and visibility rules
- `builder-header.tsx` — title, save/export buttons, preview toggle

### Backend (`server/`)

There are two separate data layers:

| Layer | File | Storage | Purpose |
|-------|------|---------|---------|
| State persistence | `main.py` | SQLite (`data/form99.sqlite3`) | Saves/restores the entire builder state as a JSON blob via `GET /state`, `PUT /state`, `DELETE /state` |
| Form CRUD | `routes/forms.py` + `controllers/forms_controller.py` | PostgreSQL | Full form lifecycle via `GET|POST|PUT|DELETE /api/forms/{id}` and `GET /api/accounts/{account_id}/forms` |

The PostgreSQL connection pool is in `database/db.py`. Use the `get_db()` context manager to get a connection. The `fields` column is JSONB; field IDs are stored as-is from the frontend.

**`account_id`** is stored as `TEXT` (not UUID) to accommodate external auth providers whose user IDs may be arbitrary strings.

### Key Patterns

- **Visibility rules** reference other fields by `sourceFieldId`. When fields are reordered or deleted, `sanitizeFieldVisibilityRules` strips any rules that are now invalid. Always call it after mutations that change field order or remove fields.
- **Field IDs** are type-based strings (`text`, `text1`, …) generated client-side and persisted as-is in PostgreSQL's JSONB `fields` column. They are also used as HTML `name` attributes in the exported form HTML.
- **RTL** — default direction is `rtl`; direction is stored per-form in `FormConfig.direction` and applied as a CSS `dir` attribute in both the builder canvas and exported HTML.
