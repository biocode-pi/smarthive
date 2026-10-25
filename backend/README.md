# SmartHive Backend

API em FastAPI do SmartHive, preparada para rodar na AWS (Cognito, RDS e S3).

## Rodando localmente

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
copy .env.example .env
uvicorn app.main:app --reload
```

A API fica em `http://localhost:8000` e a documentacao interativa em
`http://localhost:8000/docs` (desativada quando `ENVIRONMENT=production`).

Sem configuracao extra a API roda com `AUTH_MODE=dev` (sem login, todos os dados
pertencem ao usuario `dev-local`) e grava em `app/data/smarthive.local.json`.

## Configuracao

| Variavel | Valores | Descricao |
|---|---|---|
| `ENVIRONMENT` | `development`, `production` | Em producao a API so sobe com Cognito e esconde o Swagger |
| `AUTH_MODE` | `dev`, `cognito` | `cognito` valida o JWT de acesso do Amazon Cognito |
| `COGNITO_USER_POOL_ID`, `COGNITO_APP_CLIENT_ID`, `AWS_REGION` | | Obrigatorias com `AUTH_MODE=cognito` |
| `DATABASE_URL` | `postgresql://...` | Vazio usa JSON local; preenchido usa PostgreSQL (Amazon RDS) |
| `DATABASE_SSLMODE` | `require` (padrao), `disable` | `disable` apenas para o Postgres local do Docker |
| `STORAGE_BACKEND` | `local`, `s3` | `s3` grava midias em bucket privado |
| `S3_BUCKET` | | Obrigatoria com `STORAGE_BACKEND=s3` |
| `MAX_UPLOAD_MB` | `50` | Tamanho maximo de imagem/video |

No EC2 as credenciais AWS (S3) vem da IAM Role da instancia. Nao coloque chaves
de acesso no `.env` nem no codigo.

## Seguranca

- **Autenticacao**: toda rota (exceto `GET /api/health`) exige
  `Authorization: Bearer <access token do Cognito>`. O token e validado pela
  assinatura (JWKS do User Pool), emissor, expiracao, `token_use=access` e `client_id`.
- **Isolamento por usuario**: cada registro guarda `usuario_id` (o `sub` do
  Cognito). Consultas filtram por esse campo e acessos a ids de outro usuario
  retornam 404.
- **Uploads**: extensao e content-type precisam bater com a lista permitida
  (JPG, PNG, WEBP, MP4, MOV, WEBM) e o tamanho e limitado. No S3 os arquivos ficam
  em bucket privado, criptografados, em `usuarios/<sub>/...`, e sao lidos por URL
  pre-assinada com validade de 1 hora.
- **HTTP**: CORS restrito as origens configuradas, cabecalhos `nosniff`,
  `X-Frame-Options`, `Referrer-Policy`, `Cache-Control: no-store` e HSTS em producao.
- **SQL**: consultas parametrizadas com `psycopg.sql`, sem concatenacao de strings.

## Testes

```bash
pip install -r requirements-dev.txt
python -m pytest -q tests
```

Os testes simulam tokens do Cognito e cobrem: rotas sem token, tokens invalidos
(client_id, tipo, emissor, expirado), isolamento entre usuarios, validacao de
upload, cabecalhos de seguranca e bloqueio do modo `dev` em producao.

## Banco de dados

O schema esta em `database/schema.sql` (PostgreSQL 16). No Docker Compose ele e
aplicado automaticamente no container `db`, que simula o RDS.
