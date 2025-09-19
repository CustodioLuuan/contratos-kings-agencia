import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Crown, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/dashboard');
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kings-bg-primary flex items-center justify-center font-space">
      <div className="max-w-md w-full mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-kings-primary p-3 rounded-xl w-fit mx-auto mb-4">
            <Crown className="h-12 w-12 text-kings-bg-primary" />
          </div>
          <h1 className="text-3xl font-bold text-kings-primary mb-2">
            Kings Contratos
          </h1>
          <p className="text-kings-text-muted">Faça login para acessar o sistema</p>
        </div>

        {/* Formulário de Login */}
        <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-kings-text-primary mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-kings-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-kings-bg-tertiary border border-kings-border rounded-lg text-kings-text-primary placeholder-kings-text-muted focus:outline-none focus:ring-2 focus:ring-kings-primary focus:border-transparent transition-all duration-200"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-kings-text-primary mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-kings-text-muted" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-kings-bg-tertiary border border-kings-border rounded-lg text-kings-text-primary placeholder-kings-text-muted focus:outline-none focus:ring-2 focus:ring-kings-primary focus:border-transparent transition-all duration-200"
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-kings-text-muted hover:text-kings-text-primary transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-kings-primary hover:bg-kings-primary-dark text-kings-bg-primary py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

        </div>

        {/* Voltar para Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-kings-text-muted hover:text-kings-text-primary transition-colors duration-200"
          >
            ← Voltar para a página inicial
          </button>
        </div>
      </div>
    </div>
  );
}
