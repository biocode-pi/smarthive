import { Edit3, MapPin, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Colmeia } from "../../types";
import { formatDate } from "../../utils/formatters";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";

interface HiveCardProps {
  colmeia: Colmeia;
  onEdit: (colmeia: Colmeia) => void;
  onDelete: (colmeia: Colmeia) => void;
}

export function HiveCard({ colmeia, onEdit, onDelete }: HiveCardProps) {
  return (
    <article className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{colmeia.nome}</h3>
            <StatusBadge status={colmeia.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {colmeia.especie} {colmeia.codigo ? `- ${colmeia.codigo}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-hive-700" />
          {colmeia.localizacao || "Localizacao nao informada"}
        </p>
        <p>Instalada em: {formatDate(colmeia.instalada_em)}</p>
        {colmeia.descricao ? <p className="line-clamp-2">{colmeia.descricao}</p> : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to={`/colmeias/${colmeia.id}`}
          className="focus-ring inline-flex min-h-10 items-center justify-center rounded-lg border border-hive-600 bg-hive-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-hive-700"
        >
          Ver detalhes
        </Link>
        <Button type="button" variant="secondary" icon={<Edit3 className="h-4 w-4" />} onClick={() => onEdit(colmeia)}>
          Editar
        </Button>
        <Button type="button" variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(colmeia)}>
          Excluir
        </Button>
      </div>
    </article>
  );
}

