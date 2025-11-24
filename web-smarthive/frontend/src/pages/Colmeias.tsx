import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";

interface Colmeia {
  _id: string;
  identificador: string;
  especie?: string;
  apiario: string | { _id: string; nome: string };
  estado?: "saudável" | "atenção" | "critico";
  createdAt: string;
  updatedAt: string;
}

interface Apiario {
  _id: string;
  nome: string;
  localizacao: string;
  createdAt: string;
  updatedAt: string;
}

export default function Colmeias() {
  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [apiarios, setApiarios] = useState<Apiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [identificador, setIdentificador] = useState("");
  const [especie, setEspecie] = useState("");
  const [apiarioId, setApiarioId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [colmeiasData, apiariosData] = await Promise.all([
        api("/api/colmeias"),
        api("/api/apiarios"),
      ]);
      setColmeias(colmeiasData);
      setApiarios(apiariosData);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api("/api/colmeias", {
        method: "POST",
        body: { 
          identificador, 
          apiario: apiarioId, // Enviando o ID como string
          ...(especie && { especie })
        },
      });

      toast({ title: "Colmeia criada com sucesso!" });
      setIdentificador("");
      setEspecie("");
      setApiarioId("");
      loadData();
    } catch (error) {
      toast({
        title: "Erro ao criar colmeia",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta colmeia?")) return;

    try {
      await api(`/api/colmeias/${id}`, { method: "DELETE" });
      toast({ title: "Colmeia excluída com sucesso!" });
      loadData();
    } catch (error) {
      toast({
        title: "Erro ao excluir colmeia",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const getApiarioNome = (apiario: string | { _id: string; nome: string }) => {
    if (typeof apiario === 'string') {
      const apiarioObj = apiarios.find((a) => a._id === apiario);
      return apiarioObj?.nome || "Não encontrado";
    }
    return apiario.nome;
  };

  return (
    <Layout title="Colmeias">
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Nova Colmeia</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="identificador">Identificador</Label>
              <Input
                id="identificador"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="especie">Espécie</Label>
              <Input
                id="especie"
                value={especie}
                onChange={(e) => setEspecie(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="apiario">Apiário</Label>
              <select
                id="apiario"
                value={apiarioId}
                onChange={(e) => setApiarioId(e.target.value)}
                required
                disabled={submitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione um apiário</option>
                {apiarios.map((apiario) => (
                  <option key={apiario._id} value={apiario._id}>
                    {apiario.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : "Criar Colmeia"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Colmeias</h2>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : colmeias.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma colmeia cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Espécie</TableHead>
                  <TableHead>Apiário</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colmeias.map((colmeia) => (
                  <TableRow key={colmeia.id}>
                    <TableCell className="font-medium">{colmeia.identificador}</TableCell>
                    <TableCell>{colmeia.especie || "-"}</TableCell>
                    <TableCell>{getApiarioNome(colmeia.apiario)}</TableCell>
                    <TableCell>{colmeia.estado || "Normal"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(colmeia.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </Layout>
  );
}
