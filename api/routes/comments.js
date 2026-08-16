const router = require("express").Router();
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const verifyToken = require("../middleware/verifyToken");

// Assembles a flat list of comments (one query) into a nested tree, keyed by
// parentId. O(n) in memory, avoids an N+1 query per level.
function buildTree(comments) {
  const byId = new Map();
  const roots = [];

  for (const c of comments) {
    byId.set(String(c._id), { ...c.toObject(), replies: [] });
  }
  for (const c of comments) {
    const node = byId.get(String(c._id));
    if (c.parentId && byId.has(String(c.parentId))) {
      byId.get(String(c.parentId)).replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// Collects a comment's id plus every descendant id (BFS over parentId), so a
// delete can cascade to the whole subtree in one deleteMany call.
async function collectSubtreeIds(rootId) {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const children = await Comment.find({ parentId: { $in: frontier } }, { _id: 1 });
    frontier = children.map((c) => c._id);
    ids.push(...frontier);
  }
  return ids;
}

// CREATE comment (protected)
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { postId, text, parentId } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }
    const post = await Post.findById(postId).catch(() => null);
    if (!post) return res.status(400).json({ error: "postId does not refer to a real post" });

    if (parentId) {
      const parent = await Comment.findById(parentId).catch(() => null);
      if (!parent || String(parent.postId) !== String(postId)) {
        return res.status(400).json({ error: "parentId does not refer to a comment on this post" });
      }
    }

    const comment = await Comment.create({
      postId,
      parentId: parentId || null,
      text: text.trim(),
      username: req.user.username,
    });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// LIST comments for a post, as a nested tree (public)
router.get("/", async (req, res, next) => {
  try {
    const { postId } = req.query;
    if (!postId) return res.status(400).json({ error: "postId query param is required" });

    const comments = await Comment.find({ postId }).sort({ createdAt: 1 });
    res.status(200).json(buildTree(comments));
  } catch (err) {
    next(err);
  }
});

// DELETE comment (protected, owner or admin) — cascades to replies
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const isOwner = comment.username === req.user.username;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You can delete only your own comment" });
    }

    const idsToDelete = await collectSubtreeIds(comment._id);
    await Comment.deleteMany({ _id: { $in: idsToDelete } });
    res.status(200).json({ message: "Comment deleted", deletedCount: idsToDelete.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
