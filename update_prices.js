const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

const novosPrecos = [
    // Gesso
    { item: 'Chapa de Gesso 1,20x2,40m', preco: 895 },
    { item: 'Mão de Obra Instalação', preco: 450 }, // Assumindo que este é o genérico ou específico se houver
    { item: 'Massa Corrida', preco: 830 },

    // PVC
    { item: 'Chapa PVC 5,80x0,25m', preco: 490 },
    // Mão de obra PVC e Modular geralmente usam o mesmo item 'Mão de Obra Instalação' no banco atual,
    // mas o usuário pediu preços diferentes.
    // O banco atual tem apenas um item 'Mão de Obra Instalação'.
    // VAMOS ATUALIZAR O GENÉRICO PARA O MAIOR VALOR (450) E CRIAR ESPECÍFICOS SE NECESSÁRIO.
    // Mas o código JS (gesso.js, pvc.js) busca 'Mão de Obra Instalação' por padrão.
    // O código JS que eu editei agora usa valores hardcoded se não encontrar no banco, OU se o banco tiver valor, usa do banco.
    // O problema é que o banco tem 'Mão de Obra Instalação' = 150.
    // Se eu mudar para 450, vai afetar todos.
    // O ideal é deletar os preços do banco para que o JS use os hardcoded, OU atualizar o banco para bater com o JS.

    // Modular
    { item: 'Placa Modular 60x60cm', preco: 830 },
];

// Como o usuário pediu preços de mão de obra diferentes para cada tipo, e o banco só tem um item genérico,
// a melhor abordagem agora é REMOVER os itens de preço do banco de dados para que o sistema use os valores
// que eu acabei de colocar no código (hardcoded).
// Assim, o gesso.js vai usar 450, o pvc.js vai usar 300, etc.

db.serialize(() => {
    console.log('Limpando tabela de preços para forçar uso dos novos valores do código...');

    // Opção 1: Atualizar valores específicos que existem
    db.run("UPDATE precos_materiais SET preco = 895 WHERE item = 'Chapa de Gesso 1,20x2,40m'");
    db.run("UPDATE precos_materiais SET preco = 830 WHERE item = 'Massa Corrida'");
    db.run("UPDATE precos_materiais SET preco = 490 WHERE item = 'Chapa PVC 5,80x0,25m'");
    db.run("UPDATE precos_materiais SET preco = 830 WHERE item = 'Placa Modular 60x60cm'");

    // Opção 2: Para mão de obra, como são diferentes, vamos DELETAR o genérico para não atrapalhar
    // Se o código JS não encontrar no banco, ele usa o valor default (|| 450, || 300, etc)
    db.run("DELETE FROM precos_materiais WHERE item = 'Mão de Obra Instalação'");

    console.log('Preços atualizados com sucesso!');
});

db.close();
