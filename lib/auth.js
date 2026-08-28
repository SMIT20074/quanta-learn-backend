// auth.js
// JWT auth, matching the "JWT — auth" box in the pitch deck.

const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET || "dev-only-secret-change-in-production";

function signToken(user) {
  return jwt.sign({ user_id: user.user_id, email: user.email }, SECRET, { expiresIn: "7d" });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing or invalid Authorization header" });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { signToken, requireAuth };
