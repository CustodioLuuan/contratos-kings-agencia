import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar cookie de sessão
    const cookies = req.headers.cookie;
    if (!cookies) {
      return res.status(401).json({ error: 'Sessão não encontrada' });
    }

    const sessionToken = cookies
      .split(';')
      .find(cookie => cookie.trim().startsWith('session_token='))
      ?.split('=')[1];

    if (!sessionToken) {
      return res.status(401).json({ error: 'Token de sessão não encontrado' });
    }

    // Verificar se o token é válido (formato: session-timestamp-random)
    if (sessionToken.startsWith('session-')) {
      return res.status(200).json({
        id: 'user-1',
        email: 'user@kings.com',
        name: 'Administrador',
        picture: 'https://via.placeholder.com/150'
      });
    }

    return res.status(401).json({ error: 'Token de sessão inválido' });
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
