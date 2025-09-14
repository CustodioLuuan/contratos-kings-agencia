import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/postgres';

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
    const client = createClient();
    await client.connect();

    const result = await client.query(`
      SELECT id, client_name, client_document, client_email, client_phone, 
             company_name, contract_value, payment_date, status, 
             signature_link_token, signed_at, created_at
      FROM contracts 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, ['user-1']);

    await client.end();

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function handleCreateContract(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      client_name,
      client_document,
      client_email,
      client_phone,
      company_name,
      contract_value,
      payment_date
    } = req.body;

    // Validação básica
    if (!client_name || !client_document || !contract_value || !payment_date) {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }

    const client = createClient();
    await client.connect();

    // Gerar token único para assinatura
    const signatureLinkToken = `sign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await client.query(`
      INSERT INTO contracts (
        user_id, client_name, client_document, client_email, client_phone,
        company_name, contract_value, payment_date, status, signature_link_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, signature_link_token
    `, [
      'user-1', client_name, client_document, client_email, client_phone,
      company_name, contract_value, payment_date, 'pending', signatureLinkToken
    ]);

    await client.end();

    return res.status(201).json({
      id: result.rows[0].id,
      signature_link_token: result.rows[0].signature_link_token
    });
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
