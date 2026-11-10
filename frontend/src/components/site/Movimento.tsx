import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "../../utils/classNames";

export function ordem(indice: number) {
  return { "--i": indice } as CSSProperties;
}

function pedeMenosMovimento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useAnimacoesDoSite<T extends HTMLElement>() {
  const raizRef = useRef<T>(null);

  useLayoutEffect(() => {
    const raiz = raizRef.current;
    if (!raiz || pedeMenosMovimento()) return;
    raiz.dataset.animar = "";

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          (entrada.target as HTMLElement).dataset.visto = "";
          observador.unobserve(entrada.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    raiz.querySelectorAll("[data-revelar]").forEach((elemento) => observador.observe(elemento));

    const camadas = Array.from(raiz.querySelectorAll<HTMLElement>("[data-parallax]"));
    let quadro = 0;
    const aplicar = () => {
      quadro = 0;
      for (const camada of camadas) {
        camada.style.transform = `translate3d(0, ${window.scrollY * Number(camada.dataset.parallax)}px, 0)`;
      }
    };
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(aplicar);
    };
    window.addEventListener("scroll", aoRolar, { passive: true });

    return () => {
      observador.disconnect();
      window.removeEventListener("scroll", aoRolar);
      cancelAnimationFrame(quadro);
      delete raiz.dataset.animar;
    };
  }, []);

  return raizRef;
}

export function AbelhaDesenho({ className }: { className?: string }) {
  return (
    <svg viewBox="-9 -8 18 15" className={className} aria-hidden="true">
      <g className="abelha-asas">
        <ellipse cx="-1" cy="-3.8" rx="4.4" ry="2.6" fill="#ffffff" fillOpacity="0.75" stroke="#121515" strokeOpacity="0.35" strokeWidth="0.4" />
      </g>
      <ellipse cx="0" cy="0" rx="5.8" ry="3.4" fill="#ffcc00" stroke="#121515" strokeWidth="0.6" />
      <rect x="-2.6" y="-3.3" width="1.5" height="6.6" fill="#121515" />
      <rect x="0.6" y="-3.3" width="1.5" height="6.6" fill="#121515" />
      <circle cx="4.9" cy="0" r="1.8" fill="#121515" />
    </svg>
  );
}

export function Palavras({ texto, inicio = 0 }: { texto: string; inicio?: number }) {
  return (
    <>
      <span className="sr-only">{texto} </span>
      <span aria-hidden="true">
        {texto.split(" ").map((palavra, indice) => (
          <span key={indice}>
            <span className="palavra-caixa">
              <span className="palavra" style={ordem(inicio + indice)}>
                {palavra}
              </span>
            </span>{" "}
          </span>
        ))}
      </span>
    </>
  );
}

export function FavoFundo() {
  return (
    <div className="favo-fundo pointer-events-none absolute inset-x-0 -bottom-1/4 -top-1/4" data-parallax="0.18" aria-hidden="true">
      <svg className="h-full w-full">
        <defs>
          <pattern id="favo-hero" width="56" height="100" patternUnits="userSpaceOnUse">
            <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="#121515" strokeOpacity="0.09" />
            <path d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" fill="none" stroke="#121515" strokeOpacity="0.09" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#favo-hero)" />
      </svg>
    </div>
  );
}

const ENXAME = [
  { y: 12, dur: 15, atraso: 0, tam: 26 },
  { y: 62, dur: 19, atraso: 6, tam: 18 },
  { y: 34, dur: 13, atraso: 3, tam: 22 },
  { y: 80, dur: 17, atraso: 11, tam: 28 },
  { y: 22, dur: 21, atraso: 14, tam: 16 },
  { y: 50, dur: 16, atraso: 9, tam: 20 },
];

