#!/bin/bash
# Gera o build do frontend e publica no S3/CloudFront.
# Uso (Git Bash, na raiz do repo): bash infra/deploy-frontend.sh
set -euo pipefail
cd "$(dirname "$0")/.."
# No Git Bash (Windows), impede que valores como "/api" virem "C:/Program Files/Git/api".
export MSYS_NO_PATHCONV=1

AWS="${AWS:-aws}"
command -v "$AWS" >/dev/null 2>&1 || AWS="/c/Program Files/Amazon/AWSCLIV2/aws.exe"
STACK="${STACK:-smarthive}"

output() {
  "$AWS" cloudformation describe-stacks --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text | tr -d '\r'
}

SITE_BUCKET="$(output SiteBucketName)"
DISTRIBUTION_ID="$(output DistributionId)"

export VITE_API_URL=/api
export VITE_AWS_REGION="$(output Region)"
export VITE_COGNITO_USER_POOL_ID="$(output UserPoolId)"
export VITE_COGNITO_CLIENT_ID="$(output UserPoolClientId)"

(cd frontend && npm ci --silent && npm run build)

# Arquivos com hash no nome podem ficar em cache por 1 ano; index.html nunca.
"$AWS" s3 sync frontend/dist "s3://$SITE_BUCKET" --delete --only-show-errors \
  --exclude index.html --cache-control "public,max-age=31536000,immutable"
"$AWS" s3 cp frontend/dist/index.html "s3://$SITE_BUCKET/index.html" --only-show-errors \
  --cache-control "no-cache"

"$AWS" cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/index.html" \
  --query Invalidation.Id --output text >/dev/null
echo "Frontend publicado em $(output SiteUrl)"
