import { Hono } from "hono";
import { cors } from 'hono/cors';
import { 
  getOAuthRedirectUrl, 
  exchangeCodeForSessionToken, 
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME 
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: (origin) => origin,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Auth endpoints
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Contract validation schemas
const CreateContractSchema = z.object({
  client_name: z.string().min(1, "Nome do cliente é obrigatório"),
  client_document: z.string().min(11, "CPF ou CNPJ é obrigatório"),
  client_email: z.string().email("Email inválido").optional(),
  client_phone: z.string().optional(),
  contract_value: z.number().positive("Valor deve ser maior que zero"),
  payment_date: z.string().min(1, "Data de pagamento é obrigatória"),
});

const SignContractSchema = z.object({
  signature_data: z.string().min(1, "Assinatura é obrigatória"),
});

// Contract endpoints
app.post('/api/contracts', authMiddleware, zValidator('json', CreateContractSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');
  
  const signatureToken = uuidv4();
  
  const result = await c.env.DB.prepare(`
    INSERT INTO contracts (user_id, client_name, client_document, client_email, client_phone, contract_value, payment_date, signature_link_token, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(
    user!.id,
    data.client_name,
    data.client_document,
    data.client_email || null,
    data.client_phone || null,
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

app.get('/api/contracts', authMiddleware, async (c) => {
  const user = c.get('user');
  
  const { results } = await c.env.DB.prepare(`
    SELECT id, client_name, client_document, contract_value, payment_date, status, signed_at, created_at
    FROM contracts 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).bind(user!.id).all();

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

export default app;
