const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const categoryRoute = require("./routes/categories");
const commentRoute = require("./routes/comments");
const contactRoute = require("./routes/contact");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const Post = require("./models/Post");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const verifyToken = require("./middleware/verifyToken");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required — set it in api/.env before starting the server");
}

const isTestEnv = process.env.NODE_ENV === "test";

app.use(cors());
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "/images")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    // Server-generated name only — never trust a client-supplied filename.
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

const ALLOWED_IMAGE_TYPES = /^image\/(png|jpe?g|webp|gif)$/;

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_IMAGE_TYPES.test(file.mimetype));
  },
});

// Rate limits are relaxed (not disabled) under test so limiter behavior itself
// stays exercised without making the rest of the suite flaky.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads from this IP, please try again later." },
});

// multer's fileFilter only checks the client-supplied Content-Type header,
// which is trivially spoofable (rename evil.html to cover.png, claim
// image/png). This checks the file's actual magic bytes on disk, after
// multer has written it, so a mislabeled non-image is caught for real.
const MAGIC_BYTE_CHECKS = {
  "image/png": (buf) => buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47,
  "image/jpeg": (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  "image/jpg": (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  "image/gif": (buf) => buf.length >= 4 && buf.toString("ascii", 0, 4) === "GIF8",
  "image/webp": (buf) =>
    buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP",
};

app.post("/api/upload", uploadLimiter, verifyToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No valid image file uploaded (png, jpg, webp, gif only, max 5MB)" });
  }

  const check = MAGIC_BYTE_CHECKS[req.file.mimetype];
  const header = fs.readFileSync(req.file.path, { flag: "r" }).subarray(0, 12);
  if (!check || !check(header)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "File content doesn't match a valid image (png, jpg, webp, gif only)" });
  }

  res.status(200).json({ filename: req.file.filename });
});

app.post("/api/seed", async (req, res) => {
  try {
    if (process.env.SEED !== "true") {
      return res.status(403).json("Seeding is disabled. Set SEED=true in .env to enable.");
    }

    const filePath = path.join(__dirname, "sampleData", "bookPosts.json");
    if (!fs.existsSync(filePath)) {
      return res.status(400).json("sample-data not found in api folder");
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const docs = JSON.parse(raw);
    if (!Array.isArray(docs)) return res.status(400).json("sample-data.json must be a JSON array");

    if (req.query.clear === "true") {
      await Post.deleteMany({});
    }

    const inserted = await Post.insertMany(docs);
    return res.status(200).json({ inserted: inserted.length });
  } catch (err) {
    console.error("Seed error:", err);
    return res.status(500).json("Seeding failed");
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to BookVerse API 👋" });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts from this IP, please try again later." },
});

// Same shape as authLimiter — this endpoint is public and unauthenticated,
// so it needs its own spam guard rather than sharing one meant for login attempts.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages sent. Please try again later." },
});

app.use("/api/auth", authLimiter, authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/comments", commentRoute);
app.use("/api/contact", contactLimiter, contactRoute);

// 404 for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Centralized error handler — never leak raw driver/stack details to clients.
app.use((err, req, res, next) => {
  if (!isTestEnv) console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "That value is already in use." });
  }

  res.status(err.status || 500).json({ error: "Something went wrong. Please try again." });
});

module.exports = app;
