#!/bin/bash
set -euo pipefail

set -a
. /opt/smarthive/app.env
set +a

KEY="postgres/smarthive-$(date -u +%Y%m%dT%H%M%SZ).dump"
umask 077
TMP="$(mktemp /var/tmp/smarthive-backup.XXXXXX)"
trap 'rm -f "$TMP"' EXIT

cd /opt/smarthive/current
docker compose -p smarthive exec -T db pg_dump -U smarthive -d smarthive -Fc > "$TMP"

SHA256="$(openssl dgst -sha256 -binary "$TMP" | base64)"
aws s3 cp "$TMP" "s3://$BACKUP_BUCKET/$KEY" --only-show-errors --sse AES256 \
  --metadata "sha256=$SHA256"

echo "Backup enviado: s3://$BACKUP_BUCKET/$KEY ($(stat -c %s "$TMP") bytes, sha256 $SHA256)"
