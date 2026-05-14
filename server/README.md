# Form99 Server

Python FastAPI backend for saving the form builder state in SQLite.

## Setup

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The client uses `http://localhost:8000` by default.
