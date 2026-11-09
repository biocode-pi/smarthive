import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "../../utils/classNames";

// Ponto de repouso de um gesto pela inercia, com a desaceleracao da rolagem do iOS
// (WWDC 2018, "Designing Fluid Interfaces"). Velocidade em px/s.
function projetar(velocidade: number, desaceleracao = 0.998) {
  return ((velocidade / 1000) * desaceleracao) / (1 - desaceleracao);
}

// Resistencia progressiva ao puxar alem do limite, em vez de travar de repente.
function elastico(excesso: number, dimensao: number, constante = 0.55) {
  return (excesso * dimensao * constante) / (dimensao + constante * Math.abs(excesso));
}

const SAIDA_MS = 320;

interface SheetProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: ReactNode;
  className?: string;
}

/**
 * Painel modal. No celular sobe da borda inferior e fecha arrastando para baixo (segue o
 * dedo 1:1 e respeita a inercia do gesto); no computador surge no centro. Fecha tambem com
 * Esc, no X ou tocando fora. Entrada e saida pelo mesmo caminho.
 */
export function Sheet({ aberto, onFechar, titulo, children, className }: SheetProps) {
  const [montado, setMontado] = useState(aberto);
  const [visivel, setVisivel] = useState(false);
  const painel = useRef<HTMLDivElement>(null);
  const fechar = useRef(onFechar);
  fechar.current = onFechar;
  const arraste = useRef<{ id: number; inicioY: number; amostras: { y: number; t: number }[] } | null>(null);
  const idTitulo = useId();

  // Monta fechado e marca visivel no quadro seguinte, para a transicao de entrada rodar.
  // Ao fechar, espera a saida terminar antes de desmontar.
  useEffect(() => {
    if (aberto) {
      painel.current?.style.removeProperty("transition-duration");
      setMontado(true);
      let interno = 0;
      const externo = requestAnimationFrame(() => {
        interno = requestAnimationFrame(() => setVisivel(true));
      });
      return () => {
        cancelAnimationFrame(externo);
        cancelAnimationFrame(interno);
      };
    }
    setVisivel(false);
    const timer = window.setTimeout(() => setMontado(false), SAIDA_MS);
    return () => window.clearTimeout(timer);
  }, [aberto]);

  // Enquanto aberto: Esc fecha, a pagina nao rola por tras e o foco volta ao gatilho no fim.
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") fechar.current();
    };
    document.addEventListener("keydown", tecla);
    if (!painel.current?.contains(document.activeElement)) painel.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", tecla);
      anterior?.focus?.({ preventScroll: true });
    };
  }, [aberto]);

  function aoPressionar(event: PointerEvent<HTMLDivElement>) {
    const el = painel.current;
    if (!el || event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    if (!window.matchMedia("(max-width: 639px)").matches) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    arraste.current = { id: event.pointerId, inicioY: event.clientY, amostras: [{ y: event.clientY, t: event.timeStamp }] };
    el.style.transition = "none";
  }

  function aoMover(event: PointerEvent<HTMLDivElement>) {
    const a = arraste.current;
    const el = painel.current;
    if (!a || !el || a.id !== event.pointerId) return;
    a.amostras.push({ y: event.clientY, t: event.timeStamp });
    a.amostras = a.amostras.filter((s) => event.timeStamp - s.t <= 100);
    const dy = event.clientY - a.inicioY;
    const y = dy < 0 ? elastico(dy, el.offsetHeight) : dy;
    el.style.transform = `translateY(${y}px)`;
  }

  function aoSoltar(event: PointerEvent<HTMLDivElement>) {
    const a = arraste.current;
    const el = painel.current;
    if (!a || !el || a.id !== event.pointerId) return;
    arraste.current = null;
    const dy = Math.max(0, event.clientY - a.inicioY);
    const primeira = a.amostras[0];
    const dt = event.timeStamp - primeira.t;
    const velocidade = dt > 0 ? ((event.clientY - primeira.y) / dt) * 1000 : 0;
    const altura = el.offsetHeight;
    const fecha = dy + projetar(velocidade) > altura / 2;

    // Devolve o controle ao CSS: a transicao parte da posicao atual na tela. Num gesto
    // rapido, encurta a saida para acompanhar a velocidade do dedo.
    el.style.transition = "";
    el.style.transform = "";
    if (fecha) {
      if (velocidade > 0) {
        const ms = Math.min(SAIDA_MS, Math.max(140, ((altura - dy) / velocidade) * 1000 * 1.6));
        el.style.transitionDuration = `${Math.round(ms)}ms`;
      }
      fechar.current();
    }
  }

  if (!montado) return null;

  return (
    <div className="sheet fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" data-visivel={visivel}>
      <div className="sheet-scrim absolute inset-0" onClick={() => fechar.current()} aria-hidden="true" />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={cn(
          "sheet-painel relative flex max-h-[90vh] w-full flex-col rounded-t-card bg-honey-50 shadow-app focus:outline-none sm:max-w-md sm:rounded-card",
          className,
        )}
      >
        <div
          className="flex-shrink-0 touch-none select-none px-6 pt-2 sm:cursor-auto sm:pt-6"
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/20 sm:hidden" aria-hidden="true" />
          <div className="flex items-center justify-between gap-4">
            <h2 id={idTitulo} className="titulo-secao">
              {titulo}
            </h2>
            <button type="button" onClick={() => fechar.current()} className="focus-ring rounded-lg p-1" aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">{children}</div>
      </div>
    </div>
  );
}
