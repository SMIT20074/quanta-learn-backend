const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { initSchema } = require("./lib/db");
const circuitRoutes = require("./routes/circuit");
const lessonRoutes = require("./routes/lessons");
const progressRoutes = require("./routes/progress");
const authRoutes = require("./routes/auth");
const blochRoutes = require("./routes/bloch");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/api/status", (req, res) => res.json({ status: "Quanta Learn backend running" }));

app.use("/api/auth", authRoutes);
app.use("/api/circuit", circuitRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/bloch", blochRoutes);
app.use("/api", progressRoutes);

const PORT = process.env.PORT || 3001;

initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`Quanta Learn backend listening on port ${PORT}`));
  })
  .catch((e) => {
    console.error("Failed to initialize database schema:", e.message);
    process.exit(1);
  });

module.exports = app;
