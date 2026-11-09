# SmartHive Frontend

Frontend em React, Vite, TypeScript e Tailwind CSS.

## Rodando localmente

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

A aplicacao abre em `http://localhost:5173`.

## Variaveis de ambiente

```env
VITE_API_URL=http://localhost:8000/api
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
```

O login usa o Amazon Cognito (biblioteca `aws-amplify/auth`, fluxo SRP). Os
valores do User Pool sao as saidas `UserPoolId` e `UserPoolClientId` da stack
`smarthive` (veja `infra/README.md`). O access token e enviado a API em
`Authorization: Bearer`.

Rotas: `/` e o site institucional, `/login` a autenticacao e `/app/*` a plataforma.

## Telas

- Dashboard
- Colmeias
- Detalhes da colmeia
- Novo monitoramento
- Sensor celular
- Alertas

