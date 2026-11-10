import logo from "../../assets/logo.png";
import { cn } from "../../utils/classNames";

interface MarcaProps {
  /** "linha": logo ao lado do nome (cabecalhos). "pilha": logo em cima, como na abertura do app. */
  variante?: "linha" | "pilha";
  /** Exibe "PROJECT" abaixo do nome, como no app. */
  comTagline?: boolean;
  className?: string;
}

/** Marca do app: abelha + "Smart Hive" (Poppins Bold) + "PROJECT" (Inter SemiBold espacado). */
export function Marca({ variante = "linha", comTagline = false, className }: MarcaProps) {
  if (variante === "pilha") {
    return (
      <div className={cn("flex flex-col items-center text-ink", className)}>
        <img src={logo} alt="" className="h-28 w-28 object-contain" />
        <p className="mt-6 font-brand text-3xl font-bold tracking-[3px]">Smart Hive</p>
        {comTagline ? <p className="mt-3 font-tagline text-sm font-semibold tracking-[7px]">PROJECT</p> : null}
      </div>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <img src={logo} alt="" className="h-9 w-9 object-contain" />
      <span className="flex flex-col leading-none">
        <span className="font-brand text-lg font-bold tracking-[1.5px]">Smart Hive</span>
        {comTagline ? <span className="mt-1 font-tagline text-[9px] font-semibold tracking-[4px]">PROJECT</span> : null}
      </span>
    </span>
  );
}
