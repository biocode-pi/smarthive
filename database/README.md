# Banco de dados SmartHive

PostgreSQL 16. Em producao roda no **Amazon RDS**; localmente, no container `db`
do Docker Compose, que aplica `schema.sql` e `seed.sql` na primeira subida.

## Aplicar no RDS

```bash
psql "postgresql://smarthive:SENHA@HOST-DO-RDS:5432/smarthive?sslmode=require" -f schema.sql
```

O `seed.sql` e opcional e cria dados de exemplo do usuario `dev-local`.

## Entidades

Todas as tabelas tem `usuario_id` (o `sub` do usuario no Amazon Cognito). A API
filtra cada consulta por esse campo.

- `colmeias`: cadastro das colmeias de abelhas nativas (`codigo` unico por usuario).
- `monitoramentos`: historico de observacoes, fluxo, midia e possivel invasor.
- `alertas`: observacoes criticas, manuais ou geradas pelo sistema.
- `capturas_sensor_celular`: camada experimental em que o celular simula o sensor visual.

## Midias

Imagens e videos ficam no Amazon S3 (bucket privado). A coluna `midia_url` guarda
`s3:<chave>`, e a API devolve uma URL pre-assinada temporaria ao ler o registro.
