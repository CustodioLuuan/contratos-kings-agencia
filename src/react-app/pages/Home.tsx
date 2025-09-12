import { useEffect } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { FileText, Shield, Zap, Crown } from 'lucide-react';

export default function Home() {
  const { user, isPending, redirectToLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && user) {
      navigate('/dashboard');
    }
  }, [user, isPending, navigate]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-kings-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kings-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kings-bg-primary text-kings-text-primary font-space">
      {/* Header */}
      <header className="border-b border-kings-border backdrop-blur-sm bg-kings-bg-primary/90 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-kings-primary p-2 rounded-lg">
                <Crown className="h-8 w-8 text-kings-bg-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-kings-primary">
                  Kings Contratos
                </h1>
                <p className="text-sm text-kings-text-muted">Kings Agência</p>
              </div>
            </div>
            <button
              onClick={redirectToLogin}
              className="bg-kings-primary hover:bg-kings-primary-dark text-kings-bg-primary px-6 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg border border-kings-border"
            >
              Entrar
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center mb-16">
          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-12 max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-6 text-kings-text-primary">
              Sistema Completo de
              <br />
              <span className="text-kings-primary">
                Gestão de Contratos
              </span>
            </h2>
            <p className="text-xl text-kings-text-muted max-w-3xl mx-auto leading-relaxed mb-8">
              Crie, gerencie e obtenha assinaturas digitais para seus contratos de forma rápida e segura. 
              A solução profissional da Kings Agência.
            </p>
            
            {/* Features */}
            <div className="flex items-center justify-center space-x-6 mb-8">
              <div className="bg-kings-bg-tertiary border border-kings-border rounded-full px-4 py-2">
                <span className="text-kings-text-secondary text-sm">✓ Assinatura Digital</span>
              </div>
              <div className="bg-kings-bg-tertiary border border-kings-border rounded-full px-4 py-2">
                <span className="text-kings-text-secondary text-sm">✓ Dashboard Completo</span>
              </div>
              <div className="bg-kings-bg-tertiary border border-kings-border rounded-full px-4 py-2">
                <span className="text-kings-text-secondary text-sm">✓ Gestão Moderna</span>
              </div>
            </div>

            <button
              onClick={redirectToLogin}
              className="bg-kings-primary hover:bg-kings-primary-dark text-kings-bg-primary px-10 py-4 rounded-full font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-xl"
            >
              Entrar no Sistema
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-8 hover:bg-kings-bg-secondary/70 transition-all duration-300 transform hover:scale-105">
            <div className="bg-kings-primary/20 border border-kings-primary/30 p-3 rounded-lg w-fit mb-4">
              <FileText className="h-6 w-6 text-kings-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-kings-text-primary">Criação Rápida</h3>
            <p className="text-kings-text-muted">
              Crie contratos profissionais em minutos com nosso formulário inteligente e modelos pré-definidos.
            </p>
          </div>

          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-8 hover:bg-kings-bg-secondary/70 transition-all duration-300 transform hover:scale-105">
            <div className="bg-kings-primary/20 border border-kings-primary/30 p-3 rounded-lg w-fit mb-4">
              <Shield className="h-6 w-6 text-kings-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-kings-text-primary">Assinatura Digital</h3>
            <p className="text-kings-text-muted">
              Sistema seguro de assinatura digital com links únicos e validação em tempo real.
            </p>
          </div>

          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-8 hover:bg-kings-bg-secondary/70 transition-all duration-300 transform hover:scale-105">
            <div className="bg-kings-primary/20 border border-kings-primary/30 p-3 rounded-lg w-fit mb-4">
              <Zap className="h-6 w-6 text-kings-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-kings-text-primary">Gestão Completa</h3>
            <p className="text-kings-text-muted">
              Dashboard completo para acompanhar status, baixar PDFs e gerenciar todos os seus contratos.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-kings-bg-secondary/30 backdrop-blur-sm border border-kings-border rounded-2xl p-12 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-4 text-kings-text-primary">Pronto para começar?</h3>
            <p className="text-kings-text-muted mb-8 text-lg">
              Faça login e comece a criar seus contratos profissionais agora mesmo.
            </p>
            <button
              onClick={redirectToLogin}
              className="bg-kings-primary hover:bg-kings-primary-dark text-kings-bg-primary px-10 py-4 rounded-full font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-xl"
            >
              Entrar no Sistema
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
