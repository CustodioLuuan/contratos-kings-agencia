import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simular autenticação - em produção, usar JWT ou session
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Simular verificação de token
    if (token === 'session-1757722119726-jresk54yi') {
      return res.status(200).json({
        id: 'user-1',
        email: 'admin@kings.com',
        name: 'Administrador Kings',
        picture: 'https://via.placeholder.com/150'
      });
    }

    return res.status(401).json({ error: 'Token inválido' });
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
