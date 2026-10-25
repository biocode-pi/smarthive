# Infraestrutura AWS do SmartHive

Toda a infraestrutura e descrita em [smarthive.yaml](smarthive.yaml) (CloudFormation)
e criada na stack `smarthive`, regiao `us-east-1`.

## Arquitetura

```text
                   Usuario (navegador / app mobile)
                                 |
                              HTTPS
                                 |
                    +------------v-------------+
                    |   Amazon CloudFront      |  dominio unico *.cloudfront.net
                    +-----+--------------+-----+
                          |              |
                 /* (site e plataforma)  /api/*
                          |              |
          +---------------v--+     +-----v---------------------------+
          | S3 (site)        |     | EC2 t4g.micro (Amazon Linux)    |
          | privado, via OAC |     |  Docker Compose:                |
          +------------------+     |   - Caddy (HTTPS 443, checa     |
                                   |     cabecalho X-Origin-Verify)  |
                                   |   - API FastAPI (sem porta)     |
                                   |   - PostgreSQL 16 (sem porta)   |
                                   +-----+-----------------+---------+
                                         |                 |
                              IAM Role   |                 | valida JWT (JWKS)
                          +--------------v---+     +-------v-----------+
                          | S3 (midias)      |     | Amazon Cognito    |
                          | privado, URLs    |     | User Pool         |
                          | pre-assinadas    |     | (login web/mobile)|
                          +------------------+     +-------------------+
```

| Recurso | Funcao |
|---|---|
| Cognito User Pool + App Client | Cadastro, login (SRP), confirmacao por e-mail e recuperacao de senha |
| S3 `SiteBucket` | Build do frontend, lido so pelo CloudFront (Origin Access Control) |
| S3 `UploadsBucket` | Imagens e videos, privado, criptografado, versionado |
| S3 `DeployBucket` | Pacotes de release do backend |
| S3 `BackupBucket` | Backups diarios do Postgres, retidos por 30 dias |
| CloudFront | HTTPS, cache do site, roteamento de `/api/*` para o EC2, cabecalhos de seguranca |
| EC2 t4g.micro | Caddy + API + Postgres em Docker; sem SSH, administrado por SSM Session Manager |
| Elastic IP | Endereco fixo da origem da API |

## Seguranca

- HTTPS ponta a ponta: navegador -> CloudFront e CloudFront -> EC2. Na origem, o Caddy
  usa certificado Let's Encrypt para `<ip>.sslip.io` (DNS publico gratuito que resolve
  para o IP; o Let's Encrypt nao emite para nomes `amazonaws.com`).
- O CloudFront envia o cabecalho secreto `X-Origin-Verify`; o Caddy responde 403 a quem
  acessa o IP direto. O segredo fica no SSM Parameter Store (`/smarthive/origin-secret`,
  SecureString) e e lido pela instancia via IAM Role.
- O Security Group abre so a 443 (exigida pela validacao TLS-ALPN do certificado); portas
  22 e 80 fechadas. API e Postgres nao publicam portas.
- A senha do Postgres e gerada na propria instancia (`/opt/smarthive/db.env`, permissao 600).
- A instancia usa IAM Role com permissao minima (gravar/ler `usuarios/*` no bucket de midias,
  ler pacotes de deploy e o segredo de origem). Nenhuma chave de acesso AWS fica em codigo ou `.env`.
- Buckets com bloqueio de acesso publico, criptografia e politica que nega acesso sem TLS.
- IMDSv2 obrigatorio e disco criptografado.

## Custo estimado (us-east-1)

| Item | US$/mes |
|---|---|
| EC2 t4g.micro (creditos de CPU "standard") | ~6,10 |
| Disco gp3 20 GB | ~1,60 |
| IPv4 publico (Elastic IP) | ~3,60 |
| S3, CloudFront, Cognito (ate 10 mil usuarios ativos) | centavos |
| **Total** | **~11,50** |

## Comandos

Pre-requisitos: AWS CLI configurado (`aws sts get-caller-identity`), Git for Windows e Node.js.
No PowerShell, `bash` abre o WSL (e falha sem distribuicao instalada); use os atalhos `.cmd`.

```bash
# Criar o segredo de origem e a infraestrutura (uma vez)
aws ssm put-parameter --name /smarthive/origin-secret --type SecureString \
  --value "$(openssl rand -hex 32)"
aws cloudformation create-stack --stack-name smarthive \
  --template-body file://infra/smarthive.yaml --capabilities CAPABILITY_IAM \
  --parameters ParameterKey=VpcId,ParameterValue=<vpc-padrao> \
               ParameterKey=SubnetId,ParameterValue=<subnet-publica> \
               ParameterKey=OriginSecret,ParameterValue="$(aws ssm get-parameter \
                 --name /smarthive/origin-secret --with-decryption \
                 --query Parameter.Value --output text)"

# Atualizar a stack depois de mudar o template
aws cloudformation update-stack --stack-name smarthive \
  --template-body file://infra/smarthive.yaml --capabilities CAPABILITY_IAM \
  --parameters ParameterKey=VpcId,UsePreviousValue=true \
               ParameterKey=SubnetId,UsePreviousValue=true \
               ParameterKey=OriginSecret,UsePreviousValue=true

# Publicar o backend (API + banco) no EC2
bash infra/deploy-backend.sh        # Git Bash
.\infra\deploy-backend.cmd          # PowerShell / CMD

# Publicar o frontend no S3/CloudFront
bash infra/deploy-frontend.sh       # Git Bash
.\infra\deploy-frontend.cmd         # PowerShell / CMD

# Ver as saidas (URL do site, ids do Cognito, buckets)
aws cloudformation describe-stacks --stack-name smarthive --query "Stacks[0].Outputs"

# Acessar o terminal da instancia (sem SSH)
aws ssm start-session --target <InstanceId>
```

## Backup do banco

Um timer do systemd na instancia (`smarthive-backup.timer`) roda todo dia as 03:00 UTC
(00:00 em Brasilia) e envia um `pg_dump` comprimido para o bucket `BackupBucket`, em
`postgres/smarthive-<data>.dump`. Os backups ficam 30 dias e depois sao apagados
automaticamente. Custo: centavos por mes.

Comandos na instancia (`aws ssm start-session --target <InstanceId>`):

```bash
sudo systemctl list-timers smarthive-backup.timer      # proximo backup agendado
sudo /opt/smarthive/current/backup.sh                  # backup na hora
sudo /opt/smarthive/current/restore.sh latest --confirmar                              # restaura o mais recente
sudo /opt/smarthive/current/restore.sh postgres/smarthive-<data>.dump --confirmar      # restaura um especifico
```

A restauracao **substitui** os dados atuais e para a API durante o processo.

## Pausar ou remover

- **Pausar** (economiza ~US$ 6/mes): `aws ec2 stop-instances --instance-ids <InstanceId>`.
  O Elastic IP continua sendo cobrado. Volte com `start-instances`.
- **Remover tudo**: esvazie os buckets e rode
  `aws cloudformation delete-stack --stack-name smarthive`. O User Pool e os
  buckets de midias e de backup tem `DeletionPolicy: Retain` e precisam ser apagados manualmente.
  O banco vive no disco da instancia e e apagado junto com ela (os backups ficam no S3). Apague tambem o
  parametro `/smarthive/origin-secret` no SSM.
