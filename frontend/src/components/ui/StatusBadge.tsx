import type { StatusColmeia } from "../../types";
import { cn } from "../../utils/classNames";
import { CORES_STATUS, pontosHexagono } from "./FavoMap";

export function Hexa({ status, className }: { status: StatusColmeia; className?: string }) {
  const cor = CORES_STATUS[status] ?? CORES_STATUS.inativa;
  return (
    <svg viewBox="0 0 14 14" className={cn("h-3.5 w-3.5 flex-shrink-0", className)} aria-hidden="true">
      <polygon points={pontosHexagono(7, 7, 6.2)} fill={cor.fill} stroke={cor.texto} strokeWidth={1.3} />
    </svg>
  );
}

export function StatusBadge({ status }: { status: StatusColmeia }) {
  const cor = CORES_STATUS[status] ?? CORES_STATUS.inativa;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-bold" style={{ color: cor.texto }}>
      <Hexa status={status} />
      {cor.rotulo}
    </span>
  );
}
