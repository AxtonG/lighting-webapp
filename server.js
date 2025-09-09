const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // serve frontend

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL // provided by Render
});

// Multer setup for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "videos/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/login.html")));

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
  if (user.rows.length === 0) return res.json({ success: false, message: "User not found" });
  
  const match = await bcrypt.compare(password, user.rows[0].password);
  if (match) res.json({ success: true });
  else res.json({ success: false, message: "Incorrect password" });
});

// Add more routes: lights toggle, video upload, video list

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
