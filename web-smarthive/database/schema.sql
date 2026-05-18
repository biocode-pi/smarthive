create extension if not exists pgcrypto;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'smarthive-capturas',
  'smarthive-capturas',
  true,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists colmeias (
  id text primary key default gen_random_uuid()::text,
  nome text not null,
  codigo text unique,
  especie text not null,
  localizacao text,
  descricao text,
  status text not null default 'ativa'
    check (status in ('ativa', 'observacao', 'risco', 'inativa')),
  instalada_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists monitoramentos (
  id text primary key default gen_random_uuid()::text,
  colmeia_id text not null references colmeias(id) on delete cascade,
  data_hora timestamptz not null default now(),
  origem text not null default 'manual'
    check (origem in ('manual', 'sensor_celular', 'iot_futuro')),
  duracao_segundos integer check (duracao_segundos is null or duracao_segundos >= 0),
  movimentos_estimados integer check (movimentos_estimados is null or movimentos_estimados >= 0),
  abelhas_entrando integer check (abelhas_entrando is null or abelhas_entrando >= 0),
  abelhas_saindo integer check (abelhas_saindo is null or abelhas_saindo >= 0),
  fluxo_estimado integer check (fluxo_estimado is null or fluxo_estimado >= 0),
  temperatura_c numeric(5, 2),
  umidade_percentual numeric(5, 2),
  possivel_invasor boolean not null default false,
  observacoes text,
  midia_url text,
  analise_experimental jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists alertas (
  id text primary key default gen_random_uuid()::text,
  colmeia_id text references colmeias(id) on delete set null,
  monitoramento_id text references monitoramentos(id) on delete set null,
  tipo text not null default 'observacao'
    check (tipo in ('observacao', 'possivel_invasor', 'baixa_atividade', 'sistema')),
  severidade text not null default 'baixa'
    check (severidade in ('baixa', 'media', 'alta')),
  titulo text not null,
  mensagem text,
  resolvido boolean not null default false,
  criado_em timestamptz not null default now(),
  resolvido_em timestamptz
);

create table if not exists capturas_sensor_celular (
  id text primary key default gen_random_uuid()::text,
  colmeia_id text not null references colmeias(id) on delete cascade,
  monitoramento_id text references monitoramentos(id) on delete set null,
  duracao_segundos integer check (duracao_segundos is null or duracao_segundos >= 0),
  movimentos_estimados integer not null default 0 check (movimentos_estimados >= 0),
  abelhas_entrando integer not null default 0 check (abelhas_entrando >= 0),
  abelhas_saindo integer not null default 0 check (abelhas_saindo >= 0),
  possivel_invasor boolean not null default false,
  observacoes text,
  midia_url text,
  criado_em timestamptz not null default now()
);

alter table colmeias enable row level security;
alter table monitoramentos enable row level security;
alter table alertas enable row level security;
alter table capturas_sensor_celular enable row level security;

create index if not exists idx_monitoramentos_colmeia_data
  on monitoramentos (colmeia_id, data_hora desc);

create index if not exists idx_alertas_resolvido
  on alertas (resolvido, criado_em desc);

create index if not exists idx_alertas_colmeia_id
  on alertas (colmeia_id);

create index if not exists idx_alertas_monitoramento_id
  on alertas (monitoramento_id);

create index if not exists idx_capturas_sensor_celular_colmeia_id
  on capturas_sensor_celular (colmeia_id);

create index if not exists idx_capturas_sensor_celular_monitoramento_id
  on capturas_sensor_celular (monitoramento_id);

create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql
set search_path = public;

drop trigger if exists trg_colmeias_atualizado_em on colmeias;
create trigger trg_colmeias_atualizado_em
before update on colmeias
for each row execute function set_atualizado_em();

drop trigger if exists trg_monitoramentos_atualizado_em on monitoramentos;
create trigger trg_monitoramentos_atualizado_em
before update on monitoramentos
for each row execute function set_atualizado_em();

comment on table colmeias is 'Colmeias de abelhas nativas monitoradas pelo SmartHive.';
comment on table monitoramentos is 'Historico de monitoramentos manuais, por celular e futuramente IoT.';
comment on table alertas is 'Alertas manuais ou gerados por heuristicas/IA futura.';
comment on table capturas_sensor_celular is 'Capturas experimentais em que o celular simula o sensor visual.';
