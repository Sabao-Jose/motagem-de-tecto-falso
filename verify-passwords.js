const bcrypt = require('bcryptjs');
const users = [
    { email: 'admin@tetofalso.com', senha: '$2b$12$9DQr7wDVqld6P5Q/bykcp.ZH38SC.4aN3sgyEBRF7PoyEtvFmKbFC', senhaCorreta: 'ADMIN1234', nome: 'Administrador', role: 'admin' },
    { email: 'josefina@123', senha: '$2b$10$bYWKmgLGZjHvLoVhrE4o7OPDsVLMRNezqQQ4U1uaZOGnzpPr36nZ.', senhaCorreta: 'josefina', nome: 'josefina', role: 'funcionario' },
    { email: 'mila@123', senha: '$2b$10$HLkI8YrenEw1zS1G2ATHbeQ5qWOpFcFmdQV7ro0qeRpeH20P1WNdO', senhaCorreta: 'mila', nome: 'mila', role: 'cliente' },
    { email: 'alitony@gmail.com', senha: '$2b$12$XzBD509lQiViFT.5RLNqVuMB3En6arAohcsFP2zKCQGFMsfQ2d/Dy', senhaCorreta: 'alitony', nome: 'alitony sabao', role: 'funcionario' },
    { email: 'maria@123.com', senha: '$2b$12$Lk4STy0P3J.Z5XjF1QH1EeQG8S.E9Xy0DdPv8Jq3R0.0Bb2hZmvQC', senhaCorreta: 'maria', nome: 'maria sabao', role: 'funcionario' }
];

console.log('Testando as senhas atualizadas no banco de dados:');
console.log('='.repeat(70));

let allPass = true;

for (const user of users) {
    const matches = bcrypt.compareSync(user.senhaCorreta, user.senha);
    if (matches) {
        console.log('OK ' + user.nome + ' (' + user.email + ') - Senha "' + user.senhaCorreta + '" - CORRETA');
    } else {
        console.log('ERRO ' + user.nome + ' (' + user.email + ') - Senha "' + user.senhaCorreta + '" - INCORRETA');
        allPass = false;
    }
}

if (allPass) {
    console.log('\nTODAS AS SENHAS ESTAO CORRETAS! O sistema de login deve funcionar agora.');
} else {
    console.log('\nALGUMAS SENHAS ESTAO INCORRETAS. Verifique novamente.');
}
