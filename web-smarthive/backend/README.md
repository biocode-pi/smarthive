# SmartHive Backend

API em FastAPI para o MVP academico do SmartHive.

## Rodando localmente

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

A API ficara em `http://localhost:8000` e a documentacao interativa em
`http://localhost:8000/docs`.

## Supabase

Por padrao, o backend usa um arquivo local em `app/data/smarthive.local.json`
para facilitar testes do MVP. Para usar Supabase:

1. Execute `database/schema.sql` no SQL Editor do Supabase.
2. Preencha `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_KEY`,
   `SUPABASE_STORAGE_BUCKET` e `DATABASE_URL` no `.env`.
3. Altere `USE_SUPABASE=true`.
4. Reinicie a API.

Valide a conexao em:

```text
GET http://localhost:8000/api/health/supabase
```

Quando `USE_SUPABASE=true`, a API nao usa fallback local. Se faltar credencial
ou tabela, o endpoint retorna erro explicitamente.

Se voce tiver apenas a string PostgreSQL do Supabase, basta preencher
`DATABASE_URL` e usar `USE_SUPABASE=true`. O CRUD passara a gravar diretamente
nas tabelas PostgreSQL.

Para testar gravacao real no Supabase:

```bash
copy .env.supabase.example .env
# preencha as chaves reais no .env
python scripts/verificar_supabase.py
```

O script cria colmeia, monitoramento e alerta temporarios no Supabase e limpa os
registros ao final.

Nesta primeira versao nao ha autenticacao obrigatoria. O Supabase Auth pode ser
adicionado depois para separar pesquisadores, meliponicultores e administradores.

## Uploads

Com `USE_SUPABASE=false`, uploads de imagem e video capturados pelo celular sao
salvos em `app/uploads` e expostos pela rota `/uploads/{arquivo}`.

Com `USE_SUPABASE=true`, os uploads sao enviados para o bucket configurado em
`SUPABASE_STORAGE_BUCKET`, por padrao `smarthive-capturas`.
