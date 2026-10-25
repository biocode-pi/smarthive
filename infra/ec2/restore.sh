#!/bin/bash
# Restaura o Postgres a partir de uma URL pre-assinada de um backup. SUBSTITUI os dados atuais.
# Nao e chamado manualmente: use infra/restore-db.sh no computador do operador, que
# escolhe o backup, gera a URL (a instancia nao tem permissao de leitura) e chama este script.
set -euo pipefail

if [ "${1:-}" != "--b64" ] || [ -z "${2:-}" ] || [ -z "${3:-}" ]; then
  echo "Uso: $0 --b64 <url-em-base64> <sha256-em-base64>" >&2
  exit 2
fi
# Os argumentos chegam em base64 (so [A-Za-z0-9+/=]) para nao serem interpretados pelo shell.
URL="$(printf '%s' "$2" | base64 -d)"
SHA256_ESPERADO="$(printf '%s' "$3" | base64 -d)"
if ! [[ "$SHA256_ESPERADO" =~ ^[A-Za-z0-9+/]{43}=$ ]] || ! [[ "$URL" =~ ^https:// ]]; then
  echo "Argumentos invalidos." >&2
  exit 2
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
curl -fsS -o "$TMP" "$URL"

# Confere a integridade com o checksum registrado pelo S3 no momento do backup.
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
