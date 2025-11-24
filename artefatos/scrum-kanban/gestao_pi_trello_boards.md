📋 GESTÃO PI - KANBAN
URL: https://trello.com/invite/b/69026c3e01add439d0108d70/ATTI9fdd26b68d7d45dc23e17463565fd0e577033C3B/gestao-pi-kanban

# 📊 GESTÃO PI - KANBAN BOARD

## 🎯 VISÃO GERAL DO QUADRO KANBAN
**Objetivo:** Gestão contínua de demandas e manutenção do projeto PI
**Tipo:** Fluxo contínuo com WIP Limits
**Métrica Principal:** Lead Time < 7 dias

## 📋 ESTRUTURA DAS LISTAS

### 📥 BACKLOG
**Descrição:** Todas as demandas identificadas aguardando priorização
**Política:** Itens devem ter descrição clara e critérios de aceitação

### 📝 TO DO  
**Descrição:** Itens priorizados e prontos para execução
**Política:** Devem estar estimados e com responsável definido

### 🔄 IN PROGRESS (WIP Limit: 3)
**Descrição:** Trabalhos em execução ativa
**Política:** Máximo 3 itens simultaneamente
**Responsável:** Time de desenvolvimento

### 👀 REVIEW (WIP Limit: 2) 
**Descrição:** Itens aguardando revisão e validação
**Política:** Code review, testes e aprovação do PO
**Responsável:** PO + Tech Lead

### ✅ DONE
**Descrição:** Trabalhos concluídos e entregues
**Política:** Atendem todos os critérios de Definition of Done
**Status:** Pronto para deploy em produção

## 🏷️ SISTEMA DE LABELS

### 🎯 POR PRIORIDADE:
- 🔴 **P1 - Crítico**: Bloqueadores, urgências
- 🟠 **P2 - Alto**: Funcionalidades importantes
- 🟡 **P3 - Médio**: Melhorias e otimizações  
- 🟢 **P4 - Baixo**: Tarefas secundárias

### 📚 POR TIPO:
- 🐛 **Bug**: Correções de problemas
- 🚀 **Feature**: Novas funcionalidades
- 🔧 **Improvement**: Melhorias no existente
- 📚 **Docs**: Documentação
- 🛠️ **DevOps**: Infraestrutura e deploy

### 👥 POR RESPONSÁVEL:
- 👤 **Leonardo**: Infraestrutura e DevOps
- 👤 **Mauricio**: Banco de dados e documentação
- 👤 **Bruno Davies**: UX/UI Design
- 👤 **Bruno Eduardo**: Desenvolvimento Backend
- 👤 **Renan Ramos**: Desenvolvimento Frontend

## 📊 MÉTRICAS E INDICADORES

### 📈 MÉTRICAS DE FLUXO:
- **Lead Time Alvo:** 3-7 dias
- **Throughput Alvo:** 8-12 itens/semana
- **WIP Limits:** In Progress (3), Review (2)

### 📋 DEFINITION OF DONE (DoD):
- [ ] Código revisado e aprovado
- [ ] Testes automatizados passando
- [ ] Documentação atualizada
- [ ] Deploy em ambiente de staging
- [ ] Aceite do Product Owner

## 🔄 PROCESSO DE TRABALHO

### 1. 📥 ENTRADA DE NOVAS DEMANDAS:
```mermaid
graph LR
    A[Nova Demanda] --> B[Backlog]
    B --> C[Priorização PO]
    C --> D[To Do]
```
### 2. 🔄 EXECUÇÃO:
```mermaid
graph LR
    A[To Do] --> B[In Progress]
    B --> C[Review]
    C --> D[Done]
```
### 3. 📊 ANÁLISE E MELHORIA:
Revisão semanal de métricas  
Ajuste de WIP limits conforme necessidade  
Identificação e remoção de gargalos  

## 🛠️ CONFIGURAÇÃO TRELLO

### ⚙️ POWER-UPS RECOMENDADOS:
- Custom Fields: Lead Time, Cycle Time
- Calendar: Prazos e entregas
- Butler: Automações de fluxo
- Card Repeater: Tasks recorrentes

### 🔄 AUTOMAÇÕES BUTLER:
```javascript
// Mover para Done → Marcar como concluído
when a card is moved to "Done",
add label "✅" to the card

// Due date chegando → Notificar
when a due date is due in 1 day,
comment "⏰ Lembrete: Prazo próximo" on the card

// Card bloqueado → Alertar time  
when label "🚧 Bloqueado" is added to a card,
comment "@here Card bloqueado - precisa de atenção"
```

