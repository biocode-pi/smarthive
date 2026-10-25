#!/bin/bash
# Executado na instancia pelo SSM (infra/deploy-backend.sh). Recebe o prefixo S3 da release.
set -euo pipefail
RELEASE_URI="$1"   # s3://bucket/releases/<id>
RELEASE_ID="$(basename "$RELEASE_URI")"
DIR="/opt/smarthive/releases/$RELEASE_ID"

# IMDSv2: regiao e IP publico (Elastic IP) da instancia.
IMDS_TOKEN="$(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')"
imds() { curl -fsS -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" "http://169.254.169.254/latest/meta-data/$1"; }
export AWS_DEFAULT_REGION="$(imds placement/region)"
PUBLIC_IP="$(imds public-ipv4)"
ORIGIN_DOMAIN="${PUBLIC_IP//./-}.sslip.io"

mkdir -p "$DIR" /opt/smarthive/caddy/data /opt/smarthive/caddy/config
aws s3 cp "$RELEASE_URI/app.tgz" /tmp/smarthive-app.tgz --only-show-errors
aws s3 cp "$RELEASE_URI/app.env" /opt/smarthive/app.env --only-show-errors
chmod 600 /opt/smarthive/app.env
tar -xzf /tmp/smarthive-app.tgz -C "$DIR"
rm -f /tmp/smarthive-app.tgz
ln -sfn "$DIR" /opt/smarthive/current

# Segredo de origem: lido do SSM pela IAM Role, gravado so para o Caddy (permissao 600).
ORIGIN_SECRET="$(aws ssm get-parameter --name /smarthive/origin-secret --with-decryption --query Parameter.Value --output text)"
umask 077
printf 'ORIGIN_DOMAIN=%s\nORIGIN_SECRET=%s\n' "$ORIGIN_DOMAIN" "$ORIGIN_SECRET" > /opt/smarthive/origin.env
umask 022

cd /opt/smarthive/current
docker compose -p smarthive --env-file /opt/smarthive/db.env up -d --build --remove-orphans
docker image prune -f >/dev/null

# Mantem apenas as 3 releases mais recentes.
ls -1dt /opt/smarthive/releases/* | tail -n +4 | xargs -r rm -rf

api_ok=false
for _ in $(seq 1 30); do
  if docker compose -p smarthive exec -T backend python -c \
      "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)" 2>/dev/null; then
    api_ok=true
    break
  fi
  sleep 2
done
if [ "$api_ok" != true ]; then
  echo "API nao respondeu ao healthcheck" >&2
  docker compose -p smarthive logs --tail 50 backend >&2
  exit 1
fi
echo "API saudavel (release $RELEASE_ID)"

# Certificado: o Caddy emite na primeira subida (pode levar ~1 min).
for _ in $(seq 1 45); do
  if curl -fsS "https://$ORIGIN_DOMAIN/api/health" -H "X-Origin-Verify: $ORIGIN_SECRET" >/dev/null 2>&1; then
    echo "HTTPS ok em $ORIGIN_DOMAIN"
    status_sem_segredo="$(curl -s -o /dev/null -w '%{http_code}' "https://$ORIGIN_DOMAIN/api/health" || true)"
    echo "Sem o cabecalho secreto: HTTP $status_sem_segredo (esperado 403)"
    exit 0
  fi
  sleep 4
done
echo "HTTPS ainda nao respondeu; verifique os logs do Caddy" >&2
docker compose -p smarthive logs --tail 30 caddy >&2
exit 1
