/**
 * Calculadora de Teto de PVC
 * Atualizada conforme solicitação:
 * - Área base
 * - Chapa PVC: 490 MT
 * - Gypsum Furring Perfil: Espaçamento padrão 60cm
 * - Mão de obra: 350 MT/m²
 */

export function calcularPVC(area, precos) {
    const PRECO_MAO_OBRA_M2 = 350;
    const ESPACAMENTO_FURRING = 0.60; // Espaçamento padrão 60cm

    // 1. PVC White 6mm*250mm*5.9m
    // Área da peça: 0.25 * 5.9 = 1.475 m²
    const chapas = Math.ceil(area / 1.475);

    // 2. PVC T-White Calhas (Rodaforro/Moldura)
    // Perímetro estimado: 4 * sqrt(Area)
    const perimetroEst = 4 * Math.sqrt(area);
    const calhas = Math.ceil(perimetroEst / 5.9);

    // 3. Gypsum Furring Perfil (Estrutura metálica para PVC)
    // Espaçamento padrão 60cm: area / 1.8
    const furringPerfil = Math.ceil(area / 1.8);

    // 4. 1000 pcs Gypsum Dry Wall (Parafusos para fixar PVC no metal)
    // Consumo: ~20/m²
    const parafusosCaixa = Math.ceil((area * 20) / 1000);

    // 5. Gypsum Main Channel (Canaleta/Pente)
    // Espaçamento padrão 1 metro: cada 1m = 1 Main Channel
    // Peças de 3m, então cada peça cobre 3m de comprimento
    // Total = area / 3
    const mainChannel = Math.ceil(area / 3);

    // 6. Gypsum Nylon Nail-in Anchor (Buchas)
    // Espaçamento padrão 20cm: cada 0,20m = 1 bucha por perfil
    // Com furring a cada 60cm, cada perfil de 3m precisa de 15 buchas (3m ÷ 0,20m)
    // Total = (area / 1.8) × 15 = area × 8.33
    const buchas = Math.ceil(area * 8.33);

    const materiais = [
        {
            nome: 'PVC White 6mm*250mm*5.9m',
            quantidade: chapas,
            unidade: 'unidade',
            preco_unitario: 490,
            total: chapas * 490
        },
        {
            nome: 'PVC T-White Calhas',
            quantidade: calhas,
            unidade: 'unidade',
            preco_unitario: precos['PVC Calhas'] || 250,
            total: calhas * (precos['PVC Calhas'] || 250)
        },
        {
            nome: 'Gypsum Furring Perfil (espaçamento 60cm)',
            quantidade: furringPerfil,
            unidade: 'unidade',
            preco_unitario: precos['Furring Perfil'] || 260,
            total: furringPerfil * (precos['Furring Perfil'] || 260)
        },
        {
            nome: '1000 pcs Gypsum Dry Wall (Caixa)',
            quantidade: parafusosCaixa,
            unidade: 'caixa',
            preco_unitario: precos['1000 pcs Dry Wall'] || 1100,
            total: parafusosCaixa * (precos['1000 pcs Dry Wall'] || 1100)
        },
        {
            nome: '1000 pcs Gypsum 9/5 (Caixa)',
            quantidade: parafusosCaixa,
            unidade: 'caixa',
            preco_unitario: precos['1000 pcs 9/5'] || 1000,
            total: parafusosCaixa * (precos['1000 pcs 9/5'] || 1000)
        },
        {
            nome: 'Gypsum Nylon Nail-in Anchor bucha tapite',
            quantidade: buchas,
            unidade: 'unidade',
            preco_unitario: precos['Anchor'] || 400,
            total: buchas * (precos['Anchor'] || 400)
        },
        {
            nome: 'Gypsum Main Channel',
            quantidade: mainChannel,
            unidade: 'unidade',
            preco_unitario: precos['Main Channel'] || 430,
            total: mainChannel * (precos['Main Channel'] || 430)
        }
    ];

    const total_materiais = materiais.reduce((sum, m) => sum + m.total, 0);
    const mao_obra = area * PRECO_MAO_OBRA_M2;
    const total_geral = total_materiais + mao_obra;

    return {
        tipo: 'pvc',
        area,
        materiais,
        total_materiais,
        mao_obra,
        total_geral,
        observacoes: [
            'Cálculo baseado na área total informada',
            'Espaçamento padrão Furring Perfil: 60cm',
            'Estrutura metálica considerada',
            'Mão de obra: 350 MT/m²'
        ]
    };
}
