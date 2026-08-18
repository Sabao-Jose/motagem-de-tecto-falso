const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.db');

console.log('=== LISTA COMPLETA DE USUÁRIOS NO BANCO DE DADOS ===');

db.all('SELECT id, nome, email, role, senha, ativo, verificado FROM usuarios ORDER BY id', (err, rows) => {
    if (err) {
        console.error('Erro:', err);
        return;
    }
    
    if (rows.length === 0) {
        console.log('⚠️  Nenhum usuário encontrado!');
    } else {
        console.log('Encontrados', rows.length, 'usuários:');
        
        rows.forEach((row, index) => {
            console.log('\n' + (index + 1) + '. ID:', row.id);
            console.log('   Nome:', row.nome);
            console.log('   Email:', row.email);
            console.log('   Role:', row.role);
            console.log('   Ativo:', row.ativo);
            console.log('   Verificado:', row.verificado);
            console.log('   Comprimento do Hash:', row.senha.length);
            console.log('   Hash:', row.senha);
        });
        
        console.log('\n=== RESUMO ===');
        rows.forEach(row => {
            console.log(row.nome + ' (' + row.email + ') - role: ' + row.role);
        });
    }
});

db.close();
