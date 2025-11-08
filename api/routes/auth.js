const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//REGISTER
router.post("/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPass,
    });

    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    console.log(err)
    res.status(500).json(err);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    console.log(req, "login")
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json("Wrong user!");

    const validated = await bcrypt.compare(req.body.password, user.password);
    if (!validated) return res.status(400).json("Wrong password!");

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "yoursecretkey", // Use env variable in production
      { expiresIn: "1d" }
    );

    const { password, ...others } = user._doc;
    return res.status(200).json({ ...others, token }); // Send token with user data
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;

