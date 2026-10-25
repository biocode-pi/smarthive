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
- Banco: PostgreSQL (Amazon RDS; Postgres local no Docker).
- Autenticacao: Amazon Cognito.
- Midias: Amazon S3 (bucket privado).
- Storage MVP: pasta local `backend/app/uploads`.
- Sensor experimental: celular como camera provisoria.

## Como rodar com Docker

O Compose sobe o PostgreSQL, o backend FastAPI e o frontend React servido por
Nginx. Por padrao a API roda com `AUTH_MODE=dev` (sem login).

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

### Configuracao AWS

O Compose sobe um PostgreSQL local que simula o Amazon RDS, com `schema.sql` e
`seed.sql` aplicados na primeira subida. Para validar tokens reais do Cognito ou
gravar midias no S3, ajuste no `.env` da raiz:

```env
AUTH_MODE=cognito
COGNITO_USER_POOL_ID=
COGNITO_APP_CLIENT_ID=
STORAGE_BACKEND=s3
S3_BUCKET=
```

Detalhes de configuracao e seguranca em `backend/README.md`.

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

Backend (`backend/.env`): veja `backend/.env.example` e `backend/README.md`.

Frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:8000/api
```

Nao insira chaves reais no repositorio.

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

- Perfis de usuario (pesquisador, meliponicultor, administrador) com grupos do Cognito.
- Analise de frames com OpenCV.
- Deteccao de fluxo com YOLO, TensorFlow ou PyTorch.
- Identificacao de possiveis invasores.
- Camera fixa com ESP32-CAM, Raspberry Pi ou outro dispositivo de borda.
- Dashboard em tempo quase real.
