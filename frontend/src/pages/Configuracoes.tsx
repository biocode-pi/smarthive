import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ExcluirConta } from "../components/auth/ExcluirConta";
import { MfaSettings } from "../components/auth/MfaSettings";
import { PerfilSettings } from "../components/auth/PerfilSettings";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth, userDisplayName } from "../context/AuthContext";

export function Configuracoes() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  async function sair() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Configurações" leitura={user?.email}>
        <Button variant="secondary" onClick={sair}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair
        </Button>
      </PageHeader>

      <section className="pb-8">
        <h2 className="titulo-secao">Conta</h2>
        <dl className="mt-4 border-t border-ink/15">
          <div className="flex items-baseline justify-between gap-6 border-b border-ink/10 py-3">
            <dt className="rotulo">Nome</dt>
            <dd className="font-bold text-ink">{userDisplayName(user)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 border-b border-ink/10 py-3">
            <dt className="rotulo">E-mail</dt>
            <dd className="truncate font-dados text-sm text-ink">{user?.email}</dd>
          </div>
        </dl>
      </section>

      {user ? <PerfilSettings /> : null}
      {user ? <MfaSettings email={user.email} /> : null}
      {user ? <ExcluirConta email={user.email} /> : null}
    </div>
  );
}
