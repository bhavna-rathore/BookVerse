const mongoose = require("mongoose");

// Adjacency-list model: parentId null = top-level comment, set = a reply.
// Simple writes, no rebalancing — the tree is assembled in memory on read
// (see resolveTree in routes/comments.js), which is the right tradeoff at
// this scale versus a materialized-path/nested-set model built for deep
// trees with heavy read traffic.
const CommentSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    username: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
