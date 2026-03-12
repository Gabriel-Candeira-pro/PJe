#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT/main/operator-ui/src"
MOCK_JS="$ROOT/mock-server.js"
LOG_DIR="$ROOT/logs"
PID_DIR="$ROOT/pids"
FRONTEND_PORT=8080
API_PORT=3000

mkdir -p "$LOG_DIR" "$PID_DIR"

echo "[start-all] root: $ROOT"

port_open() {
  (echo > /dev/tcp/127.0.0.1/$1) >/dev/null 2>&1 && return 0 || return 1
}

find_pids_on_port() {
  local port=$1
  # prefer lsof
  if command -v lsof >/dev/null 2>&1; then
    lsof -t -iTCP:${port} -sTCP:LISTEN 2>/dev/null || true
    return
  fi
  # fallback to ss parsing
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null | awk -v P=":"${port} '$4 ~ P { for(i=1;i<=NF;i++) if($i ~ /pid=/) { sub("pid=", "", $i); sub(",", "", $i); print $i } }' || true
    return
  fi
  # fallback to netstat
  if command -v netstat >/dev/null 2>&1; then
    netstat -ltnp 2>/dev/null | awk -v P=":"${port} '$4 ~ P { for(i=1;i<=NF;i++) if($i ~ /\/)/) { gsub("/","",$i); print $i } }' || true
    return
  fi
}

kill_on_port() {
  local port=$1
  local pids
  pids=$(find_pids_on_port "$port" | tr '\n' ' ')
  if [ -z "${pids// /}" ]; then
    return 0
  fi
  echo "[start-all] port $port in use by PID(s): $pids — attempting graceful stop"
  for pid in $pids; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
  sleep 2
  # check still alive
  local still=""
  for pid in $pids; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      still="$still $pid"
    fi
  done
  if [ -n "$still" ]; then
    echo "[start-all] forcing kill for PID(s): $still"
    for pid in $still; do
      kill -9 "$pid" >/dev/null 2>&1 || true
    done
  fi
  sleep 1
}

start_docker_compose() {
  if [ -f "$ROOT/infra/docker-compose.yml" ] && command -v docker >/dev/null 2>&1; then
    echo "[start-all] docker-compose file found, starting services..."
    if command -v docker-compose >/dev/null 2>&1; then
      docker-compose -f "$ROOT/infra/docker-compose.yml" up -d
    else
      docker compose -f "$ROOT/infra/docker-compose.yml" up -d
    fi
    sleep 3
    return 0
  fi
  return 1
}

start_mock() {
  if port_open $API_PORT; then
    echo "[start-all] API already listening on port $API_PORT"
    return 0
  fi
  if ! command -v node >/dev/null 2>&1; then
    echo "[start-all] node not found; cannot start mock API. Please install node or start backend."
    return 1
  fi
  if [ ! -f "$MOCK_JS" ]; then
    cat > "$MOCK_JS" <<'NODE'
const express = require('express');
const app = express();
app.use(express.json());
let items = [];
app.get('/api/interventions', (req, res) => res.json(items));
app.post('/api/interventions', (req, res) => {
  const id = items.length + 1;
  const it = { id, ...req.body };
  items.push(it);
  res.status(201).json(it);
});
const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log('mock api running on', port));
NODE
    chmod +x "$MOCK_JS" || true
  fi
  echo "[start-all] starting mock API (port $API_PORT)"
  nohup node "$MOCK_JS" > "$LOG_DIR/mock.log" 2>&1 &
  echo $! > "$PID_DIR/mock.pid"
  sleep 1
}

start_frontend() {
  if port_open $FRONTEND_PORT; then
    echo "[start-all] Frontend already listening on port $FRONTEND_PORT"
    return 0
  fi
  if [ ! -d "$FRONTEND_DIR" ]; then
    echo "[start-all] Frontend dir not found: $FRONTEND_DIR"
    return 1
  fi
  echo "[start-all] starting frontend from $FRONTEND_DIR on port $FRONTEND_PORT"
  pushd "$FRONTEND_DIR" >/dev/null
    if command -v npx >/dev/null 2>&1; then
    nohup npx serve -l tcp://0.0.0.0:$FRONTEND_PORT > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"
  elif command -v python3 >/dev/null 2>&1; then
    nohup python3 -m http.server $FRONTEND_PORT --bind 0.0.0.0 > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"
  else
    echo "[start-all] neither npx nor python3 found; cannot start frontend server"
    popd >/dev/null
    return 1
  fi
  popd >/dev/null
  sleep 1
}

echo "[start-all] checking and freeing ports if necessary..."
# ports to ensure free before starting
for p in $API_PORT $FRONTEND_PORT; do
  if port_open $p; then
    kill_on_port $p
  fi
done

echo "[start-all] trying docker-compose..."
if start_docker_compose; then
  echo "[start-all] docker-compose started (if configured)."
fi

if port_open $API_PORT; then
  echo "[start-all] API reachable at http://localhost:$API_PORT"
else
  echo "[start-all] API not reachable; starting mock API"
  start_mock || echo "[start-all] failed to start mock API"
fi

start_frontend || echo "[start-all] failed to start frontend"

echo "[start-all] Frontend: http://localhost:$FRONTEND_PORT"
echo "[start-all] API: http://localhost:$API_PORT"

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1 || true
fi

echo "[start-all] logs: $LOG_DIR   pids: $PID_DIR"
echo "[start-all] done"

echo "[start-all] attach logs (ctrl+C to detach)"
# keep the script running following logs; -F follows name and retries if file is recreated
exec tail -F "$LOG_DIR/mock.log" "$LOG_DIR/frontend.log"
