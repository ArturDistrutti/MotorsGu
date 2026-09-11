// Cria (ou atualiza a senha de) um usuário administrador.
// Uso:  node create-admin.js <usuario> <senha>
// Exemplo:  node create-admin.js admin "MinhaSenhaForte123!"

const bcrypt = require("bcryptjs");
const db = require("./db");

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error("Uso: node create-admin.js <usuario> <senha>");
  process.exit(1);
}

if (password.length < 8) {
  console.error("A senha precisa ter pelo menos 8 caracteres.");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

const existing = db.prepare("SELECT id FROM admins WHERE username = ?").get(username);
if (existing) {
  db.prepare("UPDATE admins SET password_hash = ? WHERE username = ?").run(hash, username);
  console.log(`Senha do usuário "${username}" atualizada com sucesso.`);
} else {
  db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(username, hash);
  console.log(`Usuário admin "${username}" criado com sucesso.`);
}
