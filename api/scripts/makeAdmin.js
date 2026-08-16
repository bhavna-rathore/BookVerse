// Grants admin role to an existing user. There is no self-service admin
// signup by design — this script is the only way to create one.
//
// Usage: node scripts/makeAdmin.js <username>

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const User = require("../models/User");

async function makeAdmin(username) {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is required — set it in api/.env before running this script");
  }
  if (!username) {
    throw new Error("Usage: node scripts/makeAdmin.js <username>");
  }

  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB");

  const user = await User.findOneAndUpdate(
    { username },
    { $set: { role: "admin" } },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with username "${username}"`);
  } else {
    console.log(`"${user.username}" is now an admin.`);
  }

  await mongoose.disconnect();
}

const username = process.argv[2];

makeAdmin(username)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed:", err.message);
    process.exit(1);
  });
