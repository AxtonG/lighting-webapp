require('dotenv').config();
console.log("DATABASE_URL from dotenv:", process.env.DATABASE_URL);

const express = require("express");
const bodyParser = require("body-parser");
// const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const app = express();

// CORS setup for frontend only
// app.use(cors({
//  origin: FRONTEND_URL,
//  credentials: true
// }));

app.use(bodyParser.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

console.log("Connecting to DB:", process.env.DATABASE_URL);

pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("PostgreSQL connection error:", err));

// Multer setup for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "videos/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Temporary in-memory lights
let lights = [
  { id: 1, name: "Living Room", status: false },
  { id: 2, name: "Kitchen", status: true },
];

// ---------------------- ROUTES ----------------------

// Serve login page at root first
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// Serve static frontend files (dashboard, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

//TESTING
app.get("/test-users", async (req, res) => {
  try {
    const result = await pool.query("SELECT username, password FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/debug-users", async (req, res) => {
  const result = await pool.query("SELECT username, password FROM users");
  res.json(result.rows);
});


// ---------------------- AUTH ----------------------
app.post("/login", async (req, res) => {
  console.log("Login attempt:", req.body);
  const { username, password } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.json({ success: false, message: "User not found" });
    }

    const user = userResult.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      console.log("Password correct for user:", username);
      res.json({ success: true });
    } else {
      console.log("Incorrect password for user:", username);
      res.json({ success: false, message: "Incorrect password" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------------- LIGHTS ----------------------
app.get("/lights", (req, res) => {
  res.json(lights);
});

app.post("/lights/toggle", (req, res) => {
  const { id } = req.body;
  const light = lights.find(l => l.id === id);
  if (light) {
    light.status = !light.status;
    res.json(light);
  } else {
    res.status(404).json({ message: "Light not found" });
  }
});

// ---------------------- VIDEO UPLOAD ----------------------
app.post("/upload", upload.single("video"), (req, res) => {
  res.json({ success: true, filename: req.file.filename });
});

// ---------------------- START SERVER ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
