#!/bin/bash
set -euo pipefail

if [ "${1:-}" != "--b64" ] || [ -z "${2:-}" ] || [ -z "${3:-}" ]; then
  echo "Uso: $0 --b64 <url-em-base64> <sha256-em-base64>" >&2
  exit 2
fi
URL="$(printf '%s' "$2" | base64 -d)"
SHA256_ESPERADO="$(printf '%s' "$3" | base64 -d)"
if ! [[ "$SHA256_ESPERADO" =~ ^[A-Za-z0-9+/]{43}=$ ]] || ! [[ "$URL" =~ ^https:// ]]; then
  echo "Argumentos invalidos." >&2
  exit 2
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
curl -fsS -o "$TMP" "$URL"

SHA256_OBTIDO="$(openssl dgst -sha256 -binary "$TMP" | base64)"
if [ "$SHA256_OBTIDO" != "$SHA256_ESPERADO" ]; then
  echo "Checksum nao confere (esperado $SHA256_ESPERADO, obtido $SHA256_OBTIDO). Abortando." >&2
  exit 1
fi

cd /opt/smarthive/current
docker compose -p smarthive stop backend
trap 'docker compose -p smarthive start backend >/dev/null; rm -f "$TMP"' EXIT
docker compose -p smarthive exec -T db pg_restore -U smarthive -d smarthive --clean --if-exists --no-owner < "$TMP"
echo "Restauracao concluida (checksum ok)."
