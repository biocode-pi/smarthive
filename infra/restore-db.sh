#!/bin/bash
# Restaura o banco a partir de um backup do S3. SUBSTITUI os dados atuais da producao.
# Roda no computador do operador (credenciais de administrador): a instancia nao tem
# permissao de ler backups, entao este script gera uma URL pre-assinada de 15 minutos.
#
# Uso (Git Bash):  bash infra/restore-db.sh                       -> lista os backups
#                  bash infra/restore-db.sh <chave> --confirmar   -> restaura
set -euo pipefail
cd "$(dirname "$0")/.."

AWS="${AWS:-aws}"
command -v "$AWS" >/dev/null 2>&1 || AWS="/c/Program Files/Amazon/AWSCLIV2/aws.exe"
STACK="${STACK:-smarthive}"

output() {
  "$AWS" cloudformation describe-stacks --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text | tr -d '\r'
}

BUCKET="$(output BackupBucketName)"
INSTANCE_ID="$(output InstanceId)"
KEY="${1:-}"

if [ -z "$KEY" ]; then
  echo "Backups disponiveis (mais recente por ultimo):"
  "$AWS" s3api list-objects-v2 --bucket "$BUCKET" --prefix postgres/ \
    --query 'sort_by(Contents, &LastModified)[].[Key, Size, LastModified]' --output text
  echo
  echo "Para restaurar: bash infra/restore-db.sh <chave> --confirmar"
  exit 0
fi
if [ "${2:-}" != "--confirmar" ]; then
  echo "A restauracao substitui os dados atuais. Repita o comando com --confirmar." >&2
  exit 2
fi

# A chave vem do operador e o checksum vem dos metadados do objeto, que a instancia
# (e portanto uma API comprometida) consegue escrever. Os dois sao validados com
# regex estritas e trafegam em base64 para nunca serem interpretados pelo shell remoto.
if ! [[ "$KEY" =~ ^postgres/smarthive-[0-9]{8}T[0-9]{6}Z\.dump$ ]]; then
  echo "Chave invalida: $KEY" >&2
  exit 2
fi
SHA256="$("$AWS" s3api head-object --bucket "$BUCKET" --key "$KEY" --query 'Metadata.sha256' --output text | tr -d '\r')"
if ! [[ "$SHA256" =~ ^[A-Za-z0-9+/]{43}=$ ]]; then
  echo "Checksum ausente ou malformado nos metadados de $KEY; restauracao recusada." >&2
  exit 1
fi
URL="$("$AWS" s3 presign "s3://$BUCKET/$KEY" --expires-in 900 | tr -d '\r')"
if ! [[ "$URL" =~ ^https://[A-Za-z0-9.-]+/[A-Za-z0-9._~%/?=\&+-]+$ ]]; then
  echo "URL pre-assinada inesperada; restauracao recusada." >&2
  exit 1
fi
URL_B64="$(printf '%s' "$URL" | base64 -w0)"
SHA_B64="$(printf '%s' "$SHA256" | base64 -w0)"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cat > "$TMP/params.json" <<JSON
{"commands": ["/opt/smarthive/current/restore.sh --b64 $URL_B64 $SHA_B64"], "executionTimeout": ["900"]}
JSON
PARAMS_FILE="$TMP/params.json"
command -v cygpath >/dev/null 2>&1 && PARAMS_FILE="$(cygpath -w "$PARAMS_FILE")"

COMMAND_ID="$("$AWS" ssm send-command --instance-ids "$INSTANCE_ID" --document-name AWS-RunShellScript \
  --comment "smarthive restore $KEY" --parameters "file://$PARAMS_FILE" \
  --query Command.CommandId --output text | tr -d '\r')"
echo "Restaurando $KEY (comando SSM $COMMAND_ID)..."

STATUS=Pending
for _ in $(seq 1 90); do
  STATUS="$("$AWS" ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" \
    --query Status --output text 2>/dev/null | tr -d '\r' || echo Pending)"
  case "$STATUS" in Pending|InProgress|Delayed) sleep 5 ;; *) break ;; esac
done
"$AWS" ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" \
  --query "[StandardOutputContent, StandardErrorContent]" --output text
[ "$STATUS" = "Success" ]
