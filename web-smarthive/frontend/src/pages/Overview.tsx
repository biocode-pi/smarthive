import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { MapPin, Flower2, Bell } from "lucide-react";

export default function Overview() {
  const [stats, setStats] = useState({
    apiarios: 0,
    colmeias: 0,
    alertas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [apiariosData, colmeiasData, alertasData] = await Promise.all([
          api("/api/apiarios"),
          api("/api/colmeias"),
          api("/api/alertas?aberto=true"),
        ]);

        setStats({
          apiarios: apiariosData.length || 0,
          colmeias: colmeiasData.length || 0,
          alertas: alertasData.length || 0,
        });
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: "Total de Apiários",
      value: stats.apiarios,
      icon: MapPin,
      color: "bg-primary/10",
      iconColor: "text-primary",
      description: "Locais cadastrados"
    },
    {
      title: "Total de Colmeias",
      value: stats.colmeias,
      icon: Flower2,
      color: "bg-accent/10",
      iconColor: "text-accent",
      description: "Colmeias ativas"
    },
    {
      title: "Alertas Ativos",
      value: stats.alertas,
      icon: Bell,
      color: "bg-destructive/10",
      iconColor: "text-destructive",
      description: "Requerem atenção"
    },
  ];

  return (
    <Layout title="Visão Geral">
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Resumo do Sistema</h2>
          <p className="text-sm text-muted-foreground">Acompanhe as principais métricas da sua operação apícola</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="group p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-4xl font-bold text-foreground mb-2">
                    {loading ? (
                      <span className="inline-block w-12 h-10 bg-muted animate-pulse rounded"></span>
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl group-hover:scale-110 transition-transform duration-200`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
