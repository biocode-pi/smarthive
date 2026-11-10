import { fetchMFAPreference, setUpTOTP, updateMFAPreference, verifyTOTPSetup } from "aws-amplify/auth";
import QRCode from "qrcode";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "../ui/Button";

type Estado = "carregando" | "desativado" | "configurando" | "ativado";

const inputClass =
  "h-12 w-40 rounded-field bg-white px-3.5 text-center font-dados text-base tracking-[0.3em] text-ink ring-1 ring-ink/15 focus:outline-none focus:ring-2 focus:ring-ink";

export function MfaSettings({ email }: { email: string }) {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [segredo, setSegredo] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetchMFAPreference()
      .then(({ enabled }) => setEstado(enabled?.includes("TOTP") ? "ativado" : "desativado"))
      .catch(() => setEstado("desativado"));
  }, []);

  async function iniciar() {
    setErro(null);
    setEnviando(true);
    try {
      const detalhes = await setUpTOTP();
      const uri = detalhes.getSetupUri("Smart Hive", email);
      setQrCode(await QRCode.toDataURL(uri.toString(), { margin: 1, width: 192 }));
      setSegredo(detalhes.sharedSecret);
      setEstado("configurando");
    } catch {
      setErro("Não foi possível iniciar a configuração. Entre novamente e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  async function confirmar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(codigo)) {
      setErro("Informe o código de 6 dígitos do aplicativo.");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await verifyTOTPSetup({ code: codigo });
      await updateMFAPreference({ totp: "PREFERRED" });
      setEstado("ativado");
      setQrCode(null);
      setSegredo(null);
      setCodigo("");
    } catch {
      setErro("Código incorreto ou expirado. Confira o horário do celular e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function desativar() {
    setErro(null);
    setEnviando(true);
    try {
      await updateMFAPreference({ totp: "DISABLED" });
      setEstado("desativado");
    } catch {
      setErro("Não foi possível desativar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const ativado = estado === "ativado";

  return (
    <section className="border-t border-ink/15 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="titulo-secao">Verificação em duas etapas</h2>
          <p className={`mt-2 text-sm font-bold ${ativado ? "text-status-ativa-texto" : "text-ink/60"}`}>
            {estado === "carregando" ? "Verificando…" : ativado ? "Ativada" : "Desativada"}
          </p>
          <p className="mt-1 max-w-lg text-sm text-ink/70">
            Ao entrar, pede também um código do aplicativo autenticador (Google Authenticator, Microsoft Authenticator).
          </p>
        </div>
        {estado === "desativado" ? (
          <Button onClick={iniciar} disabled={enviando}>
            Ativar
          </Button>
        ) : null}
        {ativado ? (
          <Button variant="secondary" onClick={desativar} disabled={enviando}>
            Desativar
          </Button>
        ) : null}
      </div>

      {estado === "configurando" && qrCode ? (
        <form className="mt-6 flex flex-col gap-6 border-t border-ink/10 pt-6 sm:flex-row" onSubmit={confirmar}>
          <img src={qrCode} alt="QR code para o aplicativo autenticador" className="h-48 w-48 rounded-field bg-white p-2 ring-1 ring-ink/10" />
          <div className="space-y-3 text-sm text-ink/75">
            <p>1. Abra o aplicativo autenticador e escaneie o QR code.</p>
            <p>
              Sem câmera? Digite a chave: <code className="break-all font-dados text-ink">{segredo}</code>
            </p>
            <p>2. Digite o código de 6 dígitos gerado pelo aplicativo:</p>
            <div className="flex flex-wrap gap-3">
              <input
                className={inputClass}
                value={codigo}
                onChange={(event) => setCodigo(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                aria-label="Código do aplicativo autenticador"
              />
              <Button type="submit" disabled={enviando}>
                Confirmar
              </Button>
              <Button variant="secondary" type="button" onClick={() => setEstado("desativado")}>
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      ) : null}

      {erro ? (
        <p role="alert" className="mt-4 text-sm font-bold text-status-risco-texto">
          {erro}
        </p>
      ) : null}
    </section>
  );
}
