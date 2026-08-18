/*
 * Calculadora de Divisão de Paredes com Gypsum Board
 * 
 * Especificações:
 * - Chapa: Gypsum Board Regular 1200mm x 2400mm x 12mm (2,88 m² por chapa)
 * - Raias/Montantes: Perfis de 3 metros de comprimento
 * - Espaçamento entre raias: 60 cm (0,60m)
 * 
 * Materiais e Preços:
 * - Gypsum Board Regular: 1000 MT/chapa
 * - Raia/Montante: 300 MT/unidade
 * - Gesso Fino 25kg: 1300 MT/saco (cobre 15m²)
 * - Fita de Rede 50m: 450 MT/rolo
 * - Bucha Tapite: 600 MT/pacote (100 unidades)
 * - Parafusos 0.25: 1000 MT/caixa (1000 parafusos)
 * - Parafusos 9/5: 1000 MT/caixa (1000 parafusos)
 */

export function calcularParede(altura, comprimento, precos = {}) {
    const PRECO_MAO_OBRA_M2 = 450; // MT por m² para paredes
    
    // Dimensões da chapa padrão
    const CHAPA_LARGURA = 1.20; // metros
    const CHAPA_ALTURA = 2.40; // metros
    const CHAPA_AREA = CHAPA_LARGURA * CHAPA_ALTURA; // 2,88 m²
    
    // Espaçamento entre raias (60 cm)
    const ESPACAMENTO_RAIA = 0.60; // metros
    
    // Área por lado
    const areaPorLado = altura * comprimento;
    
    // Área total (2 lados - frente e verso)
    const areaTotal = areaPorLado * 2;
    
    // 1. Chapas de Gypsum Board (com margem de 10%)
    const chapasSemMargem = areaTotal / CHAPA_AREA;
    const chapasComMargem = Math.ceil(chapasSemMargem * 1.10); // 10% de margem
    
    // 2. Raias/Montantes (perfis de 3m)
    // Número de raias por lado (comprimento / espaçamento + 1 para borda inicial)
    const raiasPorLado = Math.floor(comprimento / ESPACAMENTO_RAIA) + 1;
    // Total de raias: 2 lados + guias superior e inferior (2 guias por lado)
    const guiasPorLado = Math.ceil(altura / 3) * 2; // guias horizontais (cada 3m)
    const totalRaias = (raiasPorLado * 2) + (guiasPorLado * 2);
    
    // 3. Gesso em Pó (sacos de 25kg - 15m² por saco)
    const sacosGesso = Math.ceil(areaTotal / 15);
    
    // 4. Fita de Rede (rolos de 50m)
    const fitaRede = Math.ceil(areaTotal / 50);
    
    // 5. Parafusos 0.25 (30 parafusos por m²)
    const totalParafusos025 = Math.ceil(areaTotal * 30);
    const caixasParafusos025 = Math.ceil(totalParafusos025 / 1000);
    
    // 6. Parafusos 9/5 (10 parafusos por m²)
    const totalParafusos95 = Math.ceil(areaTotal * 10);
    const caixasParafusos95 = Math.ceil(totalParafusos95 / 1000);
    
    // 7. Buchas Tapite (2,5 buchas por m², pacotes de 100)
    const totalBuchas = Math.ceil(areaTotal * 2.5);
    const pacotesBuchas = Math.ceil(totalBuchas / 100);
    
    // Preços padrão (podem ser sobrescritos)
    const precoGypsum = precos['Gypsum Board'] || 1000;
    const precoRaia = precos['Raia'] || 300;
    const precoGesso = precos['Gesso 25kg'] || 1300;
    const precoFitaRede = precos['Fita Rede'] || 450;
    const precoBuchaTapite = precos['Bucha Tapite'] || 600;
    const precoParafuso025 = precos['Parafusos 0.25'] || 1000;
    const precoParafuso95 = precos['Parafusos 9/5'] || 1000;
    
    const materiais = [
        {
            nome: 'Gypsum Board Regular',
            quantidade: chapasComMargem,
            unidade: 'chapa',
            preco_unitario: precoGypsum,
            total: chapasComMargem * precoGypsum,
            especificacao: ''
        },
        {
            nome: 'Raia/Montante Perfil 3m',
            quantidade: totalRaias,
            unidade: 'unidade',
            preco_unitario: precoRaia,
            total: totalRaias * precoRaia,
            especificacao: 'Espaçamento: 60cm'
        },
        {
            nome: 'Gesso Fino 25kg',
            quantidade: sacosGesso,
            unidade: 'saco',
            preco_unitario: precoGesso,
            total: sacosGesso * precoGesso,
            especificacao: '1 saco cobre 15m²'
        },
        {
            nome: 'Fita de Rede 50m',
            quantidade: fitaRede,
            unidade: 'rolo',
            preco_unitario: precoFitaRede,
            total: fitaRede * precoFitaRede,
            especificacao: 'Para fechar juntas das chapas'
        },
        {
            nome: 'Bucha Tapite',
            quantidade: pacotesBuchas,
            unidade: 'pacote',
            preco_unitario: precoBuchaTapite,
            total: pacotesBuchas * precoBuchaTapite,
            especificacao: `100 unidades por pacote (${totalBuchas} buchas no total)`
        },
        {
            nome: 'Parafusos 0.25',
            quantidade: caixasParafusos025,
            unidade: 'caixa',
            preco_unitario: precoParafuso025,
            total: caixasParafusos025 * precoParafuso025,
            especificacao: `1000 parafusos por caixa (${totalParafusos025} no total)`
        },
        {
            nome: 'Parafusos 9/5',
            quantidade: caixasParafusos95,
            unidade: 'caixa',
            preco_unitario: precoParafuso95,
            total: caixasParafusos95 * precoParafuso95,
            especificacao: `1000 parafusos por caixa (${totalParafusos95} no total)`
        }
    ];
    
    const total_materiais = materiais.reduce((sum, m) => sum + m.total, 0);
    const mao_obra = areaTotal * PRECO_MAO_OBRA_M2;
    const total_geral = total_materiais + mao_obra;
    
    // Detalhes do cálculo para exibição
    const detalhes = {
        areaPorLado: areaPorLado.toFixed(2),
        areaTotal: areaTotal.toFixed(2),
        raiasPorLado: raiasPorLado,
        espacamento: ESPACAMENTO_RAIA * 100, // em cm
        chapasPorLado: Math.ceil(areaPorLado / CHAPA_AREA),
        margem: '10%',
        totalParafusos025,
        totalParafusos95,
        totalBuchas
    };
    
    return {
        tipo: 'parede',
        altura,
        comprimento,
        areaPorLado,
        areaTotal,
        materiais,
        total_materiais,
        mao_obra,
        total_geral,
        detalhes,
        observacoes: [
            `Dimensões da parede: ${altura}m (altura) × ${comprimento}m (comprimento)`,
            `Área por lado: ${detalhes.areaPorLado} m²`,
            `Área total (2 lados): ${detalhes.areaTotal} m²`,
            `Chapas: ${chapasComMargem} (com ${detalhes.margem} de margem)`,
            `Raias: ${totalRaias} (espaçamento de ${detalhes.espacamento}cm)`,
            `Gesso: 1 saco de 25kg cobre 15m²`,
            `Fita de Rede: 1 rolo tem 50m`,
            `Parafusos 0.25: ${totalParafusos025} unidades (${caixasParafusos025} caixas)`,
            `Parafusos 9/5: ${totalParafusos95} unidades (${caixasParafusos95} caixas)`,
            `Buchas Tapite: ${totalBuchas} unidades (${pacotesBuchas} pacotes)`
        ]
    };
}
