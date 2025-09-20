import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Crown, User, LogOut, Clock, CheckCircle, DollarSign, Plus, FileText, Download, MoreVertical, Edit, Trash2, Copy, X, Search } from 'lucide-react';
import DropdownMenu from '../components/DropdownMenu';
import Notification, { NotificationType } from '../components/Notification';
import jsPDF from 'jspdf';

interface Contract {
  id: number;
  client_name: string;
  client_document: string;
  client_email?: string;
  client_phone?: string;
  company_name?: string;
  contract_value: number;
  payment_date: string;
  contract_type?: 'service' | 'permuta';
  partner_services?: string;
  status: 'pending' | 'signed';
  signed_at?: string;
  created_at: string;
  signature_link_token?: string;
  signature_data?: string;
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'service' | 'permuta'>('all');
  
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
        const response = await fetch('/api/auth/me', {
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
      // Limpar estado local
      setUser(null);
      setContracts([]);
      // Redirecionar para home
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

  // Filtrar contratos baseado na pesquisa, status e tipo
  const filteredContracts = contracts.filter(contract => {
    // Filtro por status
    if (statusFilter !== 'all' && contract.status !== statusFilter) {
      return false;
    }
    
    // Filtro por tipo
    if (typeFilter !== 'all' && contract.contract_type !== typeFilter) {
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
      const response = await fetch(`/api/contracts/delete/${contractToDelete.id}`, {
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
      const link = `https://contratos.kingsagencia.com.br/api/contracts/${contract.signature_link_token}`;
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

  const generateContractPDF = async (contract: Contract) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Função para verificar se é contrato de permuta
    const isPermutaContract = () => {
      return String(contract.contract_type || '').trim().toLowerCase() === 'permuta';
    };

    // Definir fundo escuro
    pdf.setFillColor(5, 5, 5); // #050505
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Função para adicionar texto com quebra de linha
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#FFFFFF', centered: boolean = false) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setTextColor(color);
      
      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          // Aplicar fundo escuro na nova página
          pdf.setFillColor(5, 5, 5);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          yPosition = 20;
        }
        
        if (centered) {
          const textWidth = pdf.getTextWidth(line);
          const x = (pageWidth - textWidth) / 2;
          pdf.text(line, x, yPosition);
        } else {
          pdf.text(line, margin, yPosition);
        }
        yPosition += fontSize * 0.4;
      });
      yPosition += 5;
    };

    // Título principal
    const contractTitle = isPermutaContract() ? 'CONTRATO DE PERMUTA DE SERVIÇOS' : 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS';
    addText(contractTitle, 18, true, '#FFFFFF', true);
    addText('KINGS AGÊNCIA', 16, true, '#DBFB36', true);
    yPosition += 10;

    // Seção PARTES
    addText('PARTES', 14, true, '#DBFB36');
    addText(`De um lado, KINGS AGÊNCIA, inscrita no CPF nº 145.998.009-37, prestando serviços de forma online, doravante denominada EMPRESA;`, 12, false, '#FFFFFF');
    const partnerTitle = isPermutaContract() ? 'PARCEIRO' : 'CLIENTE';
    addText(`E de outro, ${contract.client_name}, inscrito no CPF nº ${contract.client_document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}, doravante denominado ${partnerTitle}.`, 12, false, '#FFFFFF');
    yPosition += 10;

    // Título do contrato
    addText(contractTitle, 16, true, '#DBFB36', true);
    yPosition += 10;

    // CLÁUSULA 1 - OBJETO
    addText('CLÁUSULA 1 – OBJETO', 14, true, '#DBFB36');
    if (isPermutaContract()) {
      addText('1.1 O presente contrato tem por objeto a troca de serviços entre as partes, em regime de permuta, consistindo em:', 12, false, '#FFFFFF');
      addText('A EMPRESA fornecerá ao PARCEIRO serviços de criação, desenvolvimento e manutenção de sites, hospedagem, suporte técnico, design e soluções digitais personalizadas.', 12, false, '#FFFFFF');
      addText(`O PARCEIRO, em contrapartida, fornecerá à EMPRESA os seguintes serviços/bens: ${contract.partner_services || '[especificar aqui o que será oferecido pelo PARCEIRO – ex: fotografia, marketing, produtos, etc.]'}.`, 12, false, '#FFFFFF');
      addText('1.2 Cada parte declara estar ciente do valor estimado dos serviços ofertados pela outra, de modo que a permuta é considerada justa e equivalente.', 12, false, '#FFFFFF');
      addText('1.3 Eventuais alterações ou acréscimos de serviços por qualquer das partes deverão ser objeto de aditivo contratual.', 12, false, '#FFFFFF');
    } else {
      addText('1.1 O presente contrato tem por objeto a prestação de serviços pela EMPRESA ao CLIENTE, podendo incluir:', 12, false, '#FFFFFF');
      addText('• Criação, desenvolvimento e manutenção de sites;', 12, false, '#FFFFFF');
      addText('• Hospedagem e suporte técnico;', 12, false, '#FFFFFF');
      addText('• Design e soluções digitais personalizadas.', 12, false, '#FFFFFF');
      addText('1.2 O site será desenvolvido de acordo com a escolha e informações fornecidas pelo CLIENTE no início do projeto, garantindo que o valor contratado cobre a entrega conforme esse combinado.', 12, false, '#FFFFFF');
      addText('1.3 As alterações ou modificações visuais nos serviços prestados seguirão as condições de cada plano contratado:', 12, false, '#FFFFFF');
      addText('• Plano Básico: qualquer alteração visual solicitada será cobrada à parte, conforme tabela vigente da EMPRESA;', 12, false, '#FFFFFF');
      addText('• Plano Avançado: inclui até 1 (uma) alteração visual gratuita por mês. Alterações adicionais serão cobradas à parte;', 12, false, '#FFFFFF');
      addText('• Plano Premium: inclui até 3 (três) alterações visuais gratuitas por mês. Alterações adicionais serão cobradas à parte.', 12, false, '#FFFFFF');
    }
    yPosition += 10;

    // CLÁUSULA 2 - PRAZO
    addText('CLÁUSULA 2 – PRAZO', 14, true, '#DBFB36');
    addText('2.1 O prazo de execução dos serviços será definido em cronograma acordado entre as partes, respeitando as condições previamente estabelecidas.', 12, false, '#FFFFFF');
    yPosition += 10;

    // CLÁUSULA 3 - VALOR E CONDIÇÕES
    const clause3Title = isPermutaContract() ? 'CLÁUSULA 3 – VALOR E CONDIÇÕES DA PERMUTA' : 'CLÁUSULA 3 – VALOR E PAGAMENTO';
    addText(clause3Title, 14, true, '#DBFB36');
    if (isPermutaContract()) {
      addText('3.1 Não haverá pagamento em dinheiro entre as partes, salvo se houver desequilíbrio no valor da permuta.', 12, false, '#FFFFFF');
      addText('3.2 Caso uma das partes solicite serviços adicionais não previstos na troca, estes poderão ser cobrados financeiramente ou compensados em novo ajuste de permuta.', 12, false, '#FFFFFF');
      addText('3.3 O valor da permuta poderá ser revisado mediante acordo mútuo e por escrito entre as partes.', 12, false, '#FFFFFF');
    } else {
      addText(`3.1 O CLIENTE pagará à EMPRESA o valor total de R$ ${contract.contract_value}, que deverá ser pago inteiramente no momento da finalização e entrega do site.`, 12, false, '#FFFFFF');
      addText(`3.2 Em caso de mensalidade (hospedagem/manutenção), o pagamento ocorrerá todo dia ${contract.payment_date.split('-')[2]} de cada mês.`, 12, false, '#FFFFFF');
      addText('3.3 Os valores poderão ser reajustados ou alterados, mediante aviso prévio de 30 (trinta) dias ao CLIENTE.', 12, false, '#FFFFFF');
      addText('3.4 O valor do contrato não será reajustado continuamente; somente poderá haver cobrança adicional em caso de alterações solicitadas pelo CLIENTE, conforme Cláusula 1.3.', 12, false, '#FFFFFF');
    }
    yPosition += 10;

    // CLÁUSULA 4 - OBRIGAÇÕES DA EMPRESA
    addText('CLÁUSULA 4 – OBRIGAÇÕES DA EMPRESA', 14, true, '#DBFB36');
    addText('• Entregar os serviços contratados dentro do prazo estabelecido;', 12, false, '#FFFFFF');
    addText('• Garantir a confidencialidade das informações recebidas;', 12, false, '#FFFFFF');
    addText('• Prestar suporte técnico conforme acordado.', 12, false, '#FFFFFF');
    yPosition += 10;

    // CLÁUSULA 5 - OBRIGAÇÕES DO PARCEIRO/CLIENTE
    const clause5Title = isPermutaContract() ? 'CLÁUSULA 5 – OBRIGAÇÕES DO PARCEIRO' : 'CLÁUSULA 5 – OBRIGAÇÕES DO CLIENTE';
    addText(clause5Title, 14, true, '#DBFB36');
    if (isPermutaContract()) {
      addText('• Entregar à EMPRESA os serviços/bens acordados em condições adequadas;', 12, false, '#FFFFFF');
      addText('• Fornecer informações, conteúdos e materiais necessários para execução dos serviços;', 12, false, '#FFFFFF');
      addText('• Cumprir os prazos ajustados.', 12, false, '#FFFFFF');
    } else {
      addText('• Fornecer informações, conteúdos e materiais necessários para execução dos serviços;', 12, false, '#FFFFFF');
      addText('• Efetuar os pagamentos nas datas ajustadas;', 12, false, '#FFFFFF');
      addText('• Respeitar os prazos de aprovação e feedback.', 12, false, '#FFFFFF');
    }
    yPosition += 10;

    // CLÁUSULA 6 - RESCISÃO
    addText('CLÁUSULA 6 – RESCISÃO', 14, true, '#DBFB36');
    addText('6.1 O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.', 12, false, '#FFFFFF');
    addText('6.2 Em caso de descumprimento das obrigações por qualquer parte, a parte prejudicada poderá suspender a execução de suas obrigações até a regularização.', 12, false, '#FFFFFF');
    yPosition += 10;

    // CLÁUSULA 7 - FORO
    addText('CLÁUSULA 7 – FORO', 14, true, '#DBFB36');
    addText('Fica eleito o foro da comarca de Itajaí/SC, com renúncia a qualquer outro, para dirimir quaisquer dúvidas decorrentes deste contrato.', 12, false, '#FFFFFF');
    yPosition += 20;

    // Data e local
    addText(`Itajaí/SC, ${new Date().toLocaleDateString('pt-BR')}.`, 12, false, '#FFFFFF');
    yPosition += 20;

    // Assinaturas
    addText('ASSINATURAS', 14, true, '#DBFB36', true);
    yPosition += 10;

    // Assinatura da empresa
    try {
      // Carregar logo da Kings Agência
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        logoImg.src = '/kings-logo.png';
      });
      
      // Adicionar logo ao PDF
      const logoWidth = 40; // Largura do logo
      const logoHeight = 20; // Altura do logo
      const logoX = (pageWidth - logoWidth) / 2; // Centralizar
      
      pdf.addImage(logoImg, 'PNG', logoX, yPosition - 10, logoWidth, logoHeight);
      yPosition += 15;
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
      // Fallback: mostrar apenas texto se o logo não carregar
      addText('Kings Agência', 12, true, '#FFFFFF');
    }
    
    addText('Kings Agência', 12, true, '#FFFFFF');
    addText('EMPRESA', 10, false, '#A3A3A3');
    yPosition += 20;

    // Assinatura do cliente
    if (contract.signature_data) {
      try {
        // Processar assinatura de forma síncrona
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Criar uma imagem temporária
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          // Aguardar o carregamento da imagem
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = contract.signature_data!;
          });
          
          // Detectar se foi assinado em mobile em tela cheia (horizontal)
          // Assinaturas em mobile tela cheia tendem a ter proporção landscape (width > height)
          const isMobileFullscreen = img.width > img.height;
          
          if (isMobileFullscreen) {
            // Para mobile em tela cheia, rotacionar a assinatura
            canvas.width = img.height; // Trocar width e height
            canvas.height = img.width;
            
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 2); // Rotacionar -90 graus
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
          } else {
            // Para desktop e mobile normal, manter orientação original
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          }
          
