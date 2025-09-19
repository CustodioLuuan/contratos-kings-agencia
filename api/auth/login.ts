import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

            // Validar credenciais - apenas uma conta
            const validCredentials = {
              email: 'kingsagenciaoficial@gmail.com',
              password: '@kingsagencia2025@!!',
              name: 'Administrador'
            };

            const user = (email === validCredentials.email && password === validCredentials.password) 
              ? validCredentials 
              : null;

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Gerar token de sessão simples
    const token = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Definir cookie de sessão
    res.setHeader('Set-Cookie', `session_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);

    return res.status(200).json({
      message: 'Login realizado com sucesso',
      user: {
        id: 'user-1',
        email: user.email,
        name: user.name,
        picture: 'https://via.placeholder.com/150'
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
