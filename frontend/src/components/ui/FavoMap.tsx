import { useId } from "react";
import type { StatusColmeia } from "../../types";
import { cn } from "../../utils/classNames";

/**
 * Mapa do meliponario em forma de favo: cada hexagono e uma colmeia, colorida pelo
 * status. As celulas ocupam o favo em espiral a partir do centro, como um favo cresce;
 * as posicoes vazias do anel atual aparecem so como contorno.
 */

export interface CelulaFavo {
  id: string;
  codigo: string;
  nome: string;
  status: StatusColmeia;
  detalhe?: string;
}

const RAIO = 46;
const LARGURA = Math.sqrt(3) * RAIO;

// Mesmos tons pastel dos selos de status do app mobile (com texto escuro, contraste AA).
const CORES: Record<StatusColmeia, { fill: string; texto: string; rotulo: string }> = {
  ativa: { fill: "#cff8cc", texto: "#1a6b12", rotulo: "Em dia" },
  observacao: { fill: "#fae596", texto: "#645f46", rotulo: "Em observação" },
  risco: { fill: "#f6c0c0", texto: "#a40000", rotulo: "Em risco" },
  inativa: { fill: "#d9d9d9", texto: "#121515", rotulo: "Inativa" },
};

const DIRECOES: Array<[number, number]> = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

/** Coordenadas axiais em espiral: centro, anel 1 (6), anel 2 (12)... */
function espiral(quantidade: number): Array<[number, number]> {
  const posicoes: Array<[number, number]> = [[0, 0]];
  for (let anel = 1; posicoes.length < quantidade; anel += 1) {
    let [q, r] = [-anel, anel];
    for (const [dq, dr] of DIRECOES) {
      for (let passo = 0; passo < anel; passo += 1) {
        posicoes.push([q, r]);
        q += dq;
        r += dr;
      }
    }
  }
  return posicoes;
}

function tamanhoDoFavo(quantidade: number): number {
  // Completa o anel atual para o favo ficar fechado (1, 7, 19, 37...).
  let total = 1;
  for (let anel = 1; total < quantidade; anel += 1) total += 6 * anel;
  return total;
}

function pontosHexagono(cx: number, cy: number, raio: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angulo = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + raio * Math.cos(angulo)).toFixed(1)},${(cy + raio * Math.sin(angulo)).toFixed(1)}`;
  }).join(" ");
}

export function resumoDoFavo(celulas: CelulaFavo[]): string {
  const contagem = (status: StatusColmeia) => celulas.filter((c) => c.status === status).length;
  return `${celulas.length} colmeias: ${contagem("ativa")} ativas, ${contagem("observacao")} em observação, ${contagem("risco")} em risco`;
}

interface FavoMapProps {
  celulas: CelulaFavo[];
  onSelecionar?: (id: string) => void;
  className?: string;
  titulo?: string;
  /** Cor da borda entre as celulas; use a cor do fundo para o favo "recortado". */
  corDoContorno?: string;
}

export function FavoMap({
  celulas,
  onSelecionar,
  className,
  titulo = "Mapa do meliponário",
  corDoContorno = "#ffffff",
}: FavoMapProps) {
  const tituloId = useId();
  const total = Math.max(tamanhoDoFavo(celulas.length), 7);
  const posicoes = espiral(total).map(([q, r]) => ({
    x: LARGURA * (q + r / 2),
    y: RAIO * 1.5 * r,
  }));

  const margem = RAIO + 6;
  const xs = posicoes.map((p) => p.x);
  const ys = posicoes.map((p) => p.y);
  const minX = Math.min(...xs) - margem;
  const minY = Math.min(...ys) - margem;
  const largura = Math.max(...xs) - Math.min(...xs) + margem * 2;
  const altura = Math.max(...ys) - Math.min(...ys) + margem * 2;

  return (
    <svg
      viewBox={`${minX} ${minY} ${largura} ${altura}`}
      className={cn("h-auto w-full", className)}
      role="group"
      aria-labelledby={tituloId}
    >
      <title id={tituloId}>{`${titulo}. ${resumoDoFavo(celulas)}.`}</title>
      {posicoes.map((p, indice) => {
        const celula = celulas[indice];
        if (!celula) {
          return (
            <polygon
              key={`vazia-${indice}`}
              points={pontosHexagono(p.x, p.y, RAIO - 3)}
              fill="none"
              stroke="#e0d39a"
              strokeDasharray="4 5"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          );
        }
        const cor = CORES[celula.status] ?? CORES.inativa;
        const interativa = Boolean(onSelecionar);
        return (
          <g
            key={celula.id}
            className={cn(
              "origin-center outline-none [transform-box:fill-box]",
              interativa && "cursor-pointer transition-transform duration-150 hover:scale-[1.04] focus-visible:scale-[1.04]",
            )}
            role={interativa ? "link" : "img"}
            tabIndex={interativa ? 0 : undefined}
            aria-label={`${celula.nome} (${celula.codigo}): ${cor.rotulo}${celula.detalhe ? `, ${celula.detalhe}` : ""}`}
            onClick={interativa ? () => onSelecionar?.(celula.id) : undefined}
            onKeyDown={
              interativa
                ? (evento) => {
                    if (evento.key === "Enter" || evento.key === " ") {
                      evento.preventDefault();
                      onSelecionar?.(celula.id);
                    }
                  }
                : undefined
            }
          >
            <polygon points={pontosHexagono(p.x, p.y, RAIO - 3)} fill={cor.fill} stroke={corDoContorno} strokeWidth={3} />
            <text
              x={p.x}
              y={p.y + (celula.detalhe ? -4 : 4)}
              textAnchor="middle"
              fill={cor.texto}
              className="font-sans text-[12.5px] font-bold"
            >
              {celula.codigo}
            </text>
            {celula.detalhe ? (
              <text x={p.x} y={p.y + 13} textAnchor="middle" fill={cor.texto} className="font-sans text-[10.5px]" opacity={0.9}>
                {celula.detalhe}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function LegendaFavo({ celulas }: { celulas: CelulaFavo[] }) {
  const itens: StatusColmeia[] = ["ativa", "observacao", "risco"];
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
      {itens.map((status) => (
        <li key={status} className="inline-flex items-center gap-2">
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
            <polygon points={pontosHexagono(6, 6, 6)} fill={CORES[status].fill} />
          </svg>
          {CORES[status].rotulo}
          <span className="tabular font-semibold text-ink">{celulas.filter((c) => c.status === status).length}</span>
        </li>
      ))}
    </ul>
  );
}
