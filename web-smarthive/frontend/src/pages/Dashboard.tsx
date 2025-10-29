import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";

interface KPIs {
  entradas: number;
  saidas: number;
  predadores: number;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIs>({
    entradas: 0,
    saidas: 0,
    predadores: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKPIs = async () => {
      try {
        const registros = await api("/api/registros");
        
        const entradas = registros.filter((r: any) => r.tipo === "entrada").length;
        const saidas = registros.filter((r: any) => r.tipo === "saida").length;
        const predadores = registros.filter((r: any) => r.tipo === "predador").length;

        setKpis({ entradas, saidas, predadores });
      } catch (error) {
        console.error("Erro ao carregar KPIs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadKPIs();
  }, []);

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Entradas</h3>
          <p className="text-4xl font-bold text-primary">
            {loading ? "..." : kpis.entradas}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Saídas</h3>
          <p className="text-4xl font-bold text-accent">
            {loading ? "..." : kpis.saidas}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Predadores Detectados</h3>
          <p className="text-4xl font-bold text-destructive">
            {loading ? "..." : kpis.predadores}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Resumo de Atividade</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium">Entradas:</div>
            <div className="flex-1 bg-secondary rounded-full h-6 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${loading ? 0 : (kpis.entradas / (kpis.entradas + kpis.saidas) * 100)}%` }}
              />
            </div>
            <div className="w-16 text-right font-semibold">{kpis.entradas}</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium">Saídas:</div>
            <div className="flex-1 bg-secondary rounded-full h-6 overflow-hidden">
              <div 
                className="bg-accent h-full transition-all duration-500"
                style={{ width: `${loading ? 0 : (kpis.saidas / (kpis.entradas + kpis.saidas) * 100)}%` }}
              />
            </div>
            <div className="w-16 text-right font-semibold">{kpis.saidas}</div>
          </div>
        </div>
      </Card>
    </Layout>
  );
}
