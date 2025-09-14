import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Crown, User, LogOut, Clock, CheckCircle, DollarSign, Plus, FileText, Download, MoreVertical, Edit, Trash2, Copy, X, Search } from 'lucide-react';
import DropdownMenu from '../components/DropdownMenu';
import Notification, { NotificationType } from '../components/Notification';

interface Contract {
  id: number;
  client_name: string;
  client_document: string;
  client_email?: string;
  client_phone?: string;
  company_name?: string;
  contract_value: number;
  payment_date: string;
  status: 'pending' | 'signed';
  signed_at?: string;
  created_at: string;
  signature_link_token?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isPending, setIsPending] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'signed' | 'pending'>('all');
  
  // Referência para o botão atual
  const currentButtonRef = useRef<HTMLButtonElement>(null);
  
  // Estados para notificações
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: NotificationType;
    title: string;
    message: string;
  }>({
    isVisible: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    // Verificar se o usuário está logado
    const checkAuth = async () => {
      console.log('Dashboard: Verificando autenticação...');
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('Dashboard: Usuário autenticado:', userData);
          setUser(userData);
        } else {
          console.log('Dashboard: Usuário não autenticado, redirecionando...');
          navigate('/login');
        }
      } catch (error) {
        console.error('Dashboard: Erro ao verificar autenticação:', error);
        navigate('/login');
      } finally {
        console.log('Dashboard: Finalizando verificação de autenticação');
        setIsPending(false);
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!isPending && user) {
      // Carregar contratos quando o usuário estiver autenticado
      const loadContracts = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/contracts', {
            credentials: 'include',
          });
          
          if (response.ok) {
            const contractsData = await response.json();
            console.log('Dashboard: Contratos carregados:', contractsData);
            setContracts(contractsData);
          } else {
            console.error('Erro ao carregar contratos:', response.status);
            setContracts([]);
          }
        } catch (error) {
          console.error('Erro ao carregar contratos:', error);
          setContracts([]);
        } finally {
          setLoading(false);
        }
      };

      loadContracts();
    }
  }, [isPending, user]);

  const showNotificationMessage = (type: NotificationType, title: string, message: string) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Verificar se o usuário retornou da criação de contrato
  useEffect(() => {
    if (location.state?.contractCreated) {
      showNotificationMessage('success', 'Contrato criado!', 'Link copiado automaticamente para a área de transferência');
      
      // Limpar o estado da navegação para evitar que a notificação apareça novamente
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      navigate('/');
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-kings-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kings-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-kings-bg-primary flex items-center justify-center">
        <div className="text-center text-kings-text-primary">
          <h2 className="text-2xl font-semibold mb-4">Redirecionando...</h2>
          <p className="text-kings-text-muted">Você será redirecionado para a página de login</p>
        </div>
      </div>
    );
  }

  // Filtrar contratos baseado na pesquisa e status
  const filteredContracts = contracts.filter(contract => {
    // Filtro por status
    if (statusFilter !== 'all' && contract.status !== statusFilter) {
      return false;
    }
    
    // Filtro por pesquisa
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      contract.client_name.toLowerCase().includes(searchLower) ||
      contract.client_document.includes(searchTerm) ||
      (contract.company_name && contract.company_name.toLowerCase().includes(searchLower))
    );
  });

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

  const handleMenuToggle = (contractId: number) => {
    setOpenMenuId(openMenuId === contractId ? null : contractId);
  };

  const handleEditContract = (contract: Contract) => {
    // Navegar para a página de criação com os dados do contrato
    navigate('/create-contract', { 
      state: { 
        editMode: true, 
        contractData: contract 
      } 
    });
    setOpenMenuId(null);
  };

  const handleDeleteContract = (contract: Contract) => {
    setContractToDelete(contract);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;
    
    try {
      const response = await fetch(`/api/contracts/${contractToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        setContracts(contracts.filter(c => c.id !== contractToDelete.id));
        setShowDeleteModal(false);
        setContractToDelete(null);
      } else {
        alert('Erro ao excluir contrato');
      }
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      alert('Erro ao excluir contrato');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setContractToDelete(null);
  };

  const handleCopyLink = async (contract: Contract) => {
    if (contract.signature_link_token) {
      const link = `${window.location.origin}/sign/${contract.signature_link_token}`;
      try {
        await navigator.clipboard.writeText(link);
        showNotificationMessage('success', 'Link copiado!', 'Link copiado automaticamente para a área de transferência');
      } catch (error) {
        console.error('Erro ao copiar link:', error);
        showNotificationMessage('error', 'Erro ao copiar', 'Não foi possível copiar o link para a área de transferência');
      }
    } else {
      showNotificationMessage('error', 'Link não disponível', 'Este contrato não possui link de assinatura');
    }
    setOpenMenuId(null);
  };

  const handleDownloadPDF = (contract: Contract) => {
    if (contract.status !== 'signed') {
      alert('Apenas contratos assinados podem ser baixados em PDF');
      setOpenMenuId(null);
      return;
    }
    
    // TODO: Implementar download de PDF
    console.log('Download PDF:', contract);
    setOpenMenuId(null);
  };

  return (
    <div className="min-h-screen bg-kings-bg-primary text-kings-text-primary font-space">
      {/* Notification */}
      <Notification
        isVisible={notification.isVisible}
        onClose={hideNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && contractToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-kings-bg-secondary border border-kings-border rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-500/20 border border-red-500/30 p-2 rounded-lg">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-kings-text-primary">Excluir Contrato</h3>
                <p className="text-sm text-kings-text-muted">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-kings-text-primary">
                Tem certeza que deseja excluir o contrato de{' '}
                <span className="font-semibold text-kings-primary">{contractToDelete.client_name}</span>?
              </p>
              <div className="mt-3 p-3 bg-kings-bg-tertiary/50 rounded-lg">
                <div className="text-sm text-kings-text-muted">
                  <div><strong>Cliente:</strong> {contractToDelete.client_name}</div>
                  <div><strong>Valor:</strong> {formatCurrency(contractToDelete.contract_value)}</div>
                  <div><strong>Status:</strong> {contractToDelete.status === 'signed' ? 'Assinado' : 'Pendente'}</div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-kings-bg-tertiary hover:bg-kings-bg-tertiary/70 border border-kings-border text-kings-text-secondary rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-kings-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-kings-bg-primary" />
                </div>
                <span className="text-kings-text-primary font-medium">{(user as any)?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-kings-text-muted hover:text-kings-text-primary transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kings-text-muted text-sm font-medium">Contratos Pendentes</p>
                <p className="text-3xl font-bold text-kings-text-primary">{pendingContracts}</p>
              </div>
              <div className="bg-orange-500/20 border border-orange-500/30 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kings-text-muted text-sm font-medium">Contratos Assinados</p>
                <p className="text-3xl font-bold text-kings-text-primary">{signedContracts}</p>
              </div>
              <div className="bg-green-500/20 border border-green-500/30 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kings-text-muted text-sm font-medium">Valor Total</p>
                <p className="text-3xl font-bold text-kings-text-primary">{formatCurrency(totalValue)}</p>
              </div>
              <div className="bg-kings-primary/20 border border-kings-primary/30 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-kings-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-kings-text-primary">Meus Contratos</h2>
          <button
            onClick={() => navigate('/create-contract')}
            className="bg-kings-primary hover:bg-kings-primary-dark text-kings-bg-primary px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Contrato</span>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-kings-text-muted" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar por nome do cliente, CPF ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-kings-bg-tertiary border border-kings-border rounded-lg focus:ring-2 focus:ring-kings-primary focus:border-transparent text-kings-text-primary placeholder-kings-text-subtle"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-kings-text-muted hover:text-kings-text-primary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  statusFilter === 'all'
                    ? 'bg-kings-primary text-kings-bg-primary'
                    : 'bg-kings-bg-tertiary text-kings-text-secondary hover:bg-kings-bg-tertiary/70 border border-kings-border'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white'
                    : 'bg-kings-bg-tertiary text-kings-text-secondary hover:bg-kings-bg-tertiary/70 border border-kings-border'
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setStatusFilter('signed')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  statusFilter === 'signed'
                    ? 'bg-green-500 text-white'
                    : 'bg-kings-bg-tertiary text-kings-text-secondary hover:bg-kings-bg-tertiary/70 border border-kings-border'
                }`}
              >
                Assinados
              </button>
            </div>
          </div>

          {/* Results Info */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mt-3 flex items-center gap-4 text-sm text-kings-text-muted">
              <span>
                {filteredContracts.length} contrato(s) encontrado(s)
                {searchTerm && ` para "${searchTerm}"`}
                {statusFilter !== 'all' && ` com status "${statusFilter === 'pending' ? 'Pendente' : 'Assinado'}"`}
              </span>
              {(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="text-kings-primary hover:text-kings-primary-dark transition-colors font-medium"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contracts Table */}
        <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kings-primary"></div>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-kings-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-kings-text-primary mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Nenhum contrato encontrado' : 'Nenhum contrato encontrado'}
              </h3>
              <p className="text-kings-text-muted mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? `Nenhum contrato encontrado com os filtros aplicados`
                  : 'Comece criando seu primeiro contrato'
                }
              </p>
              {!(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => navigate('/create-contract')}
                  className="bg-kings-primary hover:bg-kings-primary-dark text-kings-bg-primary px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Criar Contrato
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-kings-bg-tertiary/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-kings-text-primary">Cliente</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-kings-text-primary">Valor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-kings-text-primary">Data de Pagamento</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-kings-text-primary">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-kings-text-primary">Criado em</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-kings-text-primary">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kings-border">
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-kings-bg-tertiary/30 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-kings-text-primary">{contract.client_name}</div>
                          <div className="text-sm text-kings-text-muted">{contract.client_document}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-kings-text-primary font-medium">
                        {formatCurrency(contract.contract_value)}
                      </td>
                      <td className="px-6 py-4 text-kings-text-primary">
                        {formatDate(contract.payment_date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          contract.status === 'signed' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        }`}>
                          {contract.status === 'signed' ? 'Assinado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-kings-text-muted">
                        {formatDate(contract.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            ref={currentButtonRef}
                            onClick={() => handleMenuToggle(contract.id)}
                            className="text-kings-text-muted hover:text-kings-text-primary transition-colors duration-200 p-1 rounded-lg hover:bg-kings-bg-tertiary/50"
                            title="Mais ações"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          <DropdownMenu
                            isOpen={openMenuId === contract.id}
                            onClose={() => setOpenMenuId(null)}
                            triggerRef={currentButtonRef as React.RefObject<HTMLButtonElement>}
                          >
                            <div className="py-1">
                              <button
                                onClick={() => handleEditContract(contract)}
                                className="w-full px-4 py-2 text-left text-sm text-kings-text-primary hover:bg-kings-bg-tertiary/50 flex items-center space-x-2"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Editar</span>
                              </button>
                              
                              <button
                                onClick={() => handleCopyLink(contract)}
                                className="w-full px-4 py-2 text-left text-sm text-kings-text-primary hover:bg-kings-bg-tertiary/50 flex items-center space-x-2"
                              >
                                <Copy className="h-4 w-4" />
                                <span>Copiar Link</span>
                              </button>
                              
                              <button
                                onClick={() => handleDownloadPDF(contract)}
                                disabled={contract.status !== 'signed'}
                                className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${
                                  contract.status === 'signed'
                                    ? 'text-kings-text-primary hover:bg-kings-bg-tertiary/50'
                                    : 'text-kings-text-muted cursor-not-allowed opacity-50'
                                }`}
                              >
                                <Download className="h-4 w-4" />
                                <span>Download PDF</span>
                              </button>
                              
                              <div className="border-t border-kings-border my-1"></div>
                              
                              <button
                                onClick={() => handleDeleteContract(contract)}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          </DropdownMenu>
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