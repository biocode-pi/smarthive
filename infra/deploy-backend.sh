#!/bin/bash
# Empacota backend + schema, envia ao S3 e manda a instancia EC2 instalar via SSM.
# Uso (Git Bash, na raiz do repo): bash infra/deploy-backend.sh
set -euo pipefail
cd "$(dirname "$0")/.."

AWS="${AWS:-aws}"
command -v "$AWS" >/dev/null 2>&1 || AWS="/c/Program Files/Amazon/AWSCLIV2/aws.exe"
STACK="${STACK:-smarthive}"

output() {
  "$AWS" cloudformation describe-stacks --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text | tr -d '\r'
}

DEPLOY_BUCKET="$(output DeployBucketName)"
INSTANCE_ID="$(output InstanceId)"
SITE_URL="$(output SiteUrl)"
REGION="$(output Region)"
RELEASE_ID="$(date +%Y%m%d-%H%M%S)"
RELEASE_URI="s3://$DEPLOY_BUCKET/releases/$RELEASE_ID"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/pkg/database"
cp infra/ec2/docker-compose.prod.yml "$TMP/pkg/docker-compose.yml"
cp infra/ec2/Caddyfile "$TMP/pkg/Caddyfile"
cp infra/ec2/backup.sh infra/ec2/restore.sh "$TMP/pkg/"
cp database/schema.sql "$TMP/pkg/database/"
tar -C . -cf - \
  --exclude='__pycache__' --exclude='.pytest_cache' --exclude='.venv' --exclude='.env' \
  --exclude='tests' --exclude='app/data/*.json' --exclude='app/uploads/*' \
  backend | tar -C "$TMP/pkg" -xf -
tar -C "$TMP/pkg" -czf "$TMP/app.tgz" .

# Configuracao nao secreta da API. A senha do banco fica so na instancia (db.env).
cat > "$TMP/app.env" <<ENV
ENVIRONMENT=production
API_PREFIX=/api
FRONTEND_URL=$SITE_URL
CORS_ORIGINS=$SITE_URL
AUTH_MODE=cognito
AWS_REGION=$REGION
COGNITO_USER_POOL_ID=$(output UserPoolId)
COGNITO_APP_CLIENT_ID=$(output UserPoolClientId)
STORAGE_BACKEND=s3
S3_BUCKET=$(output UploadsBucketName)
BACKUP_BUCKET=$(output BackupBucketName)
MAX_UPLOAD_MB=50
ENV

"$AWS" s3 cp "$TMP/app.tgz" "$RELEASE_URI/app.tgz" --only-show-errors
"$AWS" s3 cp "$TMP/app.env" "$RELEASE_URI/app.env" --only-show-errors
"$AWS" s3 cp infra/ec2/install.sh "$RELEASE_URI/install.sh" --only-show-errors

cat > "$TMP/params.json" <<JSON
{"commands": ["set -e", "aws s3 cp $RELEASE_URI/install.sh /tmp/smarthive-install.sh --only-show-errors", "bash /tmp/smarthive-install.sh $RELEASE_URI"], "executionTimeout": ["1200"]}
JSON

PARAMS_FILE="$TMP/params.json"
command -v cygpath >/dev/null 2>&1 && PARAMS_FILE="$(cygpath -w "$PARAMS_FILE")"

COMMAND_ID="$("$AWS" ssm send-command --instance-ids "$INSTANCE_ID" \
  --document-name AWS-RunShellScript --comment "smarthive $RELEASE_ID" \
  --parameters "file://$PARAMS_FILE" --query Command.CommandId --output text | tr -d '\r')"

echo "Release $RELEASE_ID enviada (comando SSM $COMMAND_ID). Aguardando instalacao..."
# O waiter do SSM desiste em ~100s; o build na t4g.micro pode levar alguns minutos.
STATUS=Pending
for _ in $(seq 1 120); do
  STATUS="$("$AWS" ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" \
    --query Status --output text 2>/dev/null | tr -d '\r' || echo Pending)"
  case "$STATUS" in Pending|InProgress|Delayed) sleep 10 ;; *) break ;; esac
done

"$AWS" ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" \
  --query StandardOutputContent --output text | grep -E "saudavel|HTTPS|cabecalho" || true
if [ "$STATUS" != "Success" ]; then
  echo "Deploy terminou com status $STATUS" >&2
  "$AWS" ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" \
    --query StandardErrorContent --output text | tail -30 >&2
  exit 1
fi
echo "Deploy concluido."
