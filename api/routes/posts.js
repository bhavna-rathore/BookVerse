const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const verifyToken = require("../middleware/verifyToken");

// Fields a client is allowed to set — never trust the whole body (e.g. likes, views, isFeatured).
const WRITABLE_POST_FIELDS = [
  "bookTitle", "author", "category", "categories", "rating", "summary",
  "keyTakeaways", "keyLearnings", "whoShouldRead", "bookCover", "myTakeaway", "tags",
];

function pickWritableFields(body) {
  const picked = {};
  for (const key of WRITABLE_POST_FIELDS) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
}

// CREATE POST (protected)
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const fields = pickWritableFields(req.body);
    if (!fields.bookTitle || !fields.bookCover) {
      return res.status(400).json({ error: "bookTitle and bookCover are required" });
    }
    const newPost = new Post({ ...fields, username: req.user.username });
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    next(err);
  }
});

// UPDATE POST (protected, owner-only)
router.put("/:id", verifyToken, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.username !== req.user.username) {
      return res.status(403).json({ error: "You can update only your post!" });
    }
    const fields = pickWritableFields(req.body);
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: fields },
      { new: true }
    );
    res.status(200).json(updatedPost);
  } catch (err) {
    next(err);
  }
});

// DELETE POST (protected, owner-only)
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.username !== req.user.username) {
      return res.status(403).json({ error: "You can delete only your post!" });
    }
    await Post.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Post has been deleted..." });
  } catch (err) {
    next(err);
  }
});

// GET POST (public)
router.get("/:id", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
});

// GET ALL POSTS (public, paginated)
router.get("/", async (req, res, next) => {
  try {
    const category = req.query.category || req.query.cat;
    const username = req.query.user;
    const search = req.query.search;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    let filter = {};
    if (username) filter.username = username;
    if (category) filter.category = category; // match by category name
    if (search) filter.$or = [
      { bookTitle: { $regex: search, $options: "i" } },
      { summary: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } }
    ];

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
});

module.exports = router;