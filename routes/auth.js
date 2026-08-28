const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { pool } = require("../lib/db");
const { signToken } = require("../lib/auth");

// POST /api/auth/signup  { name, email, password }
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }

  try {
    const existing = await pool.query("select 1 from users where email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `insert into users (name, email, password_hash) values ($1, $2, $3)
       returning user_id, name, email, xp, level, streak`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (e) {
    res.status(500).json({ error: "Signup failed", detail: e.message });
  }
});

// POST /api/auth/login  { email, password }
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const result = await pool.query("select * from users where email = $1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken(user);
    delete user.password_hash;
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: "Login failed", detail: e.message });
  }
});

module.exports = router;
