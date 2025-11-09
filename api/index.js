const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const categoryRoute = require("./routes/categories");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Post = require("./models/Post"); 
const Category = require("./models/Category");
const cors = require("cors");

app.use(cors());
dotenv.config();
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "/images")));

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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
    cb(null, req.body.name);
  },
});


const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  res.status(200).json("File has been uploaded");
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

const verifyToken = require("./middleware/verifyToken");
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/categories", categoryRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
