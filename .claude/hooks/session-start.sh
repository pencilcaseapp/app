#!/bin/bash
#
# Prepares a Claude Code on the web session: the Docker daemon, the Postgres
# and Redis containers from docker-compose.yml, and the npm dependencies.
# Without this the cloud container has the docker binaries but no running
# daemon, so `npm run docker:up` — and with it every test and e2e run —
# fails before it starts.

set -euo pipefail

# Local machines run Docker Desktop and manage their own dependencies.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# Docker Hub rate limits anonymous pulls per IP and the cloud environment
# shares its egress address, so pulling postgres:18 and redis:8-alpine comes
# back as "429 Too Many Requests". Google's pull-through mirror serves the
# same Docker Hub images without that limit.
configure_registry_mirror() {
  mkdir -p /etc/docker
  if ! grep -q mirror.gcr.io /etc/docker/daemon.json 2>/dev/null; then
    echo '{"registry-mirrors": ["https://mirror.gcr.io"]}' > /etc/docker/daemon.json
  fi
}

daemon_has_mirror() {
  docker info 2>/dev/null | grep -q mirror.gcr.io
}

start_docker_daemon() {
  if daemon_has_mirror; then
    return
  fi

  # A daemon that started before the mirror was configured would still 429.
  if docker info > /dev/null 2>&1; then
    pkill dockerd || true
    sleep 2
  fi

  nohup dockerd > /var/log/dockerd.log 2>&1 &

  for _ in $(seq 1 30); do
    if daemon_has_mirror; then
      return
    fi
    sleep 1
  done

  echo 'dockerd did not become ready:' >&2
  tail -20 /var/log/dockerd.log >&2
  return 1
}

# The first run pulls three images through the proxy, which is the one step
# here flaky enough to be worth a second attempt.
start_containers() {
  npm run docker:up || {
    echo 'docker compose up failed, retrying once' >&2
    sleep 5
    npm run docker:up
  }
}

configure_registry_mirror
start_docker_daemon
npm install
start_containers
