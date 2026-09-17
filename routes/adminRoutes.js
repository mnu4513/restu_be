const express = require("express");

const {
  getAllUsers,
  getAllOrders,
  updateStatus,
  assignDeliveryPerson,
} = require("../controllers/adminController.js");

const {
  protect,
  admin,
} = require("../middleware/authMiddleware.js");

const router = express.Router();


// ==========================================
// USERS
// ==========================================

router.get(
  "/users",
  protect,
  admin,
  getAllUsers
);


// ==========================================
// ORDERS
// ==========================================

// Get all orders
router.get(
  "/orders",
  protect,
  admin,
  getAllOrders
);


// Update normal order status
router.put(
  "/:id/status",
  protect,
  admin,
  updateStatus
);


// ==========================================
// DELIVERY
// ==========================================

// Assign delivery person to an order
router.put(
  "/orders/:id/assign-delivery",
  protect,
  admin,
  assignDeliveryPerson
);


// ==========================================
// 404
// ==========================================

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