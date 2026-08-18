const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.db');

console.log('=== Atualizando senhas dos usuários ===');

async function updatePasswords() {
    // Atualizar admin - senha ADMIN1234 (12 rounds)
    await new Promise((resolve, reject) => {
        db.run('UPDATE usuarios SET senha = ? WHERE email = ?', [
            bcrypt.hashSync('ADMIN1234', 12),
            'admin@tetofalso.com'
        ], function(err) {
            if (err) console.error('Erro ao atualizar admin:', err);
            else console.log('✅ Admin atualizado:', this.changes);
            resolve();
        });
    });

    // Atualizar josefina - senha josefina (10 rounds)
    await new Promise((resolve, reject) => {
        db.run('UPDATE usuarios SET senha = ? WHERE email = ?', [
            bcrypt.hashSync('josefina', 10),
            'josefina@123'
        ], function(err) {
            if (err) console.error('Erro ao atualizar josefina:', err);
            else console.log('✅ Josefina atualizada:', this.changes);
            resolve();
        });
    });

    // Atualizar mila - senha mila (10 rounds)
    await new Promise((resolve, reject) => {
        db.run('UPDATE usuarios SET senha = ? WHERE email = ?', [
            bcrypt.hashSync('mila', 10),
            'mila@123'
        ], function(err) {
            if (err) console.error('Erro ao atualizar mila:', err);
            else console.log('✅ Mila atualizada:', this.changes);
            resolve();
        });
    });

    // Atualizar alitony - senha alitony (12 rounds)
    await new Promise((resolve, reject) => {
        db.run('UPDATE usuarios SET senha = ? WHERE email = ?', [
            bcrypt.hashSync('alitony', 12),
            'alitony@gmail.com'
        ], function(err) {
            if (err) console.error('Erro ao atualizar alitony:', err);
            else console.log('✅ Alitony atualizado:', this.changes);
            resolve();
        });
    });

    // Atualizar maria - senha maria (12 rounds)
    await new Promise((resolve, reject) => {
        db.run('UPDATE usuarios SET senha = ? WHERE email = ?', [
            bcrypt.hashSync('maria', 12),
            'maria@123.com'
        ], function(err) {
            if (err) console.error('Erro ao atualizar maria:', err);
            else console.log('✅ Maria atualizada:', this.changes);
            resolve();
        });
    });

    // Verificar atualizações
    await new Promise((resolve, reject) => {
        console.log('\n=== Verificando atualizações ===');
        db.all('SELECT id, nome, email FROM usuarios WHERE email IN (\'admin@tetofalso.com\', \'josefina@123\', \'mila@123\', \'alitony@gmail.com\', \'maria@123.com\')', (err, rows) => {
            if (err) console.error('Erro ao verificar:', err);
            else {
                rows.forEach(row => {
                    db.get('SELECT senha FROM usuarios WHERE id = ?', [row.id], (err2, userRow) => {
                        if (err2) console.error('Erro:', err2);
                        else console.log(`${row.nome} (${row.email}): Hash length: ${userRow.senha.length} chars`);
                    });
                });
            }
            resolve();
        });
    });
    
    db.close();
}

updatePasswords().catch(console.error);
