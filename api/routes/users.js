const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcrypt");
const verifyToken = require("../middleware/verifyToken");

//UPDATE (owner-only)
router.put("/:id", verifyToken, async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: "You can update only your account!" });
  }
  try {
    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.profilePic) updates.profilePic = req.body.profilePic;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(req.body.password, salt);
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    const { password, ...others } = updatedUser._doc;
    res.status(200).json(others);
  } catch (err) {
    next(err);
  }
});

//DELETE (owner-only)
router.delete("/:id", verifyToken, async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: "You can delete only your account!" });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found!" });
    await Post.deleteMany({ username: user.username });
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User has been deleted..." });
  } catch (err) {
    next(err);
  }
});

//GET USER (public profile — no email, no password)
router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found!" });
    const { username, profilePic, createdAt, _id } = user._doc;
    res.status(200).json({ _id, username, profilePic, createdAt });
  } catch (err) {
    next(err);
  }
});


module.exports = router;