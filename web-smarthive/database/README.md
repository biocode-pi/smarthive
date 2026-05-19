# Banco de dados SmartHive

O banco alvo e PostgreSQL no Supabase. O frontend nao acessa o Supabase
diretamente nesta versao; ele consome o backend FastAPI, que pode usar Supabase
quando as variaveis de ambiente estiverem configuradas.

## Como executar no Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute `schema.sql`.
4. Opcionalmente execute `seed.sql` para dados de exemplo.
5. Copie `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL`.
6. Preencha esses valores em `backend/.env`.
7. Defina `USE_SUPABASE=true`.

## Entidades

- `colmeias`: cadastro das colmeias de abelhas nativas.
- `monitoramentos`: historico de observacoes, fluxo, midia e possivel invasor.
- `alertas`: observacoes criticas, manuais ou geradas pelo sistema.
- `capturas_sensor_celular`: camada experimental em que o celular simula o sensor visual.

## Storage

O `schema.sql` tambem cria o bucket publico `smarthive-capturas` no Supabase
Storage. O backend envia imagens/videos para esse bucket quando
`USE_SUPABASE=true`.

Use `SUPABASE_SERVICE_ROLE_KEY` no backend para permitir escrita no bucket sem
depender de politicas publicas de insert.

## Autenticacao futura

O MVP nao exige login. Em uma evolucao, use Supabase Auth e Row Level Security
para separar pesquisadores, propriedades, meliponicultores e administradores.
