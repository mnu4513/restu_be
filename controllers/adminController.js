const User = require("../models/User.js");
const Order = require("../models/Order.js");  // ✅ fixed typo

// @desc Get all users with their orders
// @route GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get all orders
// @route GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")                        // ✅ populate user
      .populate("items.menuItem", "name price discount")     // ✅ populate menu item details
      .sort({ createdAt: -1 });  // ✅ newest first

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// @desc Update order status
// @route PUT /api/admin/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    // ✅ Repopulate before sending back
    order = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.menuItem", "name price discount");

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
