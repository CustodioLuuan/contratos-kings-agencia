import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { signature_data } = req.body;

    if (!signature_data) {
      return res.status(400).json({ error: 'Dados de assinatura não fornecidos' });
    }

    console.log('🔍 [SIGN API] Assinando contrato com token:', token);

    // Verificar se o contrato existe
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('signature_link_token', token)
      .limit(1);
    
    if (fetchError) {
      console.log('❌ [SIGN API] Erro ao buscar contrato:', fetchError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    if (!contracts || contracts.length === 0) {
      console.log('❌ [SIGN API] Contrato não encontrado para token:', token);
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }

    const contract = contracts[0];

    if (contract.status === 'signed') {
      console.log('⚠️ [SIGN API] Contrato já foi assinado');
      return res.status(400).json({ error: 'Contrato já foi assinado' });
    }

    // Atualizar contrato com assinatura
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        signature_data,
        signed_at: new Date().toISOString()
      })
      .eq('signature_link_token', token);

    if (updateError) {
      console.error('❌ [SIGN API] Erro ao atualizar contrato:', updateError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    console.log('✅ [SIGN API] Contrato assinado com sucesso');

    return res.status(200).json({ message: 'Contrato assinado com sucesso' });
  } catch (error) {
    console.error('❌ [SIGN API] Erro ao assinar contrato:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
