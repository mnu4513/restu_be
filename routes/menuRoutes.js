const express = require("express");
const {
  getMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public route → fetch menu
router.get("/", getMenu);

// Admin only → add new item
// router.post("/", protect, admin, addMenuItem);
router.post("/", addMenuItem);

// Admin only → update item
// router.put("/:id", protect, admin, updateMenuItem);
router.put("/:id", updateMenuItem);

// Admin only → delete item
// router.delete("/:id", protect, admin, deleteMenuItem);
router.delete("/:id", deleteMenuItem);

// Unknown API requests
router.all('/*', (req, res) => {
  try {
    res.status(404).json({ message: "URL not found! ##########" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
