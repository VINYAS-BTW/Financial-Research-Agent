# backend/run.sh
#!/usr/bin/env bash
set -euo pipefail

export $(grep -v '^#' .env | xargs || true)

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
