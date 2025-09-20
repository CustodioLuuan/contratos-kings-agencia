import jsPDF from 'jspdf';

interface Contract {
  id: number;
  client_name: string;
  client_document: string;
  client_email?: string | null;
  client_phone?: string | null;
  company_name?: string | null;
  contract_value: number;
  payment_date: string;
  contract_type?: 'service' | 'permuta';
  partner_services?: string | null;
  signature_data?: string | null;
  status: 'pending' | 'signed';
  created_at: string;
}

export const generateContractPDF = async (contract: Contract, clientSignature?: string | null) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);

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

  // Função auxiliar para verificar se é contrato de permuta
  const isPermutaContract = () => {
    return String(contract?.contract_type || '').trim().toLowerCase() === 'permuta';
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
    console.log('Tentando carregar logo da Kings Agência...');
    // Carregar logo da Kings Agência
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      logoImg.onload = () => {
        console.log('Logo carregado com sucesso!');
        resolve(logoImg);
      };
      logoImg.onerror = (error) => {
        console.error('Erro ao carregar logo:', error);
        reject(error);
      };
      logoImg.src = '/kings-logo.png';
    });
    
    // Adicionar logo ao PDF
    const logoWidth = 40; // Largura do logo
    const logoHeight = 20; // Altura do logo
    const logoX = (pageWidth - logoWidth) / 2; // Centralizar
    
    console.log('Adicionando logo ao PDF...');
    pdf.addImage(logoImg, 'PNG', logoX, yPosition - 10, logoWidth, logoHeight);
    yPosition += 15;
    console.log('Logo adicionado ao PDF com sucesso!');
  } catch (error) {
    console.error('Erro ao carregar logo:', error);
    // Fallback: mostrar apenas texto se o logo não carregar
    addText('Kings Agência', 12, true, '#FFFFFF');
  }
  
  addText('Kings Agência', 12, true, '#FFFFFF');
  addText('EMPRESA', 10, false, '#A3A3A3');
  yPosition += 20;

  // Assinatura do cliente
  if (clientSignature) {
    // Processar assinatura de forma síncrona
    try {
      // Converter a assinatura para branco (inverter cores)
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
          img.src = clientSignature;
        });
        
        // Detectar se foi assinado em mobile em tela cheia (horizontal)
        // Assinaturas em mobile tela cheia têm proporção muito landscape (width >> height)
        const aspectRatio = img.width / img.height;
        const isMobileFullscreen = aspectRatio > 2.0; // Proporção muito landscape
        
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
        
        // Aplicar filtro para inverter cores (preto vira branco)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Inverter RGB para branco
          data[i] = 255 - data[i];     // R
          data[i + 1] = 255 - data[i + 1]; // G
          data[i + 2] = 255 - data[i + 2]; // B
          // Manter alpha
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

  return pdf;
};
