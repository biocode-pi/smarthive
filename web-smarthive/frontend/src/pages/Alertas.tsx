import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

interface Alerta {
  id: number;
  nivel: string;
  mensagem: string;
  createdAt: string;
  reconhecido?: boolean;
}

export default function Alertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAlertas = async () => {
    try {
      const data = await api("/api/alertas?aberto=true");
      setAlertas(data);
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertas();

    // Conectar ao SSE para alertas em tempo real
    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/alertas/stream`);

    eventSource.addEventListener("alerta", () => {
      loadAlertas();
      toast({
        title: "Novo alerta recebido!",
        description: "A lista de alertas foi atualizada.",
      });
    });

    eventSource.onerror = () => {
      console.error("Erro na conexão SSE");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleAck = async (id: number) => {
    try {
      await api(`/api/alertas/${id}/ack`, { method: "POST" });
      toast({ title: "Alerta reconhecido!" });
      loadAlertas();
    } catch (error) {
      toast({
        title: "Erro ao reconhecer alerta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR");
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel.toLowerCase()) {
      case "critico":
        return "text-destructive font-semibold";
      case "alto":
        return "text-orange-600 font-semibold";
      case "medio":
        return "text-primary font-medium";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Layout title="Alertas">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Alertas Abertos</h2>
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : alertas.length === 0 ? (
          <p className="text-muted-foreground">Nenhum alerta aberto no momento.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nível</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertas.map((alerta) => (
                <TableRow key={alerta.id}>
                  <TableCell>
                    <span className={getNivelColor(alerta.nivel)}>{alerta.nivel}</span>
                  </TableCell>
                  <TableCell>{alerta.mensagem}</TableCell>
                  <TableCell>{formatDate(alerta.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleAck(alerta.id)}
                      disabled={alerta.reconhecido}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Reconhecer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Layout>
  );
}
