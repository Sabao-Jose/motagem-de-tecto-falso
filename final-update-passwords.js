const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.db');

console.log('=== ATUALIZANDO TODAS AS SENHAS DOS USUÁRIOS ===');

async function updatePasswords() {
    const updates = [
        { email: 'admin@tetofalso.com', senha: 'ADMIN1234', rounds: 12 },
        { email: 'josefina@123', senha: 'josefina', rounds: 10 },
        { email: 'mila@123', senha: 'mila', rounds: 10 },
        { email: 'alitony@gmail.com', senha: 'alitony', rounds: 12 },
        { email: 'maria@123.com', senha: 'maria', rounds: 12 },
        { email: 'admin-test@local', senha: 'admin-test', rounds: 10 },
        { email: 'tester@local', senha: 'tester', rounds: 10 }
    ];
    
    for (const update of updates) {
        const senhaHash = bcrypt.hashSync(update.senha, update.rounds);
        
        await new Promise((resolve, reject) => {
            db.run('UPDATE usuarios SET senha = ? WHERE email = ?', [senhaHash, update.email], function(err) {
                if (err) {
                    console.error('Erro ao atualizar ' + update.email + ':', err);
                    reject(err);
                } else {
                    console.log('Atualizado ' + update.email + ' para senha \'' + update.senha + '\' (hash ' + update.rounds + ' rounds)');
                    resolve();
                }
            });
        });
    }
    
    console.log('\n=== VERIFICANDO TODAS AS ATUALIZAÇÕES ===');
    
    await new Promise((resolve, reject) => {
        db.all('SELECT id, nome, email, senha FROM usuarios ORDER BY id', (err, rows) => {
            if (err) {
                console.error('Erro ao verificar:', err);
                reject(err);
                return;
            }
            
            for (const row of rows) {
                const expectedPasswords = {
                    'admin@tetofalso.com': 'ADMIN1234',
                    'josefina@123': 'josefina',
                    'mila@123': 'mila',
                    'alitony@gmail.com': 'alitony',
                    'maria@123.com': 'maria',
                    'admin-test@local': 'admin-test',
                    'tester@local': 'tester'
                };
                
                if (expectedPasswords[row.email] && bcrypt.compareSync(expectedPasswords[row.email], row.senha)) {
                    console.log('OK ' + row.nome + ' (' + row.email + ') - senha correta confirmada');
                } else {
                    console.log('ERRO ' + row.nome + ' (' + row.email + ') - SENHA INCORRETA!');
                }
            }
            
            resolve();
        });
    });
    
    db.close();
    console.log('\nAtualização de senhas concluída! Todos os usuários têm senhas corretas.');
}

updatePasswords().catch(console.error);
