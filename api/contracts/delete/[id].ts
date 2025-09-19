import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    return handleDeleteContract(req, res, id as string);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleDeleteContract(req: VercelRequest, res: VercelResponse, id: string) {
  try {
    console.log('🗑️ [DELETE API] Excluindo contrato com ID:', id);
    
    // Verificar se o contrato existe
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .limit(1);
    
    if (fetchError) {
      console.error('❌ [DELETE API] Erro ao buscar contrato:', fetchError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    if (!contracts || contracts.length === 0) {
      console.log('❌ [DELETE API] Contrato não encontrado para ID:', id);
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }

    // Excluir o contrato
    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ [DELETE API] Erro ao excluir contrato:', deleteError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    console.log('✅ [DELETE API] Contrato excluído com sucesso');
    return res.status(200).json({ message: 'Contrato excluído com sucesso' });
  } catch (error) {
    console.error('❌ [DELETE API] Erro ao excluir contrato:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
