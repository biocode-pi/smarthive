import { Mail, Phone } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { atualizarPerfil, mascaraTelefone, obterPerfil, type Perfil } from "../../services/perfil";
import { formatDateTime } from "../../utils/formatters";
import { Button } from "../ui/Button";

/** Telefone e consentimento de notificacoes (LGPD: data do aceite e revogacao a qualquer momento). */
export function PerfilSettings() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    obterPerfil()
      .then((dados) => {
        setPerfil(dados);
        setTelefone(dados.telefone ? mascaraTelefone(dados.telefone) : "");
      })
      .catch(() => setErro("Não foi possível carregar seu perfil."));
  }, []);

  async function salvarTelefone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    if (telefone && telefone.replace(/\D/g, "").length < 10) {
      setErro("Informe o telefone com DDD, por exemplo (11) 91234-5678.");
      return;
    }
    setSalvando(true);
    try {
      setPerfil(await atualizarPerfil({ telefone: telefone || null }));
      setMensagem(telefone ? "Telefone salvo." : "Telefone removido.");
    } catch {
      setErro("Não foi possível salvar o telefone.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarNotificacoes(ativar: boolean) {
    setErro(null);
    setMensagem(null);
    try {
      setPerfil(await atualizarPerfil({ notificacoes_email: ativar }));
      setMensagem(ativar ? "Notificações por e-mail ativadas." : "Notificações por e-mail desativadas.");
    } catch {
      setErro("Não foi possível atualizar a preferência.");
    }
  }

  return (
    <section className="border-t border-ink/15 py-8">
      <h2 className="titulo-secao">Contato e notificações</h2>

      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={salvarTelefone}>
        <label className="campo-rotulo min-w-[220px] flex-1">
          Telefone (opcional)
          <span className="flex h-12 items-center gap-3 rounded-field bg-white px-4 ring-1 ring-ink/15 focus-within:ring-2 focus-within:ring-ink">
            <Phone className="h-4 w-4 text-ink/60" aria-hidden="true" />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={telefone}
              onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
              placeholder="(11) 91234-5678"
              className="h-full min-w-0 flex-1 bg-transparent font-dados font-normal focus:outline-none"
            />
          </span>
        </label>
        <Button type="submit" disabled={salvando || !perfil}>
          Salvar telefone
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-6">
        <div className="flex min-w-0 items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink/60" aria-hidden="true" />
          <div>
            <p className="font-bold text-ink">Notificações por e-mail</p>
            <p className="text-sm text-ink/70">
              {perfil?.notificacoes_email && perfil.consentimento_em
                ? `Ativadas desde ${formatDateTime(perfil.consentimento_em)}.`
                : perfil?.revogado_em
                  ? `Desativadas em ${formatDateTime(perfil.revogado_em)}.`
                  : "Desativadas. Ative para receber avisos de alertas das colmeias."}
            </p>
          </div>
        </div>
        <Button
          variant={perfil?.notificacoes_email ? "secondary" : "primary"}
          disabled={!perfil}
          onClick={() => alternarNotificacoes(!perfil?.notificacoes_email)}
        >
          {perfil?.notificacoes_email ? "Desativar" : "Ativar"}
        </Button>
      </div>

      {mensagem ? (
        <p role="status" className="mt-4 text-sm font-bold text-status-ativa-texto">
          {mensagem}
        </p>
      ) : null}
      {erro ? (
        <p role="alert" className="mt-4 text-sm font-bold text-status-risco-texto">
          {erro}
        </p>
      ) : null}
    </section>
  );
}
