import { fetchMFAPreference, setUpTOTP, updateMFAPreference, verifyTOTPSetup } from "aws-amplify/auth";
import { ShieldCheck, ShieldOff } from "lucide-react";
import QRCode from "qrcode";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "../ui/Button";

type Estado = "carregando" | "desativado" | "configurando" | "ativado";

const inputClass =
  "h-11 w-40 rounded-md border border-slate-300 bg-white px-3.5 text-center text-sm tracking-[0.3em] text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100";

/** Verificacao em duas etapas (TOTP) com aplicativo autenticador. */
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
      const uri = detalhes.getSetupUri("SmartHive", email);
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
    <section className="surface mb-6 rounded-xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className={`rounded-lg p-3 ${ativado ? "bg-hive-50 text-hive-700" : "bg-amber-50 text-amber-700"}`}>
            {ativado ? <ShieldCheck className="h-6 w-6" /> : <ShieldOff className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-500">Verificação em duas etapas</p>
            <p className="mt-1 text-lg font-bold text-slate-950">
              {estado === "carregando" ? "Verificando..." : ativado ? "Ativada" : "Desativada"}
            </p>
            <p className="text-sm text-slate-600">
              Pede um codigo do aplicativo autenticador (Google Authenticator, Microsoft Authenticator) ao entrar.
            </p>
          </div>
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
        <form className="mt-6 flex flex-col gap-6 border-t border-border pt-6 sm:flex-row" onSubmit={confirmar}>
          <img src={qrCode} alt="QR code para o aplicativo autenticador" className="h-48 w-48 rounded-lg border border-border" />
          <div className="space-y-3 text-sm text-slate-600">
            <p>1. Abra o aplicativo autenticador e escaneie o QR code.</p>
            <p>
              Sem camera? Digite a chave: <code className="break-all font-mono text-slate-900">{segredo}</code>
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

      {erro ? <p className="mt-4 text-sm text-rose-700">{erro}</p> : null}
    </section>
  );
}
