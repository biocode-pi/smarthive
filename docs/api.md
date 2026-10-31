# API do SmartHive (para o app mobile)

Base: `https://<dominio>/api`. Todas as rotas, exceto `GET /health`, exigem o access token do
Amazon Cognito (o mesmo User Pool do web) no cabecalho `Authorization: Bearer <token>`.
Cada usuario so enxerga os proprios dados; ids de outro usuario respondem 404.

Limite: 120 requisicoes por minuto por IP (20 uploads por minuto). Acima disso, 429 com `Retry-After`.

## Meliponarios (locais que agrupam colmeias)

| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/meliponarios?busca=&com_alerta=` | Lista com `total_colmeias` e `alertas_abertos`. `busca` procura em nome, cidade e endereco (ignora acentos). |
| POST | `/meliponarios` | Cria. Corpo: `nome` (obrigatorio), `endereco`, `cidade`, `uf`, `descricao`. |
| GET | `/meliponarios/{id}` | Detalhe com os agregados. |
| GET | `/meliponarios/{id}/colmeias` | Colmeias do meliponario. |
| PUT | `/meliponarios/{id}` | Atualiza os campos enviados. |
| DELETE | `/meliponarios/{id}` | Apaga o meliponario; as colmeias ficam sem meliponario (nao sao apagadas). |

Exemplo de item da lista (equivale ao card "TEST-1 / 12 colmeias / EM DIA" do app):

```json
{
  "id": "a1b2...",
  "nome": "Meliponário do Horto",
  "endereco": "Rua Guará, 1385",
  "cidade": "Jacupiranga",
  "uf": "SP",
  "descricao": null,
  "total_colmeias": 12,
  "alertas_abertos": 0,
  "criado_em": "2026-10-30T21:00:00Z",
  "atualizado_em": "2026-10-30T21:00:00Z"
}
```

`alertas_abertos == 0` corresponde ao selo "Em dia"; maior que zero, ao selo "N alertas".

## Colmeias

`GET/POST /colmeias`, `GET/PUT/DELETE /colmeias/{id}`, `GET /colmeias/{id}/monitoramentos`.
O campo opcional `meliponario_id` vincula a colmeia a um meliponario do proprio usuario.
Apagar uma colmeia apaga tambem seus monitoramentos e alertas.

## Perfil do usuario (cadastro do app)

| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/perfil` | `telefone`, `notificacoes_email`, `consentimento_em`, `revogado_em`. |
| PUT | `/perfil` | Envie so o que mudar. `telefone`: com DDD, em qualquer formato (`"(11) 91234-5678"`); `null` remove. `notificacoes_email`: `true` registra a data do consentimento, `false` registra a revogacao. |

Nome, e-mail e senha continuam no Cognito (`signUp` com os atributos `email` e `name`).
O telefone e o aceite de notificacoes sao enviados ao `/perfil` logo apos o primeiro login,
porque a API so aceita usuarios autenticados.

## Excluir conta (LGPD)

`DELETE /conta` apaga todos os dados do usuario na plataforma (meliponarios, colmeias,
monitoramentos, alertas, capturas, perfil e midias no S3) e responde 204. Em seguida o app
deve excluir a conta no Cognito com o token do proprio usuario (Amplify `deleteUser()`) e
encerrar a sessao. Peca confirmacao antes (o web exige digitar o e-mail).

## Outras rotas

- `POST /monitoramentos` (multipart, com `arquivo` opcional) e `POST /sensor-celular/captura`.
- `GET /alertas`, `POST /alertas`, `PUT /alertas/{id}/resolver`.
- `GET /dashboard/resumo`.

Midias voltam em `midia_url` como link temporario (1 hora) para o S3.

## Termos

O app usa "Apiário"; o projeto e de **meliponicultura** (abelhas sem ferrao), entao a API e o
web usam **meliponário**. Sugestao: trocar "Apiários"/"Novo Apiário" no app por
"Meliponários"/"Novo meliponário".
