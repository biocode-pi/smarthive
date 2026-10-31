import { deleteUser } from "aws-amplify/auth";
import { Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

/**
 * Exclusao da conta (LGPD, art. 18, VI). Primeiro a API apaga todos os dados do usuario;
 * depois o proprio usuario exclui a conta no Cognito com o token dele.
 */
export function ExcluirConta({ email }: { email: string }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const confirmado = confirmacao.trim().toLowerCase() === email.toLowerCase();

  async function excluir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmado) return;
    setExcluindo(true);
    setErro(null);
    try {
      await api.delete("/conta");
    } catch {
      setErro("Não foi possível apagar seus dados. Nada foi excluído; tente novamente.");
      setExcluindo(false);
      return;
    }
    try {
      await deleteUser();
    } catch {
      // Os dados ja foram apagados; se falhar so o Cognito, a pessoa pode repetir o pedido.
      setErro("Seus dados foram apagados, mas não foi possível encerrar a conta de login. Tente novamente.");
      setExcluindo(false);
      return;
    }
    await logout().catch(() => undefined);
    navigate("/", { replace: true });
  }

  return (
    <section className="surface mb-6 p-6 ring-1 ring-status-risco">
      <h2 className="text-lg font-bold text-status-risco-texto">Excluir minha conta</h2>
      <p className="mt-2 text-sm text-slate-700">
        Apaga de forma permanente sua conta e todos os seus dados: meliponários, colmeias, monitoramentos, alertas,
        fotos, vídeos, telefone e preferências. Cópias de segurança e versões antigas de arquivos são eliminadas
        automaticamente em até 30 dias.
      </p>

      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="focus-ring mt-4 inline-flex h-11 items-center gap-2 rounded-field bg-white px-4 text-sm font-bold text-status-risco-texto ring-1 ring-status-risco hover:bg-status-risco"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Quero excluir minha conta
        </button>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={excluir}>
          <label className="block text-sm font-bold text-ink">
            Para confirmar, digite seu e-mail: <span className="font-normal">{email}</span>
            <input
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="off"
              className="mt-1 h-[50px] w-full rounded-field bg-white px-4 font-normal shadow-app focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!confirmado || excluindo}
              className="focus-ring inline-flex h-11 items-center gap-2 rounded-field bg-status-risco-texto px-4 text-sm font-bold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {excluindo ? "Excluindo..." : "Excluir conta e todos os dados"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                setConfirmacao("");
              }}
              className="focus-ring h-11 rounded-field bg-white px-4 text-sm font-bold text-ink shadow-app"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {erro ? (
        <p role="alert" className="mt-3 text-sm font-bold text-status-risco-texto">
          {erro}
        </p>
      ) : null}
    </section>
  );
}
