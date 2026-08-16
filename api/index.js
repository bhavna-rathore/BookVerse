const app = require("./app");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const Category = require("./models/Category");

mongoose
  .connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("Connected to MongoDB");

    //seed categories when SEED_CATEGORIES=true in .env
    if (process.env.SEED_CATEGORIES === "true") {
      try {
        const catFile = path.join(__dirname, "sampleData", "categories.json");
        if (!fs.existsSync(catFile)) {
          console.warn("categories.json not found, skipping category seed");
        } else {
          const raw = fs.readFileSync(catFile, "utf8");
          const docs = JSON.parse(raw);
          if (!Array.isArray(docs)) {
            console.warn("categories.json must be an array, skipping category seed");
          } else {
            await Category.deleteMany({});
            const inserted = await Category.insertMany(docs);
            console.log(`Seeded ${inserted.length} categories`);
          }
        }
      } catch (seedErr) {
        console.error("Category seed error:", seedErr);
      }
    }
  })
  .catch((err) => console.log("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
