# Smart Hive - Sistema de Gestão de Apiários

Frontend completo em React + Vite com TailwindCSS para gerenciamento de apiários e colmeias.

## 🚀 Tecnologias

- **Vite** - Build tool e dev server
- **React 18** - Framework UI
- **React Router** - Roteamento
- **TailwindCSS** - Estilização
- **TypeScript** - Tipagem estática
- **Shadcn/ui** - Componentes de UI

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/          # Layout components (Sidebar, Header, Layout)
│   └── ui/              # UI components (Card, Table, Button, etc)
├── pages/               # Páginas da aplicação
│   ├── Login.tsx
│   ├── Cadastro.tsx
│   ├── Overview.tsx
│   ├── Dashboard.tsx
│   ├── Apiarios.tsx
│   ├── Colmeias.tsx
│   ├── NovoRegistro.tsx
│   ├── Registros.tsx
│   ├── Alertas.tsx
│   └── Configuracoes.tsx
├── lib/
│   └── api.ts          # Client HTTP centralizado
└── hooks/              # Custom hooks
```

## 🔧 Instalação e Execução

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variável de ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
VITE_API_URL=http://localhost:4000
```

### 3. Executar o projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

### 4. Build para produção

```bash
npm run build
npm run preview
```

## 🔐 Autenticação

O sistema utiliza autenticação via token JWT:
- Token armazenado no `localStorage`
- Header `Authorization: Bearer <token>` enviado em todas as requisições
- Guard de rota implementado no componente `Layout`
- Logout limpa o token e redireciona para `/login`

## 📋 Funcionalidades

### Páginas Públicas
- **/login** - Autenticação de usuário
- **/cadastro** - Registro de novo usuário

### Páginas Protegidas
- **/** - Visão geral com KPIs (apiários, colmeias, alertas)
- **/dashboard** - Dashboard com gráficos de atividade
- **/apiarios** - CRUD de apiários
- **/colmeias** - CRUD de colmeias
- **/registros/novo** - Criar novo registro manual ou simular câmera
- **/registros** - Histórico de registros
- **/alertas** - Lista de alertas com SSE em tempo real
- **/configuracoes** - Configurações do sistema

## 🌐 Integração com API

O cliente HTTP está centralizado em `src/lib/api.ts`:

```typescript
import { api } from "@/lib/api";

// GET
const data = await api("/api/apiarios");

// POST
await api("/api/colmeias", {
  method: "POST",
  body: { identificador, apiario: apiarioId, especie }
});

// PUT
await api(`/api/apiarios/${id}`, {
  method: "PUT",
  body: { nome, localizacao }
});

// DELETE
await api(`/api/apiarios/${id}`, { method: "DELETE" });
```

### Endpoints Consumidos

**Auth:**
- `POST /auth/register` - Registro
- `POST /auth/login` - Login

**Apiários:**
- `GET /api/apiarios` - Listar
- `POST /api/apiarios` - Criar
- `PUT /api/apiarios/:id` - Atualizar
- `DELETE /api/apiarios/:id` - Deletar

**Colmeias:**
- `GET /api/colmeias` - Listar (query: `?apiario=<id>`)
- `POST /api/colmeias` - Criar (body: `{ identificador, apiario, especie? }`)
- `PUT /api/colmeias/:id` - Atualizar
- `DELETE /api/colmeias/:id` - Deletar

**Registros:**
- `GET /api/registros` - Listar
- `POST /api/registros` - Criar
- `POST /api/registros/simulate` - Simular câmera

**Alertas:**
- `GET /api/alertas` - Listar
- `POST /api/alertas/:id/ack` - Reconhecer
- `GET /api/alertas/stream` - SSE stream

## 🎨 Design System

O sistema utiliza a paleta amarela Smart Hive (#f59e0b) como cor primária. Todas as cores estão definidas no arquivo `src/index.css` usando tokens semânticos:

- `--primary`: Amarelo da marca (#f59e0b)
- `--secondary`: Amarelo claro para backgrounds
- `--accent`: Amarelo mais vibrante para destaques
- `--destructive`: Vermelho para alertas e exclusões

## 📱 Responsividade

O layout é totalmente responsivo:
- Sidebar fixa em telas grandes
- Menu adaptável para mobile
- Grids que colapsam em telas menores
- Componentes otimizados para touch

## ⚡ Server-Sent Events (SSE)

A página de alertas utiliza SSE para receber notificações em tempo real:

```typescript
const eventSource = new EventSource(`${API_URL}/api/alertas/stream`);

eventSource.addEventListener("alerta", () => {
  // Atualiza a lista de alertas
  loadAlertas();
});
```

## 📝 Notas Técnicas

### Diferenças do Next.js

Este projeto usa **Vite + React Router** ao invés de Next.js Pages Router, mas mantém estrutura similar:
- `pages/` para rotas (com React Router ao invés de file-based routing)
- `lib/api.ts` para client HTTP centralizado
- Variável de ambiente `VITE_API_URL` (ao invés de `NEXT_PUBLIC_API_URL`)

### Variáveis de Ambiente

Vite usa o prefixo `VITE_` para expor variáveis ao client:
- ✅ `VITE_API_URL`
- ❌ `NEXT_PUBLIC_API_URL` (não funciona)

Acesso: `import.meta.env.VITE_API_URL`

## 📄 Licença

Este projeto foi criado como solução frontend para a plataforma Smart Hive.
