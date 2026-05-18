# Form99 — Developer Init Guide

Form99 is a drag-and-drop form builder web application with Hebrew/RTL support, conditional field visibility, multiple field types, and a live preview mode. The frontend is fully functional; the backend is currently in progress.

---

## Project Structure

```
Form99/
├── client/                  # Next.js 16 frontend (App Router)
│   ├── app/                 # Root layout and pages
│   ├── components/
│   │   ├── form-builder/    # Core builder components (canvas, palette, settings)
│   │   └── ui/              # shadcn/ui component library
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # State management, types, utilities
│   └── public/              # Static assets
└── server/                  # FastAPI backend (in progress)
    ├── app/
    │   ├── routers/         # API route definitions
    │   ├── models/          # SQLAlchemy ORM models
    │   ├── schemas/         # Pydantic request/response schemas
    │   └── core/            # Config, auth, dependencies
    ├── alembic/             # Alembic migration files
    ├── alembic.ini
    ├── main.py              # FastAPI app entry point
    ├── requirements.txt
    └── .env.example
```

---

## Prerequisites

- **Node.js** >= 18 and **npm** >= 9 (client)
- **Python** >= 3.11 and **pip** (server)
- **PostgreSQL** >= 15

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/neta99d/form99.git
cd form99
```

### 2. Install client dependencies

```bash
cd client
npm install
```

### 3. Set up the server (Python virtual environment)

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
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Server — `server/.env`

```env
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/form99
JWT_SECRET=your_jwt_secret_here
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=10080
```

> Copy `server/.env.example` to `server/.env` and fill in the values before starting the server.

---

## Database Setup

### 1. Create the database

```sql
CREATE DATABASE form99;
```

### 2. Run migrations

```bash
cd server
alembic upgrade head
```

### 3. (Optional) Generate a new migration after model changes

```bash
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

---

## Running Locally

### Start the client (frontend only — server not required)

```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Start the full stack

1. Make sure PostgreSQL is running.
2. Start the server:
   ```bash
   cd server
   uvicorn main:app --reload --port 8000
   ```
3. In a separate terminal, start the client:
   ```bash
   cd client
   npm run dev
   ```

---

## API

The server runs on **port 8000**. Interactive API docs are available at [http://localhost:8000/docs](http://localhost:8000/docs).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/forms` | List all forms |
| POST | `/api/forms` | Create a new form |
| GET | `/api/forms/:id` | Get a form by ID |
| PUT | `/api/forms/:id` | Update a form |
| DELETE | `/api/forms/:id` | Delete a form |

All protected routes require an `Authorization: Bearer <token>` header.

---

## Scripts & Commands

### Client (`client/`) — npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

### Server (`server/`) — Python commands

| Command | Description |
|---------|-------------|
| `uvicorn main:app --reload --port 8000` | Start dev server with auto-reload |
| `alembic upgrade head` | Apply all pending migrations |
| `alembic revision --autogenerate -m "desc"` | Generate a new migration from model changes |
| `alembic downgrade -1` | Roll back the last migration |
