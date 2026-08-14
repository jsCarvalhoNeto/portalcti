import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Atenção: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configuradas nas variáveis de ambiente!'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let _ephemeralClient: ReturnType<typeof createClient> | null = null;

/**
 * Cliente sem persistência de sessão para permitir que
 * administradores/professores criem novos usuários sem alterar a sessão ativa.
 */
export const getEphemeralClient = () => {
  if (!_ephemeralClient) {
    _ephemeralClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return _ephemeralClient;
};

export const createEphemeralClient = getEphemeralClient;

