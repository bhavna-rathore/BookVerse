const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    bookTitle: { type: String, required: true },
    author: { type: String, default: "Unknown" },
    category: { type: String },            
    categories: [{ name: String }],        
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

module.exports = mongoose.model("Post", PostSchema);