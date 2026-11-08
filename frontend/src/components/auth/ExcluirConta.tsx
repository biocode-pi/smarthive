import { deleteUser } from "aws-amplify/auth";
import { Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { botao } from "../ui/Button";

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
    // Vai para a pagina inicial antes de encerrar a sessao; senao a rota protegida
    // redireciona para o login.
    navigate("/", { replace: true });
    await logout().catch(() => undefined);
  }

  return (
    <section className="border-t border-ink/15 py-8">
      <h2 className="titulo-secao text-status-risco-texto">Excluir minha conta</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/75">
        Apaga de forma permanente sua conta e todos os seus dados: meliponários, colmeias, monitoramentos, alertas,
        fotos, vídeos, telefone e preferências. Cópias de segurança e versões antigas de arquivos são eliminadas
        automaticamente em até 30 dias.
      </p>

      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className={botao("secondary", "mt-5 border-status-risco-texto/40 text-status-risco-texto hover:border-status-risco-texto")}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Quero excluir minha conta
        </button>
      ) : (
        <form className="mt-5 max-w-xl space-y-4" onSubmit={excluir}>
          <label className="campo-rotulo">
            <span>
              Para confirmar, digite seu e-mail: <span className="font-dados font-normal">{email}</span>
            </span>
            <input
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="off"
              className="campo"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!confirmado || excluindo}
              className={botao("danger")}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {excluindo ? "Excluindo…" : "Excluir conta e todos os dados"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                setConfirmacao("");
              }}
              className={botao("secondary")}
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
