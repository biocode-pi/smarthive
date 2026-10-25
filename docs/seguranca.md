# Praticas de Seguranca do SmartHive

Este documento descreve as praticas de desenvolvimento seguro aplicadas no SmartHive,
organizadas pelas categorias do **OWASP Top 10 (2021)**. Cada controle aponta para o
codigo que o implementa e para a evidencia que o comprova (teste automatizado, CI ou
verificacao manual em producao).

Ambiente de producao: AWS (us-east-1), descrito em [infra/smarthive.yaml](../infra/smarthive.yaml).

## Visao geral

```text
 Usuario --HTTPS--> CloudFront --HTTPS + cabecalho secreto--> Caddy (EC2) --> API FastAPI --> PostgreSQL
                       |                                                       |
                       +--> S3 (site, privado)                                 +--> S3 (midias, privado)
 Usuario --SRP--> Amazon Cognito (login)          API valida o JWT do Cognito em toda requisicao
```

Fronteiras de confianca:

1. **Internet -> CloudFront**: unica entrada publica. HTTPS obrigatorio.
2. **CloudFront -> EC2**: HTTPS com certificado valido e cabecalho secreto `X-Origin-Verify`.
3. **API -> dados**: toda consulta e filtrada pelo usuario autenticado.
4. **Instancia -> AWS**: credenciais temporarias da IAM Role, com permissao minima.

---

## A01 - Controle de acesso quebrado

| Controle | Onde | Evidencia |
|---|---|---|
| Toda rota exige usuario autenticado (exceto `GET /api/health`) | `Depends(get_usuario_atual)` em [backend/app/routers/](../backend/app/routers/) | `test_rotas_exigem_token` |
| Isolamento por usuario: toda tabela tem `usuario_id` (o `sub` do Cognito) e toda consulta filtra por ele | [colmeia_service.py](../backend/app/services/colmeia_service.py), [monitoramento_service.py](../backend/app/services/monitoramento_service.py), [alerta_service.py](../backend/app/services/alerta_service.py) | `test_usuario_nao_acessa_dados_de_outro` |
| Acesso a id de outro usuario responde **404** (nao 403), para nao revelar que o registro existe | `obter_colmeia` e equivalentes | `test_usuario_nao_acessa_dados_de_outro` |
| Alertas nao podem ser vinculados a colmeia ou monitoramento de outro usuario | `criar_alerta` | revisao de codigo |
| `midia_url` nao e aceito do cliente (evita apontar para arquivos de terceiros) | [schemas/monitoramento.py](../backend/app/schemas/monitoramento.py) | revisao de codigo |
| Arquivos no S3 ficam em `usuarios/<sub>/...`; a API so assina URLs dentro da pasta do proprio usuario | `url_de_leitura` em [storage_service.py](../backend/app/services/storage_service.py) | verificado em producao |
| Buckets S3 com bloqueio total de acesso publico; site lido so pelo CloudFront (Origin Access Control) | [smarthive.yaml](../infra/smarthive.yaml) | URL do S3 sem assinatura responde 403 |

## A02 - Falhas criptograficas