## 📋 CHECKLIST DE IMPLEMENTAÇÃO:
- [ ] Configurar listas com WIP limits  
- [ ] Criar sistema de labels completo  
- [ ] Definir membros e responsabilidades  
- [ ] Configurar automações Butler  
- [ ] Estabelecer métricas iniciais  
- [ ] Treinar time no processo Kanban  

## 📞 RESPONSABILIDADES

### 👤 PRODUCT OWNER:
- Priorização do backlog  
- Definição de critérios de aceitação  
- Aceite final das entregas  

### 👥 TIME DE DESENVOLVIMENTO:
- Execução dos itens em progresso  
- Respeito aos WIP limits  
- Atualização contínua do board  

### 🔧 SCRUM MASTER/TECH LEAD:
- Facilitação do processo  
- Remoção de impedimentos  
- Análise de métricas e melhorias  

---

# 🏈 GESTÃO PI - SCRUM
**URL:** https://trello.com/invite/b/66f5b479f0e875fc8579449c/ATTI9dc548485d02f1b1b8df7f8a8a5b33d3E0864C19/gestao-pi

## 🎯 VISÃO GERAL DO FRAMEWORK SCRUM
**Objetivo:** Desenvolvimento iterativo e incremental do projeto PI  
**Ciclo:** Sprints de 2-4 semanas  
**Métrica Principal:** Velocity consistente  

## 📅 ESTRUTURA DE SPRINTS ### 🗓️ CICLO SCRUM TÍPICO:
mermaid
graph TD
    A[Product Backlog] --> B[Sprint Planning]
    B --> C[Sprint Backlog]
    C --> D[2-Week Sprint]
    D --> E[Daily Scrum]
    E --> F[Sprint Review]
    F --> G[Sprint Retrospective]
    G --> A
📋 LISTAS DO BOARD SCRUM:
PRODUCT BACKLOG
Descrição: Lista priorizada de todas as funcionalidades desejadas
Responsável: Product Owner
Conteúdo: User Stories, épicos, features

SPRINT BACKLOG
Descrição: Itens selecionados para a sprint atual
Responsável: Development Team
Compromisso: Sprint Goal

TO DO
Descrição: Tasks técnicas derivadas das user stories
Detalhamento: Breakdown em tarefas executáveis

IN PROGRESS (WIP Limit: 3)
Descrição: Trabalhos em desenvolvimento ativo
Atualização: Diária no Daily Scrum

CODE REVIEW
Descrição: Itens aguardando revisão técnica
Critério: PR aberto, código revisável

TESTING
Descrição: Funcionalidades em fase de testes
Aberto para: QA e Product Owner

DONE
Descrição: Incremento potencialmente entregável
Critério: Atende Definition of Done

👥 PAPÉIS E RESPONSABILIDADES
👤 PRODUCT OWNER (PO)
Responsabilidades:

Definir e priorizar Product Backlog

Representar stakeholders

Aceitar ou rejeitar entregas

Maximizar valor do produto

🔧 SCRUM MASTER (SM)
Responsabilidades:

Garantir adoção do Scrum

Facilitar cerimônias

Remover impedimentos

Coach do time

👨‍💻 DEVELOPMENT TEAM
Membros:

Bruno Davies: UX/UI Design

Bruno Eduardo: Desenvolvimento Backend

Renan Ramos: Desenvolvimento Frontend

Responsabilidades:

Auto-gerenciável e multifuncional

Estimação e compromisso com sprint

Entrega do incremento

📅 CERIMÔNIAS SCRUM
🎯 SPRINT PLANNING (2-4 horas)
Participantes: PO, SM, Development Team
Entrada: Product Backlog priorizado
Saída: Sprint Backlog com Sprint Goal

💻 DAILY SCRUM (15 minutos diários)
Horário: 09:15-09:30
Perguntas:

O que fiz ontem?

O que farei hoje?

Há impedimentos?

👀 SPRINT REVIEW (1-2 horas)
Participantes: Time + Stakeholders
Objetivo: Demonstrar incremento e coletar feedback

🔄 SPRINT RETROSPECTIVE (1-2 horas)
Participantes: Time Scrum
Objetivo: Melhorar processos e práticas

📊 ARTEFATOS SCRUM
PRODUCT BACKLOG
markdown
## 🎯 ÉPICOS PRINCIPAIS:

