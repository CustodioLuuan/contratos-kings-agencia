import { useEffect, useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { Crown, Plus, FileText, Download, DollarSign, User, LogOut, CheckCircle, Clock } from 'lucide-react';
import type { Contract } from '@/shared/types';

export default function Dashboard() {
  const { user, isPending, logout } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !user) {
      navigate('/');
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch('/api/contracts', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setContracts(data);
        }
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchContracts();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isPending || !user) {
    return (
      <div className="min-h-screen bg-kings-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kings-primary"></div>
      </div>
    );
  }

  const pendingContracts = contracts.filter(c => c.status === 'pending').length;
  const signedContracts = contracts.filter(c => c.status === 'signed').length;
  const totalValue = contracts.reduce((sum, c) => sum + c.contract_value, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-kings-bg-primary text-kings-text-primary font-space">
      {/* Header */}
      <header className="border-b border-kings-border backdrop-blur-sm bg-kings-bg-primary/90">
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
                <p className="text-sm text-kings-text-muted">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-kings-bg-tertiary border border-kings-border px-4 py-2 rounded-lg">
                <User className="h-4 w-4 text-kings-primary" />
                <span className="text-sm text-kings-text-secondary">{user.google_user_data.name || user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-4 py-2 rounded-lg transition-colors text-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kings-text-muted text-sm">Total de Contratos</p>
                <p className="text-2xl font-bold text-kings-text-primary">{contracts.length}</p>
              </div>
              <div className="bg-kings-bg-tertiary border border-kings-border p-3 rounded-lg">
                <FileText className="h-6 w-6 text-kings-primary" />
              </div>
            </div>
          </div>

          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kings-text-muted text-sm">Pendentes</p>
                <p className="text-2xl font-bold text-kings-primary">{pendingContracts}</p>
              </div>
              <div className="bg-kings-bg-tertiary border border-kings-border p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kings-text-muted text-sm">Assinados</p>
                <p className="text-2xl font-bold text-emerald-400">{signedContracts}</p>
              </div>
              <div className="bg-kings-bg-tertiary border border-kings-border p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kings-text-muted text-sm">Valor Total</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalValue)}</p>
              </div>
              <div className="bg-kings-bg-tertiary border border-kings-border p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-kings-text-primary">Seus Contratos</h2>
          <button
            onClick={() => navigate('/create-contract')}
            className="flex items-center space-x-2 bg-kings-primary hover:bg-kings-primary-dark text-kings-bg-primary px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Contrato</span>
          </button>
        </div>

        {/* Contracts Table */}
        <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kings-primary mx-auto"></div>
              <p className="mt-4 text-kings-text-muted">Carregando contratos...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-kings-text-muted mx-auto mb-4" />
              <p className="text-kings-text-muted mb-4">Nenhum contrato encontrado</p>
              <button
                onClick={() => navigate('/create-contract')}
                className="bg-kings-primary hover:bg-kings-primary-dark text-kings-bg-primary px-6 py-2 rounded-full font-medium transition-colors"
              >
                Criar Primeiro Contrato
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-kings-bg-tertiary/50 border-b border-kings-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-kings-text-muted uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-kings-text-muted uppercase tracking-wider">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-kings-text-muted uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-kings-text-muted uppercase tracking-wider">Pagamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-kings-text-muted uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-kings-text-muted uppercase tracking-wider">Criado em</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-kings-text-muted uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kings-border">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-kings-bg-tertiary/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-kings-text-primary">{contract.client_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-kings-text-secondary">
                        {contract.client_document}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-kings-primary font-medium">
                        {formatCurrency(contract.contract_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-kings-text-secondary">
                        {formatDate(contract.payment_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          contract.status === 'signed' 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                            : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        }`}>
                          {contract.status === 'signed' ? 'Assinado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-kings-text-secondary">
                        {formatDate(contract.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {contract.status === 'pending' && (
                            <button
                              onClick={() => {
                                const link = `${window.location.origin}/sign/${contract.signature_link_token}`;
                                navigator.clipboard.writeText(link);
                                alert('Link copiado para a área de transferência!');
                              }}
                              className="text-kings-primary hover:text-kings-primary-dark text-sm font-medium transition-colors"
                            >
                              Copiar Link
                            </button>
                          )}
                          {contract.status === 'signed' && (
                            <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center space-x-1 transition-colors">
                              <Download className="h-4 w-4" />
                              <span>PDF</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
