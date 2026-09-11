const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(16).toString("hex");
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error("Formato de imagem não suportado."));
    }
    cb(null, true);
  }
});

function serialize(vehicle) {
  return {
    id: vehicle.id,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    price: vehicle.price,
    km: vehicle.km,
    condition: vehicle.condition,
    image: vehicle.image ? `/uploads/${vehicle.image}` : ""
  };
}

function validateBody(body, { requireAll }) {
  const errors = [];
  const required = ["model", "year", "color", "price", "km", "condition"];
  if (requireAll) {
    for (const field of required) {
      if (body[field] === undefined || body[field] === "") errors.push(`Campo "${field}" é obrigatório.`);
    }
  }
  if (body.condition && !["Novo", "Seminovo"].includes(body.condition)) {
    errors.push('Campo "condition" deve ser "Novo" ou "Seminovo".');
  }
  if (body.year !== undefined && Number.isNaN(Number(body.year))) errors.push('Campo "year" deve ser numérico.');
  if (body.price !== undefined && Number.isNaN(Number(body.price))) errors.push('Campo "price" deve ser numérico.');
  if (body.km !== undefined && Number.isNaN(Number(body.km))) errors.push('Campo "km" deve ser numérico.');
  return errors;
}

// GET /api/vehicles — público, com filtros opcionais via query string
router.get("/", (req, res) => {
  const { model, year, color, condition, maxPrice } = req.query;

  let sql = "SELECT * FROM vehicles WHERE 1=1";
  const params = [];

  if (model) { sql += " AND LOWER(model) LIKE ?"; params.push(`%${model.toLowerCase()}%`); }
  if (year) { sql += " AND year = ?"; params.push(Number(year)); }
  if (color) { sql += " AND color = ?"; params.push(color); }
  if (condition) { sql += " AND condition = ?"; params.push(condition); }
  if (maxPrice) { sql += " AND price <= ?"; params.push(Number(maxPrice)); }

  sql += " ORDER BY created_at DESC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(serialize));
});

// GET /api/vehicles/:id — público
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Veículo não encontrado." });
  res.json(serialize(row));
});

// POST /api/vehicles — protegido, cria veículo (com upload opcional de imagem)
router.post("/", requireAuth, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const errors = validateBody(req.body, { requireAll: true });
    if (errors.length) return res.status(400).json({ error: errors.join(" ") });

    const { model, year, color, price, km, condition } = req.body;
    const image = req.file ? req.file.filename : null;

    const result = db.prepare(`
      INSERT INTO vehicles (model, year, color, price, km, condition, image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(model.trim(), Number(year), color.trim(), Number(price), Number(km), condition, image);

    const created = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(serialize(created));
  });
});

// PUT /api/vehicles/:id — protegido, edita veículo (com upload opcional de nova imagem)
router.put("/:id", requireAuth, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const existing = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Veículo não encontrado." });

    const errors = validateBody(req.body, { requireAll: true });
    if (errors.length) return res.status(400).json({ error: errors.join(" ") });

    const { model, year, color, price, km, condition } = req.body;
    let image = existing.image;

    if (req.file) {
      // Remove a imagem antiga do disco, se existir, antes de salvar a nova.
      if (existing.image) {
        const oldPath = path.join(UPLOADS_DIR, existing.image);
        fs.unlink(oldPath, () => {});
      }
      image = req.file.filename;
    }

    db.prepare(`
      UPDATE vehicles SET model=?, year=?, color=?, price=?, km=?, condition=?, image=?
      WHERE id=?
    `).run(model.trim(), Number(year), color.trim(), Number(price), Number(km), condition, image, req.params.id);

    const updated = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(req.params.id);
    res.json(serialize(updated));
  });
});

// DELETE /api/vehicles/:id — protegido
router.delete("/:id", requireAuth, (req, res) => {
  const existing = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Veículo não encontrado." });

  if (existing.image) {
    fs.unlink(path.join(UPLOADS_DIR, existing.image), () => {});
  }
  db.prepare("DELETE FROM vehicles WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

module.exports = router;
