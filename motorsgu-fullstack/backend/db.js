const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "data", "motorsgu.db");

// Garante que a pasta "data" exista antes de abrir o banco.
const fs = require("fs");
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT NOT NULL,
    price REAL NOT NULL,
    km INTEGER NOT NULL,
    condition TEXT NOT NULL,
    image TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );
`);

// Semeia veículos de demonstração apenas se a tabela estiver vazia.
const vehicleCount = db.prepare("SELECT COUNT(*) AS c FROM vehicles").get().c;
if (vehicleCount === 0) {
  const insert = db.prepare(`
    INSERT INTO vehicles (model, year, color, price, km, condition, image)
    VALUES (@model, @year, @color, @price, @km, @condition, @image)
  `);
  const demoCars = [
    { model: "Toyota Corolla XEi", year: 2022, color: "Branco", price: 119900, km: 42000, condition: "Seminovo", image: null },
    { model: "Chevrolet Onix Premier", year: 2023, color: "Preto", price: 89900, km: 31000, condition: "Seminovo", image: null },
    { model: "Volkswagen T-Cross Highline", year: 2024, color: "Cinza", price: 139900, km: 18000, condition: "Seminovo", image: null },
    { model: "Honda Civic Touring", year: 2023, color: "Prata", price: 164900, km: 22000, condition: "Seminovo", image: null },
    { model: "Jeep Compass Longitude", year: 2024, color: "Azul", price: 149900, km: 15000, condition: "Seminovo", image: null },
    { model: "Hyundai HB20 Comfort", year: 2025, color: "Branco", price: 82900, km: 0, condition: "Novo", image: null }
  ];
  const insertMany = db.transaction((cars) => {
    for (const c of cars) insert.run(c);
  });
  insertMany(demoCars);
  console.log("Banco de dados semeado com veículos de demonstração.");
}

module.exports = db;
