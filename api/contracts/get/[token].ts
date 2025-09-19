import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 [GET CONTRACT API] Buscando contrato com token:', token);
    
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('signature_link_token', token)
      .limit(1);
    
    if (error) {
      console.log('❌ [GET CONTRACT API] Erro ao buscar contrato:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    if (!data || data.length === 0) {
      console.log('❌ [GET CONTRACT API] Contrato não encontrado para token:', token);
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }

    const contract = data[0];
    console.log('✅ [GET CONTRACT API] Contrato encontrado:', contract);
    console.log('🔍 [GET CONTRACT API] Tipo do contrato:', contract.contract_type);
    console.log('🔍 [GET CONTRACT API] Tipo do contract_type:', typeof contract.contract_type);
    console.log('🔍 [GET CONTRACT API] Serviços do parceiro:', contract.partner_services);
    console.log('🔍 [GET CONTRACT API] Todos os campos do contrato:', Object.keys(contract));
    return res.status(200).json(contract);
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
