#!/bin/bash
# Скрипт для автоматической очистки buildx контейнеров перед сборкой

set -e

echo "Очистка buildx контейнеров..."

# Проверяем наличие podman
if command -v podman &> /dev/null; then
    podman ps -a --filter "name=buildx" --format "{{.ID}}" | xargs -r podman rm -f 2>/dev/null || true
    echo "Buildx контейнеры очищены через podman"
elif command -v docker &> /dev/null; then
    docker ps -a --filter "name=buildx" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true
    echo "Buildx контейнеры очищены через docker"
else
    echo "Не найдены podman или docker"
    exit 1
fi

echo "Готово к сборке!"

