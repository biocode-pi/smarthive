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
```

Nesta primeira versao, o frontend consome apenas a API FastAPI. O acesso direto
ao Supabase fica reservado para evolucoes futuras com autenticacao e politicas
de seguranca.

## Telas

- Dashboard
- Colmeias
- Detalhes da colmeia
- Novo monitoramento
- Sensor celular
- Alertas

