const bcrypt = require('bcryptjs');

// Test ADMIN1234 against admin hash
const adminHash = '$2b$12$GQSGryC5lwC3v1QKZ6Ezxe7IHe0hOZ1TOKg4NfD6gipnel3hiPmlq';
console.log('Admin hash:', adminHash);

const password = 'ADMIN1234';
const isMatch = bcrypt.compareSync(password, adminHash);
console.log('Password:', password);
console.log('Matches:', isMatch);
