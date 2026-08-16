const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//REGISTER
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPass,
    });

    const user = await newUser.save();
    const { password: _pw, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    next(err);
  }
});

//LOGIN
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Wrong username or password" });

    const validated = await bcrypt.compare(password, user.password);
    if (!validated) return res.status(400).json({ error: "Wrong username or password" });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _pw, ...others } = user._doc;
    return res.status(200).json({ ...others, token }); // Send token with user data
  } catch (err) {
    next(err);
  }
});

module.exports = router;

