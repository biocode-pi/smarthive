import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";

export function NotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <EmptyState title="Página não encontrada" description="A rota solicitada não faz parte do MVP Smart Hive." />
      <div className="mt-4 text-center">
        <Link className="font-semibold text-hive-700 hover:text-hive-800" to="/app">
          Voltar para o dashboard
        </Link>
      </div>
    </div>
  );
}

