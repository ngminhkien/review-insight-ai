#!/usr/bin/env bash

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
AI_MODE="${AI_MODE:-real}"
PIDS=()
PYTHON_COMMAND=""
AI_PID=""
AI_REQUIREMENTS_STAMP="$ROOT_DIR/ai-service/.venv/.requirements-installed"

cleanup() {
  trap - INT TERM EXIT
  printf '\nStopping development servers...\n'

  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done

  wait 2>/dev/null || true
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

wait_for_service() {
  local name="$1"
  local url="$2"
  local pid="$3"
  local attempts="${4:-60}"

  printf 'Waiting for %s' "$name"
  for ((attempt = 1; attempt <= attempts; attempt++)); do
    if ! kill -0 "$pid" 2>/dev/null; then
      printf '\n%s stopped before becoming ready.\n' "$name" >&2
      wait "$pid" || true
      exit 1
    fi

    if curl --silent --fail --max-time 1 "$url" >/dev/null 2>&1; then
      printf ' ready.\n'
      return
    fi

    printf '.'
    sleep 1
  done

  printf '\nTimed out waiting for %s at %s\n' "$name" "$url" >&2
  exit 1
}

trap cleanup INT TERM EXIT

require_command php
require_command npm
require_command curl

case "$AI_MODE" in
  mock|real|none)
    ;;
  *)
    printf 'Invalid AI_MODE: %s. Use mock, real, or none.\n' "$AI_MODE" >&2
    exit 1
    ;;
esac

if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  printf 'Installing frontend dependencies...\n'
  (
    cd "$ROOT_DIR/frontend"
    npm install
  ) || exit 1
fi

if [ "$AI_MODE" = "mock" ]; then
  printf 'Starting mock AI service: http://127.0.0.1:8001\n'
  (
    cd "$ROOT_DIR/backend"
    exec php -S 127.0.0.1:8001 tests/mock-ai-service.php
  ) &
  AI_PID="$!"
  PIDS+=("$AI_PID")
  wait_for_service "mock AI service" "http://127.0.0.1:8001/health" "$AI_PID" 30
elif [ "$AI_MODE" = "real" ]; then
  if command -v python3 >/dev/null 2>&1; then
    PYTHON_COMMAND="python3"
  elif command -v python >/dev/null 2>&1; then
    PYTHON_COMMAND="python"
  else
    printf 'Missing required command: python3\n' >&2
    exit 1
  fi

  if [ ! -x "$ROOT_DIR/ai-service/.venv/bin/python" ]; then
    printf 'Creating Python virtual environment...\n'
    "$PYTHON_COMMAND" -m venv "$ROOT_DIR/ai-service/.venv" || exit 1
  fi

  if [ ! -f "$AI_REQUIREMENTS_STAMP" ] \
    || [ "$ROOT_DIR/ai-service/requirements.txt" -nt "$AI_REQUIREMENTS_STAMP" ] \
    || ! "$ROOT_DIR/ai-service/.venv/bin/python" -c \
    'import fastapi, uvicorn, pandas, numpy, sklearn, imblearn, joblib, dotenv, pydantic; from google import genai' \
    >/dev/null 2>&1; then
    printf 'Installing AI service dependencies...\n'
    "$ROOT_DIR/ai-service/.venv/bin/python" -m pip install -r "$ROOT_DIR/ai-service/requirements.txt" || exit 1
    touch "$AI_REQUIREMENTS_STAMP"
  fi

  printf 'Starting Python AI service: http://127.0.0.1:8001\n'
  (
    cd "$ROOT_DIR/ai-service"
    export MPLCONFIGDIR="$ROOT_DIR/ai-service/.cache/matplotlib"
    export XDG_CACHE_HOME="$ROOT_DIR/ai-service/.cache"
    mkdir -p "$MPLCONFIGDIR"
    exec .venv/bin/python -m uvicorn src.api:app --host 127.0.0.1 --port 8001
  ) &
  AI_PID="$!"
  PIDS+=("$AI_PID")
  wait_for_service "Python AI service" "http://127.0.0.1:8001/health" "$AI_PID" 120
fi

printf 'Starting PHP backend: http://%s:%s\n' "$BACKEND_HOST" "$BACKEND_PORT"
(
  cd "$ROOT_DIR/backend"
  exec php -S "$BACKEND_HOST:$BACKEND_PORT" -t public
) &
PIDS+=("$!")

printf 'Starting React frontend: http://%s:%s\n' "$FRONTEND_HOST" "$FRONTEND_PORT"
(
  cd "$ROOT_DIR/frontend"
  exec npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT"
) &
PIDS+=("$!")

printf '\nDevelopment servers are running. Press Ctrl+C to stop all of them.\n\n'

while true; do
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid"
      exit $?
    fi
  done
  sleep 1
done
