import { formatCurrency } from '../app.js';

const tipoNome = {
    'gesso': 'Teto de Gesso',
    'pvc': 'Teto de PVC',
    'modular': 'Teto Modular'
};

// Cores do tema
const COLORS = {
    primary:    [79, 70, 229],
    primaryDark:[55, 48, 163],
    accent:     [16, 185, 129],
    accentDark: [5, 150, 105],
    dark:       [30, 30, 46],
    gray:       [107, 114, 128],
    lightGray:  [243, 244, 246],
    white:      [255, 255, 255],
    black:      [17, 24, 39],
    red:        [239, 68, 68],
    blue:       [59, 130, 246],
};

const MARGIN = 20;
const FOOTER_H = 18;
const HEADER_H = 23;

function drawRoundedRect(doc, x, y, w, h, r, fill, stroke) {
    doc.roundedRect(x, y, w, h, r, r, fill ? 'F' : (stroke ? 'S' : 'FD'));
}

function drawTopBar(doc, pw) {
    doc.setFillColor(...COLORS.primaryDark);
    doc.rect(0, 0, pw, 14, 'F');
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 14, pw, 6, 'F');
    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 20, pw, 3, 'F');
}

function drawHeader(doc, pw, copyType, dataFormatada, nomeCliente, tipoDisplay, area, largura, comprimento, logoData) {
    drawTopBar(doc, pw);
    let y = 28;

    // Logo — usa o objeto de imagem já carregado
    const logoW = 24;
    if (logoData) {
        try {
            const h = (logoData.naturalHeight / logoData.naturalWidth) * logoW;
            doc.addImage(logoData, 'PNG', MARGIN, y, logoW, h);
        } catch (e) {
            doc.setFillColor(...COLORS.lightGray);
            drawRoundedRect(doc, MARGIN, y, logoW, 20, 3, true);
        }
    } else {
        doc.setFillColor(...COLORS.lightGray);
        drawRoundedRect(doc, MARGIN, y, logoW, 20, 3, true);
    }

    // Company name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('Tecto Falso', MARGIN + logoW + 6, y + 8);
    doc.setTextColor(...COLORS.accentDark);
    doc.text(' Saba\u00F3', MARGIN + logoW + 6 + doc.getTextWidth('Tecto Falso'), y + 8);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text('Especialistas em Acabamentos de Tecto Falso', MARGIN + logoW + 6, y + 14);

    // Via badge
    const badgeText = copyType === 'empresa' ? 'VIA EMPRESA' : 'VIA CLIENTE';
    const badgeColor = copyType === 'empresa' ? COLORS.red : COLORS.accent;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    const badgeW = doc.getTextWidth(badgeText) + 10;
    doc.setFillColor(...badgeColor);
    drawRoundedRect(doc, pw - MARGIN - badgeW, y, badgeW, 9, 3, true);
    doc.setTextColor(...COLORS.white);
    doc.text(badgeText, pw - MARGIN - badgeW / 2, y + 6, { align: 'center' });

    // Data (right side below badge)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(dataFormatada, pw - MARGIN, y + 18, { align: 'right' });

    y += 25;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, pw - MARGIN, y);
    y += 3;

    // Title
    doc.setFillColor(245, 243, 255);
    drawRoundedRect(doc, MARGIN, y, pw - 2 * MARGIN, 12, 3, true);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('OR\u00C7AMENTO / RECIBO', pw / 2, y + 8.5, { align: 'center' });
    y += 17;

    // Info cards (two columns)
    const cardH = 28;
    const cw = pw - 2 * MARGIN;
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(230, 231, 235);
    doc.setLineWidth(0.3);
    drawRoundedRect(doc, MARGIN, y, cw, cardH, 4, true, true);

    const cL = MARGIN + 8;
    const cR = pw / 2 + 4;
    let iy = y + 6;

    // Left: Cliente
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.gray);
    doc.text('CLIENTE', cL, iy); iy += 4;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.black);
    doc.text(nomeCliente || 'N\u00E3o informado', cL, iy); iy += 6;
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.gray);
    doc.text('DATA', cL, iy); iy += 4;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.black);
    doc.text(dataFormatada, cL, iy);

    // Right: Tipo + \u00C1rea
    iy = y + 6;
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.gray);
    doc.text('TIPO DE SERVI\u00C7O', cR, iy); iy += 4;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.primary);
    doc.text(tipoDisplay, cR, iy); iy += 6;
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.gray);
    doc.text('\u00C1REA TOTAL', cR, iy); iy += 4;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.accentDark);
    let areaText = `${area.toFixed(2)} m\u00B2`;
    if (largura > 0 && comprimento > 0) areaText += `  (${largura}m \u00D7 ${comprimento}m)`;
    doc.text(areaText, cR, iy);

    y += cardH + 4;
    return y;
}

