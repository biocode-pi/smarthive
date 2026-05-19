# SmartHive

Monorepo do SmartHive.

## Estrutura

```text
smarthive/
+-- web-smarthive/   # Frontend Vite, backend FastAPI, Docker e schema Supabase
+-- mobile/          # App Expo/React Native
+-- IA-smarthive/
+-- artefatos/
+-- artigo-cientifico/
+-- banco-de-dados/
`-- utils/
```

## Web e Mobile

O web e o mobile compartilham o mesmo projeto Supabase.

- Backend web: `web-smarthive/backend`
- Frontend web: `web-smarthive/frontend`
- App mobile: `mobile`
- Schema compartilhado: `web-smarthive/database/schema.sql`
- Autenticacao compartilhada: Supabase Auth

Para rodar cada aplicacao, consulte os READMEs dentro de `web-smarthive/` e
`mobile/`.
