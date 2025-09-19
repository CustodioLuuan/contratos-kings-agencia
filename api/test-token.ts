import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Testando busca por token...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar busca por token específico
    const token = 'sign-1758669232846-y0bfofrbg';
    
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('signature_link_token', token)
      .single();
    
    if (error) {
      console.error('Erro ao buscar contrato:', error);
      return res.status(500).json({ error: 'Erro ao buscar contrato', details: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    
    return res.status(200).json({ 
      message: 'Contrato encontrado!',
      contract: data
    });
    
  } catch (error) {
    console.error('Erro geral:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}

