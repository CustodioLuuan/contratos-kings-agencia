import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query;

  if (req.method === 'GET') {
    return handleGetContract(req, res, token as string);
  } else if (req.method === 'POST') {
    return handleSignContract(req, res, token as string);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetContract(req: VercelRequest, res: VercelResponse, token: string) {
  try {
    const client = createClient();
    await client.connect();

    const result = await client.query(`
      SELECT id, client_name, client_document, client_email, client_phone,
             company_name, contract_value, payment_date, status,
             signature_link_token, signed_at, created_at
      FROM contracts 
      WHERE signature_link_token = $1
    `, [token]);

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function handleSignContract(req: VercelRequest, res: VercelResponse, token: string) {
  try {
    const { signature_data } = req.body;

    if (!signature_data) {
      return res.status(400).json({ error: 'Dados de assinatura não fornecidos' });
    }

    const client = createClient();
    await client.connect();

    // Verificar se o contrato existe
    const contractResult = await client.query(`
      SELECT id, status FROM contracts WHERE signature_link_token = $1
    `, [token]);

    if (contractResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }

    if (contractResult.rows[0].status === 'signed') {
      await client.end();
      return res.status(400).json({ error: 'Contrato já foi assinado' });
    }

    // Atualizar contrato com assinatura
    await client.query(`
      UPDATE contracts 
      SET status = 'signed', signed_at = NOW(), signature_data = $1
      WHERE signature_link_token = $2
    `, [signature_data, token]);

    await client.end();

    return res.status(200).json({ message: 'Contrato assinado com sucesso' });
  } catch (error) {
    console.error('Erro ao assinar contrato:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
