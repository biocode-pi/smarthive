import { Link } from "react-router-dom";
import { botao } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";

export function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <EmptyState
        title="Página não encontrada"
        description="Este endereço não existe no Smart Hive. Ele pode ter mudado ou estar digitado errado."
        acao={
          <Link className={botao("primary")} to="/app">
            Ir para a visão geral
          </Link>
        }
      />
    </div>
  );
}
