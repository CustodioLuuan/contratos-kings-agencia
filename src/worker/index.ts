import { Hono } from "hono";
import { cors } from 'hono/cors';
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

const MOCHA_SESSION_TOKEN_COOKIE_NAME = 'mocha-session-token';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: (origin) => origin,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Auth endpoints - Login com email e senha
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email e senha são obrigatórios' }, 400);
    }

    // Para desenvolvimento, aceitar qualquer email/senha
    // Em produção, você deve verificar contra um banco de dados
    if (email === 'admin@kings.com' && password === '123456') {
      const sessionToken = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      console.log('Login bem-sucedido, criando sessão:', sessionToken);
      
      setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false, // Para desenvolvimento local
        maxAge: 60 * 24 * 60 * 60, // 60 days
      });

      return c.json({ 
        success: true, 
        user: {
          id: 'user-1',
          email: email,
          name: 'Administrador Kings',
          picture: 'https://via.placeholder.com/150'
        }
      }, 200);
    } else {
      return c.json({ error: 'Email ou senha incorretos' }, 401);
    }
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Logout endpoint
app.post('/api/auth/logout', async (c) => {
  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: false, // Para desenvolvimento local
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  
  console.log('Verificando autenticação, token:', sessionToken);
  
  if (!sessionToken) {
    console.log('Nenhum token encontrado, retornando 401');
    return c.json({ error: 'Não autenticado' }, 401);
  }
  
  // Para desenvolvimento, retornar usuário mock baseado na sessão
  const mockUser = {
    id: 'user-1',
    email: 'admin@kings.com',
    name: 'Administrador Kings',
    picture: 'https://via.placeholder.com/150'
  };
  
  console.log('Usuário autenticado, retornando dados:', mockUser);
  return c.json(mockUser);
});


// Contract validation schemas
const CreateContractSchema = z.object({
  client_name: z.string().min(1, "Nome do cliente é obrigatório"),
  client_document: z.string().min(11, "CPF ou CNPJ é obrigatório"),
  client_email: z.string().email("Email inválido").optional(),
  client_phone: z.string().optional(),
  company_name: z.string().optional(),
  contract_value: z.number().positive("Valor deve ser maior que zero"),
  payment_date: z.string().min(1, "Data de pagamento é obrigatória"),
});

const SignContractSchema = z.object({
  signature_data: z.string().min(1, "Assinatura é obrigatória"),
});

// Contract endpoints
app.post('/api/contracts', zValidator('json', CreateContractSchema), async (c) => {
  // Verificar autenticação manualmente
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (!sessionToken) {
    return c.json({ error: 'Não autenticado' }, 401);
  }
  
  const data = c.req.valid('json');
  
  const signatureToken = uuidv4();
  
  const result = await c.env.DB.prepare(`
    INSERT INTO contracts (user_id, client_name, client_document, client_email, client_phone, company_name, contract_value, payment_date, signature_link_token, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(
    'user-1', // ID fixo para desenvolvimento
    data.client_name,
    data.client_document,
    data.client_email || null,
    data.client_phone || null,
    data.company_name || null,
    data.contract_value,
    data.payment_date,
    signatureToken
  ).run();

  return c.json({
    id: result.meta.last_row_id,
    signature_link: `/sign/${signatureToken}`,
    ...data
  });
});

app.get('/api/contracts', async (c) => {
  // Verificar autenticação manualmente
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (!sessionToken) {
    return c.json({ error: 'Não autenticado' }, 401);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT id, client_name, client_document, client_email, client_phone, company_name, contract_value, payment_date, status, signature_link_token, signed_at, created_at
    FROM contracts 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).bind('user-1').all(); // ID fixo para desenvolvimento

  return c.json(results);
});

app.get('/api/contracts/:token', async (c) => {
  const token = c.req.param('token');
  
  const result = await c.env.DB.prepare(`
    SELECT * FROM contracts WHERE signature_link_token = ?
  `).bind(token).first();

  if (!result) {
    return c.json({ error: 'Contrato não encontrado' }, 404);
  }

  return c.json(result);
});

app.post('/api/contracts/:token/sign', zValidator('json', SignContractSchema), async (c) => {
  const token = c.req.param('token');
  const { signature_data } = c.req.valid('json');
  
  const contract = await c.env.DB.prepare(`
    SELECT * FROM contracts WHERE signature_link_token = ?
  `).bind(token).first();

  if (!contract) {
    return c.json({ error: 'Contrato não encontrado' }, 404);
  }

  if (contract.status === 'signed') {
    return c.json({ error: 'Contrato já foi assinado' }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE contracts 
    SET signature_data = ?, status = 'signed', signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE signature_link_token = ?
  `).bind(signature_data, token).run();

  return c.json({ success: true, message: 'Contrato assinado com sucesso!' });
});

// PUT contract endpoint (update)
app.put('/api/contracts/:id', async (c) => {
  const contractId = c.req.param('id');
  
  // Verificar se o usuário está autenticado
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (!sessionToken) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  try {
    const body = await c.req.json();
    
    // Validar dados obrigatórios
    if (!body.client_name || !body.client_document || !body.contract_value || !body.payment_date) {
      return c.json({ error: 'Dados obrigatórios não fornecidos' }, 400);
    }

    // Verificar se o contrato existe e pertence ao usuário
    const existingContract = await c.env.DB.prepare(`
      SELECT * FROM contracts WHERE id = ? AND user_id = ?
    `).bind(contractId, 'user-1').first(); // ID fixo para desenvolvimento

    if (!existingContract) {
      return c.json({ error: 'Contrato não encontrado' }, 404);
    }

    // Atualizar o contrato
    await c.env.DB.prepare(`
      UPDATE contracts 
      SET client_name = ?, client_document = ?, client_email = ?, client_phone = ?, 
          company_name = ?, contract_value = ?, payment_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(
      body.client_name,
      body.client_document,
      body.client_email || '',
      body.client_phone || '',
      body.company_name || '',
      body.contract_value,
      body.payment_date,
      contractId,
      'user-1' // ID fixo para desenvolvimento
    ).run();

    return c.json({ success: true, message: 'Contrato atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// DELETE contract endpoint
app.delete('/api/contracts/:id', async (c) => {
  const contractId = c.req.param('id');
  
  // Verificar se o usuário está autenticado
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (!sessionToken) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  // Verificar se o contrato existe e pertence ao usuário
  const contract = await c.env.DB.prepare(`
    SELECT * FROM contracts WHERE id = ? AND user_id = ?
  `).bind(contractId, 'user-1').first(); // ID fixo para desenvolvimento

  if (!contract) {
    return c.json({ error: 'Contrato não encontrado' }, 404);
  }

  // Excluir o contrato
  await c.env.DB.prepare(`
    DELETE FROM contracts WHERE id = ? AND user_id = ?
  `).bind(contractId, 'user-1').run(); // ID fixo para desenvolvimento

  return c.json({ success: true, message: 'Contrato excluído com sucesso!' });
});

export default app;
