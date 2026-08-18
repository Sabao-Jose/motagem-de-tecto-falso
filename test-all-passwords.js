const bcrypt = require('bcryptjs');

// Test all user passwords against the correct passwords
const users = [
    { nome: 'Administrador', email: 'admin@tetofalso.com', senha: '$2b$12$GQSGryC5lwC3v1QKZ6Ezxe7IHe0hOZ1TOKg4NfD6gipnel3hiPmlq', senhaCorreta: 'ADMIN1234' },
    { nome: 'josefina', email: 'josefina@123', senha: '$2b$10$Z98hJIORSKd97Gku657Lpu8SsrWW5RKfu8Gan7iH.yWGQVjcfHzki', senhaCorreta: 'josefina' },
    { nome: 'mila', email: 'mila@123', senha: '$2b$10$2J.7tRv0Y4ih9Klglj77YOJE7M8SsuBXPqlYGizTIXqID0E7L9YBu', senhaCorreta: 'mila' },
    { nome: 'alitony sabao', email: 'alitony@gmail.com', senha: '$2b$12$iWJ4kVCsqyOJADwa86mtYeJVwuB5xlRy5kJ6OIoe1.nLjhEqpNHzu', senhaCorreta: 'alitony' },
    { nome: 'maria sabao', email: 'maria@123.com', senha: '$2b$12$YKt7zQH/sZSfWT97yzd.OuLpA.WCqLk.qVrVWkbXYPQL5TzCVVowC', senhaCorreta: 'maria' }
];

console.log('Testando todas as senhas de usuário:');
console.log('='.repeat(60));

for (const user of users) {
    const matches = bcrypt.compareSync(user.senhaCorreta, user.senha);
    console.log(`${user.email} (${user.nome}): ${matches ? '✅ CORRETA' : '❌ INCORRETA'} - Senha: '${user.senhaCorreta}'`);
}
