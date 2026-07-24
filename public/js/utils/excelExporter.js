/**
 * Exportador de Relatórios para Excel
 * Usa SheetJS (xlsx) para gerar planilhas
 */

export async function exportarServicosExcel(servicos) {
    if (!window.XLSX) {
        alert('Biblioteca Excel não carregada.');
        return;
    }

    // Preparar dados
    const dados = servicos.map(s => ({
        'ID': s.id,
        'Data': new Date(s.data_servico).toLocaleDateString('pt-MZ'),
        'Cliente': s.cliente_nome,
        'Tipo de Teto': s.tipo_teto,
        'Área (m²)': s.area,
        'Valor Total': s.valor_total,
        'Status': s.status
    }));

    // Criar workbook
    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.json_to_sheet(dados);

    // Adicionar worksheet ao workbook
    window.XLSX.utils.book_append_sheet(wb, ws, 'Serviços');

    // Salvar arquivo
    window.XLSX.writeFile(wb, `Relatorio_Servicos_${new Date().getTime()}.xlsx`);
}

export async function exportarMateriaisExcel(servicos) {
    if (!window.XLSX) {
        alert('Biblioteca Excel não carregada.');
        return;
    }

    // Consolidar materiais
    const materiais = {};

    servicos.forEach(s => {
        if (s.materiais_json) {
            const mats = JSON.parse(s.materiais_json);
            mats.forEach(m => {
                if (!materiais[m.nome]) {
                    materiais[m.nome] = {
                        nome: m.nome,
                        quantidade: 0,
                        unidade: m.unidade
                    };
                }
                materiais[m.nome].quantidade += m.quantidade;
            });
        }
    });

    const dados = Object.values(materiais).map(m => ({
        'Material': m.nome,
        'Quantidade Total': m.quantidade,
        'Unidade': m.unidade
    }));

    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.json_to_sheet(dados);
    window.XLSX.utils.book_append_sheet(wb, ws, 'Materiais');

    window.XLSX.writeFile(wb, `Relatorio_Materiais_${new Date().getTime()}.xlsx`);
}

export async function exportarClientesExcel(clientes) {
    if (!window.XLSX) {
        alert('Biblioteca Excel não carregada.');
        return;
    }

    const dados = clientes.map(c => ({
        'ID': c.id,
        'Nome': c.nome,
        'Telefone': c.telefone,
        'Email': c.email,
        'Endereço': c.endereco,
        'Data Cadastro': new Date(c.created_at).toLocaleDateString('pt-MZ')
    }));

    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.json_to_sheet(dados);
    window.XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

    window.XLSX.writeFile(wb, `Relatorio_Clientes_${new Date().getTime()}.xlsx`);
}