| Controle | Onde |
|---|---|
| HTTPS ponta a ponta: navegador -> CloudFront (`redirect-to-https`/`https-only`) e CloudFront -> EC2 (`https-only`, TLS 1.2) | `Distribution` em [smarthive.yaml](../infra/smarthive.yaml) |
| Certificado valido na origem (Let's Encrypt via Caddy) | [infra/ec2/Caddyfile](../infra/ec2/Caddyfile) |
| HSTS em producao (API e site) | [backend/app/main.py](../backend/app/main.py), politica `SecurityHeadersPolicy` do CloudFront |
| Politica dos buckets nega qualquer acesso sem TLS (`aws:SecureTransport`) | [smarthive.yaml](../infra/smarthive.yaml) |
| Criptografia em repouso: S3 (SSE-S3), disco do EC2 (EBS criptografado) | [smarthive.yaml](../infra/smarthive.yaml) |
| Segredos fora do codigo: senha do Postgres gerada na instancia (arquivo 600); segredo de origem no SSM Parameter Store como `SecureString` | [infra/README.md](../infra/README.md) |
| Senhas de usuarios nunca chegam a API nem trafegam em texto: login por SRP no Cognito | [frontend/src/context/AuthContext.tsx](../frontend/src/context/AuthContext.tsx) |

## A03 - Injecao

| Controle | Onde |
|---|---|
| SQL sempre parametrizado com `psycopg.sql` (identificadores e placeholders), sem concatenacao de strings | `PostgresStore` em [backend/app/database.py](../backend/app/database.py) |
| Nomes de tabela restritos a uma lista fixa (`TABLES`) | `_table_identifier` em [database.py](../backend/app/database.py) |
| Entrada validada por schemas Pydantic (tipos, tamanhos, enums, valores >= 0) | [backend/app/schemas/](../backend/app/schemas/) |
| Restauracao do banco: chave e checksum validados por regex e transmitidos em base64 ao comando remoto | [infra/restore-db.sh](../infra/restore-db.sh), [infra/ec2/restore.sh](../infra/ec2/restore.sh) |

A ultima linha corrige uma vulnerabilidade real encontrada na revisao de seguranca: o
checksum vinha de metadados que a instancia pode escrever e era interpolado num comando
executado como root. Teste com metadado malicioso (`x';touch /tmp/pwned;'`): restauracao
recusada.

## A04 - Design inseguro

- **Falha segura**: a API **recusa iniciar** em producao se a autenticacao nao for o Cognito
  (`ENVIRONMENT=production` exige `AUTH_MODE=cognito`). Evidencia: `test_producao_exige_cognito`.
- **Menor exposicao**: API e Postgres nao publicam portas; so o Caddy escuta (443).
- **Backup somente escrita**: a credencial da instancia (compartilhada com a API) grava
  backups, mas nao le, nao lista e nao apaga. Uma API comprometida nao consegue roubar nem
  destruir os backups. Verificado em producao (listar/ler/apagar: acesso negado).
- **Restauracao pelo operador**: so com credenciais de administrador, URL pre-assinada de
  15 minutos, chave explicita e `--confirmar`.
- **Limite de requisicoes por IP** (janela de 60 s): 120 requisicoes gerais e 20 uploads,
  com resposta 429 e `Retry-After`. O IP usado e o anotado pelo CloudFront no
  `X-Forwarded-For`, entao um cabecalho forjado pelo cliente nao burla o limite.
  Enderecos IPv6 contam pelo prefixo /64 (um cliente costuma ter um /64 inteiro), e ha um
  teto de chaves por janela: acima dele, IPs novos dividem um balde de excedente com limite
  proprio (a memoria nao cresce e quem enche o teto nao bloqueia os demais clientes).
  Ver [backend/app/rate_limit.py](../backend/app/rate_limit.py). Evidencias:
  `test_limite_geral_por_ip`, `test_limite_de_upload`,
  `test_x_forwarded_for_falsificado_nao_burla_limite`, `test_ipv6_do_mesmo_bloco_64_conta_junto`,
  `test_teto_de_chaves_usa_balde_de_excedente`, `test_ip_invalido_vira_chave_unica`. Login e cadastro sao limitados
  pelo proprio Cognito.

## A05 - Configuracao incorreta de seguranca

| Controle | Onde | Evidencia |
|---|---|---|
| CORS restrito a origem do site, metodos e cabecalhos explicitos, sem credenciais | [main.py](../backend/app/main.py) | revisao de codigo |
| Cabecalhos: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Cache-Control: no-store` | [main.py](../backend/app/main.py) | `test_cabecalhos_de_seguranca` |
| Swagger/OpenAPI desligados em producao | [main.py](../backend/app/main.py) | `/api/docs` responde 404 em producao |
| Healthcheck publico sem detalhes internos; erros de banco nao expoem mensagens internas | [routers/health.py](../backend/app/routers/health.py) | revisao de codigo |
| Security Group: so a 443; portas 22 e 80 fechadas; sem SSH (administracao via SSM Session Manager) | [smarthive.yaml](../infra/smarthive.yaml) | porta 80 sem resposta |
| Acesso direto ao IP do servidor sem o cabecalho secreto recebe 403 | [Caddyfile](../infra/ec2/Caddyfile) | verificado a cada deploy por `install.sh` |
| IMDSv2 obrigatorio; creditos de CPU `standard` | `LaunchTemplate` em [smarthive.yaml](../infra/smarthive.yaml) | |
| Container da API roda com usuario sem privilegios | [backend/Dockerfile](../backend/Dockerfile) | |

## A06 - Componentes vulneraveis e desatualizados

- **Auditoria automatica no CI** a cada push e toda segunda-feira:
  `pip-audit` (backend) e `npm audit` (frontend, falha em high/critical de producao).
  Ver [.github/workflows/ci.yml](../.github/workflows/ci.yml).
- Versoes fixadas (`==` no Python, `package-lock.json` no Node).
- Na criacao do CI foram corrigidas vulnerabilidades reais: PyJWT, Starlette,
  python-multipart e `fast-xml-parser` (critica, via aws-amplify).
- Estado atual: **0 vulnerabilidades** no backend e nas dependencias de producao do frontend.

## A07 - Falhas de identificacao e autenticacao

| Controle | Onde |
|---|---|
| Autenticacao gerenciada pelo **Amazon Cognito** (sem armazenar senhas no projeto) | `UserPool` em [smarthive.yaml](../infra/smarthive.yaml) |
| Politica de senha: minimo 8 caracteres com maiuscula, minuscula e numero (validada tambem no frontend) | `UserPool` / [Login.tsx](../frontend/src/pages/Login.tsx) |
| Confirmacao de e-mail obrigatoria no cadastro; recuperacao de senha por codigo | `UserPool` / [AuthContext.tsx](../frontend/src/context/AuthContext.tsx) |
| Sem enumeracao de usuarios (`PreventUserExistenceErrors`); mensagem generica "e-mail ou senha incorretos" | `UserPoolClient` |
| Access token de 60 minutos, refresh de 30 dias, revogacao de tokens habilitada | `UserPoolClient` |
| A API valida assinatura (JWKS do User Pool, RS256), emissor, expiracao, `token_use=access` e `client_id` | [backend/app/auth.py](../backend/app/auth.py) |
| Opcao "manter conectado" desmarcada guarda a sessao so ate fechar o navegador | [AuthContext.tsx](../frontend/src/context/AuthContext.tsx) |
| **Verificacao em duas etapas (MFA) opcional** por aplicativo autenticador (TOTP), ativada pelo usuario em Configuracoes | `MfaConfiguration: OPTIONAL` / [MfaSettings.tsx](../frontend/src/components/auth/MfaSettings.tsx) |

Evidencia: `test_token_invalido_rejeitado` cobre token de outro app (`client_id`), ID token
no lugar do access token, emissor de outro User Pool e token expirado.

## A08 - Falhas de integridade de software e dados

- Uploads validados: extensao **e** content-type precisam bater com a lista permitida
  (JPG, PNG, WEBP, MP4, MOV, WEBM); tamanho limitado (50 MB). Evidencias:
  `test_upload_tipo_invalido` (HTML disfarcado de `.jpg` -> 415), `test_upload_acima_do_limite` (413),
  `test_upload_valido`.
- Nome do arquivo gerado no servidor (UUID); o nome enviado pelo usuario nao e usado.
- Backups com SHA-256 do arquivo nos metadados, conferido antes de restaurar.
- Deploy por pacotes no S3 privado + SSM, sem chaves de acesso na instancia.

## A09 - Falhas de log e monitoramento

- Logs dos containers com rotacao (10 MB x 3) na instancia.
- Historico de comandos do SSM (deploys e restauracoes) e historico de eventos do
  CloudTrail (90 dias, padrao da conta).
- **Limitacao**: nao ha alertas automaticos (ex.: CloudWatch Alarms) para erros ou tentativas
  de acesso. Ver "Limitacoes conhecidas".

## A10 - SSRF

- A API nao faz requisicoes para URLs informadas pelo usuario. A unica chamada externa e
  para o JWKS do Cognito, com endereco fixo derivado da configuracao.

---

## Evidencias

### Testes automatizados

[backend/tests/test_seguranca.py](../backend/tests/test_seguranca.py), executados no CI:

| Teste | Verifica |
|---|---|
| `test_rotas_exigem_token` | Rotas protegidas respondem 401 sem token |
| `test_health_publico` | Healthcheck continua publico |
| `test_token_invalido_rejeitado` (4 casos) | `client_id` errado, ID token, emissor errado, token expirado |
| `test_usuario_nao_acessa_dados_de_outro` | Listar, ler, editar, apagar e criar monitoramento em colmeia alheia |
| `test_upload_tipo_invalido` | Arquivo com tipo divergente -> 415 |
| `test_upload_acima_do_limite` | Arquivo acima do limite -> 413 |
| `test_upload_valido` | Upload permitido funciona |
| `test_cabecalhos_de_seguranca` | Cabecalhos de seguranca presentes |
| `test_producao_exige_cognito` | Configuracao insegura em producao e recusada |
| `test_limite_geral_por_ip` | 429 com `Retry-After` apos o limite; healthcheck fora do limite |
| `test_limite_de_upload` | Uploads tem limite proprio, separado do geral |
| `test_x_forwarded_for_falsificado_nao_burla_limite` | `X-Forwarded-For` forjado nao troca o IP contado |
| `test_ipv6_do_mesmo_bloco_64_conta_junto` | Trocar de endereco dentro do mesmo /64 nao burla o limite |
| `test_teto_de_chaves_usa_balde_de_excedente` | Excesso de IPs distintos nao esgota memoria nem bloqueia clientes conhecidos |
| `test_ip_invalido_vira_chave_unica` | Valores que nao sao IP nao viram chaves arbitrarias |

### Integracao continua

[.github/workflows/ci.yml](../.github/workflows/ci.yml): testes, `pip-audit`, `npm audit`,
`cfn-lint` e verificacao de sintaxe dos scripts.

### Verificacoes manuais em producao (25/10/2026)

| Verificacao | Resultado |
|---|---|
| `GET /api/colmeias` sem token / com token falso | 401 |
| Login real no Cognito, criar/listar/apagar colmeia | OK |
| Upload de imagem: URL pre-assinada / mesma URL sem assinatura | 200 / 403 |
| Upload de HTML disfarcado de `.png` | 415 |
| Acesso direto ao IP da instancia sem cabecalho secreto | 403 |
| Porta 80 da instancia | sem resposta |
| `/api/docs` em producao | 404 |
| Instancia tentando listar/ler/apagar backups | acesso negado |
| Restauracao com metadado malicioso | recusada |
| Rajada de 200 requisicoes do mesmo IP | 429 apos o limite, com `Retry-After` |
| Mesmo IP com `X-Forwarded-For` forjado | continua 429 |
| Outro IP durante o bloqueio | liberado (limite e por IP real) |
| Ativar MFA, sair e entrar: codigo errado / correto | recusado / acesso liberado |

## Limitacoes conhecidas e proximos passos

Escolhas feitas pelo orcamento do projeto (creditos limitados) ou ainda pendentes:

| Limitacao | Impacto | Mitigacao atual / proximo passo |
|---|---|---|
| Porta 443 do EC2 aberta a internet (exigida pela validacao do certificado) | Qualquer um alcanca o Caddy | Requisicoes sem o cabecalho secreto recebem 403 |
| Origem usa `sslip.io` (DNS de terceiros) | Dependencia externa | Trocar por dominio proprio |
| Limite de requisicoes em memoria, em um unico processo, so por IP | Contadores zeram ao reiniciar; ataque distribuido (muitos IPs) nao e contido | Limite tambem por usuario autenticado; AWS WAF (pago) para ataques distribuidos |
| Sem WAF | Sem filtragem de ataques comuns na borda | Custo; avaliar AWS WAF |
| MFA opcional, nao obrigatorio | Quem nao ativa depende so da senha | Tornar obrigatorio para administradores |
| Access token valido ate expirar mesmo apos excluir o usuario ou sair | Ate 60 min de acesso com um token vazado | Reduzir a validade ou checar revogacao (GlobalSignOut) na API |
| Sem alertas de monitoramento | Incidentes so sao percebidos manualmente | CloudWatch Alarms para 5xx e falhas de login |
| Banco no mesmo servidor da API | Comprometer a instancia expoe o banco | Backups somente escrita fora da instancia; RDS em privado se houver orcamento |
| Backups sem Object Lock | Sobrescrita possivel por quem tem `PutObject` (versionamento preserva 7 dias) | Habilitar Object Lock |
| 3 vulnerabilidades moderadas em dependencias de desenvolvimento (Tailwind 3) | Nao vao para producao | Migrar para Tailwind 4 |

## Como verificar

```bash
# Testes de seguranca
cd backend && pip install -r requirements-dev.txt && python -m pytest -v tests

# Auditoria de dependencias
pip install pip-audit && pip-audit -r backend/requirements.txt
cd frontend && npm audit --omit=dev

# Validacao da infraestrutura
pip install cfn-lint && cfn-lint infra/smarthive.yaml
```
