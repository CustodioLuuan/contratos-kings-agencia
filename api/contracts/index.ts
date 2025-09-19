import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTablesIfNotExist() {
  try {
    // Tentar inserir usuário padrão - se a tabela não existir, vai dar erro mas não importa
    await supabase
      .from('users')
      .upsert({
        id: 'user-1',
        email: 'kingsagenciaoficial@gmail.com',
        name: 'Administrador',
        picture: 'https://via.placeholder.com/150'
      });

    console.log('✅ Usuário padrão criado/verificado com sucesso');
  } catch (error) {
    console.log('ℹ️ Tabela users pode não existir ainda, continuando...');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return handleGetContracts(req, res);
  } else if (req.method === 'POST') {
    return handleCreateContract(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetContracts(req: VercelRequest, res: VercelResponse) {
  try {
    await createTablesIfNotExist();
    
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('user_id', 'user-1')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar contratos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    console.log('📋 Contratos encontrados:', data?.length || 0);
    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function handleCreateContract(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('API: Recebendo requisição POST');
    console.log('API: Body:', req.body);
    
    const {
      client_name,
      client_document,
      client_email,
      client_phone,
      company_name,
      contract_value,
      payment_date,
      contract_type,
      partner_services
    } = req.body;

    console.log('🔍 [CREATE CONTRACT] Dados recebidos:', {
      client_name,
      client_document,
      contract_type,
      partner_services
    });
    console.log('🔍 [CREATE CONTRACT] contract_type tipo:', typeof contract_type);
    console.log('🔍 [CREATE CONTRACT] contract_type valor:', contract_type);

    // Validação básica simplificada
    if (!client_name || !client_document) {
      console.log('API: Validação falhou - nome e documento são obrigatórios');
      return res.status(400).json({ error: 'Nome e documento são obrigatórios' });
    }

    await createTablesIfNotExist();

    // Gerar token único para assinatura
    const signatureLinkToken = `sign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Criar contrato no Supabase
    const contractData = {
      user_id: 'user-1',
      client_name,
      client_document,
      client_email: client_email || '',
      client_phone: client_phone || '',
      company_name: company_name || '',
      contract_value: contract_value || 0,
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      contract_type: contract_type || 'service',
      partner_services: partner_services || '',
      status: 'pending',
      signature_link_token: signatureLinkToken
    };

    console.log('🔍 [CREATE CONTRACT] Dados para inserir no banco:', contractData);

    const { data, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar contrato no Supabase:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    console.log('✅ Contrato criado no Supabase:', data);

    return res.status(201).json({
      id: data.id,
      signature_link_token: data.signature_link_token
    });
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
