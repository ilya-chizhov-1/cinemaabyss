#!/bin/bash
# Wrapper для docker-compose build с автоматической очисткой buildx контейнеров

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

"$SCRIPT_DIR/cleanup-buildx.sh"

docker-compose build "$@"

