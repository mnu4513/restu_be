const Order = require("../models/Order");
const Menu = require("../models/Menu");
const Address = require("../models/Address");
const { emitOrderUpdate } = require("../socket");

// ======================================================
// PLACE ORDER
// POST /api/orders
// ======================================================

exports.placeOrder = async (req, res) => {
  try {
    const { items, addressId } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // ===============================
    // ADDRESS
    // ===============================

    const address = await Address.findOne({
      _id: addressId,
      user: req.user._id,
    });

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Invalid address",
      });
    }

    // ===============================
    // FETCH MENU ITEMS
    // ===============================

    const menuItems = await Promise.all(
      items.map((item) => Menu.findById(item.menuItem))
    );

    let totalPrice = 0;

    for (let i = 0; i < items.length; i++) {
      const orderItem = items[i];
      const menuItem = menuItems[i];

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item not found: ${orderItem.menuItem}`,
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is currently unavailable`,
        });
      }

      if (
        !Number.isInteger(orderItem.quantity) ||
        orderItem.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      totalPrice += menuItem.finalPrice * orderItem.quantity;
    }

    // ===============================
    // CREATE ORDER
    // ===============================

    const order = new Order({
      user: req.user._id,

      items: items.map((item) => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
      })),

      totalPrice,

      status: "Pending",

      // Delivery defaults
      deliveryPerson: null,
      deliveryStatus: "Unassigned",

      deliveryAddress: {
        label: address.label,
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        location: address.location,
      },
    });

    await order.save();

    emitOrderUpdate(order.user.toString(), order);

    return res.status(201).json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Place order error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// CANCEL ORDER
// PUT /api/orders/:id/cancel
// ======================================================

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ===============================
    // OWNER CHECK
    // ===============================

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not your order",
      });
    }

    // ===============================
    // ONLY PENDING ORDERS
    // ===============================

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }

    if (order.deliveryStatus !== "Unassigned") {
      return res.status(400).json({
        success: false,
        message: "Order is already assigned for delivery",
      });
    }

    // ===============================
    // 2 MINUTE RULE
    // ===============================

    const diff =
      (Date.now() - new Date(order.createdAt).getTime()) /
      1000 /
      60;

    if (diff > 2) {
      return res.status(400).json({
        success: false,
        message: "Cancel time expired (2 minutes passed)",
      });
    }

    order.status = "Cancelled";

    await order.save();

    emitOrderUpdate(order.user.toString(), order);

    return res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Cancel order error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// GET USER ORDERS
// GET /api/orders/my
// ======================================================

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    })
      .populate("items.menuItem")
      .populate("deliveryPerson", "name phone")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });
  } catch (err) {
    console.error("Get user orders error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};