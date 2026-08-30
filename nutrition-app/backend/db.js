const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'nutrition.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    weight_kg REAL NOT NULL,
    height_cm REAL NOT NULL,
    age INTEGER NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    activity_level TEXT NOT NULL,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('lose', 'maintain', 'gain')),
    goal_weight_kg REAL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS weight_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weight_kg REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('desayuno', 'comida', 'cena', 'snack')),
    calories REAL NOT NULL,
    protein_g REAL NOT NULL DEFAULT 0,
    carbs_g REAL NOT NULL DEFAULT 0,
    fat_g REAL NOT NULL DEFAULT 0,
    is_estimated INTEGER NOT NULL DEFAULT 0,
    liked INTEGER NOT NULL DEFAULT 0,
    disliked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS menu_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    items_json TEXT NOT NULL,
    total_calories REAL NOT NULL,
    liked INTEGER NOT NULL DEFAULT 0,
    disliked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL
  );
`);

module.exports = db;
