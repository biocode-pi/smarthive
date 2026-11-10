import { useEffect, useState, type CSSProperties } from "react";

const abelhas = [
  { sentido: "entra", y: 46, dur: 2.6, atraso: 0, x: 60 },
  { sentido: "entra", y: 70, dur: 3.1, atraso: 0.9, x: 150 },
  { sentido: "sai", y: 58, dur: 2.8, atraso: 0.4, x: 110 },
  { sentido: "entra", y: 38, dur: 3.4, atraso: 1.7, x: 200 },
  { sentido: "sai", y: 80, dur: 3.0, atraso: 1.3, x: 30 },
  { sentido: "entra", y: 62, dur: 2.4, atraso: 2.2, x: 235 },
  { sentido: "sai", y: 44, dur: 3.3, atraso: 2.6, x: 175 },
] as const;

const dia = [4, 3, 2, 2, 3, 6, 14, 26, 38, 47, 52, 55, 57, 54, 50, 46, 41, 33, 22, 12, 8, 6, 5, 4];

function trilha(valores: number[], largura: number, altura: number) {
  const max = Math.max(...valores);
  const passo = largura / (valores.length - 1);
  return valores.map((v, i) => `${i ? "L" : "M"}${(i * passo).toFixed(1)} ${(altura - (v / max) * altura).toFixed(1)}`).join(" ");
}

export function InstrumentoEntrada() {
  const [contagem, setContagem] = useState({ entradas: 22, saidas: 19 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setContagem((c) => (Math.random() < 0.55 ? { ...c, entradas: c.entradas + 1 } : { ...c, saidas: c.saidas + 1 }));
    }, 1400);
    return () => window.clearInterval(timer);
  }, []);

  const total = contagem.entradas + contagem.saidas;

  return (
    <figure className="instrumento rounded-[28px] bg-ink p-5 text-white shadow-[0_24px_48px_-16px_rgba(18,21,21,0.55)] sm:p-6">
      <div className="flex items-center justify-between gap-3 font-dados text-[11px] uppercase tracking-[0.12em] text-white/60">
        <span>
          <span className="text-honey-500">JAT-001</span> · Jataí · entrada
        </span>
        <span className="rounded-full border border-white/20 px-2 py-0.5 text-white/70">simulação</span>
      </div>

      <svg viewBox="0 0 400 120" className="mt-4 w-full" role="img" aria-label="Abelhas entrando e saindo da colmeia">
        <defs>
          <pattern id="veio" width="10" height="120" patternUnits="userSpaceOnUse">
            <path d="M0 0v120M5 0c2 30-2 60 0 120" stroke="#5b3300" strokeWidth="1" fill="none" opacity="0.6" />
          </pattern>
        </defs>
        <rect x="292" y="0" width="108" height="120" rx="6" fill="#8f4f00" />
        <rect x="292" y="0" width="108" height="120" rx="6" fill="url(#veio)" />
        <rect x="270" y="50" width="26" height="20" rx="4" fill="#e58d0c" />
        <rect x="266" y="54" width="8" height="12" rx="3" fill="#121515" />
        <line x1="0" y1="112" x2="262" y2="112" stroke="white" strokeOpacity="0.12" strokeDasharray="2 6" />

        {abelhas.map((a, i) => (
          <g
            key={i}
            className={`abelha abelha-${a.sentido}`}
            style={
              {
                "--y": `${a.y}px`,
                "--x": `${a.x}px`,
                animationDuration: `${a.dur}s`,
                animationDelay: `-${a.atraso}s`,
              } as CSSProperties
            }
          >
            <g transform={a.sentido === "sai" ? "scale(-1.6 1.6)" : "scale(1.6)"}>
              <ellipse cx="-0.5" cy="-3.5" rx="4" ry="2.5" fill="white" opacity="0.45" />
              <ellipse cx="0" cy="0" rx="5.5" ry="3.2" fill="#ffcc00" />
              <rect x="-1" y="-3.2" width="1.6" height="6.4" fill="#121515" opacity="0.7" />
              <circle cx="4.6" cy="0" r="1.6" fill="#121515" />
            </g>
          </g>
        ))}
      </svg>

      <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4 border-t border-white/10 pt-5">
        <div>
          <p className="font-dados text-[11px] uppercase tracking-[0.12em] text-white/60">Movimentos na última hora</p>
          <p key={total} className="numero-pulso mt-1 font-dados text-5xl font-medium tabular-nums text-honey-500" aria-live="off">
            {total}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-1 font-dados text-xs tabular-nums">
          <dt className="text-white/60">entradas</dt>
          <dd className="text-right">{contagem.entradas}</dd>
          <dt className="text-white/60">saídas</dt>
          <dd className="text-right">{contagem.saidas}</dd>
        </dl>
      </div>

      <div className="mt-5">
        <svg viewBox="0 0 240 40" className="grafico-surge h-10 w-full" preserveAspectRatio="none" aria-hidden="true">
          <path d={trilha(dia, 240, 36) + " V40 H0 Z"} fill="#ffcc00" opacity="0.12" />
          <path d={trilha(dia, 240, 36)} fill="none" stroke="#ffcc00" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="mt-1 flex justify-between font-dados text-[10px] text-white/50">
          <span>00h</span>
          <span>12h</span>
          <span>agora</span>
        </div>
      </div>
      <figcaption className="sr-only">
        Ilustração: na plataforma, a contagem vem das capturas feitas na entrada de cada colmeia.
      </figcaption>
    </figure>
  );
}
