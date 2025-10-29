import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";

interface Colmeia {
  _id: string;
  identificador: string;
  especie?: string;
  apiario: string;
}

export default function NovoRegistro() {
  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [colmeiaId, setColmeiaId] = useState("");
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [origem, setOrigem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadColmeias = async () => {
      try {
        const data = await api("/api/colmeias");
        setColmeias(data);
      } catch (error) {
        console.error("Erro ao carregar colmeias:", error);
      }
    };

    loadColmeias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!colmeiaId) {
        throw new Error("Selecione uma colmeia");
      }

      await api("/api/registros", {
        method: "POST",
        body: {
          colmeia: colmeiaId, // Enviando o ID como string
          tipo,
          valor: valor ? Number(valor) : undefined,
          origem: origem || undefined,
        },
      });

      toast({ title: "Registro criado com sucesso!" });
      setTipo("");
      setValor("");
      setOrigem("");
    } catch (error) {
      toast({
        title: "Erro ao criar registro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulate = async () => {
    if (!colmeiaId) {
      toast({
        title: "Selecione uma colmeia",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api("/api/registros/simulate", {
        method: "POST",
        body: { 
          colmeia: colmeiaId // Enviando o ID como string
        },
      });

      toast({ title: "Simulação de câmera realizada!" });
    } catch (error) {
      toast({
        title: "Erro ao simular",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Novo Registro">
      <div className="max-w-2xl">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Criar Registro Manual</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="colmeia">Colmeia</Label>
              <select
                id="colmeia"
                value={colmeiaId}
                onChange={(e) => setColmeiaId(e.target.value)}
                required
                disabled={submitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione uma colmeia</option>
                {colmeias.map((colmeia) => (
                  <option key={colmeia._id} value={colmeia._id}>
                    {colmeia.identificador}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
                disabled={submitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione um tipo</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="predador">Predador</option>
                <option value="temperatura">Temperatura</option>
                <option value="umidade">Umidade</option>
              </select>
            </div>

            {(tipo === "temperatura" || tipo === "umidade") && (
              <div>
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  disabled={submitting}
                />
              </div>
            )}

            <div>
              <Label htmlFor="origem">Origem</Label>
              <Input
                id="origem"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                placeholder="Ex: manual, camera, sensor"
                disabled={submitting}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar Registro"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSimulate}
                disabled={submitting || !colmeiaId}
              >
                <Camera className="mr-2 h-4 w-4" />
                Simular Câmera
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
