import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";

export function NotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <EmptyState title="Pagina nao encontrada" description="A rota solicitada nao faz parte do MVP SmartHive." />
      <div className="mt-4 text-center">
        <Link className="font-semibold text-hive-700 hover:text-hive-800" to="/">
          Voltar para o dashboard
        </Link>
      </div>
    </div>
  );
}

