/*
 * Calculadora de Teto de Gesso
 * Atualizada conforme solicitação:
 * - Área base
 * - Chapa: Area / 2.88
 * - Massa de Barramento: 1 saco 25kg cobre 15m²
 * - Mão de obra: 250 MT/m²
 */

export function calcularGesso(area, precos) {
    const PRECO_MAO_OBRA_M2 = 450;

    // Fórmulas estimadas baseadas em consumo médio por m² para estrutura completa
    // Ajuste conforme necessário se houver fórmulas exatas fornecidas além da chapa

    // 1. Gypsum Board Regular Placa (Area / 2.88)
    const chapas = Math.ceil(area / 2.88);

    // 2. Gypsum Furring Perfil (Perfil F530)
    // Consumo médio: 3.5m/m². Peças de 3m? Se não especificado, assumimos peças de 3m.
    // Formula aproximada: Area * 1.2 (peças de 3m)
    const furringPerfil = Math.ceil(area * 1.2);

    // 3. Wall Angle (Cantoneira) 25x25x0.5mm x 3m
    // Perímetro estimado para area quadrada: 4 * sqrt(Area)
    // Consumo: Perímetro / 3m
    const perimetroEst = 4 * Math.sqrt(area);
    const wallAngle = Math.ceil(perimetroEst / 3);

    // 4. Gypsum Corner Bead (Cantoneira de reforço)
    // Estimativa: 20% do perímetro ou específico para cantos externos.
    // Vamos colocar um valor base de 1 peça a cada 10m² para cantos
    const cornerBead = Math.ceil(area * 0.1);

    // 5. 1000 pcs Gypsum Dry Wall (Parafusos?)
    // O nome sugere caixa de 1000 parafusos ou similar.
    // Se for parafusos, consumo é ~30/m². 200m² = 6000 parafusos = 6 caixas.
    const parafusosCaixa = Math.ceil((area * 30) / 1000);

    // 6. Gypsum Drywall Screw (Parafusos avulsos ou outra medida?)
    // Vamos assumir parafusos para estrutura (metal-metal). ~10/m²
    const parafusosMetal = Math.ceil(area * 10);

    // 7. Gypsum Nylon Nail-in Anchor (Buchas)
    // Para fixar perfis no teto/parede. ~2/m² de teto + perímetro
    const buchas = Math.ceil(area * 2.5);

    // 8. Gypsum Paper Metal (Fita com reforço metálico ou fita de papel?)
    // Vamos assumir rolos. 1 rolo cobre ~40m² de juntas.
    const paperMetal = Math.ceil(area / 40);

    // 9. Gypsum Main Channel (Canaleta)
    // Consumo: ~1m/m². Peças de 3m -> Area * 0.35
    const mainChannel = Math.ceil(area * 0.35);

    // 10. Gypsum Fiber Glass Tape (Fita telada)
    // 1 rolo (45m ou 90m) por ~50m².
    const fiberTape = Math.ceil(area / 50);

    // 11. Massa de Barramento (Gesso Fino 25kg)
    // 1 saco de 25kg cobre 15m²
    const massaBarramento = Math.ceil(area / 15);

    const materiais = [
        {
            nome: 'Gypsum Board Regular Placa gesso',
            quantidade: chapas,
            unidade: 'unidade',
            preco_unitario: 1000,
            total: chapas * 1000
        },
        {
            nome: 'Gypsum Furring Perfil',
            quantidade: furringPerfil,
            unidade: 'unidade',
            preco_unitario: precos['Gypsum Furring Perfil'] || 300,
            total: furringPerfil * (precos['Gypsum Furring Perfil'] || 300)
        },
        {
            nome: 'Wall Angle 25x25x0.5mm x 3m cantoneira garvanizado',
            quantidade: wallAngle,
            unidade: 'unidade',
            preco_unitario: precos['Wall Angle'] || 200,
            total: wallAngle * (precos['Wall Angle'] || 200)
        },
        {
            nome: 'Gypsum Corner bit',
            quantidade: cornerBead,
            unidade: 'unidade',
            preco_unitario: precos['Corner Bead'] || 260,
            total: cornerBead * (precos['Corner Bead'] || 260)
        },
        {
            nome: '1000 pcs Gypsum Dry Wall (Caixa parafuso 0,25)',
            quantidade: parafusosCaixa,
            unidade: 'caixa',
            preco_unitario: precos['1000 pcs Dry Wall'] || 1100,
            total: parafusosCaixa * (precos['1000 pcs Dry Wall'] || 1100)
        },
        {
            nome: 'Gypsum Drywall Screw (Unid parafuso 9/5)',
            quantidade: parafusosMetal,
            unidade: 'unidade',
            preco_unitario: precos['Drywall Screw'] || 2,
            total: parafusosMetal * (precos['Drywall Screw'] || 2)
        },
        {
            nome: 'Gypsum Nylon Nail-in Anchor bucha tapite',
            quantidade: buchas,
            unidade: 'unidade',
            preco_unitario: precos['Anchor'] || 5,
            total: buchas * (precos['Anchor'] || 5)
        },
        {
            nome: 'Gypsum Paper Metal banda armda',
            quantidade: paperMetal,
            unidade: 'rolo',
            preco_unitario: precos['Paper Metal'] || 1150,
            total: paperMetal * (precos['Paper Metal'] || 1150)
        },
        {
            nome: 'Gypsum Main Channel pentes',
            quantidade: mainChannel,
            unidade: 'unidade',
            preco_unitario: precos['Main Channel'] || 350,
            total: mainChannel * (precos['Main Channel'] || 350)
        },
        {
            nome: 'Gypsum Fiber Glass Tape fita redes',
            quantidade: fiberTape,
            unidade: 'rolo',
            preco_unitario: precos['Fiber Glass Tape'] || 450,
            total: fiberTape * (precos['Fiber Glass Tape'] || 450)
        },
        {
            nome: 'Massa de Barramento (Gesso Fino 25kg)',
            quantidade: massaBarramento,
            unidade: 'saco',
            preco_unitario: precos['Massa Barramento'] || 1220,
            total: massaBarramento * (precos['Massa Barramento'] || 1220)
        }
    ];

    const total_materiais = materiais.reduce((sum, m) => sum + m.total, 0);
    const mao_obra = area * PRECO_MAO_OBRA_M2;
    const total_geral = total_materiais + mao_obra;

    return {
        tipo: 'gesso',
        area,
        materiais,
        total_materiais,
        mao_obra,
        total_geral,
        observacoes: [
            'Cálculo baseado na área total informada',
            'Quantidades estimadas para estrutura padrão',
            '1 saco de Gesso Fino 25kg cobre 15m²',
            'Valores de mão de obra: 450 MT/m²'
        ]
    };
}