function drawFooterBar(doc, pw, ph, pageNum, totalPages, copyType) {
    const footerY = ph - FOOTER_H;
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, footerY, pw - MARGIN, footerY);

    doc.setFillColor(248, 249, 250);
    doc.rect(0, footerY, pw, FOOTER_H, 'F');

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text('Tecto Falso Saba\u00F3  \u2022  http://www.tectofalsosabao.co.mz  \u2022  contato@tectofalsosabao.co.mz  \u2022  +258 87 029 6633 / 84 420 0152', pw / 2, footerY + 7, { align: 'center' });

    const viaText = copyType === 'empresa' ? 'VIA EMPRESA' : 'VIA CLIENTE';
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(`${viaText}  \u2022  P\u00E1gina ${pageNum} de ${totalPages}`, pw / 2, footerY + 12, { align: 'center' });
}

function checkNewPage(doc, pw, ph, currentY, neededSpace, copyType, pageNum) {
    if (currentY + neededSpace > ph - FOOTER_H - 5) {
        drawFooterBar(doc, pw, ph, pageNum, pageNum, copyType);
        doc.addPage();
        return HEADER_H + 8;
    }
    return currentY;
}

async function gerarPDF(tipo, area, largura, comprimento, totalMateriais, totalMaoObra, clienteNome = '', copyType = 'cliente', servicosSelecionados = [], logoData = null) {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        alert('Biblioteca PDF não carregada.');
        return;
    }

    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const cw = pw - 2 * MARGIN;
    const dataFormatada = new Date().toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' });
    const nomeCliente = clienteNome || 'N\u00E3o informado';
    const tipoDisplay = tipoNome[tipo] || tipo;
    const totalGeral = (totalMateriais + totalMaoObra) * 1.30;

    // ==================== HEADER ====================
    let yPos = drawHeader(doc, pw, copyType, dataFormatada, nomeCliente, tipoDisplay, area, largura, comprimento, logoData);

    // ==================== RESUMO FINANCEIRO ====================
    doc.setFillColor(245, 243, 255);
    drawRoundedRect(doc, MARGIN, yPos, cw, 24, 4, true);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text('OR\u00C7AMENTO TOTAL', MARGIN + 14, yPos + 9);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(formatCurrency(totalGeral), pw - MARGIN - 14, yPos + 16, { align: 'right' });

    yPos += 32;

    // ==================== SERVI\u00C7OS ADICIONAIS ====================
    if (servicosSelecionados && servicosSelecionados.length > 0) {
        yPos = checkNewPage(doc, pw, ph, yPos, 20, copyType, 1);

        doc.setFillColor(...COLORS.accent);
        doc.rect(MARGIN, yPos, 3, 8, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text('Servi\u00E7os Adicionais', MARGIN + 7, yPos + 6);
        yPos += 11;

        const serviceRows = servicosSelecionados.map((s, i) => [String(i + 1), s]);
        doc.autoTable({
            startY: yPos,
            margin: { left: MARGIN, right: MARGIN },
            head: [['#', 'Servi\u00E7o']],
            body: serviceRows,
            theme: 'plain',
            styles: {
                fontSize: 8,
                cellPadding: { top: 2.5, bottom: 2.5, left: 5, right: 5 },
                textColor: [...COLORS.black],
                lineWidth: 0,
            },
            headStyles: {
                fillColor: [...COLORS.primary],
                textColor: [...COLORS.white],
                fontStyle: 'bold',
                fontSize: 7,
                cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
            },
            alternateRowStyles: { fillColor: [248, 249, 252] },
            columnStyles: {
                0: { cellWidth: 14, halign: 'center', fontStyle: 'bold', textColor: [...COLORS.gray] },
                1: { cellWidth: cw - 14 },
            },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 1) {
                    data.cell.styles.textColor = [...COLORS.dark];
                }
            }
        });

        yPos = doc.lastAutoTable.finalY + 6;
    }

    // ==================== CONDI\u00C7\u00D5ES / OBSERVA\u00C7\u00D5ES ====================
    // Precisa de ~40mm para 4 obs + titulo
    yPos = checkNewPage(doc, pw, ph, yPos, 45, copyType, 1);

    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN, yPos, 3, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Condi\u00E7\u00F5es e Observa\u00E7\u00F5es', MARGIN + 7, yPos + 6);
    yPos += 11;

    const obs = [
        'Or\u00E7amento v\u00E1lido por 30 dias a partir da data de emiss\u00E3o.',
        'Valores sujeitos a altera\u00E7\u00E3o conforme pre\u00E7o de materiais.',
        'Garantia de 3 meses contra defeitos de execu\u00E7\u00E3o.',
        area >= 300
            ? 'Pagamento: 50% adiantado, 25% ao meio da obra, 25% na conclus\u00E3o.'
            : 'Pagamento: 70% adiantado, 30% na conclus\u00E3o da obra.',
    ];

    obs.forEach((text, i) => {
        doc.setFillColor(245, 243, 255);
        doc.circle(MARGIN + 3, yPos + 1.5, 1.5, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.primary);
        doc.text(String(i + 1), MARGIN + 3, yPos + 1.5, { align: 'center' });
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.gray);
        doc.text(text, MARGIN + 8, yPos + 2);
        yPos += 6;
    });

    yPos += 10;

    // ==================== ASSINATURAS ====================
    // Sempre mostra, em nova pagina se necessario
    yPos = checkNewPage(doc, pw, ph, yPos, 30, copyType, 1);

    const sigW = 55;
    const sigLeft = MARGIN + 12;
    const sigRight = pw - MARGIN - sigW - 12;

    doc.setDrawColor(...COLORS.gray);
    doc.setLineWidth(0.3);
    doc.line(sigLeft, yPos, sigLeft + sigW, yPos);
    doc.line(sigRight, yPos, sigRight + sigW, yPos);

    // Nome (assinatura) automático
    doc.setFontSize(16);
    doc.setFont('times', 'italic');
    doc.setTextColor(...COLORS.primaryDark);
    doc.text('Jose Sabao', sigRight + sigW / 2, yPos - 2, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text('Assinatura do Cliente', sigLeft + sigW / 2, yPos + 5, { align: 'center' });
    doc.text('Assinatura da Empresa', sigRight + sigW / 2, yPos + 5, { align: 'center' });

    doc.setFontSize(6);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Data: ${dataFormatada}`, sigLeft + sigW / 2, yPos + 10, { align: 'center' });

    // ==================== FOOTER (ultima pagina) ====================
    drawFooterBar(doc, pw, ph, 1, 1, copyType);

    // ==================== WATERMARK ====================
    if (copyType === 'empresa') {
        doc.setFontSize(70);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(240, 240, 240);
        doc.text('C\u00D3PIA INTERNA', pw / 2, ph / 2, { align: 'center', angle: 45 });
    }

    // ==================== SAVE ====================
    const via = copyType === 'empresa' ? 'Via_Empresa' : 'Via_Cliente';
    const filename = `Orcamento_${via}_${(tipoNome[tipo] || tipo).replace(/ /g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(filename);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function gerarReciboPDF(tipo, area, largura, comprimento, totalMateriais, totalMaoObra, clienteNome = '', servicosSelecionados = []) {
    // Carrega o logo uma vez só antes de gerar ambos os recibos
    let logoData = null;
    try {
        logoData = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = 'images/logo.png';
        });
    } catch (e) {
        console.warn('Logo não pôde ser carregado:', e);
    }

    await gerarPDF(tipo, area, largura, comprimento, totalMateriais, totalMaoObra, clienteNome, 'cliente', servicosSelecionados, logoData);
    await delay(800);
    await gerarPDF(tipo, area, largura, comprimento, totalMateriais, totalMaoObra, clienteNome, 'empresa', servicosSelecionados, logoData);
}
