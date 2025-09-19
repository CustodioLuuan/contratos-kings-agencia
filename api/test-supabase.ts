import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Testando conexão com Supabase...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('SUPABASE_URL:', supabaseUrl ? 'Configurado' : 'NÃO CONFIGURADO');
    console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'Configurado' : 'NÃO CONFIGURADO');
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Variáveis de ambiente não configuradas',
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('contracts')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Erro ao conectar com Supabase:', error);
      return res.status(500).json({ error: 'Erro ao conectar com Supabase', details: error.message });
    }
    
    return res.status(200).json({ 
      message: 'Conexão com Supabase funcionando!',
      data: data
    });
    
  } catch (error) {
    console.error('Erro geral:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}

