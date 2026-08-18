const bcrypt = require('bcryptjs');

// Known users from the database (based on our earlier query)
const users = [
    { nome: 'Administrador', email: 'admin@tetofalso.com', role: 'admin', senha: '$2b$12$GQSGryC5lwC3v1QKZ6Ezxe7IHe0hOZ1TOKg4NfD6gipnel3hiPmlq' },
    { nome: 'josefina', email: 'josefina@123', role: 'funcionario', senha: '$2b$10$Z98hJIORSKd97Gku657Lpu8SsrWW5RKfu8Gan7iH.yWGQVjcfHzki' },
    { nome: 'mila', email: 'mila@123', role: 'cliente', senha: '$2b$10$2J.7tRv0Y4ih9Klglj77YOJE7M8SsuBXPqlYGizTIXqID0E7L9YBu' },
    { nome: 'alitony sabao', email: 'alitony@gmail.com', role: 'funcionario', senha: '$2b$12$iWJ4kVCsqyOJADwa86mtYeJVwuB5xlRy5kJ6OIoe1.nLjhEqpNHzu' },
    { nome: 'maria sabao', email: 'maria@123.com', role: 'funcionario', senha: '$2b$12$YKt7zQH/sZSfWT97yzd.OuLpA.WCqLk.qVrVWkbXYPQL5TzCVVowC' }
];

const possiblePasswords = [
    'ADMIN1234', 'admin', 'adm', 'admin123', 'password',
    'josefina', 'mila', 'alitony', 'maria', '123', '1234', '12345',
    'teste', 'func', 'funcionario', 'client', 'cliente', 'user', 'test',
    'pass', 'senha', '123456', 'passwd', 'qwerty', 'letmein'
];

console.log('🔍 VERIFICANDO CREDENCIAIS DOS USUÁRIOS EXISTENTES');
console.log('='.repeat(60));

let found = false;

for (const user of users) {
    console.log(`\n📧 ${user.email} (${user.nome} - ${user.role}):`);
    let passwordFound = false;

    for (const pass of possiblePasswords) {
        if (bcrypt.compareSync(pass, user.senha)) {
            console.log(`  ✅ SENHA: ${pass}`);
            passwordFound = true;
            found = true;
            break;
        }
    }

    if (!passwordFound) {
        console.log(`  ❌ Nenhuma senha correspondente encontrada`);
    }
}

if (!found) {
    console.log('\n⚠️  Nenhuma senha correspondente encontrada. Pode ser:');
    console.log('   - Hash errado no banco de dados');
    console.log('   - Senha alterada manualmente');
    console.log('   - Usuários criados por script diferente');
}

console.log('\n💡 SUGESTÃO DE ATUALIZAÇÃO:')
console.log('Se as senhas acima estiverem corretas, você pode atualizar o banco de dados com:');
console.log('   ADMIN1234 → hash para admin (12 rounds)');
console.log('   josefina → hash para josefina (10 rounds)');
console.log('   mila → hash para mila (10 rounds)');
console.log('   alitony → hash para alitony (12 rounds)');
console.log('   maria → hash para maria (12 rounds)');
console.log('\nPara gerar novos hashes: node -e "require(\"bcryptjs\").hashSync(\"senha\", X)"');