          // Aplicar filtro para inverter cores (preto vira branco) mas manter fundo transparente
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Se o pixel é branco (fundo), tornar transparente
            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0; // Alpha = 0 (transparente)
            } else {
              // Para pixels escuros (assinatura), inverter para branco
              data[i] = 255 - r;     // R
              data[i + 1] = 255 - g; // G
              data[i + 2] = 255 - b; // B
              // Manter alpha original
            }
          }
          ctx.putImageData(imageData, 0, 0);
          
          // Adicionar ao PDF
          const signatureData = canvas.toDataURL('image/png');
          const imgWidth = 60; // Largura da assinatura
          const imgHeight = 20; // Altura da assinatura
          const x = (pageWidth - imgWidth) / 2; // Centralizar
          
          pdf.addImage(signatureData, 'PNG', x, yPosition - 15, imgWidth, imgHeight);
        }
      } catch (error) {
        console.error('Erro ao processar assinatura:', error);
      }
    }
    
    addText(contract.client_name, 12, true, '#FFFFFF');
    addText(partnerTitle, 10, false, '#A3A3A3');
    yPosition += 20;

    // TERMOS DE USO
    addText('TERMOS DE USO – SITE KINGS AGÊNCIA', 14, true, '#DBFB36', true);
    yPosition += 10;

    addText('ACEITAÇÃO DOS TERMOS', 12, true, '#DBFB36');
    addText('Ao acessar e utilizar o site da Kings Agência, o cliente declara estar ciente e de acordo com as regras aqui estabelecidas.', 12, false, '#FFFFFF');
    yPosition += 10;

    addText('SERVIÇOS OFERECIDOS', 12, true, '#DBFB36');
    addText('O site pode disponibilizar informações sobre criação de sites, design, soluções digitais personalizadas e demais serviços oferecidos.', 12, false, '#FFFFFF');
    yPosition += 10;

    addText('RESPONSABILIDADE DO CLIENTE', 12, true, '#DBFB36');
    addText('• Utilizar o site de forma legal e ética;', 12, false, '#FFFFFF');
    addText('• Não tentar invadir, copiar ou alterar o sistema;', 12, false, '#FFFFFF');
    addText('• Respeitar os direitos de propriedade intelectual.', 12, false, '#FFFFFF');
    yPosition += 10;

    addText('RESPONSABILIDADE DA KINGS AGÊNCIA', 12, true, '#DBFB36');
    addText('A Kings Agência se compromete a proteger os dados pessoais dos clientes, seguindo as diretrizes da LGPD (Lei Geral de Proteção de Dados).', 12, false, '#FFFFFF');
    yPosition += 10;

    addText('PROPRIEDADE INTELECTUAL', 12, true, '#DBFB36');
    addText('Todo o conteúdo do site, incluindo textos, imagens, logotipos e design, é de propriedade da Kings Agência e não pode ser reproduzido sem autorização.', 12, false, '#FFFFFF');
    yPosition += 10;

    addText('PRIVACIDADE', 12, true, '#DBFB36');
    addText('As informações fornecidas pelos clientes serão utilizadas exclusivamente para contato e elaboração de propostas comerciais.', 12, false, '#FFFFFF');
    yPosition += 10;

    addText('ALTERAÇÕES', 12, true, '#DBFB36');
    addText('Estes termos podem ser alterados a qualquer momento, sendo a versão mais recente sempre válida.', 12, false, '#FFFFFF');
    yPosition += 10;

    addText('FORO', 12, true, '#DBFB36');
    addText('Para questões relacionadas ao uso do site, fica eleito o foro da comarca de Itajaí/SC.', 12, false, '#FFFFFF');

    // Adicionar metadados
    const pdfTitle = isPermutaContract() ? 'Contrato de Permuta de Serviços' : 'Contrato de Prestação de Serviços';
    pdf.setProperties({
      title: `${pdfTitle} - ${contract.client_name}`,
      subject: pdfTitle,
      author: 'Kings Agência',
      creator: 'Kings Agência - Sistema de Contratos',
    });

    // Baixar o PDF
    const contractTypeName = isPermutaContract() ? 'permuta' : 'prestacao-servicos';
    const fileName = `contrato-${contractTypeName}-${contract.client_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  const handleDownloadPDF = async (contract: Contract) => {
    if (contract.status !== 'signed') {
      showNotificationMessage('error', 'Erro', 'Apenas contratos assinados podem ser baixados em PDF');
      setOpenMenuId(null);
      return;
    }
    
    try {
      await generateContractPDF(contract);
      showNotificationMessage('success', 'PDF Baixado!', 'O contrato foi baixado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showNotificationMessage('error', 'Erro ao gerar PDF', 'Não foi possível gerar o PDF. Tente novamente.');
    }
    
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

            {/* Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  typeFilter === 'all'
                    ? 'bg-kings-primary text-kings-bg-primary'
                    : 'bg-kings-bg-tertiary text-kings-text-secondary hover:bg-kings-bg-tertiary/70 border border-kings-border'
                }`}
              >
                Todos os Tipos
              </button>
              <button
                onClick={() => setTypeFilter('service')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  typeFilter === 'service'
                    ? 'bg-blue-500 text-white'
                    : 'bg-kings-bg-tertiary text-kings-text-secondary hover:bg-kings-bg-tertiary/70 border border-kings-border'
                }`}
              >
                Prestação
              </button>
              <button
                onClick={() => setTypeFilter('permuta')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  typeFilter === 'permuta'
                    ? 'bg-purple-500 text-white'
                    : 'bg-kings-bg-tertiary text-kings-text-secondary hover:bg-kings-bg-tertiary/70 border border-kings-border'
                }`}
              >
                Permuta
              </button>
            </div>
          </div>

          {/* Results Info */}
          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
            <div className="mt-3 flex items-center gap-4 text-sm text-kings-text-muted">
              <span>
                {filteredContracts.length} contrato(s) encontrado(s)
                {searchTerm && ` para "${searchTerm}"`}
                {statusFilter !== 'all' && ` com status "${statusFilter === 'pending' ? 'Pendente' : 'Assinado'}"`}
                {typeFilter !== 'all' && ` do tipo "${typeFilter === 'permuta' ? 'Permuta' : 'Prestação'}"`}
              </span>
              {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
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
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? 'Nenhum contrato encontrado' : 'Nenhum contrato encontrado'}
              </h3>
              <p className="text-kings-text-muted mb-6">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? `Nenhum contrato encontrado com os filtros aplicados`
                  : 'Comece criando seu primeiro contrato'
                }
              </p>
              {!(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-kings-text-primary">Tipo</th>
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
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          contract.contract_type === 'permuta'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {contract.contract_type === 'permuta' ? 'Permuta' : 'Prestação'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-kings-text-primary font-medium">
                        {contract.contract_type === 'permuta' ? 'Troca de Serviços' : formatCurrency(contract.contract_value)}
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