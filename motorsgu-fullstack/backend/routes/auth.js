const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
  }

  const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username);

  // Mensagem genérica de propósito: não revela se o usuário existe ou não.
  const invalidCredentials = () =>
    res.status(401).json({ error: "Usuário ou senha incorretos." });

  if (!admin) return invalidCredentials();

  const passwordMatches = bcrypt.compareSync(password, admin.password_hash);
  if (!passwordMatches) return invalidCredentials();

  const token = jwt.sign(
    { sub: admin.id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
  );

  res.json({ token, username: admin.username });
});

module.exports = router;
