# Form99 — Developer Init Guide

Form99 is a drag-and-drop form builder with Hebrew/RTL support, conditional field visibility, multiple field types, live preview, and HTML export.

---

## Project Structure

```
Form99/
├── client/                  # Next.js 16 frontend (App Router)
│   ├── app/                 # Root layout and pages
│   ├── components/
│   │   ├── form-builder/    # Core builder UI (canvas, palette, settings, header)
│   │   └── ui/              # shadcn/ui component library
│   ├── lib/                 # State management, types, API client
│   └── public/              # Static assets
└── server/                  # FastAPI backend
    ├── controllers/         # Business logic
    ├── database/            # PostgreSQL connection pool
    ├── migrations/          # Raw SQL migration files
    ├── models/              # Pydantic request/response models
    ├── routes/              # API route definitions
    ├── data/                # SQLite file (state persistence)
    ├── main.py              # FastAPI app entry point
    └── requirements.txt
```

---

## Prerequisites

- **Node.js** >= 18, **npm** >= 9
- **Python** >= 3.11
- **PostgreSQL** >= 15

---

## Installation

### Client

```bash
cd client
npm install
```

### Server

```bash
cd server
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

---

## Environment Variables

### Client — `client/.env.local`

```env
NEXT_PUBLIC_FORM99_API_URL=http://localhost:8000
```

### Server — `server/.env`

```env
DATABASE_URL=postgresql://postgres:secret@localhost:5432/form99
```

Copy `server/.env.example` to `server/.env` and fill in the values.

---

## Database Setup

There is no migration runner — run the SQL file manually:

```bash
psql $DATABASE_URL -f server/migrations/001_create_forms_table.sql
```

---

## Running Locally

### Frontend only (no server required)

```bash
cd client
npm run dev        # http://localhost:3000
```

### Full stack

Start the backend:

```bash
cd server
uvicorn main:app --reload --port 8000
```

In a separate terminal, start the frontend:

```bash
cd client
npm run dev
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/state` | Load full builder state (SQLite) |
| PUT | `/state` | Save full builder state (SQLite) |
| DELETE | `/state` | Clear builder state (SQLite) |
| POST | `/api/forms` | Create a form |
| GET | `/api/forms/{id}` | Get a form |
| PUT | `/api/forms/{id}` | Update a form |
| DELETE | `/api/forms/{id}` | Delete a form |
| POST | `/api/forms/{id}/duplicate` | Duplicate a form |
| GET | `/api/accounts/{account_id}/forms` | List forms for an account |

---

## Scripts

### Client (`client/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run dev:server` | Start the FastAPI backend (shortcut) |

### Server (`server/`)

| Command | Description |
|---------|-------------|
| `uvicorn main:app --reload --port 8000` | Start dev server with auto-reload |
