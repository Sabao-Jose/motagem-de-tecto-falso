/**
 * Calculadora de Teto Modular
 * Atualizada conforme solicitação:
 * - Área base
 * - Fórmulas específicas de estrutura
 * - Mão de obra: 250 MT/m²
 */

export function calcularModular(area, precos) {
    const PRECO_MAO_OBRA_M2 = 250;

    // 1. Tectofalso Gesso 60x60 (2.88)
    // O usuário especificou "2.88", que é a metragem de uma caixa padrão (8 placas de 0.36m²).
    // Formula: Area / 2.88 = Quantidade de caixas
    const caixas = Math.ceil(area / 2.88);

    // 2. Ctee Cross Tee 1.2 m
    // Formula solicitada: 200 * 1.35 -> Area * 1.35
    const crossTee120 = Math.ceil(area * 1.35);

    // 3. Stee Small Cross Tee 60 cm
    // Formula solicitada: 200 * 1.35 -> Area * 1.35
    const crossTee60 = Math.ceil(area * 1.35);

    // 4. Mtee Main Tee 3.60 m
    // Formula solicitada: 200 * 0.27 -> Area * 0.27
    const mainTee = Math.ceil(area * 0.27);

    // 5. Cantoneira 3 m
    // Formula solicitada: 200 * 0.22 -> Area * 0.22
    const cantoneira = Math.ceil(area * 0.22);

    // 6. Gypsum Nylon Nail-in Anchor (Buchas)
    // Para fixar perfis no teto/parede. ~2.5/m²
    const buchas = Math.ceil(area * 2.5);

    const materiais = [
        {
            nome: 'Tectofalso Gesso 60x60 (Caixa 2.88m²)',
            quantidade: caixas,
            unidade: 'caixa',
            preco_unitario: 1050, // Preço por caixa ou m²? Usuário disse "modular esta 830mt". Assumindo por caixa ou m²? 
            // Se 830 for por m², caixa = 830 * 2.88. Se for por caixa, 830.
            // Geralmente preço é por m² ou caixa. 830MT por m² é caro, 830 por caixa é barato.
            // O usuário disse "modular esta 830mt". Vamos assumir preço da CAIXA ou UNIDADE principal de venda.
            // Dado o contexto "cada chapa de gesso 895", 830 deve ser a CAIXA.
            total: caixas * 1050
        },
        {
            nome: 'Ctee Cross Tee 1.2 m',
            quantidade: crossTee120,
            unidade: 'unidade',
            preco_unitario: precos['Cross Tee 1.2'] || 200,
            total: crossTee120 * (precos['Cross Tee 1.2'] || 200)
        },
        {
            nome: 'Stee Small Cross Tee 60 cm',
            quantidade: crossTee60,
            unidade: 'unidade',
            preco_unitario: precos['Small Tee 0.6'] || 120,
            total: crossTee60 * (precos['Small Tee 0.6'] || 120)
        },
        {
            nome: 'Mtee Main Tee 3.60 m',
            quantidade: mainTee,
            unidade: 'unidade',
            preco_unitario: precos['Main Tee 3.6'] || 450,
            total: mainTee * (precos['Main Tee 3.6'] || 450)
        },
        {
            nome: 'Gypsum Nylon Nail-in Anchor bucha tapite',
            quantidade: buchas,
            unidade: 'unidade',
            preco_unitario: precos['Anchor'] || 5,
            total: buchas * (precos['Anchor'] || 5)
        },
        {
            nome: 'Cantoneira 3 m branca',
            quantidade: cantoneira,
            unidade: 'unidade',
            preco_unitario: precos['Cantoneira 3m'] || 180,
            total: cantoneira * (precos['Cantoneira 3m'] || 180)
        }
    ];

    const total_materiais = materiais.reduce((sum, m) => sum + m.total, 0);
    const mao_obra = area * PRECO_MAO_OBRA_M2;
    const total_geral = total_materiais + mao_obra;

    return {
        tipo: 'modular',
        area,
        materiais,
        total_materiais,
        mao_obra,
        total_geral,
        observacoes: [
            'Cálculo baseado na área total informada',
            'Fatores de estrutura: Main(0.27), Cross(1.35), Small(1.35)',
            'Valores de mão de obra: 350 MT/m²'
        ]
    };
}
