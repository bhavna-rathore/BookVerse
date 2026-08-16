const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    bookTitle: { type: String, required: true },
    author: { type: String, default: "Unknown" },
    // categoryId is the source of truth (a real reference into the Category
    // collection). category is a denormalized copy of that Category's name,
    // kept in sync on write, so list views can render a category label
    // without a populate() on every request.
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    category: { type: String, default: "" },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    summary: { type: String },
    keyTakeaways: { type: [String], default: [] }, 
    keyLearnings: { type: [String], default: [] },
    whoShouldRead: { type: String },
    bookCover: { type: String,required: true },
    myTakeaway: { type: String },
    tags: { type: [String], default: [] },
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Backs the `search` filter in GET /api/posts. A $text query against this
// index scales; the $regex scan it replaced does a full collection scan on
// every search and gets slower linearly with the number of posts.
PostSchema.index({ bookTitle: "text", summary: "text", author: "text" });

module.exports = mongoose.model("Post", PostSchema);