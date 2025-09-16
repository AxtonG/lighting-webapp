require('dotenv').config();
console.log("DATABASE_URL from dotenv:", process.env.DATABASE_URL);
const baseUrl = process.env.BASE_URL || "http://localhost:5000";
const express = require("express");
const bodyParser = require("body-parser");
// const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();

// CORS setup for frontend only
//const cors = require("cors");
//app.use(cors({
 // origin: FRONTEND_URL,
 // credentials: true
//}));

app.use(bodyParser.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

console.log("Connecting to DB:", process.env.DATABASE_URL);

async function createApprovalToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const hours = Number(process.env.TOKEN_EXPIRY_HOURS || 72);
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000); // expiry

  await pool.query(
    "INSERT INTO approval_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [userId, token, expiresAt]
  );
  return token;
}

pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("PostgreSQL connection error:", err));

// create reusable transporter (Gmail example; use App Password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS
  }
});

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
    if (user.status !== "approved") {
      return res.json({ success: false, message: "Account awaiting approval" });
    }
    const match = await bcrypt.compare(password, user.password_hash);

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

//------------------ REQUEST ACCOUNT -----------------------
app.post("/request-account", async (req, res) => {
  const { username, email, phone, password } = req.body;

  try {
    // 1. Check if username already exists
    const existingUser = await pool.query(
      "SELECT 1 FROM users WHERE username = $1",
      [username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // 2. Check if email already exists
    const existingEmail = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert new user
    const result = await pool.query(
      "INSERT INTO users (username, email, phone, password_hash, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id",
      [username, email, phone, hashedPassword, "pending"]
    );

    const userId = result.rows[0].id;

    // 5. Send email to admin
    await transporter.sendMail({
      from: process.env.ADMIN_EMAIL,
      to: "ad.safehaven@gmail.com", // admin email
      subject: "New Account Request Pending Approval",
      text: `A new user has requested an account:\n\n
Username: ${username}\n
Email: ${email}\n
Phone: ${phone}\n
\nTo approve: ${baseUrl}/approve-user/${userId} 
\nTo reject: ${baseUrl}/reject-user/${userId}`
    }); // CHANGE URL WHEN LIVE TO ACTUAL URL

    res.json({ message: "Request submitted! Awaiting admin approval." });

  } catch (err) {
    console.error("Error in /request-account:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/approve-user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE users SET status = 'approved' WHERE id = $1", [id]);
    res.send("✅ User has been approved successfully!");
  } catch (err) {
    console.error("Error approving user:", err);
    res.status(500).send("Server error while approving user.");
  }
});

app.get("/reject-user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.send("❌ User has been rejected and removed.");
  } catch (err) {
    console.error("Error rejecting user:", err);
    res.status(500).send("Server error while rejecting user.");
  }
});

// ---------------------- CLEANUP PENDING USERS ----------------------
async function cleanupPendingUsers() {
  try {
    const hours = Number(process.env.TOKEN_EXPIRY_HOURS || 72);
    const cutoff = new Date(Date.now() - hours * 3600 * 1000);

    const result = await pool.query(
      "DELETE FROM users WHERE status = 'pending' AND created_at < $1 RETURNING id, username, email",
      [cutoff]
    );

    if (result.rowCount > 0) {
      console.log(`Deleted ${result.rowCount} pending user(s):`, result.rows.map(r => r.username));
    }
  } catch (err) {
    console.error("Error cleaning up pending users:", err);
  }
}

// Run cleanup every hour
setInterval(cleanupPendingUsers, 3600*1000);

// ---------------------- START SERVER ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
