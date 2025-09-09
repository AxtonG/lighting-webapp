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

// Serve login page at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});


app.use(express.static(path.join(__dirname, "public"))); // serve frontend

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL // provided by Render
});
// Test connection immediately
pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("PostgreSQL connection error:", err));

// Multer setup for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "videos/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Routes

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/login.html")));

app.post("/login", async (req, res) => {
  console.log("Login attempt:", req.body); // make sure this logs
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


// Add more routes: lights toggle, video upload, video list

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
