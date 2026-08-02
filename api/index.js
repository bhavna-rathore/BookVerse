const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const categoryRoute = require("./routes/categories");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const Post = require("./models/Post");
const Category = require("./models/Category");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const verifyToken = require("./middleware/verifyToken");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required — set it in api/.env before starting the server");
}

app.use(cors());
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "/images")));

mongoose
  .connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("Connected to MongoDB");

    //seed categories when SEED_CATEGORIES=true in .env
    if (process.env.SEED_CATEGORIES === "true") {
      try {
        const catFile = path.join(__dirname, "sampleData", "categories.json");
        if (!fs.existsSync(catFile)) {
          console.warn("categories.json not found, skipping category seed");
        } else {
          const raw = fs.readFileSync(catFile, "utf8");
          const docs = JSON.parse(raw);
          if (!Array.isArray(docs)) {
            console.warn("categories.json must be an array, skipping category seed");
          } else {
            await Category.deleteMany({});
            const inserted = await Category.insertMany(docs);
            console.log(`Seeded ${inserted.length} categories`);
          }
        }
      } catch (seedErr) {
        console.error("Category seed error:", seedErr);
      }
    }
  })
  .catch((err) => console.log("MongoDB connection error:", err));

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

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads from this IP, please try again later." },
});

app.post("/api/upload", uploadLimiter, verifyToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No valid image file uploaded (png, jpg, webp, gif only, max 5MB)" });
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
    console.log(raw);
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
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts from this IP, please try again later." },
});

app.use("/api/auth", authLimiter, authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/categories", categoryRoute);

// 404 for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Centralized error handler — never leak raw driver/stack details to clients.
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "That value is already in use." });
  }

  res.status(err.status || 500).json({ error: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
