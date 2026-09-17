const express = require("express");

const {
  placeOrder,
  cancelOrder,
  getUserOrders,
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ===============================
// CUSTOMER ORDER ROUTES
// ===============================

// Place new order
router.post("/", protect, placeOrder);

// Cancel own order
router.put("/:id/cancel", protect, cancelOrder);

// Get logged-in user's orders
router.get("/my", protect, getUserOrders);

// 404 fallback
router.all("/*", (req, res) => {
  try {
    res.status(404).json({
      success: false,
      message: "URL not found!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;