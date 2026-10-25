#!/bin/bash
# Restaura o Postgres a partir de um backup no S3. SUBSTITUI os dados atuais.
# Uso na instancia:
#   sudo /opt/smarthive/current/restore.sh latest --confirmar
#   sudo /opt/smarthive/current/restore.sh postgres/smarthive-20261025T030000Z.dump --confirmar
set -euo pipefail

ALVO="${1:-}"
if [ -z "$ALVO" ] || [ "${2:-}" != "--confirmar" ]; then
  echo "Uso: $0 <latest|postgres/arquivo.dump> --confirmar" >&2
  exit 2
fi

set -a
. /opt/smarthive/app.env
set +a

if [ "$ALVO" = "latest" ]; then
  ALVO="$(aws s3api list-objects-v2 --bucket "$BACKUP_BUCKET" --prefix postgres/ \
    --query 'sort_by(Contents, &LastModified)[-1].Key' --output text)"
  if [ -z "$ALVO" ] || [ "$ALVO" = "None" ]; then
    echo "Nenhum backup encontrado em s3://$BACKUP_BUCKET/postgres/" >&2
    exit 1
  fi
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
aws s3 cp "s3://$BACKUP_BUCKET/$ALVO" "$TMP" --only-show-errors

cd /opt/smarthive/current
echo "Restaurando $ALVO ..."
docker compose -p smarthive stop backend
docker compose -p smarthive exec -T db pg_restore -U smarthive -d smarthive --clean --if-exists --no-owner < "$TMP"
docker compose -p smarthive start backend
echo "Restauracao concluida."
