# Smart Hive

Plataforma web para monitorar colmeias de abelhas nativas sem ferrão. O meliponicultor organiza seus meliponários e colmeias, registra capturas da entrada de cada caixa e acompanha o movimento, o histórico e os alertas.

**Site publicado:** https://www.smarthive.app.br

## Funcionalidades

**Site institucional**
- Apresentação do projeto, espécies nativas, etapas do monitoramento e exemplo do mapa do meliponário.
- Termos de Uso e Política de Privacidade.

**Conta**
- Cadastro com confirmação por e-mail, login e recuperação de senha.
- Verificação em duas etapas com aplicativo autenticador.
- Telefone e preferência de notificações por e-mail, com registro do consentimento.
- Exclusão da conta e de todos os dados, conforme a LGPD.

**Plataforma**
- **Visão geral:** mapa em forma de favo, colmeias que precisam de atenção, indicadores e movimento recente.
- **Meliponários:** cadastro, busca, filtro por alertas e mapa das colmeias de cada local.
- **Colmeias:** cadastro por espécie, código, localização e situação, com ficha e histórico de cada uma.
- **Captura:** câmera do celular ou do computador, com escolha entre as câmeras disponíveis, inclusive uma GoPro usada como webcam. Também aceita foto ou vídeo. A leitura automática acontece no próprio navegador.
- **Atividade:** entradas, saídas, movimentos e situação das colmeias.
- **Histórico:** todas as capturas, com a mídia registrada.
- **Alertas:** gerados a partir das capturas ou criados manualmente, com gravidade e resolução.

## Tecnologias

| Parte | Tecnologias |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, AWS Amplify |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Banco de dados | PostgreSQL 16 |
| Login | Amazon Cognito |
| Infraestrutura | AWS (CloudFront, S3, EC2), Caddy e Docker |

## Como testar

### Opção 1: no site publicado

É o caminho mais rápido e não exige instalar nada.

1. Acesse https://www.smarthive.app.br e clique em **Entrar**.
2. Crie uma conta com um e-mail válido e informe o código recebido.
3. Cadastre um meliponário e uma colmeia.
4. Em **Captura**, abra a câmera, ou envie uma foto, e salve o registro.
5. Veja o resultado em **Visão geral**, **Histórico** e **Alertas**.

### Opção 2: rodar o projeto completo no computador

Requer [Git](https://git-scm.com/), [Python 3.12 ou superior](https://www.python.org/) e [Node.js 20.19 ou superior](https://nodejs.org/). Não precisa de Docker nem de banco de dados: neste modo, a API grava os dados em um arquivo local. O login usa o mesmo serviço do site publicado, então é necessária uma conta com e-mail válido.

Os comandos abaixo são para o PowerShell do Windows. No Linux e no macOS, troque `copy` por `cp` e `.venv\Scripts\python` por `.venv/bin/python`.

**1. Clone o repositório**

```powershell
git clone https://github.com/biocode-pi/smarthive.git
cd smarthive
```

**2. Prepare e inicie a API**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt
copy .env.example .env
```

No arquivo `backend/.env`, altere estas linhas:

```env
AUTH_MODE=cognito
COGNITO_USER_POOL_ID=us-east-1_ZnGO71IUs
COGNITO_APP_CLIENT_ID=v2u40cvu2ncedlcbbafe0vig
```

Inicie a API e mantenha este terminal aberto:

```powershell
.venv\Scripts\python -m uvicorn app.main:app --reload
```

A API fica em http://localhost:8000 e a documentação interativa em http://localhost:8000/docs.

**3. Prepare e inicie o site**

Em outro terminal, na pasta do projeto:

```powershell
cd frontend
npm ci
copy .env.example .env
```

No arquivo `frontend/.env`, preencha:

```env
VITE_COGNITO_USER_POOL_ID=us-east-1_ZnGO71IUs
VITE_COGNITO_CLIENT_ID=v2u40cvu2ncedlcbbafe0vig
```

Inicie o site:

```powershell
npm run dev
```

Acesse http://localhost:5173, crie uma conta e siga os passos da opção 1. A câmera funciona em `localhost`. Para usá-la em outro aparelho, use o site publicado, porque o navegador exige HTTPS.

### Opção 3: testar só a API com Docker

Sobe a API e um PostgreSQL com dados de exemplo, sem login. Requer o [Docker](https://www.docker.com/) em execução.

```powershell
copy .env.docker.example .env
docker compose up --build
```

Abra http://localhost:8000/docs e experimente as rotas, por exemplo `GET /api/colmeias`. O site servido nesse modo não tem login habilitado; para usar a plataforma, siga a opção 1 ou 2.

Para encerrar e apagar os dados locais:

```powershell
docker compose down -v
```

## Testes automatizados

Com o ambiente da opção 2 instalado, na pasta `backend`:

```powershell
.venv\Scripts\python -m pytest tests
```

Os testes cobrem autenticação, isolamento de dados entre contas, uploads, limites de requisição e exclusão de conta.

## Estrutura do repositório

```text
backend/    API em FastAPI e testes
frontend/   site e plataforma em React
database/   estrutura do banco e dados de exemplo
infra/      infraestrutura na AWS e scripts de publicação
docs/       documentação de segurança e da API
```

## Segurança

- Cada conta acessa somente os próprios dados.
- O login é feito pelo Amazon Cognito, com verificação em duas etapas opcional.
- O banco de dados não tem acesso direto pela internet, e as mídias ficam em armazenamento privado.
- A API limita o tamanho e a quantidade de requisições por tipo de rota.

Detalhes em [docs/seguranca.md](docs/seguranca.md).

## Sobre o projeto

Projeto Integrador do curso de Desenvolvimento de Software Multiplataforma da Fatec Registro.
