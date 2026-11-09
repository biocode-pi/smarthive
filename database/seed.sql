-- Dados de exemplo do usuario 'dev-local' (AUTH_MODE=dev).
-- Para ver estes dados com um usuario real do Cognito, troque o dono depois:
--   update colmeias set usuario_id = '<sub-do-cognito>' where usuario_id = 'dev-local';
--   (repita para monitoramentos e alertas)

insert into colmeias (id, usuario_id, nome, codigo, especie, localizacao, descricao, status, instalada_em)
values
  (
    'colmeia-jatai-campus',
    'dev-local',
    'Colmeia Jatai - Campus',
    'JAT-001',
    'Jatai',
    'Horto experimental',
    'Colmeia piloto usada para validacao do fluxo visual com celular.',
    'ativa',
    current_date
  ),
  (
    'colmeia-mandacaia-lab',
    'dev-local',
    'Mandacaia - Meliponario',
    'MAN-002',
    'Mandacaia',
    'Meliponario escola',
    'Unidade em observacao para comparacao de comportamento.',
    'observacao',
    current_date
  )
on conflict (id) do nothing;

insert into monitoramentos (
  id,
  usuario_id,
  colmeia_id,
  origem,
  duracao_segundos,
  movimentos_estimados,
  abelhas_entrando,
  abelhas_saindo,
  fluxo_estimado,
  possivel_invasor,
  observacoes,
  analise_experimental
)
values (
  'mon-campus-001',
  'dev-local',
  'colmeia-jatai-campus',
  'sensor_celular',
  60,
  42,
  18,
  16,
  34,
  false,
  'Captura experimental com celular apontado para a entrada.',
  '{"nivel_atividade":"moderado","saldo_fluxo":2,"observacao":"Analise heuristica inicial, sem IA real."}'::jsonb
)
on conflict (id) do nothing;

insert into alertas (
  id,
  usuario_id,
  colmeia_id,
  monitoramento_id,
  tipo,
  severidade,
  titulo,
  mensagem,
  resolvido
)
values (
  'alerta-observacao-campus',
  'dev-local',
  'colmeia-jatai-campus',
  'mon-campus-001',
  'observacao',
  'baixa',
  'Validar posicionamento do celular',
  'Revisar enquadramento da entrada da colmeia nas proximas capturas.',
  false
)
on conflict (id) do nothing;

