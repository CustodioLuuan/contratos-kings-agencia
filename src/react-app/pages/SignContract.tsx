// VERSÃO ATUALIZADA - 2024-12-19 15:30 - CONTRATO PERMUTA FIX
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { Crown, FileText, PenTool, Download, CheckCircle } from 'lucide-react';
import type { Contract } from '@/shared/types';
import { generateContractPDF } from '@/shared/pdfGenerator';

export default function SignContract() {
  const { token } = useParams<{ token: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<number[][]>([]);
  const [allStrokes, setAllStrokes] = useState<number[][][]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Detectar se é mobile
  const isMobile = 'ontouchstart' in window && window.innerWidth <= 768;

  // Adicionar estilos de impressão
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body { background: white !important; }
        .print-hidden { display: none !important; }
        .print-visible { display: block !important; }
        .bg-kings-bg-secondary { background: white !important; }
        .text-kings-text-primary { color: black !important; }
        .text-kings-text-secondary { color: #374151 !important; }
        .text-kings-text-muted { color: #6b7280 !important; }
        .border-kings-border { border-color: #d1d5db !important; }
        .bg-kings-primary { background: #3b82f6 !important; }
        .text-kings-primary { color: #3b82f6 !important; }
        .filter { filter: none !important; }
        .brightness-0 { filter: none !important; }
        .invert { filter: none !important; }
      }
      
      .pdf-optimized {
        background: white !important;
        color: black !important;
      }
      
      .pdf-optimized .text-kings-text-primary { color: black !important; }
      .pdf-optimized .text-kings-text-secondary { color: #374151 !important; }
      .pdf-optimized .text-kings-text-muted { color: #6b7280 !important; }
      .pdf-optimized .border-kings-border { border-color: #d1d5db !important; }
      .pdf-optimized .bg-kings-primary { background: #3b82f6 !important; }
      .pdf-optimized .text-kings-primary { color: #3b82f6 !important; }
      .pdf-optimized .bg-kings-bg-secondary { background: white !important; }
      .pdf-optimized .filter { filter: none !important; }
      .pdf-optimized .brightness-0 { filter: none !important; }
      .pdf-optimized .invert { filter: none !important; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/contracts/get/${token}`);
        if (response.ok) {
          const data = await response.json();
          setContract(data);
          if (data.status === 'signed') {
            setSigned(true);
          }
        } else {
          setError('Contrato não encontrado');
        }
      } catch (error) {
        console.error('Error fetching contract:', error);
        setError('Erro ao carregar contrato');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchContract();
    }
  }, [token]);

  useEffect(() => {
    const initCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      
      // Detectar se é desktop (não é mobile)
      const isDesktop = !('ontouchstart' in window) && window.innerWidth > 768;
      
      // Detectar se é mobile em tela cheia
      const isMobileFullscreen = isMobile && isFullscreen;
      
      if (isDesktop) {
        // Configuração para DESKTOP com devicePixelRatio
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
      } else if (isMobileFullscreen) {
        // Configuração ESPECÍFICA para MOBILE em tela cheia
        canvas.width = rect.width;
        canvas.height = rect.height;
        // Sem devicePixelRatio para mobile em tela cheia
      } else {
        // Configuração SIMPLES para MOBILE normal
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      // Set drawing style for smooth lines
      ctx.lineWidth = 3.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      
      // Configurações específicas para mobile
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, isDesktop ? rect.width : canvas.width, isDesktop ? rect.height : canvas.height);
    };

    // Delay para garantir que o DOM esteja carregado
    setTimeout(initCanvas, 100);
    
    // Reconfigurar canvas em mudanças de orientação ou redimensionamento
    const handleResize = () => {
      setTimeout(initCanvas, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMobile, isFullscreen]);

  const getPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Calcular coordenadas relativas ao canvas
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Detectar se é desktop
    const isDesktop = !('ontouchstart' in window) && window.innerWidth > 768;
    
    // Detectar se é mobile em tela cheia - usar estado atual
    const isMobileFullscreen = isMobile && isFullscreen;
    
    console.log('getPosition - isMobile:', isMobile, 'isFullscreen:', isFullscreen, 'isMobileFullscreen:', isMobileFullscreen);
    
    if (isDesktop) {
      // Aplicar escala do devicePixelRatio apenas no DESKTOP
      const dpr = window.devicePixelRatio || 1;
      const scaledX = x * dpr;
      const scaledY = y * dpr;
      console.log('Desktop - scaled coordinates:', [scaledX, scaledY]);
      return [scaledX, scaledY];
    } else if (isMobileFullscreen) {
      // Coordenadas DIRETAS para MOBILE em tela cheia
      console.log('Mobile Fullscreen - direct coordinates:', [x, y]);
      return [x, y];
    } else {
      // Coordenadas DIRETAS para MOBILE normal
      console.log('Mobile Normal - direct coordinates:', [x, y]);
      return [x, y];
    }
  };

  // Filtro de suavização para reduzir tremores
  const smoothPoints = (points: number[][]) => {
    if (points.length < 3) return points;
    
    const smoothed = [points[0]]; // Primeiro ponto sem alteração
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      // Aplica filtro de média móvel para suavizar
      const smoothedX = (prev[0] + curr[0] + next[0]) / 3;
      const smoothedY = (prev[1] + curr[1] + next[1]) / 3;
      
      smoothed.push([smoothedX, smoothedY]);
    }
    
    smoothed.push(points[points.length - 1]); // Último ponto sem alteração
    return smoothed;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signed) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newPoints = [getPosition(e, canvas)];
    console.log('Start drawing at:', newPoints[0]);
    setPoints(newPoints);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const newPoints = [...points, getPosition(e, canvas)];
    setPoints(newPoints);
    redraw(canvas, newPoints);
  };

  const redraw = (canvas: HTMLCanvasElement, currentPoints: number[][]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha todos os traços anteriores
    allStrokes.forEach(stroke => {
      if (stroke.length < 2) return;

      const smoothedPoints = smoothPoints(stroke);
      ctx.beginPath();
      ctx.moveTo(smoothedPoints[0][0], smoothedPoints[0][1]);

      // Algoritmo de suavização melhorado para curvas ultra-suaves
      for (let i = 1; i < smoothedPoints.length - 1; i++) {
        const [x1, y1] = smoothedPoints[i - 1];
        const [x2, y2] = smoothedPoints[i];
        const [x3, y3] = smoothedPoints[i + 1];
        
        // Calcula pontos de controle para curvas Bézier cúbicas mais suaves
        const cp1x = x1 + (x2 - x1) * 0.5;
        const cp1y = y1 + (y2 - y1) * 0.5;
        const cp2x = x2 - (x3 - x2) * 0.5;
        const cp2y = y2 - (y3 - y2) * 0.5;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      }
      
      // Último ponto com curva quadrática
      if (smoothedPoints.length > 1) {
        const lastIndex = smoothedPoints.length - 1;
        const [x1, y1] = smoothedPoints[lastIndex - 1];
        const [x2, y2] = smoothedPoints[lastIndex];
        const [xMid, yMid] = [(x1 + x2) / 2, (y1 + y2) / 2];
        ctx.quadraticCurveTo(x1, y1, xMid, yMid);
      }
      
      ctx.stroke();
    });

    // Desenha o traço atual
    if (currentPoints.length < 2) return;

    const smoothedPoints = smoothPoints(currentPoints);
    ctx.beginPath();
    ctx.moveTo(smoothedPoints[0][0], smoothedPoints[0][1]);

    // Algoritmo de suavização melhorado para curvas ultra-suaves
    for (let i = 1; i < smoothedPoints.length - 1; i++) {
      const [x1, y1] = smoothedPoints[i - 1];
      const [x2, y2] = smoothedPoints[i];
      const [x3, y3] = smoothedPoints[i + 1];
      
      // Calcula pontos de controle para curvas Bézier cúbicas mais suaves
      const cp1x = x1 + (x2 - x1) * 0.5;
      const cp1y = y1 + (y2 - y1) * 0.5;
      const cp2x = x2 - (x3 - x2) * 0.5;
      const cp2y = y2 - (y3 - y2) * 0.5;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    }
    
    // Último ponto com curva quadrática
    if (smoothedPoints.length > 1) {
      const lastIndex = smoothedPoints.length - 1;
      const [x1, y1] = smoothedPoints[lastIndex - 1];
      const [x2, y2] = smoothedPoints[lastIndex];
      const [xMid, yMid] = [(x1 + x2) / 2, (y1 + y2) / 2];
      ctx.quadraticCurveTo(x1, y1, xMid, yMid);
    }
    
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (points.length > 0) {
      setAllStrokes(prev => [...prev, points]);
    }
    setIsDrawing(false);
    setPoints([]);
  };

  const clearSignature = () => {
    if (signed) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPoints([]);
    setAllStrokes([]);
  };

  const downloadPDF = async () => {
    if (!contract) return;

    try {
      const pdf = await generateContractPDF(contract, clientSignature);
      
      // Baixar o PDF
      const contractTypeName = isPermutaContract() ? 'permuta' : 'prestacao-servicos';
      const fileName = `contrato-${contractTypeName}-${contract.client_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Entrar em tela cheia
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        (document.documentElement as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Sair da tela cheia
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Detectar mudanças de tela cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleSign = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !contract) return;

    const signatureData = canvas.toDataURL();
    
    setSigning(true);
    try {
      const response = await fetch(`/api/contracts/sign/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature_data: signatureData }),
      });

      if (response.ok) {
        setSigned(true);
        setClientSignature(signatureData);
        // Scroll para o topo da página para mostrar a notificação
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const error = await response.json();
        alert(`Erro ao assinar contrato: ${error.error}`);
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Erro ao assinar contrato. Tente novamente.');
    } finally {
      setSigning(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função auxiliar para verificar se é contrato de permuta
  const isPermutaContract = () => {
    return String(contract?.contract_type || '').trim().toLowerCase() === 'permuta';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-kings-bg-primary flex items-center justify-center">
        <div className="text-center text-kings-text-primary">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kings-primary mx-auto mb-4"></div>
          <p>Carregando contrato...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-kings-bg-primary flex items-center justify-center">
        <div className="text-center text-kings-text-primary">
          <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Contrato não encontrado</h2>
          <p className="text-kings-text-muted">{error || 'O link pode ter expirado ou estar inválido.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kings-bg-primary font-space">
      {/* Header */}
      <header className="bg-kings-bg-secondary/50 backdrop-blur-sm border-b border-kings-border print-hidden">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-kings-primary p-2 rounded-lg">
                <Crown className="h-8 w-8 text-kings-bg-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-kings-primary">
                  Kings Agência
                </h1>
                <p className="text-sm text-kings-text-muted">
                  {isPermutaContract() ? 'Contrato de Permuta de Serviços' : 'Contrato de Prestação de Serviços'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {signed && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8 print-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center space-x-3">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h3 className="text-emerald-400 font-semibold text-sm sm:text-base">Contrato assinado com sucesso!</h3>
                  <p className="text-emerald-300 text-xs sm:text-sm">Seu contrato foi assinado e está sendo processado.</p>
                </div>
              </div>
              <button
                onClick={downloadPDF}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                <Download className="h-4 w-4" />
                <span>Baixar PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Contract Content */}
        <div ref={contractRef} className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-kings-text-primary">
              {isPermutaContract() ? 'CONTRATO DE PERMUTA DE SERVIÇOS' : 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS'}
            </h2>
            <h3 className="text-lg sm:text-xl font-semibold text-kings-primary">KINGS AGÊNCIA</h3>
          </div>

          <div className="prose max-w-none text-kings-text-secondary leading-relaxed">
            {/* Partes do Contrato */}
            <div className="bg-kings-bg-tertiary/30 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
              <h4 className="text-lg font-bold mb-4 text-kings-primary">PARTES</h4>
                <p className="mb-3">
                  De um lado, <strong>KINGS AGÊNCIA</strong>, inscrita no CPF nº 145.998.009-37, prestando serviços de forma online, doravante denominada <strong>EMPRESA</strong>;
                </p>
                <p>
                  E de outro, <strong>{contract.client_name}</strong>, inscrito no CPF nº <strong>{contract.client_document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</strong>, doravante denominado <strong>{isPermutaContract() ? 'PARCEIRO' : 'CLIENTE'}</strong>.
                </p>
            </div>

            {/* Título do Contrato */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-kings-primary">
                {isPermutaContract() ? 'CONTRATO DE PERMUTA DE SERVIÇOS' : 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS'}
              </h3>
            </div>

            {/* Cláusulas do Contrato */}
            <div className="space-y-8">
              {/* Cláusula 1 - Objeto */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">CLÁUSULA 1 – OBJETO</h4>
                <div className="space-y-3">
                  {isPermutaContract() ? (
                    <>
                      <p>
                        <span className="font-semibold">1.1</span> O presente contrato tem por objeto a troca de serviços entre as partes, em regime de permuta, consistindo em:
                      </p>
                      <p>
                        A EMPRESA fornecerá ao PARCEIRO serviços de criação, desenvolvimento e manutenção de sites, hospedagem, suporte técnico, design e soluções digitais personalizadas.
                      </p>
                      <p>
                        O PARCEIRO, em contrapartida, fornecerá à EMPRESA os seguintes serviços/bens: <strong>{contract.partner_services || '[especificar aqui o que será oferecido pelo PARCEIRO – ex: fotografia, marketing, produtos, etc.]'}</strong>.
                      </p>
                      <p>
                        <span className="font-semibold">1.2</span> Cada parte declara estar ciente do valor estimado dos serviços ofertados pela outra, de modo que a permuta é considerada justa e equivalente.
                      </p>
                      <p>
                        <span className="font-semibold">1.3</span> Eventuais alterações ou acréscimos de serviços por qualquer das partes deverão ser objeto de aditivo contratual.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <span className="font-semibold">1.1</span> O presente contrato tem por objeto a prestação de serviços pela EMPRESA ao CLIENTE, podendo incluir:
                      </p>
                      <ul className="list-disc list-inside ml-6 space-y-1">
                        <li>Criação, desenvolvimento e manutenção de sites;</li>
                        <li>Hospedagem e suporte técnico;</li>
                        <li>Design e soluções digitais personalizadas.</li>
                      </ul>
                      <p>
                        <span className="font-semibold">1.2</span> O site será desenvolvido de acordo com a escolha e informações fornecidas pelo CLIENTE no início do projeto, garantindo que o valor contratado cobre a entrega conforme esse combinado.
                      </p>
                      <p>
                        <span className="font-semibold">1.3</span> As alterações ou modificações visuais nos serviços prestados seguirão as condições de cada plano contratado:
                      </p>
                      <ul className="list-disc list-inside ml-6 space-y-2 mt-2">
                        <li><strong>Plano Básico:</strong> qualquer alteração visual solicitada será cobrada à parte, conforme tabela vigente da EMPRESA;</li>
                        <li><strong>Plano Avançado:</strong> inclui até 1 (uma) alteração visual gratuita por mês. Alterações adicionais serão cobradas à parte;</li>
                        <li><strong>Plano Premium:</strong> inclui até 3 (três) alterações visuais gratuitas por mês. Alterações adicionais serão cobradas à parte.</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Cláusula 2 - Prazo */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">CLÁUSULA 2 – PRAZO</h4>
                <p>
                  <span className="font-semibold">2.1</span> O prazo de execução dos serviços será definido em cronograma acordado entre as partes, respeitando as condições previamente estabelecidas.
                </p>
              </div>

              {/* Cláusula 3 - Valor e Condições */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">
                  {isPermutaContract() ? 'CLÁUSULA 3 – VALOR E CONDIÇÕES DA PERMUTA' : 'CLÁUSULA 3 – VALOR E PAGAMENTO'}
                </h4>
                <div className="space-y-3">
                  {isPermutaContract() ? (
                    <>
                      <p>
                        <span className="font-semibold">3.1</span> Não haverá pagamento em dinheiro entre as partes, salvo se houver desequilíbrio no valor da permuta.
                      </p>
                      <p>
                        <span className="font-semibold">3.2</span> Caso uma das partes solicite serviços adicionais não previstos na troca, estes poderão ser cobrados financeiramente ou compensados em novo ajuste de permuta.
                      </p>
                      <p>
                        <span className="font-semibold">3.3</span> O valor da permuta poderá ser revisado mediante acordo mútuo e por escrito entre as partes.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <span className="font-semibold">3.1</span> O CLIENTE pagará à EMPRESA o valor total de <strong className="text-kings-primary text-lg">{formatCurrency(contract.contract_value)}</strong>, que deverá ser pago inteiramente no momento da finalização e entrega do site.
                      </p>
                      <p>
                        <span className="font-semibold">3.2</span> Em caso de mensalidade (hospedagem/manutenção), o pagamento ocorrerá todo dia <strong>{contract.payment_date.split('-')[2]}</strong> de cada mês.
                      </p>
                      <p>
                        <span className="font-semibold">3.3</span> Os valores poderão ser reajustados ou alterados, mediante aviso prévio de 30 (trinta) dias ao CLIENTE.
                      </p>
                      <p>
                        <span className="font-semibold">3.4</span> O valor do contrato não será reajustado continuamente; somente poderá haver cobrança adicional em caso de alterações solicitadas pelo CLIENTE, conforme Cláusula 1.3.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Cláusula 4 - Obrigações da Empresa */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">CLÁUSULA 4 – OBRIGAÇÕES DA EMPRESA</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Entregar os serviços contratados dentro do prazo estabelecido;</li>
                  <li>Garantir a confidencialidade das informações recebidas;</li>
                  <li>Prestar suporte técnico conforme acordado.</li>
                </ul>
              </div>

              {/* Cláusula 5 - Obrigações do Parceiro/Cliente */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">
                  {isPermutaContract() ? 'CLÁUSULA 5 – OBRIGAÇÕES DO PARCEIRO' : 'CLÁUSULA 5 – OBRIGAÇÕES DO CLIENTE'}
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {isPermutaContract() ? (
                    <>
                      <li>Entregar à EMPRESA os serviços/bens acordados em condições adequadas;</li>
                      <li>Fornecer informações, conteúdos e materiais necessários para execução dos serviços;</li>
                      <li>Cumprir os prazos ajustados.</li>
                    </>
                  ) : (
                    <>
                      <li>Fornecer informações, conteúdos e materiais necessários para execução dos serviços;</li>
                      <li>Efetuar os pagamentos nas datas ajustadas;</li>
                      <li>Respeitar os prazos de aprovação e feedback.</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Cláusula 6 - Rescisão */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">CLÁUSULA 6 – RESCISÃO</h4>
                <div className="space-y-3">
                  <p>
                    <span className="font-semibold">6.1</span> O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.
                  </p>
                  <p>
                    <span className="font-semibold">6.2</span> Em caso de descumprimento das obrigações por qualquer parte, a parte prejudicada poderá suspender a execução de suas obrigações até a regularização.
                  </p>
                </div>
              </div>

              {/* Cláusula 7 - Foro */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">CLÁUSULA 7 – FORO</h4>
                <p>
                  Fica eleito o foro da comarca de Itajaí/SC, com renúncia a qualquer outro, para dirimir quaisquer dúvidas decorrentes deste contrato.
                </p>
              </div>
            </div>

            {/* Assinaturas */}
            <div className="mt-12 pt-8 border-t-2 border-kings-border">
              <div className="text-center mb-6">
                <p className="text-kings-text-muted">
                  Itajaí/SC, {formatDate(contract.created_at)}.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end space-y-8 sm:space-y-0">
                <div className="text-center w-full sm:w-auto">
                  <div className="max-w-48 mx-auto sm:mx-0">
                    {/* Logo da Kings Agência */}
                    <div className="mb-3 flex justify-center">
                      <img 
                        src="/kings-logo.png" 
                        alt="Kings Agência Logo" 
                        className="h-16 w-auto object-contain"
                      />
                    </div>
                    {/* Linha embaixo da imagem */}
                    <div className="border-t border-kings-border mb-3"></div>
                    <p className="text-sm font-semibold text-kings-text-primary">Kings Agência</p>
                    <p className="text-xs text-kings-text-muted">EMPRESA</p>
                  </div>
                </div>
                <div className="text-center w-full sm:w-auto">
                  <div className="max-w-48 mx-auto sm:mx-0">
                    {clientSignature ? (
                      <div className="mb-3">
                        <img 
                          src={clientSignature} 
                          alt="Assinatura do Cliente" 
                          className="h-12 w-auto object-contain mx-auto filter brightness-0 invert"
                        />
                        {/* Linha embaixo da assinatura */}
                        <div className="border-t border-kings-border mt-3"></div>
                      </div>
                    ) : null}
                    <p className="text-sm font-semibold text-kings-text-primary">{contract.client_name}</p>
                    <p className="text-xs text-kings-text-muted">{isPermutaContract() ? 'PARCEIRO' : 'CLIENTE'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Termos de Uso */}
            <div className="mt-16 pt-8 border-t-2 border-kings-border">
              <h3 className="text-2xl font-bold text-center mb-8 text-kings-primary">📄 TERMOS DE USO – SITE KINGS AGÊNCIA</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold mb-3 text-kings-primary">ACEITAÇÃO DOS TERMOS</h4>
                  <p>
                    Ao acessar e utilizar o site da Kings Agência, o cliente declara estar ciente e de acordo com as regras aqui estabelecidas.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-3 text-kings-primary">SERVIÇOS OFERECIDOS</h4>
                  <p>
                    O site pode disponibilizar informações sobre criação de sites, design, soluções digitais personalizadas e demais serviços oferecidos.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-3 text-kings-primary">RESPONSABILIDADE DO CLIENTE</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Utilizar o site de forma legal e ética;</li>
                    <li>Não tentar invadir, copiar ou alterar o sistema;</li>
                    <li>Fornecer dados verdadeiros em formulários de contato.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-3 text-kings-primary">RESPONSABILIDADE DA KINGS AGÊNCIA</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Manter o site disponível, salvo em casos de manutenção ou força maior;</li>
                    <li>Proteger os dados pessoais fornecidos, conforme a LGPD (Lei Geral de Proteção de Dados).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-3 text-kings-primary">PROPRIEDADE INTELECTUAL</h4>
                  <p>
                    Todo o conteúdo do site (textos, imagens, logotipos e materiais) pertence à Kings Agência e não pode ser reproduzido sem autorização.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-3 text-kings-primary">PRIVACIDADE</h4>
                  <p>
                    As informações coletadas serão utilizadas exclusivamente para contato e envio de propostas. Não compartilhamos dados com terceiros sem autorização.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-3 text-kings-primary">ALTERAÇÕES</h4>
                  <p>
                    A Kings Agência poderá atualizar estes Termos a qualquer momento, sendo responsabilidade do cliente consultar regularmente.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-3 text-kings-primary">FORO</h4>
                  <p>
                    Fica eleito o foro da comarca de Itajaí/SC, para dirimir quaisquer conflitos decorrentes do uso do site.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        {!signed && (
          <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-lg p-8'}`}>
            {isFullscreen ? (
              // Layout de tela cheia para mobile
              <div className="h-full flex flex-col">
                {/* Botões no topo - sempre horizontal */}
                <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-kings-primary/20 border border-kings-primary/30 p-2 rounded-lg">
                      <PenTool className="h-5 w-5 text-kings-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Assinatura Digital</h3>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={clearSignature}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                    >
                      Limpar
                    </button>
                    
                    <button
                      onClick={toggleFullscreen}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Sair</span>
                    </button>
                  </div>
                </div>

                {/* Canvas ocupando o resto da tela */}
                <div className="flex-1 p-4">
                  <div className="h-full border-2 border-dashed border-gray-300 rounded-lg p-2">
                    <canvas
                      ref={canvasRef}
                      className="border border-gray-300 rounded bg-white touch-none w-full h-full"
                      style={{ 
                        height: '100%',
                        display: 'block',
                        margin: '0 auto',
                        maxWidth: '100%',
                        cursor: 'url("data:image/svg+xml;base64,PHN2ZyBjbGFzcz0idzYgaDYgdGV4dC1ncmF5LTgwMCBkYXJrOnRleHQtd2hpdGUiIGFyaWEtaGlkZGVuPSJ0cnVlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0iY3VycmVudENvbG9yIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTE1LjUxNCAzLjI5M2ExIDEgMCAwIDAtMS40MTUgMEwxMi4xNTEgNS4yNGEuOTMuOTMgMCAwIDEgLjA1Ni4wNTJsNi41IDYuNWEuOTcuOTcgMCAwIDEgLjA1Mi4wNTZMMjAuNzA3IDkuOWExIDEgMCAwIDAgMC0xLjQxNWwtNS4xOTMtNS4xOTNaTTcuMDA0IDguMjdsMy44OTItMS40NiA2LjI5MyA2LjI5My0xLjQ2IDMuODkzYTEgMSAwIDAgMS0uNjAzLjU5MWwtOS40OTQgMy4zNTVhMSAxIDAgMCAxLS45OC0uMThsNi40NTItNi40NTNhMSAxIDAgMCAwLTEuNDE0LTEuNDE0bC02LjQ1MyA2LjQ1MmExIDEgMCAwIDEtLjE4LS45OGwzLjM1NS05LjQ5NGExIDEgMCAwIDEgLjU5MS0uNjAzWiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+") 2 22, auto'
                      }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (signed) return;
                        
                        setIsDrawing(true);
                        const canvas = canvasRef.current;
                        if (!canvas) return;

                        const newPoints = [getPosition(e, canvas)];
                        setPoints(newPoints);
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isDrawing || signed) return;

                        const canvas = canvasRef.current;
                        if (!canvas) return;

                        const newPoints = [...points, getPosition(e, canvas)];
                        setPoints(newPoints);
                        redraw(canvas, newPoints);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        stopDrawing();
                      }}
                    />
                  </div>
                </div>

                {/* Botão de assinar na parte inferior */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <button
                    onClick={handleSign}
                    disabled={signing}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-kings-primary hover:bg-kings-primary-dark text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Assinando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Assinar e Finalizar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Layout normal
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                  <div className="bg-kings-primary/20 border border-kings-primary/30 p-2 rounded-lg">
                    <PenTool className="h-5 w-5 text-kings-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-kings-text-primary">Assinatura Digital</h3>
                  </div>
                  
                </div>

                <p className="text-kings-text-muted mb-6">
                  Desenhe sua assinatura no campo abaixo para concordar com os termos do contrato:
                </p>

                <div className="border-2 border-dashed border-kings-border rounded-lg p-2 sm:p-4 mb-6 relative">
                <canvas
                  ref={canvasRef}
                  className={`border border-kings-border rounded bg-white touch-none w-full max-w-full ${isMobile && !isFullscreen ? 'opacity-50 pointer-events-none' : ''}`}
                  style={{ 
                    height: isFullscreen ? 'calc(100vh - 200px)' : '200px',
                    display: 'block',
                    margin: '0 auto',
                    maxWidth: '100%',
                    cursor: isMobile && !isFullscreen ? 'not-allowed' : 'url("data:image/svg+xml;base64,PHN2ZyBjbGFzcz0idzYgaDYgdGV4dC1ncmF5LTgwMCBkYXJrOnRleHQtd2hpdGUiIGFyaWEtaGlkZGVuPSJ0cnVlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0iY3VycmVudENvbG9yIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTE1LjUxNCAzLjI5M2ExIDEgMCAwIDAtMS40MTUgMEwxMi4xNTEgNS4yNGEuOTMuOTMgMCAwIDEgLjA1Ni4wNTJsNi41IDYuNWEuOTcuOTcgMCAwIDEgLjA1Mi4wNTZMMjAuNzA3IDkuOWExIDEgMCAwIDAgMC0xLjQxNWwtNS4xOTMtNS4xOTNaTTcuMDA0IDguMjdsMy44OTItMS40NiA2LjI5MyA2LjI5My0xLjQ2IDMuODkzYTEgMSAwIDAgMS0uNjAzLjU5MWwtOS40OTQgMy4zNTVhMSAxIDAgMCAxLS45OC0uMThsNi40NTItNi40NTNhMSAxIDAgMCAwLTEuNDE0LTEuNDE0bC02LjQ1MyA2LjQ1MmExIDEgMCAwIDEtLjE4LS45OGwzLjM1NS05LjQ5NGExIDEgMCAwIDEgLjU5MS0uNjAzWiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+") 2 22, auto'
                  }}
                  onMouseDown={isMobile && !isFullscreen ? undefined : startDrawing}
                  onMouseMove={isMobile && !isFullscreen ? undefined : draw}
                  onMouseUp={isMobile && !isFullscreen ? undefined : stopDrawing}
                  onMouseLeave={isMobile && !isFullscreen ? undefined : stopDrawing}
                  onTouchStart={isMobile && !isFullscreen ? undefined : (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (signed) return;
                    
                    setIsDrawing(true);
                    const canvas = canvasRef.current;
                    if (!canvas) return;

                    const newPoints = [getPosition(e, canvas)];
                    setPoints(newPoints);
                  }}
                  onTouchMove={isMobile && !isFullscreen ? undefined : (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDrawing || signed) return;

                    const canvas = canvasRef.current;
                    if (!canvas) return;

                    const newPoints = [...points, getPosition(e, canvas)];
                    setPoints(newPoints);
                    redraw(canvas, newPoints);
                  }}
                  onTouchEnd={isMobile && !isFullscreen ? undefined : (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    stopDrawing();
                  }}
                />
                
                {/* Sobreposição preta para mobile */}
                {isMobile && !isFullscreen && (
                  <div className="absolute inset-0 bg-black/80 border-2 border-white rounded-lg flex flex-col items-center justify-center p-4">
                    <div className="text-center">
                      <div className="mb-4">
                        <svg className="w-12 h-12 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Assinar em Tela Cheia</h3>
                      <p className="text-sm text-gray-200 mb-4">
                        Para uma melhor experiência de assinatura, use o modo tela cheia.
                      </p>
                      <button
                        onClick={toggleFullscreen}
                        className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span>Ativar Tela Cheia</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={clearSignature}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-kings-bg-tertiary hover:bg-kings-bg-tertiary/70 border border-kings-border text-kings-text-secondary rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Limpar Assinatura
                </button>

              </div>

               <button
                 onClick={handleSign}
                 disabled={signing || (isMobile && !isFullscreen)}
                 className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 transform text-sm sm:text-base ${
                   isMobile && !isFullscreen 
                     ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                     : 'bg-kings-primary hover:bg-kings-primary-dark text-kings-bg-primary hover:scale-105'
                 } disabled:opacity-50 disabled:cursor-not-allowed`}
               >
                {signing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kings-bg-primary"></div>
                    <span>Assinando...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Assinar e Finalizar</span>
                  </>
                )}
              </button>
            </div>
              </>
            )}
          </div>
        )}

        {/* Terms Link */}
        <div className="text-center mt-8">
          <p className="text-sm text-kings-text-subtle">
            Ao assinar este contrato, você concorda com nossos{' '}
            <a href="#" className="text-kings-primary hover:text-kings-primary-dark font-medium transition-colors">
              Termos de Uso
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
