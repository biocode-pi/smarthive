# SmartHive Mobile

Aplicativo mobile em Expo/React Native para o SmartHive.

Este projeto fica na pasta `mobile` do monorepo `biocode-pi/smarthive`, junto
com o web em `web-smarthive`, para que tudo fique centralizado na branch `main`:

- Web: pasta `web-smarthive`.
- Mobile: pasta `mobile`.
- Dados compartilhados: mesmo projeto Supabase usado pelo backend web.

## Como rodar

```bash
npm install
copy .env.example .env
npm run start
```

No `.env`, use as mesmas credenciais publicas do Supabase configurado no web:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
EXPO_PUBLIC_API_URL=https://SEU-BACKEND.onrender.com/api
```

Nao use `SUPABASE_SERVICE_ROLE_KEY` no mobile. Ela deve ficar somente no
backend do web, por exemplo no Render.

## Scripts

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
```

## Ligacao com o web

Para os dois funcionarem em paralelo:

1. Backend web no Render com `USE_SUPABASE=true`.
2. Frontend web na Vercel com `VITE_API_URL=https://SEU-BACKEND.onrender.com/api`.
3. Mobile com `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   apontando para o mesmo Supabase.
4. Mobile com `EXPO_PUBLIC_API_URL` apontando para o mesmo backend Render,
   caso alguma tela precise consumir endpoints HTTP do web.
5. Supabase com o `web-smarthive/database/schema.sql` mais recente aplicado,
   pois ele cria as tabelas/politicas usadas pelo mobile (`apiarios` e
   campos mobile em `colmeias`).
