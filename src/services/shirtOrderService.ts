import { supabase } from '@/lib/supabaseClient';

export type ShirtSize = 'P' | 'M' | 'G' | 'GG' | 'XGG';
export type ShirtModel = 'masculino' | 'feminino';

export interface ShirtOrder {
  id: string;
  student_name: string;
  student_id?: string | null;
  student_registration?: string;
  grade: string;
  model: ShirtModel;
  size: ShirtSize;
  notes?: string;
  session_code: string;
  created_at: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = 'cti_shirt_orders_cache';

const INITIAL_MOCK_ORDERS: ShirtOrder[] = [];

// Helper para ler do localStorage
function getLocalOrders(): ShirtOrder[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

// Helper para salvar no localStorage
function saveLocalOrders(orders: ShirtOrder[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('Erro ao salvar pedidos no localStorage:', e);
  }
}

/**
 * Busca os pedidos de camisa (do Supabase com fallback para localStorage)
 */
export async function getShirtOrders(sessionCode?: string): Promise<ShirtOrder[]> {
  try {
    let query = supabase
      .from('shirt_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionCode && sessionCode !== 'ALL') {
      query = query.eq('session_code', sessionCode);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Atualiza o cache local com os dados reais do Supabase
      saveLocalOrders(data as ShirtOrder[]);
      return data as ShirtOrder[];
    }
  } catch (err) {
    console.warn('Tabela shirt_orders não acessível no Supabase, usando dados locais sincronizados:', err);
  }

  // Fallback local
  const localList = getLocalOrders();
  if (sessionCode && sessionCode !== 'ALL') {
    return localList.filter(o => o.session_code === sessionCode || o.session_code === 'GERAL');
  }
  return localList;
}

/**
 * Registra ou atualiza um pedido de camisa do aluno
 */
export async function saveShirtOrder(orderData: {
  student_name: string;
  student_id?: string | null;
  student_registration?: string;
  grade: string;
  model: ShirtModel;
  size: ShirtSize;
  notes?: string;
  session_code?: string;
}): Promise<ShirtOrder> {
  const session_code = (orderData.session_code || 'GERAL').toUpperCase().trim();
  const newId = 'shirt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const payload: ShirtOrder = {
    id: newId,
    student_name: orderData.student_name.trim(),
    student_id: orderData.student_id || null,
    student_registration: orderData.student_registration || '',
    grade: orderData.grade,
    model: orderData.model,
    size: orderData.size,
    notes: orderData.notes?.trim() || '',
    session_code,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let savedOrder = payload;

  try {
    const { data, error } = await supabase
      .from('shirt_orders')
      .insert([
        {
          student_name: payload.student_name,
          student_id: payload.student_id,
          student_registration: payload.student_registration,
          grade: payload.grade,
          model: payload.model,
          size: payload.size,
          notes: payload.notes,
          session_code: payload.session_code
        }
      ])
      .select()
      .single();

    if (!error && data) {
      savedOrder = data as ShirtOrder;
    }
  } catch (err) {
    console.warn('Erro ao inserir no Supabase (utilizando fallback local):', err);
  }

  // Atualizar cache local
  const currentOrders = getLocalOrders();
  // Se já existir pedido com mesmo nome e mesma turma, substitui para evitar duplicação do mesmo aluno
  const existingIdx = currentOrders.findIndex(
    o => o.student_name.toLowerCase().trim() === savedOrder.student_name.toLowerCase().trim() &&
         o.grade === savedOrder.grade
  );

  let updatedList: ShirtOrder[];
  if (existingIdx !== -1) {
    updatedList = [...currentOrders];
    updatedList[existingIdx] = savedOrder;
  } else {
    updatedList = [savedOrder, ...currentOrders];
  }
  saveLocalOrders(updatedList);

  // Broadcast em tempo real para os painéis dos professores
  try {
    const channel = supabase.channel(`shirt_channel_${session_code}`, {
      config: { broadcast: { ack: false } }
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'new_shirt_order',
          payload: savedOrder
        });
      }
    });
  } catch (err) {
    console.warn('Erro no broadcast realtime:', err);
  }

  return savedOrder;
}

/**
 * Exclui um pedido de camisa
 */
export async function deleteShirtOrder(id: string): Promise<boolean> {
  try {
    await supabase.from('shirt_orders').delete().eq('id', id);
  } catch (err) {
    console.warn('Erro ao excluir no Supabase:', err);
  }

  const current = getLocalOrders();
  const filtered = current.filter(o => o.id !== id);
  saveLocalOrders(filtered);
  return true;
}

/**
 * Atualiza dados de um pedido existente
 */
export async function updateShirtOrder(id: string, updates: Partial<ShirtOrder>): Promise<ShirtOrder | null> {
  try {
    const { data } = await supabase
      .from('shirt_orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (data) return data as ShirtOrder;
  } catch (err) {
    console.warn('Erro ao atualizar no Supabase:', err);
  }

  const current = getLocalOrders();
  const idx = current.findIndex(o => o.id === id);
  if (idx !== -1) {
    const updated = { ...current[idx], ...updates, updated_at: new Date().toISOString() };
    current[idx] = updated;
    saveLocalOrders(current);
    return updated;
  }
  return null;
}

/**
 * Limpa todos os pedidos de camisa (do Supabase e do cache local)
 */
export async function clearAllShirtOrders(sessionCode?: string): Promise<boolean> {
  try {
    let query = supabase.from('shirt_orders').delete();
    if (sessionCode && sessionCode !== 'ALL') {
      query = query.eq('session_code', sessionCode);
    } else {
      query = query.neq('id', '00000000-0000-0000-0000-000000000000');
    }
    await query;
  } catch (err) {
    console.warn('Erro ao limpar pedidos no Supabase:', err);
  }

  saveLocalOrders([]);
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {}

  // Broadcast de reset para os clientes conectados
  try {
    const code = (sessionCode || 'GERAL').toUpperCase().trim();
    const channel = supabase.channel(`shirt_channel_${code}`, {
      config: { broadcast: { ack: false } }
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'shirt_reset',
          payload: {}
        });
      }
    });
  } catch {}

  return true;
}

