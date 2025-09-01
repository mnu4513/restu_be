const express = require("express");
const { getAllUsers, getAllOrders, updateStatus } = require("../controllers/adminController.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

const router = express.Router();


router.get("/users", protect, admin, getAllUsers);  
router.get("/orders", protect, admin, getAllOrders); 
router.put("/:id/status", protect, admin, updateStatus)
router.all('/*', (req, res) => {
  try {
    res.status(404).json({ message: "URL not found! ##########" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
