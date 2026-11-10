#!/bin/bash
# Backup do Postgres para o S3. Executado diariamente pelo timer smarthive-backup
# (instalado pelo install.sh) e manualmente com: sudo /opt/smarthive/current/backup.sh
# A instancia so tem permissao de escrita no bucket (nao le, nao lista, nao apaga).
set -euo pipefail

set -a
. /opt/smarthive/app.env   # BACKUP_BUCKET, AWS_REGION
set +a

KEY="postgres/smarthive-$(date -u +%Y%m%dT%H%M%SZ).dump"
umask 077
TMP="$(mktemp /var/tmp/smarthive-backup.XXXXXX)"
trap 'rm -f "$TMP"' EXIT

cd /opt/smarthive/current
# Formato custom (-Fc): comprimido e restauravel com pg_restore.
docker compose -p smarthive exec -T db pg_dump -U smarthive -d smarthive -Fc > "$TMP"

# SHA-256 do arquivo inteiro vai nos metadados; o restore confere antes de aplicar.
SHA256="$(openssl dgst -sha256 -binary "$TMP" | base64)"
aws s3 cp "$TMP" "s3://$BACKUP_BUCKET/$KEY" --only-show-errors --sse AES256 \
  --metadata "sha256=$SHA256"

echo "Backup enviado: s3://$BACKUP_BUCKET/$KEY ($(stat -c %s "$TMP") bytes, sha256 $SHA256)"
