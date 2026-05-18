import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export type Colmeia = {
  id: string;
  apiarioId: string;
  nome: string;
  especie: string;
  longitude: string;
  latitude: string;
  temperatura: string;
  umidade: string;
  peso: string;
  alerta: boolean;
};

type ColmeiaContextType = {
  colmeias: Colmeia[];
  adicionarColmeia: (dados: Omit<Colmeia, 'id' | 'alerta' | 'temperatura' | 'umidade' | 'peso'>) => Promise<void>;
  editarColmeia: (id: string, dados: Partial<Omit<Colmeia, 'id'>>) => Promise<void>;
  deletarColmeia: (id: string) => Promise<void>;
  colmeiasPorApiario: (apiarioId: string) => Colmeia[];
  carregando: boolean;
};

const ColmeiaContext = createContext<ColmeiaContextType>({
  colmeias: [],
  adicionarColmeia: async () => {},
  editarColmeia: async () => {},
  deletarColmeia: async () => {},
  colmeiasPorApiario: () => [],
  carregando: true,
});

export function ColmeiaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (user) {
      carregar();
    } else {
      setColmeias([]);
      setCarregando(false);
    }
  }, [user]);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('colmeias')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setColmeias(data.map(mapear));
    }
    setCarregando(false);
  }

  function mapear(row: any): Colmeia {
    return {
      id: row.id,
      apiarioId: row.apiario_id,
      nome: row.nome,
      especie: row.especie ?? '',
      longitude: row.longitude ?? '',
      latitude: row.latitude ?? '',
      temperatura: row.temperatura ?? '--',
      umidade: row.umidade ?? '--',
      peso: row.peso ?? '--',
      alerta: row.alerta ?? false,
    };
  }

  async function adicionarColmeia(dados: Omit<Colmeia, 'id' | 'alerta' | 'temperatura' | 'umidade' | 'peso'>) {
    const { data, error } = await supabase
      .from('colmeias')
      .insert({
        apiario_id: dados.apiarioId,
        user_id: user!.id,
        nome: dados.nome,
        especie: dados.especie,
        longitude: dados.longitude,
        latitude: dados.latitude,
        temperatura: '--',
        umidade: '--',
        peso: '--',
        alerta: false,
      })
      .select()
      .single();

    if (!error && data) {
      setColmeias(prev => [...prev, mapear(data)]);
    }
  }

  async function editarColmeia(id: string, dados: Partial<Omit<Colmeia, 'id'>>) {
    const dbDados: any = { ...dados };
    if (dados.apiarioId) {
      dbDados.apiario_id = dados.apiarioId;
      delete dbDados.apiarioId;
    }

    const { data, error } = await supabase
      .from('colmeias')
      .update(dbDados)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setColmeias(prev => prev.map(c => c.id === id ? mapear(data) : c));
    }
  }

  async function deletarColmeia(id: string) {
    const { error } = await supabase.from('colmeias').delete().eq('id', id);
    if (!error) {
      setColmeias(prev => prev.filter(c => c.id !== id));
    }
  }

  function colmeiasPorApiario(apiarioId: string) {
    return colmeias.filter(c => c.apiarioId === apiarioId);
  }

  return (
    <ColmeiaContext.Provider value={{ colmeias, adicionarColmeia, editarColmeia, deletarColmeia, colmeiasPorApiario, carregando }}>
      {children}
    </ColmeiaContext.Provider>
  );
}

export function useColmeias() {
  return useContext(ColmeiaContext);
}
