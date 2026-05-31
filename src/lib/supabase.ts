import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Cargar variables de entorno para Supabase.
// Nota: En Next.js (App Router), las variables expuestas al navegador deben llevar el prefijo NEXT_PUBLIC_.
// Si se utiliza Vite, se usa import.meta.env.VITE_SUPABASE_URL.
const supabaseUrl = 
  (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL)) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || 
  (typeof window !== 'undefined' ? (window as any)._env_?.NEXT_PUBLIC_SUPABASE_URL : '') ||
  'https://your-project-id.supabase.co';

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 
  (typeof window !== 'undefined' ? (window as any)._env_?.NEXT_PUBLIC_SUPABASE_ANON_KEY : '') ||
  'your-anon-key-placeholder';

// Validar credenciales de forma elegante para desarrollo sin bloquear la app
if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
  console.warn(
    '⚠️ Supabase URL no está configurada o usa valores de ejemplo. Asegúrate de configurar la variable NEXT_PUBLIC_SUPABASE_URL.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
  console.warn(
    '⚠️ Supabase Anon Key no está configurada. Configura la variable NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// Inicializar el cliente singleton de Supabase
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);

export default supabase;
