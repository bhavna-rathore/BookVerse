const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const verifyToken = require("../middleware/verifyToken"); // Add this line

// CREATE POST (protected)
router.post("/", async (req, res) => {
  const newPost = new Post({ ...req.body });
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE POST (protected)
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.username === req.body.username) {
      try {
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          { $set: req.body },
          { new: true }
        );
        res.status(200).json(updatedPost);
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(401).json("You can update only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE POST (protected)
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.username === req.query.username) {
      try {
        await Post.deleteOne({ _id: req.params.id });
        res.status(200).json("Post has been deleted...");
      } catch (err) {
        res.status(501).json(err);
      }
    } else {
      res.status(401).json("You can delete only your post!");
    }
  } catch (err) {
    res.status(502).json(err);
  }
});

// GET POST (public)
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET ALL POSTS (public)
router.get("/", async (req, res) => {
  try {
    const category = req.query.category || req.query.cat;
    const username = req.query.user;
    const search = req.query.search;
    let filter = {};
    if (username) filter.username = username;
    if (category) filter.category = category; // match by category name
    if (search) filter.$or = [
      { bookTitle: { $regex: search, $options: "i" } },
      { summary: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } }
    ];

    const posts = await Post.find(filter).sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

module.exports = router;