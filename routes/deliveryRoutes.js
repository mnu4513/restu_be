const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const deliveryAuth = require("../middleware/deliveryAuth");

const {
  getDeliveryDashboard,
  getMyDeliveries,
  getDeliveryOrder,
  acceptDelivery,
  rejectDelivery,
  updateDeliveryStatus,
} = require("../controllers/deliveryController");


// ======================================================
// DELIVERY ROUTES
// ======================================================

// Dashboard
// GET /api/delivery/dashboard
router.get(
  "/dashboard",
  protect,
  deliveryAuth,
  getDeliveryDashboard
);


// My deliveries
// GET /api/delivery/orders
router.get(
  "/orders",
  protect,
  deliveryAuth,
  getMyDeliveries
);


// Delivery order details
// GET /api/delivery/orders/:id
router.get(
  "/orders/:id",
  protect,
  deliveryAuth,
  getDeliveryOrder
);


// Accept delivery
// PUT /api/delivery/orders/:id/accept
router.put(
  "/orders/:id/accept",
  protect,
  deliveryAuth,
  acceptDelivery
);


// Reject delivery
// PUT /api/delivery/orders/:id/reject
router.put(
  "/orders/:id/reject",
  protect,
  deliveryAuth,
  rejectDelivery
);


// Update delivery status
// PUT /api/delivery/orders/:id/status
router.put(
  "/orders/:id/status",
  protect,
  deliveryAuth,
  updateDeliveryStatus
);


// ======================================================
// 404
// ======================================================

router.all("/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Delivery URL not found!",
  });
});


module.exports = router;