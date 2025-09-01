const express = require("express");
const { registerUser, loginUser, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);  
router.all('/*', (req, res) => {
  try {
    res.status(404).json({ message: "URL not found! ##########" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;   // ✅ must be exactly this
