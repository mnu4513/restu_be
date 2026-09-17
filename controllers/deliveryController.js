const mongoose = require("mongoose");
const Order = require("../models/Order");

// ======================================================
// GET DELIVERY DASHBOARD
// GET /api/delivery/dashboard
// ======================================================

const getDeliveryDashboard = async (req, res) => {
  try {
    const deliveryPersonId = req.user._id;

    // ==========================================
    // TODAY DATE RANGE
    // ==========================================

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // ==========================================
    // GET ALL ASSIGNED ORDERS
    // ==========================================

    const orders = await Order.find({
      deliveryPerson: deliveryPersonId,
    })
      .populate("user", "name email phone")
      .populate(
        "items.menuItem",
        "name price discount finalPrice thumbnail"
      )
      .sort({ createdAt: -1 })
      .lean();

    // ==========================================
    // TODAY'S ORDERS
    // ==========================================

    const todayOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);

      return (
        createdAt >= startOfDay &&
        createdAt <= endOfDay
      );
    });

    // ==========================================
    // DELIVERY STATUS COUNTS
    // ==========================================

    const assignedOrders = orders.filter(
      (order) =>
        order.deliveryStatus === "Assigned"
    );

    const acceptedOrders = orders.filter(
      (order) =>
        order.deliveryStatus === "Accepted"
    );

    const rejectedOrders = orders.filter(
      (order) =>
        order.deliveryStatus === "Rejected"
    );

    const pickedUpOrders = orders.filter(
      (order) =>
        order.deliveryStatus === "Picked Up"
    );

    const outForDeliveryOrders = orders.filter(
      (order) =>
        order.deliveryStatus === "Out for Delivery"
    );

    const deliveredToday = todayOrders.filter(
      (order) =>
        order.deliveryStatus === "Delivered"
    );

    // ==========================================
    // ACTIVE DELIVERY
    // ==========================================

    const activeDelivery =
      outForDeliveryOrders[0] ||
      pickedUpOrders[0] ||
      acceptedOrders[0] ||
      assignedOrders[0] ||
      null;

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      deliveryPerson: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },

      stats: {
        assigned: assignedOrders.length,
        accepted: acceptedOrders.length,
        pickedUp: pickedUpOrders.length,
        outForDelivery:
          outForDeliveryOrders.length,
        delivered: deliveredToday.length,
        rejected: rejectedOrders.length,
      },

      activeDelivery,

      todayOrders,
    });
  } catch (error) {
    console.error(
      "Get delivery dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load delivery dashboard",
    });
  }
};


// ======================================================
// GET MY DELIVERIES
// GET /api/delivery/orders
// ======================================================

const getMyDeliveries = async (req, res) => {
  try {
    const deliveryPersonId = req.user._id;

    const orders = await Order.find({
      deliveryPerson: deliveryPersonId,
    })
      .populate("user", "name email phone")
      .populate(
        "items.menuItem",
        "name price discount finalPrice thumbnail"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Get delivery orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load deliveries",
    });
  }
};


// ======================================================
// GET DELIVERY ORDER
// GET /api/delivery/orders/:id
// ======================================================

const getDeliveryOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE OBJECT ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const deliveryPersonId = req.user._id;

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findOne({
      _id: id,
      deliveryPerson: deliveryPersonId,
    })
      .populate(
        "user",
        "name email phone"
      )
      .populate(
        "items.menuItem",
        "name price discount finalPrice thumbnail"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found or not assigned to you",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get delivery order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load order",
    });
  }
};


// ======================================================
// ACCEPT DELIVERY
// PUT /api/delivery/orders/:id/accept
// ======================================================

const acceptDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const deliveryPersonId = req.user._id;

    const order = await Order.findOne({
      _id: id,
      deliveryPerson: deliveryPersonId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found or not assigned to you",
      });
    }

    // ==========================================
    // STATUS CHECK
    // ==========================================

    if (order.deliveryStatus !== "Assigned") {
      return res.status(400).json({
        success: false,
        message:
          `Cannot accept delivery when status is '${order.deliveryStatus}'`,
      });
    }

    // ==========================================
    // ACCEPT DELIVERY
    // ==========================================

    order.deliveryStatus = "Accepted";
    order.deliveryAcceptedAt = new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Delivery accepted successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Accept delivery error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to accept delivery",
    });
  }
};


// ======================================================
// REJECT DELIVERY
// PUT /api/delivery/orders/:id/reject
// ======================================================

const rejectDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const deliveryPersonId = req.user._id;

    const order = await Order.findOne({
      _id: id,
      deliveryPerson: deliveryPersonId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found or not assigned to you",
      });
    }

    // ==========================================
    // STATUS CHECK
    // ==========================================

    if (order.deliveryStatus !== "Assigned") {
      return res.status(400).json({
        success: false,
        message:
          `Cannot reject delivery when status is '${order.deliveryStatus}'`,
      });
    }

    // ==========================================
    // REJECT DELIVERY
    // ==========================================

    order.deliveryStatus = "Rejected";
    order.deliveryRejectedAt = new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Delivery rejected successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Reject delivery error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject delivery",
    });
  }
};


// ======================================================
// UPDATE DELIVERY STATUS
// PUT /api/delivery/orders/:id/status
// ======================================================

const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const deliveryPersonId = req.user._id;

    // ==========================================
    // VALIDATE ORDER ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ==========================================
    // ALLOWED STATUS
    // ==========================================

    const allowedStatuses = [
      "Picked Up",
      "Out for Delivery",
      "Delivered",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid delivery status",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findOne({
      _id: id,
      deliveryPerson: deliveryPersonId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found or not assigned to you",
      });
    }

    // ==========================================
    // VALID STATUS TRANSITIONS
    // ==========================================

    const validTransitions = {
      Assigned: ["Accepted"],

      Accepted: ["Picked Up"],

      "Picked Up": [
        "Out for Delivery",
      ],

      "Out for Delivery": [
        "Delivered",
      ],

      Delivered: [],

      Rejected: [],
    };

    const nextStatuses =
      validTransitions[
        order.deliveryStatus
      ] || [];

    /*
     * This endpoint handles:
     *
     * Accepted → Picked Up
     * Picked Up → Out for Delivery
     * Out for Delivery → Delivered
     */

    if (!nextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          `Cannot change delivery status from '${order.deliveryStatus}' to '${status}'`,
      });
    }

    // ==========================================
    // UPDATE DELIVERY STATUS
    // ==========================================

    order.deliveryStatus = status;

    // ==========================================
    // TIMESTAMPS
    // ==========================================

    if (status === "Picked Up") {
      order.deliveryPickedUpAt =
        new Date();
    }

    if (
      status === "Out for Delivery"
    ) {
      /*
       * Your current Order model
       * does not have an
       * outForDeliveryAt field.
       *
       * So we don't save a timestamp here.
       */
    }

    if (status === "Delivered") {
      order.deliveryDeliveredAt =
        new Date();

      /*
       * Overall order is now delivered.
       */
      order.status = "Delivered";
    }

    await order.save();

    // ==========================================
    // POPULATE ORDER
    // ==========================================

    const populatedOrder =
      await Order.findById(order._id)
        .populate(
          "user",
          "name email phone"
        )
        .populate(
          "items.menuItem",
          "name price discount finalPrice thumbnail"
        )
        .populate(
          "deliveryPerson",
          "name email phone"
        );

    return res.status(200).json({
      success: true,
      message:
        "Delivery status updated successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error(
      "Update delivery status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update delivery status",
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  getDeliveryDashboard,
  getMyDeliveries,
  getDeliveryOrder,
  acceptDelivery,
  rejectDelivery,
  updateDeliveryStatus,
};