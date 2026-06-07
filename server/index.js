const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "../client/build")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const APP_PASSWORD = process.env.APP_PASSWORD || "dernek2024";

// ── Init DB ──────────────────────────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      member_name TEXT NOT NULL,
      date DATE NOT NULL,
      signed_at TIMESTAMPTZ DEFAULT NOW(),
      signature TEXT,
      UNIQUE(member_name, date)
    );
  `);
  console.log("DB ready");
}

// ── Auth middleware ───────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers["x-app-token"];
  if (token !== APP_PASSWORD) return res.status(401).json({ error: "Yetkisiz" });
  next();
}

// ── Auth ─────────────────────────────────────────────────────────────────────
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: "Şifre hatalı" });
  }
});

// ── Members ──────────────────────────────────────────────────────────────────
app.get("/api/members", auth, async (req, res) => {
  const { rows } = await pool.query("SELECT name FROM members ORDER BY name COLLATE \"tr-TR-x-icu\" ASC");
  res.json(rows.map(r => r.name));
});

app.post("/api/members", auth, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "İsim boş olamaz" });
  await pool.query("INSERT INTO members (name) VALUES ($1) ON CONFLICT DO NOTHING", [name.trim()]);
  res.json({ ok: true });
});

app.post("/api/members/bulk", auth, async (req, res) => {
  const { names } = req.body;
  if (!Array.isArray(names)) return res.status(400).json({ error: "Geçersiz" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const name of names) {
      if (name?.trim()) {
        await client.query("INSERT INTO members (name) VALUES ($1) ON CONFLICT DO NOTHING", [name.trim()]);
      }
    }
    await client.query("COMMIT");
    res.json({ ok: true, count: names.length });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.delete("/api/members/:name", auth, async (req, res) => {
  await pool.query("DELETE FROM members WHERE name = $1", [decodeURIComponent(req.params.name)]);
  res.json({ ok: true });
});

// ── Attendance ────────────────────────────────────────────────────────────────
app.get("/api/attendance/:date", auth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT member_name, to_char(signed_at AT TIME ZONE 'Europe/Istanbul', 'HH24:MI') as time, signature FROM attendance WHERE date = $1",
    [req.params.date]
  );
  const result = {};
  rows.forEach(r => { result[r.member_name] = { time: r.time, sig: r.signature }; });
  res.json(result);
});

app.get("/api/attendance", auth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT DISTINCT to_char(date, 'YYYY-MM-DD') as date FROM attendance ORDER BY date DESC"
  );
  res.json(rows.map(r => r.date));
});

app.post("/api/attendance", auth, async (req, res) => {
  const { member_name, date, signature } = req.body;
  await pool.query(
    `INSERT INTO attendance (member_name, date, signature)
     VALUES ($1, $2, $3)
     ON CONFLICT (member_name, date) DO UPDATE SET signature = $3, signed_at = NOW()`,
    [member_name, date, signature]
  );
  res.json({ ok: true });
});

app.delete("/api/attendance/:date/:name", auth, async (req, res) => {
  await pool.query(
    "DELETE FROM attendance WHERE date = $1 AND member_name = $2",
    [req.params.date, decodeURIComponent(req.params.name)]
  );
  res.json({ ok: true });
});

// ── Catch-all → React ─────────────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

initDB().then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Yoklama server: ${PORT}`));
});
