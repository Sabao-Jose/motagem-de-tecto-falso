/*
 * Calculadora de Teto de Gesso
 * Atualizada conforme solicitação:
 * - Área base
 * - Chapa: Area / 2.88
 * - Gypsum Furring Perfil: Espaçamento padrão 60cm
 * - Massa de Barramento: 1 saco 25kg cobre 15m²
 * - Mão de obra: 450 MT/m²
 */

export function calcularGesso(area, precos) {
    const PRECO_MAO_OBRA_M2 = 450;
    const ESPACAMENTO_FURRING = 0.60; // Espaçamento padrão 60cm

    // 1. Gypsum Board Regular Placa (Area / 2.88)
    const chapas = Math.ceil(area / 2.88);

    // 2. Gypsum Furring Perfil (Espaçamento padrão 60cm)
    // Para area A = L × C, com espaçamento de 60cm:
    // - Linhas ao longo da largura: L / 0.60
    // - Perfis por linha (perfis de 3m): C / 3
    // Total = (L / 0.60) × (C / 3) = (L × C) / 1.8 = area / 1.8
    const furringPerfil = Math.ceil(area / 1.8);

    // 3. Wall Angle (Cantoneira) 25x25x0.5mm x 3m
    // Perímetro estimado: 4 × √(area)
    const perimetroEst = 4 * Math.sqrt(area);
    const wallAngle = Math.ceil(perimetroEst / 3);

    // 4. Gypsum Corner Bead (Cantoneira de reforço)
    const cornerBead = Math.ceil(area * 0.1);

    // 5. 1000 pcs Gypsum Dry Wall (Parafusos 0.25)
    // Consumo: ~30/m²
    const parafusosCaixa = Math.ceil((area * 30) / 1000);

    // 6. Gypsum Drywall Screw (Parafusos 9/5)
    // Consumo: ~10/m²
    const parafusosMetal = Math.ceil(area * 10);

    // 7. Gypsum Nylon Nail-in Anchor (Buchas)
    // Espaçamento padrão 20cm: cada 0,20m = 1 bucha por perfil
    // Com furring a cada 60cm, cada perfil de 3m precisa de 15 buchas (3m ÷ 0,20m)
    // Total = (area / 1.8) × 15 = area × 8.33
    const buchas = Math.ceil(area * 8.33);

    // 8. Gypsum Paper Metal (Fita com reforço metálico)
    // 1 rolo cobre ~40m² de juntas
    const paperMetal = Math.ceil(area / 40);

    // 9. Gypsum Main Channel (Canaleta/Pente)
    // Espaçamento padrão 1 metro: cada 1m = 1 Main Channel
    // Peças de 3m, então cada peça cobre 3m de comprimento
    // Total = area / 3
    const mainChannel = Math.ceil(area / 3);

    // 10. Gypsum Fiber Glass Tape (Fita redes para fechar juntas)
    // Cada rolo tem 50 metros
    // Para chapas de 1.20m x 2.40m, cada chapa tem ~7.20m de juntas
    // Metros de fita por m² = 7.20 / 2.88 = 2.5m de fita por m²
    // Total de fita = area × 2.5 metros
    // Número de rolos = (area × 2.5) / 50 = area / 20
    const fiberTape = Math.ceil(area / 20);

    // 11. Massa de Barramento (Gesso Fino 25kg)
    // 1 saco de 25kg barre 15m² na primeira mão
    // Segunda mão: consome menos, aproximadamente 20m² por saco
    // Total para 2 mãos: (area / 15) + (area / 20)
    const primeiraMao = Math.ceil(area / 15);
    const segundaMao = Math.ceil(area / 20);
    const massaBarramento = primeiraMao + segundaMao;

    const materiais = [
        {
            nome: 'Gypsum Board Regular Placa gesso',
            quantidade: chapas,
            unidade: 'unidade',
            preco_unitario: 1000,
            total: chapas * 1000
        },
        {
            nome: 'Gypsum Furring Perfil (espaçamento 60cm)',
            quantidade: furringPerfil,
            unidade: 'unidade',
            preco_unitario: precos['Gypsum Furring Perfil'] || 300,
            total: furringPerfil * (precos['Gypsum Furring Perfil'] || 300)
        },
        {
            nome: 'Wall Angle 25x25x0.5mm x 3m cantoneira galvanizado',
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
            nome: 'Gypsum Drywall Screw (parafuso 9/5)',
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
            nome: 'Gypsum Paper Metal banda armada',
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
            'Espaçamento padrão Furring Perfil: 60cm',
            '1 saco de Gesso Fino 25kg cobre 15m²',
            'Mão de obra: 450 MT/m²'
        ]
    };
}
