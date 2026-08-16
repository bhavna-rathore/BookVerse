// One-time backfill: resolves each Post's free-text `category` string to a
// real Category document and sets `categoryId`, fixing the data-integrity
// gap where a Category named "Fiction" and a post with category "fiction"
// never matched. Safe to re-run — posts that already have a categoryId are
// skipped, and category lookups are case-insensitive find-or-create.
//
// Usage: node scripts/migrateCategories.js

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const Post = require("../models/Post");
const Category = require("../models/Category");

const FALLBACK_CATEGORY_NAME = "Uncategorized";

async function findOrCreateCategory(name) {
  const trimmed = name.trim();
  const existing = await Category.findOne({ name: new RegExp(`^${trimmed}$`, "i") });
  if (existing) return existing;
  return Category.create({ name: trimmed });
}

async function migrate() {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is required — set it in api/.env before running this script");
  }

  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB");

  const posts = await Post.find({ categoryId: null });
  console.log(`Found ${posts.length} post(s) without a categoryId`);

  let updated = 0;
  const categoryCache = new Map();

  for (const post of posts) {
    const rawName = (post.category || "").trim() || FALLBACK_CATEGORY_NAME;
    const cacheKey = rawName.toLowerCase();

    let category = categoryCache.get(cacheKey);
    if (!category) {
      category = await findOrCreateCategory(rawName);
      categoryCache.set(cacheKey, category);
    }

    post.categoryId = category._id;
    post.category = category.name; // normalize casing/whitespace drift too
    await post.save();
    updated += 1;
  }

  console.log(`Updated ${updated} post(s) across ${categoryCache.size} categor${categoryCache.size === 1 ? "y" : "ies"}.`);
  await mongoose.disconnect();
}

migrate()
  .then(() => {
    console.log("Migration complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
