#!/bin/bash
# Restaura o Postgres a partir de uma URL pre-assinada de um backup. SUBSTITUI os dados atuais.
# Nao e chamado manualmente: use infra/restore-db.sh no computador do operador, que
# escolhe o backup, gera a URL (a instancia nao tem permissao de leitura) e chama este script.
set -euo pipefail

URL="${1:-}"
SHA256_ESPERADO="${2:-}"
if [ -z "$URL" ] || [ -z "$SHA256_ESPERADO" ]; then
  echo "Uso: $0 <url-pre-assinada> <sha256-base64>" >&2
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