### EPIC 1: Gestão de Apiários
- SH-001: Cadastro de apiários
- SH-002: Geolocalização
- SH-003: Status operacional

### EPIC 2: Monitoramento
- SH-004: Coleta de sensores
- SH-005: Dashboard métricas
- SH-006: Alertas automáticos

### EPIC 3: Segurança
- SH-007: Detecção predadores
- SH-008: Sistema notificações
SPRINT BACKLOG
Sprint 1 Goal: "Sistema básico de gestão de apiários funcionando"

ID	User Story	Story Points	Responsável
SH-001	Como usuário, quero cadastrar apiários	8	Bruno Eduardo
SH-002	Como admin, quero visualizar apiários	5	Renan Ramos
SH-003	Como sistema, preciso de MongoDB	13	Mauricio
INCREMENT
Definição: Produto funcionando ao final da sprint
Critério: Potencialmente entregável e atendendo DoD

🏷️ SISTEMA DE LABELS SCRUM
📊 POR STORY POINTS:
⚫ 1pt: Tarefa simples (<4h)

🔵 3pts: Tarefa média (1 dia)

🟢 5pts: Tarefa complexa (2 dias)

🟡 8pts: Épico pequeno (3-4 dias)

🟠 13pts: Épico médio (1 semana)

🔴 21pts: Épico grande (2 semanas)

👥 POR RESPONSÁVEL:
🎨 Bruno Davies: UX/UI Design

⚡ Bruno Eduardo: Backend Development

🎯 Renan Ramos: Frontend Development

🛠️ Leonardo: Infraestrutura

🗄️ Mauricio: Banco de Dados

📈 MÉTRICAS SCRUM
📊 VELOCITY TRACKING:
Sprint 1 Alvo: 30-35 story points

Capacidade Time: 4 pessoas × 10 dias = 34 pontos

Meta: Velocity consistente sprint a sprint

📉 BURNDOWN CHART:
Progresso diário da sprint

Identificação de atrasos

Ajuste de expectativas

🎯 DEFINITION OF DONE (DoD):
Código revisado e aprovado

Testes unitários (>80% cobertura)

Testes de integração passando

Documentação atualizada

Deploy em ambiente de staging

Aceite do Product Owner

Performance atendendo requisitos

🛠️ CONFIGURAÇÃO TRELLO SCRUM
⚙️ POWER-UPS ESSENCIAIS:
Custom Fields: Story Points, Estimativas

Calendar: Datas de sprint e cerimônias

Butler: Automações de fluxo Scrum

Card Repeater: Daily Scrum recorrente

🔄 AUTOMAÇÕES BUTLER SCRUM:
javascript
// Início da Sprint → Configurar board
when date is "first day of sprint",
move all cards from "Done" to "Product Backlog"

// Daily Scrum → Checklist automático
every day at 09:00,
add checklist "Daily Scrum" to cards in "In Progress"

// Fim da Sprint → Preparar review
when date is "last day of sprint",
comment "🎯 Sprint Review amanhã!" on the board
📋 CHECKLIST DE IMPLEMENTAÇÃO SCRUM:
Configurar listas do board Scrum

Definir duração das sprints (2 semanas)

Estabelecer Product Backlog inicial

Configurar sistema de story points

Definir membros e papéis

Agendar cerimônias recorrentes

Configurar automações Butler

Treinar time em práticas Scrum

📞 FLUXO DE TRABALHO SCRUM
1. 📋 PRE-SPRINT PLANNING:
graph LR
    A[Product Backlog] --> B[Refinamento]
    B --> C[Priorização PO]
    C --> D[Sprint Planning]
2. 🎯 SPRINT EXECUTION:
graph LR
    A[Sprint Backlog] --> B[To Do]
    B --> C[In Progress]
    C --> D[Code Review]
    D --> E[Testing]
    E --> F[Done]
3. 📊 SPRINT CLOSURE:
graph LR
    A[Sprint Review] --> B[Demo]
    B --> C[Feedback]
    C --> D[Retrospective]
    D --> E[Melhorias]
🚨 GESTÃO DE IMPEDIMENTOS
📋 TIPOS DE IMPEDIMENTOS:
🔴 Crítico: Bloqueia toda a sprint

🟠 Alto: Impacta múltiplos itens

🟡 Médio: Impacta item específico

🟢 Baixo: Inconveniente, não bloqueador

🔄 PROCESSO DE RESOLUÇÃO:
Identificação no Daily Scrum

Escalação para Scrum Master

Ação imediata para remoção

Tracking até resolução completa