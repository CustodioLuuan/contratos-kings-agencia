import { useEffect } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        navigate('/dashboard');
      } catch (error) {
        console.error('Error during authentication:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="min-h-screen bg-kings-bg-primary flex items-center justify-center font-space">
      <div className="text-center text-kings-text-primary">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-kings-primary" />
        <h2 className="text-2xl font-semibold mb-2">Finalizando login...</h2>
        <p className="text-kings-text-muted">Aguarde enquanto configuramos sua conta</p>
      </div>
    </div>
  );
}
