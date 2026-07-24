/**
 * Calculadora de Teto de PVC
 * Atualizada conforme solicitação:
 * - Área base
 * - Chapa PVC: 490 MT
 * - Mão de obra: 300 MT/m²
 */

export function calcularPVC(area, precos) {
    const PRECO_MAO_OBRA_M2 = 400;

    // 1. PVC White 6mm*250mm*5.9m
    // Área da peça: 0.25 * 5.9 = 1.475 m²
    const chapas = Math.ceil(area / 1.475);

    // 2. PVC T-White Calhas (Rodaforro/Moldura)
    // Perímetro estimado: 4 * sqrt(Area)
    // Peças de 6m (comum para PVC) ou 4m? Vamos assumir 6m.
    const perimetroEst = 4 * Math.sqrt(area);
    const calhas = Math.ceil(perimetroEst / 5.9);

    // 3. Gypsum Furring Perfil (Estrutura metálica para PVC)
    // Consumo similar ao gesso: Area * 1.2 (peças de 3m)
    const furringPerfil = Math.ceil(area * 1.2);

    // 4. 1000 pcs Gypsum Dry Wall (Parafusos para fixar PVC no metal)
    // Consumo: ~20/m².
    const parafusosCaixa = Math.ceil((area * 20) / 1000);

    // 5. Gypsum Main Channel (Canaleta)
    // Consumo: Area * 0.35
    const mainChannel = Math.ceil(area * 0.35);

    // 6. Gypsum Nylon Nail-in Anchor (Buchas)
    // Para fixar perfis no teto/parede. ~2.5/m²
    const buchas = Math.ceil(area * 2.5);

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
            preco_unitario: precos['PVC Calhas'] || 200,
            total: calhas * (precos['PVC Calhas'] || 200)
        },
        {
            nome: 'Gypsum Furring Perfil',
            quantidade: furringPerfil,
            unidade: 'unidade',
            preco_unitario: precos['Furring Perfil'] || 250,
            total: furringPerfil * (precos['Furring Perfil'] || 250)
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
            preco_unitario: precos['Anchor'] || 5,
            total: buchas * (precos['Anchor'] || 5)
        },
        {
            nome: 'Gypsum Main Channel',
            quantidade: mainChannel,
            unidade: 'unidade',
            preco_unitario: precos['Main Channel'] || 420,
            total: mainChannel * (precos['Main Channel'] || 420)
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
            'Estrutura metálica considerada',
            'Valores de mão de obra: 400 MT/m²'
        ]
    };
}
