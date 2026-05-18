# SmartHive

SmartHive e uma plataforma para monitoramento de colmeias de abelhas nativas. O
MVP valida a coleta, organizacao e interpretacao inicial dos dados antes da
evolucao para IA e IoT real.

O SmartHive nao e apenas um CRUD. Ele e a base de uma plataforma inteligente
para monitoramento de colmeias de abelhas nativas. O MVP valida a coleta,
organizacao e interpretacao inicial dos dados. A evolucao futura sera a
automacao da analise por IA e a substituicao do celular por um dispositivo IoT
dedicado.

## Arquitetura

```text
smarthive/
+-- frontend/
+-- backend/
+-- database/
+-- docs/
`-- README.md
```

## Tecnologias

- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router DOM, Axios.
- Backend: Python, FastAPI, Pydantic, Uvicorn.
- Banco: PostgreSQL no Supabase.
- Storage MVP: pasta local `backend/app/uploads`.
- Sensor experimental: celular como camera provisoria.

## Projetos relacionados

- Web: pasta `web-smarthive`.
- Mobile: pasta `mobile`.

Para web e mobile funcionarem em paralelo, use o mesmo projeto Supabase nos dois
ambientes. O backend web deve manter `SUPABASE_SERVICE_ROLE_KEY` somente no
Render. O mobile deve usar apenas a chave publica anon em
`EXPO_PUBLIC_SUPABASE_ANON_KEY`. Execute `database/schema.sql` no Supabase para
criar tambem as tabelas e politicas usadas pelo mobile.

## Como rodar com Docker

O Compose sobe o backend FastAPI e o frontend React servido por Nginx. Por
padrao, o backend usa o JSON local do MVP, persistido em volume Docker, sem
exigir Supabase.

```bash
copy .env.docker.example .env
docker compose up --build
```

Aplicacao: `http://localhost:5173`

API: `http://localhost:8000`

Swagger: `http://localhost:8000/docs`

O frontend em Docker usa `VITE_API_URL=/api`; o Nginx encaminha `/api` e
`/uploads` para o container do backend.

Para parar:

```bash
docker compose down
```

Para remover tambem os dados locais persistidos em volumes:

```bash
docker compose down -v
```

### Docker com Supabase

Para usar Supabase ou PostgreSQL externo, preencha as variaveis no `.env` da
raiz e altere:

```env
USE_SUPABASE=true
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=smarthive-capturas
DATABASE_URL=
```

Se `DATABASE_URL` estiver preenchida, o backend usa conexao PostgreSQL direta.
Caso contrario, usa `SUPABASE_URL` com `SUPABASE_SERVICE_ROLE_KEY` ou
`SUPABASE_KEY`.

## Como rodar o backend

```bash
cd C:\Users\draxs\Desktop\smarthive\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

API: `http://localhost:8000`

Swagger: `http://localhost:8000/docs`

## Como rodar o frontend

```bash
cd C:\Users\draxs\Desktop\smarthive\frontend
npm install
copy .env.example .env
npm run dev
```

Aplicacao: `http://localhost:5173`

## Variaveis de ambiente

Backend (`backend/.env`):

```env
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=smarthive-capturas
DATABASE_URL=
USE_SUPABASE=false
```

Frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:8000/api
```

Nao insira chaves reais no repositorio.

## Supabase

1. Crie um projeto no Supabase.
2. Execute `database/schema.sql`.
3. Opcionalmente execute `database/seed.sql`.
4. Preencha `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_STORAGE_BUCKET` e `DATABASE_URL` no backend.
5. Altere `USE_SUPABASE=true`.

Por padrao, o backend usa um arquivo JSON local para facilitar demonstracoes sem
infraestrutura externa. Quando `USE_SUPABASE=true`, nao existe fallback local:
os dados e uploads sao enviados ao Supabase ou a API retorna erro claro.

Quando `DATABASE_URL` estiver preenchida, o backend usa conexao PostgreSQL direta
com o banco do Supabase para o CRUD.

Valide a conexao com:

```bash
curl http://localhost:8000/api/health/supabase
```

Teste gravacao real com:

```bash
cd C:\Users\draxs\Desktop\smarthive\backend
copy .env.supabase.example .env
# preencha as chaves reais
python scripts/verificar_supabase.py
```

## Celular como sensor experimental

Nesta fase, o celular funciona como sensor visual experimental. Ele permite
validar a captura de dados visuais da entrada da colmeia antes da implementacao
de hardware IoT dedicado. O usuario registra imagem ou video, duracao, fluxo
estimado, abelhas entrando, abelhas saindo, observacoes e possivel invasor.

Detalhes em `docs/iot/sensor-celular.md`.

## Funcionalidades do MVP

- Cadastrar, listar, editar e excluir colmeias.
- Visualizar status: ativa, observacao, risco ou inativa.
- Registrar monitoramentos com midia do celular.
- Consultar historico por colmeia.
- Registrar captura experimental pelo celular.
- Visualizar resumo no dashboard.
- Criar e resolver alertas.

## Roadmap futuro

- Supabase Auth e perfis de usuarios.
- Supabase Storage para midias.
- Analise de frames com OpenCV.
- Deteccao de fluxo com YOLO, TensorFlow ou PyTorch.
- Identificacao de possiveis invasores.
- Camera fixa com ESP32-CAM, Raspberry Pi ou outro dispositivo de borda.
- Dashboard em tempo quase real.
