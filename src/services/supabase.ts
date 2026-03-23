import { createClient } from '@supabase/supabase-js';

// 获取环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 导出客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
