const router = require("express").Router();
const Category = require("../models/Category");
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");

// GET all categories (public)
router.get("/", async (req, res, next) => {
  try {
    const cats = await Category.find({}).sort({ name: 1 });
    res.status(200).json(cats);
  } catch (err) {
    next(err);
  }
});

// CREATE category (protected — any logged-in user)
// Deliberately not admin-gated: creating a tag is low-risk and additive
// (mirrors Write.jsx's inline "+ Add new category"), unlike deletion below,
// which can orphan existing posts and is a real moderation action.
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    // upsert-like behavior: avoid duplicates (case-insensitive)
    const existing = await Category.findOne({ name: new RegExp(`^${name.trim()}$`, "i") });
    if (existing) return res.status(409).json({ error: "Category already exists" });

    const newCat = new Category({ name: name.trim(), description });
    const saved = await newCat.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

// DELETE category (admin-only — destructive, can orphan posts referencing it)
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Category not found" });
    res.status(200).json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;