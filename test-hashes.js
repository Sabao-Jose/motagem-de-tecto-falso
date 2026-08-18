const bcrypt = require('bcryptjs');
const hashes = [
    '$2b$12$GQSGryC5lwC3v1QKZ6Ezxe7IHe0hOZ1TOKg4NfD6gipnel3hiPmlq',
    '$2b$10$Z98hJIORSKd97Gku657Lpu8SsrWW5RKfu8Gan7iH.yWGQVjcfHzki',
    '$2b$10$2J.7tRv0Y4ih9Klglj77YOJE7M8SsuBXPqlYGizTIXqID0E7L9YBu',
    '$2b$12$iWJ4kVCsqyOJADwa86mtYeJVwuB5xlRy5kJ6OIoe1.nLjhEqpNHzu',
    '$2b$12$YKt7zQH/sZSfWT97yzd.OuLpA.WCqLk.qVrVWkbXYPQL5TzCVVowC'
];
const possiblePasswords = ['ADMIN1234', 'josefina', 'mila', 'alitony', 'maria', '123'];

console.log('Comparando hashes conhecidos:');
for (let i = 0; i < hashes.length; i++) {
    console.log(`Hash ${i+1}: ${hashes[i]}`);
    for (const pass of possiblePasswords) {
        if (bcrypt.compareSync(pass, hashes[i])) {
            console.log(`  ✅ ${pass}`);
        }
    }
}