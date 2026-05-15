export type StatusColmeia = "ativa" | "observacao" | "risco" | "inativa";
export type OrigemMonitoramento = "manual" | "sensor_celular" | "iot_futuro";
export type SeveridadeAlerta = "baixa" | "media" | "alta";
export type TipoAlerta = "observacao" | "possivel_invasor" | "baixa_atividade" | "sistema";

export interface Colmeia {
  id: string;
  nome: string;
  codigo?: string | null;
  especie: string;
  localizacao?: string | null;
  descricao?: string | null;
  status: StatusColmeia;
  instalada_em?: string | null;
  criado_em: string;
  atualizado_em?: string | null;
}

export interface Monitoramento {
  id: string;
  colmeia_id: string;
  data_hora?: string | null;
  origem: OrigemMonitoramento;
  duracao_segundos?: number | null;
  movimentos_estimados?: number | null;
  abelhas_entrando?: number | null;
  abelhas_saindo?: number | null;
  fluxo_estimado?: number | null;
  temperatura_c?: number | null;
  umidade_percentual?: number | null;
  possivel_invasor: boolean;
  observacoes?: string | null;
  midia_url?: string | null;
  analise_experimental?: {
    nivel_atividade?: string;
    fluxo_total?: number;
    saldo_fluxo?: number;
    observacao?: string;
  } | null;
  criado_em: string;
  atualizado_em?: string | null;
}

export interface Alerta {
  id: string;
  colmeia_id?: string | null;
  monitoramento_id?: string | null;
  tipo: TipoAlerta;
  severidade: SeveridadeAlerta;
  titulo: string;
  mensagem?: string | null;
  resolvido: boolean;
  criado_em: string;
  resolvido_em?: string | null;
}

export interface DashboardResumo {
  total_colmeias: number;
  colmeias_ativas: number;
  colmeias_em_observacao: number;
  colmeias_em_risco: number;
  monitoramentos_realizados: number;
  alertas_abertos: number;
  ultimos_monitoramentos: Monitoramento[];
  alertas_recentes: Alerta[];
  sensor_celular: {
    ativo: boolean;
    descricao: string;
  };
}

export interface SensorCelularResposta {
  monitoramento_id: string;
  captura_id: string;
  mensagem: string;
}

