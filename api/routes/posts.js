const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const Category = require("../models/Category");
const verifyToken = require("../middleware/verifyToken");

// Sort applied by the database, before skip/limit — sorting an already-
// paginated page client-side (the previous approach) only reorders whatever
// happened to land on that page, not the full result set.
const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  rating: { rating: -1, createdAt: -1 }, // createdAt as a stable tiebreaker
};

// Fields a client is allowed to set — never trust the whole body (e.g. likes, views, isFeatured).
// Category is deliberately not in this list: it needs to be resolved against
// a real Category document, not passed through as free text (see resolveCategory).
const WRITABLE_POST_FIELDS = [
  "bookTitle", "author", "rating", "summary",
  "keyTakeaways", "keyLearnings", "whoShouldRead", "bookCover", "myTakeaway", "tags",
];

function pickWritableFields(body) {
  const picked = {};
  for (const key of WRITABLE_POST_FIELDS) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
}

// Resolves a client-supplied categoryId into { categoryId, category } —
// category is a denormalized copy of the Category's name for cheap reads.
// An invalid/missing id just means "no category," not an error.
async function resolveCategory(categoryId) {
  if (!categoryId) return { categoryId: null, category: "" };
  const cat = await Category.findById(categoryId).catch(() => null);
  if (!cat) return { categoryId: null, category: "" };
  return { categoryId: cat._id, category: cat.name };
}

// CREATE POST (protected)
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const fields = pickWritableFields(req.body);
    if (!fields.bookTitle || !fields.bookCover) {
      return res.status(400).json({ error: "bookTitle and bookCover are required" });
    }
    const categoryFields = await resolveCategory(req.body.categoryId);
    const newPost = new Post({ ...fields, ...categoryFields, username: req.user.username });
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
    if (Object.prototype.hasOwnProperty.call(req.body, "categoryId")) {
      Object.assign(fields, await resolveCategory(req.body.categoryId));
    }
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

// DELETE POST (protected, owner or admin — admins moderate by removing, not editing)
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const isOwner = post.username === req.user.username;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
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
    const categoryName = req.query.category || req.query.cat;
    const categoryIdParam = req.query.categoryId;
    const username = req.query.user;
    const search = req.query.search;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const sort = SORT_OPTIONS[req.query.sort] || SORT_OPTIONS.newest;

    let filter = {};
    if (username) filter.username = username;
    if (categoryIdParam) {
      filter.categoryId = categoryIdParam;
    } else if (categoryName) {
      // Case-insensitive match against the real Category collection — a
      // plain string filter would silently miss "Fiction" vs "fiction".
      const cat = await Category.findOne({ name: new RegExp(`^${categoryName}$`, "i") });
      if (!cat) return res.status(200).json([]); // unknown category name, not "all posts"
      filter.categoryId = cat._id;
    }
    // $text uses the index on bookTitle/summary/author (see models/Post.js) —
    // scales with a search-term lookup instead of a full collection scan.
    // Note this matches whole words, not arbitrary substrings, which is a
    // real (and worth knowing) behavior difference from the $regex this replaced.
    if (search) filter.$text = { $search: search };

    const posts = await Post.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
});

module.exports = router;