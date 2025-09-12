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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    // Set drawing style
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signed) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (signed) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

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
            <p className="mb-4">
              <strong>CONTRATANTE:</strong> {contract.client_name}, portador(a) do CPF/CNPJ nº {contract.client_document}
              {contract.client_email && `, email: ${contract.client_email}`}
              {contract.client_phone && `, telefone: ${contract.client_phone}`}.
            </p>

            <p className="mb-4">
              <strong>CONTRATADA:</strong> Kings Agência, empresa especializada em marketing digital e desenvolvimento de negócios.
            </p>

            <h4 className="text-lg font-semibold mt-6 mb-3 text-kings-primary">1. OBJETO DO CONTRATO</h4>
            <p className="mb-4">
              A CONTRATADA se compromete a prestar serviços de marketing digital, incluindo mas não limitado a: 
              criação de conteúdo, gestão de redes sociais, campanhas publicitárias, consultoria estratégica 
              e desenvolvimento de materiais promocionais.
            </p>

            <h4 className="text-lg font-semibold mt-6 mb-3 text-kings-primary">2. VALOR E FORMA DE PAGAMENTO</h4>
            <p className="mb-4">
              O valor total dos serviços é de <strong className="text-kings-primary">{formatCurrency(contract.contract_value)}</strong>, 
              a ser pago até a data de <strong className="text-kings-primary">{formatDate(contract.payment_date)}</strong>.
            </p>

            <h4 className="text-lg font-semibold mt-6 mb-3 text-kings-primary">3. PRAZO E EXECUÇÃO</h4>
            <p className="mb-4">
              Os serviços serão executados conforme cronograma a ser estabelecido entre as partes, 
              respeitando os prazos acordados e a qualidade esperada.
            </p>

            <h4 className="text-lg font-semibold mt-6 mb-3 text-kings-primary">4. RESPONSABILIDADES</h4>
            <p className="mb-4">
              A CONTRATADA se compromete a executar os serviços com qualidade e profissionalismo. 
              O CONTRATANTE deve fornecer todas as informações e materiais necessários para a execução dos serviços.
            </p>

            <h4 className="text-lg font-semibold mt-6 mb-3 text-kings-primary">5. DISPOSIÇÕES GERAIS</h4>
            <p className="mb-4">
              Este contrato é regido pelas leis brasileiras. Eventuais divergências serão resolvidas 
              preferencialmente por acordo entre as partes.
            </p>

            <div className="mt-8 pt-8 border-t border-kings-border">
              <p className="text-center text-sm text-kings-text-muted mb-6">
                Data do contrato: {formatDate(contract.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        {!signed && (
          <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-kings-primary/20 border border-kings-primary/30 p-2 rounded-lg">
                <PenTool className="h-5 w-5 text-kings-primary" />
              </div>
              <h3 className="text-xl font-semibold text-kings-text-primary">Assinatura Digital</h3>
            </div>

            <p className="text-kings-text-muted mb-6">
              Desenhe sua assinatura no campo abaixo para concordar com os termos do contrato:
            </p>

            <div className="border-2 border-dashed border-kings-border rounded-lg p-4 mb-6">
              <canvas
                ref={canvasRef}
                className="w-full cursor-crosshair border border-kings-border rounded bg-white"
                style={{ height: '200px' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>

            <div className="flex justify-between items-center">
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
