import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { Crown, FileText, PenTool, Download, CheckCircle } from 'lucide-react';
import type { Contract } from '@/shared/types';

export default function SignContract() {
  const { token } = useParams<{ token: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<number[][]>([]);
  const [allStrokes, setAllStrokes] = useState<number[][][]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/contracts/${token}`);
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

      // Configuração do canvas para alta resolução
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // Define o tamanho real do canvas
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      
      // Escala o contexto para corresponder ao devicePixelRatio
      ctx.scale(ratio, ratio);
      
      // Ajusta o tamanho CSS do canvas
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      // Set drawing style for smooth lines
      ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 0.5;

    // Fill with white background
    ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      console.log('Canvas initialized:', {
        width: canvas.width,
        height: canvas.height,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight,
        ratio,
        rect: rect
      });
    };

    // Delay para garantir que o DOM esteja carregado
    setTimeout(initCanvas, 100);
  }, []);

  const getPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Calcula posição relativa ao canvas
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    return [x, y];
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
      const response = await fetch(`/api/contracts/${token}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature_data: signatureData }),
      });

      if (response.ok) {
        setSigned(true);
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
      <header className="bg-kings-bg-secondary/50 backdrop-blur-sm border-b border-kings-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-kings-primary p-2 rounded-lg">
                <Crown className="h-8 w-8 text-kings-bg-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-kings-primary">
                  Kings Agência
                </h1>
                <p className="text-sm text-kings-text-muted">Contrato de Prestação de Serviços</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {signed && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
              <div>
                <h3 className="text-emerald-400 font-semibold">Contrato assinado com sucesso!</h3>
                <p className="text-emerald-300 text-sm">Seu contrato foi assinado e está sendo processado.</p>
              </div>
            </div>
          </div>
        )}

        {/* Contract Content */}
        <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-lg p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-kings-text-primary">
              CONTRATO DE PRESTAÇÃO DE SERVIÇOS
            </h2>
            <h3 className="text-xl font-semibold text-kings-primary">KINGS AGÊNCIA</h3>
          </div>

          <div className="prose max-w-none text-kings-text-secondary leading-relaxed">
            {/* Partes do Contrato */}
            <div className="bg-kings-bg-tertiary/30 rounded-lg p-6 mb-8">
              <h4 className="text-lg font-bold mb-4 text-kings-primary">PARTES</h4>
              <p className="mb-3">
                De um lado, <strong>KINGS AGÊNCIA</strong>, inscrito no CPF nº 145.998.009-37, prestando serviços de forma online, doravante denominado <strong>CONTRATADO</strong>;
              </p>
              <p>
                E de outro, <strong>{contract.client_name}</strong>, inscrito no CPF nº <strong>{contract.client_document}</strong>, doravante denominado <strong>CONTRATANTE</strong>.
              </p>
            </div>

            {/* Cláusulas do Contrato */}
            <div className="space-y-8">
              {/* Cláusula 1 - Objeto */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">CLÁUSULA 1 – OBJETO</h4>
                <div className="space-y-3">
                  <p>
                    <span className="font-semibold">1.1</span> O presente contrato tem por objeto a prestação de serviços pelo CONTRATADO ao CONTRATANTE, podendo incluir:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-1">
                    <li>Criação, desenvolvimento e manutenção de sites;</li>
                    <li>Hospedagem e suporte técnico;</li>
                    <li>Marketing digital, design e outras soluções acordadas.</li>
                  </ul>
                  <p>
                    <span className="font-semibold">1.2</span> O site será desenvolvido de acordo com a escolha e informações fornecidas pelo CONTRATANTE no início do projeto, garantindo que o valor contratado cobre a entrega conforme esse combinado.
                  </p>
                  <p>
                    <span className="font-semibold">1.3</span> Caso o CONTRATANTE solicite alterações ou modificações fora do que foi inicialmente combinado, será cobrada uma taxa adicional de 30% do valor original do contrato, previamente acordada entre as partes.
                  </p>
                </div>
              </div>

              {/* Cláusula 2 - Prazo */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">CLÁUSULA 2 – PRAZO</h4>
                <p>
                  <span className="font-semibold">2.1</span> O prazo para entrega dos serviços será definido em cronograma acordado entre as partes.
                </p>
              </div>

              {/* Cláusula 3 - Valor e Pagamento */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">CLÁUSULA 3 – VALOR E PAGAMENTO</h4>
                <div className="space-y-3">
                  <p>
                    <span className="font-semibold">3.1</span> O CONTRATANTE pagará ao CONTRATADO o valor total de <strong className="text-kings-primary text-lg">{formatCurrency(contract.contract_value)}</strong>, que deverá ser pago inteiramente no momento da finalização e entrega do site.
                  </p>
                  <p>
                    <span className="font-semibold">3.2</span> Em caso de mensalidade (hospedagem/manutenção), o pagamento ocorrerá todo dia <strong>{new Date(contract.payment_date).getDate()}</strong> de cada mês.
                  </p>
                  <p>
                    <span className="font-semibold">3.3</span> Os valores poderão ser reajustados ou alterados, mediante aviso prévio de 30 (trinta) dias ao CONTRATANTE.
                  </p>
                  <p>
                    <span className="font-semibold">3.4</span> O valor do contrato não será reajustado continuamente; somente poderá haver cobrança adicional em caso de alterações solicitadas pelo CONTRATANTE, conforme Cláusula 1.3.
                  </p>
                </div>
              </div>

              {/* Cláusula 4 - Obrigações do Contratado */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">CLÁUSULA 4 – OBRIGAÇÕES DO CONTRATADO</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Entregar os serviços contratados dentro do prazo estabelecido;</li>
                  <li>Garantir a confidencialidade das informações do CONTRATANTE;</li>
                  <li>Prestar suporte técnico conforme acordado.</li>
                </ul>
              </div>

              {/* Cláusula 5 - Obrigações do Contratante */}
              <div>
                <h4 className="text-xl font-bold mb-4 text-kings-primary border-b border-kings-border pb-2">CLÁUSULA 5 – OBRIGAÇÕES DO CONTRATANTE</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Fornecer informações, conteúdos e materiais necessários para execução dos serviços;</li>
                  <li>Efetuar os pagamentos nas datas ajustadas;</li>
                  <li>Respeitar os prazos de aprovação e feedback.</li>
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
                    <span className="font-semibold">6.2</span> Em caso de inadimplência, o CONTRATADO poderá suspender os serviços.
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
              <div className="flex justify-between items-end">
                <div className="text-center">
                  <div className="border-t border-kings-border pt-2 w-48">
                    {/* Logo da Kings Agência */}
                    <div className="mb-3 flex justify-center">
                      <img 
                        src="/kings-logo.png" 
                        alt="Kings Agência Logo" 
                        className="h-16 w-auto object-contain"
                      />
                    </div>
                    <p className="text-sm font-semibold text-kings-text-primary">Kings Agência</p>
                    <p className="text-xs text-kings-text-muted">CONTRATADO</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-kings-border pt-2 w-48">
                    <p className="text-sm font-semibold text-kings-text-primary">{contract.client_name}</p>
                    <p className="text-xs text-kings-text-muted">CONTRATANTE</p>
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
                    Ao acessar e utilizar o site da Kings Agência, o usuário declara estar ciente e de acordo com as regras aqui estabelecidas.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-3 text-kings-primary">SERVIÇOS OFERECIDOS</h4>
                  <p>
                    O site pode disponibilizar informações sobre serviços de marketing digital, criação de sites, design e demais soluções.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-3 text-kings-primary">RESPONSABILIDADE DO USUÁRIO</h4>
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
                    A Kings Agência poderá atualizar estes Termos a qualquer momento, sendo responsabilidade do usuário consultar regularmente.
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
          <div className={`bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-lg p-8 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
              <div className="bg-kings-primary/20 border border-kings-primary/30 p-2 rounded-lg">
                <PenTool className="h-5 w-5 text-kings-primary" />
              </div>
              <h3 className="text-xl font-semibold text-kings-text-primary">Assinatura Digital</h3>
              </div>
              
              {/* Botão de tela cheia - apenas em mobile */}
              <button
                onClick={toggleFullscreen}
                className="md:hidden p-2 bg-kings-primary text-white rounded-lg hover:bg-kings-primary/90 transition-colors"
                title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>

            <p className="text-kings-text-muted mb-6">
              Desenhe sua assinatura no campo abaixo para concordar com os termos do contrato:
            </p>

            <div className={`border-2 border-dashed border-kings-border rounded-lg p-4 mb-6 ${isFullscreen ? 'h-full' : ''}`}>
              <canvas
                ref={canvasRef}
                className={`border border-kings-border rounded bg-white touch-none ${isFullscreen ? 'w-full h-full' : 'w-full'}`}
                style={{ 
                  height: isFullscreen ? 'calc(100vh - 200px)' : '200px',
                  display: 'block',
                  margin: '0 auto',
                  cursor: 'url("data:image/svg+xml;base64,PHN2ZyBjbGFzcz0idzYgaDYgdGV4dC1ncmF5LTgwMCBkYXJrOnRleHQtd2hpdGUiIGFyaWEtaGlkZGVuPSJ0cnVlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0iY3VycmVudENvbG9yIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTE1LjUxNCAzLjI5M2ExIDEgMCAwIDAtMS40MTUgMEwxMi4xNTEgNS4yNGEuOTMuOTMgMCAwIDEgLjA1Ni4wNTJsNi41IDYuNWEuOTcuOTcgMCAwIDEgLjA1Mi4wNTZMMjAuNzA3IDkuOWExIDEgMCAwIDAgMC0xLjQxNWwtNS4xOTMtNS4xOTNaTTcuMDA0IDguMjdsMy44OTItMS40NiA2LjI5MyA2LjI5My0xLjQ2IDMuODkzYTEgMSAwIDAgMS0uNjAzLjU5MWwtOS40OTQgMy4zNTVhMSAxIDAgMCAxLS45OC0uMThsNi40NTItNi40NTNhMSAxIDAgMCAwLTEuNDE0LTEuNDE0bC02LjQ1MyA2LjQ1MmExIDEgMCAwIDEtLjE4LS45OGwzLjM1NS05LjQ5NGExIDEgMCAwIDEgLjU5MS0uNjAzWiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9zdmc+") 2 22, auto'
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (signed) return;
                  
                  setIsDrawing(true);
                  const canvas = canvasRef.current;
                  if (!canvas) return;

                  const newPoints = [getPosition(e, canvas)];
                  setPoints(newPoints);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  if (!isDrawing || signed) return;

                  const canvas = canvasRef.current;
                  if (!canvas) return;

                  const newPoints = [...points, getPosition(e, canvas)];
                  setPoints(newPoints);
                  redraw(canvas, newPoints);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopDrawing();
                }}
              />
            </div>

            <div className={`flex justify-between items-center ${isFullscreen ? 'fixed bottom-4 left-4 right-4' : ''}`}>
              <button
                onClick={clearSignature}
                className="px-4 py-2 bg-kings-bg-tertiary hover:bg-kings-bg-tertiary/70 border border-kings-border text-kings-text-secondary rounded-lg font-medium transition-colors"
              >
                Limpar Assinatura
              </button>

              <button
                onClick={handleSign}
                disabled={signing}
                className="flex items-center space-x-2 px-6 py-3 bg-kings-primary hover:bg-kings-primary-dark text-kings-bg-primary rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