export function EnxameFundo() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {ENXAME.map((abelha, indice) => (
        <div
          key={indice}
          className="enxame-abelha absolute left-0"
          style={
            {
              top: `${abelha.y}%`,
              width: abelha.tam,
              animationDuration: `${abelha.dur}s`,
              animationDelay: `-${abelha.atraso}s`,
            } as CSSProperties
          }
        >
          <AbelhaDesenho className="w-full" />
        </div>
      ))}
    </div>
  );
}

const PONTOS_DO_RASTRO = 14;
const DISTANCIA_ENTRE_PONTOS = 34;

export function AbelhaGuia() {
  const [ativa, setAtiva] = useState(false);
  const corpo = useRef<HTMLDivElement>(null);
  const direcao = useRef<HTMLDivElement>(null);
  const pontos = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (!pedeMenosMovimento()) setAtiva(true);
  }, []);

  useEffect(() => {
    if (!ativa || !corpo.current || !direcao.current) return;
    const elementoCorpo = corpo.current;
    const elementoDirecao = direcao.current;

    const alvo = () => {
      const curso = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progresso = Math.min(1, Math.max(0, window.scrollY / curso));
      return {
        x: window.innerWidth * (0.5 + 0.44 * Math.sin(progresso * Math.PI * 5 + Math.PI / 2)),
        y: window.innerHeight * (0.16 + 0.68 * progresso),
      };
    };

    const posicao = alvo();
    const ultimoPonto = { ...posicao };
    let sentido = -1;
    let proximoPonto = 0;
    let quadro = 0;

    const desenhar = (dx = 0, dy = 0) => {
      if (Math.abs(dx) > 0.15) sentido = dx < 0 ? -1 : 1;
      const inclinacao = Math.max(-28, Math.min(28, dy * 2.4)) * sentido;
      elementoCorpo.style.transform = `translate3d(${posicao.x}px, ${posicao.y}px, 0)`;
      elementoDirecao.style.transform = `scaleX(${sentido}) rotate(${inclinacao}deg)`;
    };

    const soltarPonto = () => {
      const ponto = pontos.current[proximoPonto];
      proximoPonto = (proximoPonto + 1) % PONTOS_DO_RASTRO;
      if (!ponto) return;
      ponto.style.transform = `translate3d(${posicao.x}px, ${posicao.y}px, 0)`;
      ponto.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 1100, easing: "ease-out" });
    };

    const passo = () => {
      const destino = alvo();
      const dx = (destino.x - posicao.x) * 0.1;
      const dy = (destino.y - posicao.y) * 0.1;
      posicao.x += dx;
      posicao.y += dy;
      desenhar(dx, dy);

      if (Math.hypot(posicao.x - ultimoPonto.x, posicao.y - ultimoPonto.y) > DISTANCIA_ENTRE_PONTOS) {
        soltarPonto();
        Object.assign(ultimoPonto, posicao);
      }
      quadro = Math.hypot(destino.x - posicao.x, destino.y - posicao.y) > 0.4 ? requestAnimationFrame(passo) : 0;
    };

    const acordar = () => {
      if (!quadro) quadro = requestAnimationFrame(passo);
    };

    desenhar();
    window.addEventListener("scroll", acordar, { passive: true });
    window.addEventListener("resize", acordar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", acordar);
      window.removeEventListener("resize", acordar);
    };
  }, [ativa]);

  if (!ativa) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 hidden overflow-hidden lg:block" aria-hidden="true">
      {Array.from({ length: PONTOS_DO_RASTRO }, (_, indice) => (
        <span
          key={indice}
          ref={(elemento) => {
            pontos.current[indice] = elemento;
          }}
          className="absolute left-0 top-0 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-ink opacity-0"
        />
      ))}
      <div ref={corpo} className="absolute left-0 top-0 -ml-6 -mt-6 will-change-transform">
        <div ref={direcao}>
          <AbelhaDesenho className={cn("abelha-paira h-12 w-12 drop-shadow-[0_4px_6px_rgba(18,21,21,0.3)]")} />
        </div>
      </div>
    </div>
  );
}
