import { Check, Copy, Cpu, Plus } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { ENDERECO_DE_CAPTURA, criarDispositivo, listarDispositivos, revogarDispositivo } from "../../services/dispositivos";
import type { Dispositivo, DispositivoCriado } from "../../types";
import { formatDateTime } from "../../utils/formatters";
import { Button } from "./Button";
import { Secao } from "./Secao";

function Copiavel({ rotulo, valor }: { rotulo: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="grid gap-1.5">
      <span className="rotulo">{rotulo}</span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-field bg-white px-4 py-3 font-dados text-sm text-ink ring-1 ring-ink/15">{valor}</code>
        <Button variant="secondary" onClick={copiar} aria-label={`Copiar ${rotulo.toLowerCase()}`} icon={copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
          {copiado ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}

export function Dispositivos({ colmeiaId }: { colmeiaId: string }) {
  const [itens, setItens] = useState<Dispositivo[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [novo, setNovo] = useState<DispositivoCriado | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarDispositivos(colmeiaId)
      .then(setItens)
      .catch(() => setItens([]));
  }, [colmeiaId]);

  async function criar(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const criado = await criarDispositivo(colmeiaId, nome);
      setNovo(criado);
      setItens((atuais) => [...atuais, criado]);
      setNome("");
      setFormAberto(false);
    } catch {
      setErro("Não foi possível gerar a chave. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  async function revogar(dispositivo: Dispositivo) {
    if (!window.confirm(`Desconectar "${dispositivo.nome}"? A placa deixa de conseguir enviar capturas.`)) return;
    try {
      await revogarDispositivo(dispositivo.id);
      setItens((atuais) => atuais.map((item) => (item.id === dispositivo.id ? { ...item, revogado_em: new Date().toISOString() } : item)));
      if (novo?.id === dispositivo.id) setNovo(null);
    } catch {
      setErro("Não foi possível desconectar a placa. Tente de novo.");
    }
  }

  const ativos = itens.filter((item) => !item.revogado_em);

  return (
    <Secao
      titulo="Placas conectadas"
      acao={
        formAberto ? null : (
          <Button variant="secondary" onClick={() => setFormAberto(true)} icon={<Plus className="h-4 w-4" />}>
            Conectar placa
          </Button>
        )
      }
    >
      {erro ? <p className="mb-4 font-bold text-status-risco-texto">{erro}</p> : null}

      {formAberto ? (
        <form onSubmit={criar} className="mb-6 flex flex-wrap items-end gap-3">
          <label className="campo-rotulo min-w-[220px] flex-1">
            Nome da placa
            <input className="campo" value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: K10 da entrada" minLength={2} maxLength={60} required autoFocus />
          </label>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Gerando…" : "Gerar chave"}
          </Button>
          <Button variant="ghost" onClick={() => setFormAberto(false)}>
            Cancelar
          </Button>
        </form>
      ) : null}

      {novo ? (
        <div className="mb-6 grid gap-4 rounded-[24px] bg-honey-500/15 p-5 ring-1 ring-honey-500/40">
          <p className="font-bold text-ink">Copie a chave agora. Por segurança, ela não aparece de novo.</p>
          <Copiavel rotulo="Endereço" valor={ENDERECO_DE_CAPTURA} />
          <Copiavel rotulo="Chave" valor={novo.chave} />
          <div>
            <Button variant="ghost" onClick={() => setNovo(null)}>
              Já copiei
            </Button>
          </div>
        </div>
      ) : null}

      {ativos.length ? (
        <ul className="border-t border-ink/15">
          {ativos.map((dispositivo) => (
            <li key={dispositivo.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Cpu className="h-5 w-5 shrink-0 text-ink/60" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{dispositivo.nome}</p>
                  <p className="text-sm text-ink/60">
                    {dispositivo.ultimo_envio_em ? `Último envio: ${formatDateTime(dispositivo.ultimo_envio_em)}` : "Ainda não enviou capturas"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => revogar(dispositivo)}>
                Desconectar
              </Button>
            </li>
          ))}
        </ul>
      ) : formAberto || novo ? null : (
        <p className="text-ink/70">Conecte uma placa com câmera para que ela envie fotos, temperatura e umidade desta colmeia sozinha.</p>
      )}
    </Secao>
  );
}
