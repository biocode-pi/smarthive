import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Registro {
  id: number;
  tipo: string;
  valor?: number;
  origem?: string;
  createdAt: string;
  colmeia: number;
}

export default function Registros() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadRegistros = async () => {
      try {
        const data = await api("/api/registros");
        setRegistros(data);
      } catch (error) {
        toast({
          title: "Erro ao carregar registros",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadRegistros();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR");
  };

  return (
    <Layout title="Registros">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Histórico de Registros</h2>
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : registros.length === 0 ? (
          <p className="text-muted-foreground">Nenhum registro encontrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colmeia</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell className="font-medium">#{registro.colmeia}</TableCell>
                  <TableCell>
                    <span className="capitalize">{registro.tipo}</span>
                  </TableCell>
                  <TableCell>{registro.valor || "-"}</TableCell>
                  <TableCell>{registro.origem || "manual"}</TableCell>
                  <TableCell>{formatDate(registro.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Layout>
  );
}
