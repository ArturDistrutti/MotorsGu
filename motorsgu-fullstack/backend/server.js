require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

require("./db"); // garante que o banco e as tabelas existam antes de subir o servidor

const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicles");

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.JWT_SECRET) {
  console.error('ERRO: defina JWT_SECRET no arquivo ".env" antes de iniciar o servidor (veja .env.example).');
  process.exit(1);
}

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve as imagens enviadas dos veículos.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Tratador de erro genérico (ex.: arquivo de imagem grande demais).
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`API da Motors Gu rodando em http://localhost:${PORT}`);
});
