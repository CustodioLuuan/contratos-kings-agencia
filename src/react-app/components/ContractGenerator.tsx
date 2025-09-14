import jsPDF from 'jspdf';

interface ContractData {
  client_name: string;
  client_document: string;
  client_email?: string;
  client_phone?: string;
  contract_value: number;
  payment_date: string;
}

export function generateContractPDF(data: ContractData): void {
  const doc = new jsPDF();
  
  // Configurações
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // Função para adicionar texto com quebra de linha
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPosition, { align });
    yPosition += lines.length * (fontSize * 0.4) + 5;
  };
  
  // Função para adicionar quebra de linha
  
  // Template exato fornecido pelo usuário
  const contractTemplate = `📄 CONTRATO DE PRESTAÇÃO DE SERVIÇOS – KINGS AGÊNCIA

PARTES: De um lado, KINGS AGÊNCIA, inscrito no CPF nº 145.998.009-37, prestando serviços de forma online, doravante denominado CONTRATADO; E de outro, [Nome do Cliente], inscrito no CPF nº [●], doravante denominado CONTRATANTE.

CLÁUSULA 1 – OBJETO
1.1 O presente contrato tem por objeto a prestação de serviços pelo CONTRATADO ao CONTRATANTE, podendo incluir: Criação, desenvolvimento e manutenção de sites; Hospedagem e suporte técnico; Marketing digital, design e outras soluções acordadas.
1.2 O site será desenvolvido de acordo com a escolha e informações fornecidas pelo CONTRATANTE no início do projeto, garantindo que o valor contratado cobre a entrega conforme esse combinado.
1.3 Caso o CONTRATANTE solicite alterações ou modificações fora do que foi inicialmente combinado, será cobrada uma taxa adicional de 30% do valor original do contrato, previamente acordada entre as partes.

CLÁUSULA 2 – PRAZO
2.1 O prazo para entrega dos serviços será definido em cronograma acordado entre as partes.

CLÁUSULA 3 – VALOR E PAGAMENTO
3.1 O CONTRATANTE pagará ao CONTRATADO o valor total de R$ 99,90, que deverá ser pago inteiramente no momento da finalização e entrega do site.
3.2 Em caso de mensalidade (hospedagem/manutenção), o pagamento ocorrerá todo dia [●] de cada mês.
3.3 Os valores poderão ser reajustados ou alterados, mediante aviso prévio de 30 (trinta) dias ao CONTRATANTE.
3.4 O valor do contrato não será reajustado continuamente; somente poderá haver cobrança adicional em caso de alterações solicitadas pelo CONTRATANTE, conforme Cláusula 1.3.

CLÁUSULA 4 – OBRIGAÇÕES DO CONTRATADO
Entregar os serviços contratados dentro do prazo estabelecido; Garantir a confidencialidade das informações do CONTRATANTE; Prestar suporte técnico conforme acordado.

CLÁUSULA 5 – OBRIGAÇÕES DO CONTRATANTE
Fornecer informações, conteúdos e materiais necessários para execução dos serviços; Efetuar os pagamentos nas datas ajustadas; Respeitar os prazos de aprovação e feedback.

CLÁUSULA 6 – RESCISÃO
6.1 O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.
6.2 Em caso de inadimplência, o CONTRATADO poderá suspender os serviços.

CLÁUSULA 7 – FORO
Fica eleito o foro da comarca de Itajaí/SC, com renúncia a qualquer outro, para dirimir quaisquer dúvidas decorrentes deste contrato.

[Local], [Data].

Kings Agência – CONTRATADO
[Cliente] – CONTRATANTE

📄 TERMOS DE USO – SITE KINGS AGÊNCIA

ACEITAÇÃO DOS TERMOS
Ao acessar e utilizar o site da Kings Agência, o usuário declara estar ciente e de acordo com as regras aqui estabelecidas.

SERVIÇOS OFERECIDOS
O site pode disponibilizar informações sobre serviços de marketing digital, criação de sites, design e demais soluções.

RESPONSABILIDADE DO USUÁRIO
Utilizar o site de forma legal e ética; Não tentar invadir, copiar ou alterar o sistema; Fornecer dados verdadeiros em formulários de contato.

RESPONSABILIDADE DA KINGS AGÊNCIA
Manter o site disponível, salvo em casos de manutenção ou força maior; Proteger os dados pessoais fornecidos, conforme a LGPD (Lei Geral de Proteção de Dados).

PROPRIEDADE INTELECTUAL
Todo o conteúdo do site (textos, imagens, logotipos e materiais) pertence à Kings Agência e não pode ser reproduzido sem autorização.

PRIVACIDADE
As informações coletadas serão utilizadas exclusivamente para contato e envio de propostas. Não compartilhamos dados com terceiros sem autorização.

ALTERAÇÕES
A Kings Agência poderá atualizar estes Termos a qualquer momento, sendo responsabilidade do usuário consultar regularmente.

FORO
Fica eleito o foro da comarca de Itajaí/SC, para dirimir quaisquer conflitos decorrentes do uso do site.`;

  // Substituir placeholders pelos dados reais
  const contractDate = new Date().toLocaleDateString('pt-BR');
  const contractLocation = 'Itajaí/SC';
  const paymentDay = new Date(data.payment_date).getDate();
  
  let finalContract = contractTemplate
    .replace(/\[Nome do Cliente\]/g, data.client_name)
    .replace(/\[●\]/g, data.client_document)
    .replace(/R\$ 99,90/g, `R$ ${data.contract_value.toFixed(2).replace('.', ',')}`)
    .replace(/todo dia \[●\] de cada mês/g, `todo dia ${paymentDay} de cada mês`)
    .replace(/\[Local\]/g, contractLocation)
    .replace(/\[Data\]/g, contractDate)
    .replace(/\[Cliente\]/g, data.client_name);

  // Adicionar o contrato ao PDF
  addText(finalContract, 11, false, 'left');
  
  // Salvar o PDF
  const fileName = `Contrato_Kings_${data.client_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
