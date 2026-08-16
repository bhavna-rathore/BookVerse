const router = require("express").Router();
const Contact = require("../models/Contact");
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// CREATE a contact submission (public)
router.post("/", async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const saved = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

// LIST submissions, newest first (admin-only — this is a private inbox, not public content)
router.get("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const messages = await Contact.find({}).sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
