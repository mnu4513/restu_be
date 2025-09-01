const express = require("express");
const {
  placeOrder,
  cancelOrder,
  getUserOrders,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


router.post("/", protect, placeOrder); 
router.put("/:id/cancel", protect, cancelOrder); 
router.get("/my", protect, getUserOrders); 
router.all('/*', (req, res) => {
  try {
    res.status(404).json({ message: "URL not found! ##########" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
