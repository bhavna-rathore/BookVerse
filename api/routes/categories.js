const router = require("express").Router();
const Category = require("../models/Category");
const verifyToken = require("../middleware/verifyToken");

// GET all categories
router.get("/", async (req, res) => {
  try {
    const cats = await Category.find({}).sort({ name: 1 });
    console.log(cats, "hello categoryies'")
    res.status(200).json(cats);
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// CREATE category (protected)
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    // upsert-like behavior: avoid duplicates
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ error: "Category already exists" });

    const newCat = new Category({ name: name.trim(), description });
    const saved = await newCat.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// DELETE category (protected)
router.delete("/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Category deleted" });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

module.exports = router;