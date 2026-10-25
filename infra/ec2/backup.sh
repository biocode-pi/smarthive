#!/bin/bash
# Backup do Postgres para o S3. Executado diariamente pelo timer smarthive-backup
# (instalado pelo install.sh) e manualmente com: sudo /opt/smarthive/current/backup.sh
set -euo pipefail

set -a
. /opt/smarthive/app.env   # BACKUP_BUCKET, AWS_REGION
set +a

KEY="postgres/smarthive-$(date -u +%Y%m%dT%H%M%SZ).dump"

cd /opt/smarthive/current
# Formato custom (-Fc): comprimido e restauravel com pg_restore. Vai direto para o S3, sem tocar o disco.
docker compose -p smarthive exec -T db pg_dump -U smarthive -d smarthive -Fc \
  | aws s3 cp - "s3://$BACKUP_BUCKET/$KEY" --only-show-errors --sse AES256

SIZE="$(aws s3api head-object --bucket "$BACKUP_BUCKET" --key "$KEY" --query ContentLength --output text)"
echo "Backup enviado: s3://$BACKUP_BUCKET/$KEY ($SIZE bytes)"
