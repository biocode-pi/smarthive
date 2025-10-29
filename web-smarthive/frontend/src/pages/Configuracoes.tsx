import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { API_BASE_URL } from "@/lib/api";

export default function Configuracoes() {
  return (
    <Layout title="Configurações">
      <div className="max-w-2xl">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Configuração da API</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">URL da API Atual</h3>
              <div className="bg-secondary px-4 py-3 rounded-md font-mono text-sm">
                {API_BASE_URL}
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-6">
              <h3 className="font-medium mb-2">Como alterar a URL da API</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>1. Crie um arquivo <code className="bg-secondary px-2 py-1 rounded">.env</code> na raiz do projeto</p>
                <p>2. Adicione a seguinte linha:</p>
                <div className="bg-secondary px-4 py-3 rounded-md font-mono mt-2">
                  VITE_API_URL=http://localhost:4000
                </div>
                <p className="mt-4">3. Reinicie o servidor de desenvolvimento:</p>
                <div className="bg-secondary px-4 py-3 rounded-md font-mono mt-2">
                  npm run dev
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-6">
              <h3 className="font-medium mb-2">Informações do Sistema</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Framework:</span>
                  <span className="font-medium">Vite + React</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versão React:</span>
                  <span className="font-medium">18.3.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estilo:</span>
                  <span className="font-medium">TailwindCSS</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
