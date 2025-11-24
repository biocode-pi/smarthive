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

interface Apiario {
  id: number;
  nome: string;
  localizacao: string;
  descricao?: string;
}

export default function Apiarios() {
  const [apiarios, setApiarios] = useState<Apiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const loadApiarios = async () => {
    try {
      const data = await api("/api/apiarios");
      setApiarios(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar apiários",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiarios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api("/api/apiarios", {
        method: "POST",
        body: { nome, localizacao, descricao },
      });

      toast({
        title: "Apiário criado com sucesso!",
      });

      setNome("");
      setLocalizacao("");
      setDescricao("");
      loadApiarios();
    } catch (error) {
      toast({
        title: "Erro ao criar apiário",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir este apiário?")) return;

    try {
      await api(`/api/apiarios/${id}`, { method: "DELETE" });
      toast({ title: "Apiário excluído com sucesso!" });
      loadApiarios();
    } catch (error) {
      toast({
        title: "Erro ao excluir apiário",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="Apiários">
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Novo Apiário</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : "Criar Apiário"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Apiários</h2>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : apiarios.length === 0 ? (
            <p className="text-muted-foreground">Nenhum apiário cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiarios.map((apiario) => (
                  <TableRow key={apiario.id}>
                    <TableCell className="font-medium">{apiario.nome}</TableCell>
                    <TableCell>{apiario.localizacao}</TableCell>
                    <TableCell>{apiario.descricao || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(apiario.id)}
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
