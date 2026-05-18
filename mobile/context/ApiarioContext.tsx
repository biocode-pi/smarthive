import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export type Apiario = {
  id: string;
  nome: string;
  cidade: string;
  endereco: string;
  alerta: boolean;
};

type ApiarioContextType = {
  apiarios: Apiario[];
  adicionarApiario: (dados: Omit<Apiario, 'id' | 'alerta'>) => Promise<void>;
  editarApiario: (id: string, dados: Omit<Apiario, 'id' | 'alerta'>) => Promise<void>;
  deletarApiario: (id: string) => Promise<void>;
  carregando: boolean;
};

const ApiarioContext = createContext<ApiarioContextType>({
  apiarios: [],
  adicionarApiario: async () => {},
  editarApiario: async () => {},
  deletarApiario: async () => {},
  carregando: true,
});

export function ApiarioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [apiarios, setApiarios] = useState<Apiario[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (user) {
      carregar();
    } else {
      setApiarios([]);
      setCarregando(false);
    }
  }, [user]);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('apiarios')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setApiarios(data.map(mapear));
    }
    setCarregando(false);
  }

  function mapear(row: any): Apiario {
    return {
      id: row.id,
      nome: row.nome,
      cidade: row.cidade,
      endereco: row.endereco,
      alerta: row.alerta ?? false,
    };
  }

  async function adicionarApiario(dados: Omit<Apiario, 'id' | 'alerta'>) {
    const { data, error } = await supabase
      .from('apiarios')
      .insert({ ...dados, user_id: user!.id, alerta: false })
      .select()
      .single();

    if (!error && data) {
      setApiarios(prev => [...prev, mapear(data)]);
    }
  }

  async function editarApiario(id: string, dados: Omit<Apiario, 'id' | 'alerta'>) {
    const { data, error } = await supabase
      .from('apiarios')
      .update(dados)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setApiarios(prev => prev.map(a => a.id === id ? mapear(data) : a));
    }
  }

  async function deletarApiario(id: string) {
    const { error } = await supabase.from('apiarios').delete().eq('id', id);
    if (!error) {
      setApiarios(prev => prev.filter(a => a.id !== id));
    }
  }

  return (
    <ApiarioContext.Provider value={{ apiarios, adicionarApiario, editarApiario, deletarApiario, carregando }}>
      {children}
    </ApiarioContext.Provider>
  );
}

export function useApiarios() {
  return useContext(ApiarioContext);
}
