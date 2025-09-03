const User = require("../models/User.js");
const Order = require("../models/Order.js");  
const { sendEmail } = require("../utils/email");
const { emitOrderUpdate } = require("../socket.js");

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

// @desc Get all orders (with search + pagination)
// @route GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";

    const query = {}; // later we can add search here

    if (search) {
      // 👉 Search by Order ID or User ID
      if (/^[0-9a-fA-F]{24}$/.test(search)) {
        // If valid Mongo ObjectId
        query.$or = [
          { _id: search },
          { user: search }
        ];
      } else {
        // Otherwise search by user email or name
        const users = await User.find({
          $or: [
            { email: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } }
          ]
        }).select("_id");
        query.user = { $in: users.map(u => u._id) };
      }
    }

    const total = await Order.countDocuments(query);
    

    // ✅ Populate user + items
    const orders = await Order.find(query)
      .populate("user", "name email")
      .populate("items.menuItem", "name price discount")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);  // ✅ apply limit

    res.json({
      orders,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// @desc Update order status
// @route PUT /api/admin/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    // ✅ Re-populate full details
    order = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.menuItem", "name price discount");

    const userId = order.user._id.toString();
    console.log("🔔 Emitting order update for user:", order.user._id);
    emitOrderUpdate(userId, order); // 👈 force string // 👈 send update


    // ✅ Send email to user only on Delivered / Cancelled
    if (status === "Delivered") {
      await sendEmail(
        order.user.email,
        "🎉 Your Order Has Been Delivered!",
        `
        <h2>Hi ${order.user.name},</h2>
        <p>Your order <strong>${order._id}</strong> has been successfully delivered.</p>
        <p>We hope you enjoy your meal 🍽️</p>
        <p><strong>Total:</strong> ₹${order.totalPrice}</p>
        `
      );
    } else if (status === "Cancelled") {
      await sendEmail(
        order.user.email,
        "❌ Your Order Has Been Cancelled",
        `
        <h2>Hi ${order.user.name},</h2>
        <p>We’re sorry, but your order <strong>${order._id}</strong> has been cancelled.</p>
        <p>If you have any questions, feel free to contact support.</p>
        `
      );
    }

        // ✅ Send email to admin only on Delivered / Cancelled
    if (status === "Delivered") {
      await sendEmail(
        "fkkhem@gmail.com",
        "🎉 Your Order Has Been Delivered!",
        `
        <h2>Hi ${order.user.name},</h2>
        <p>Your order <strong>${order._id}</strong> has been successfully delivered.</p>
        <p>We hope you enjoy your meal 🍽️</p>
        <p><strong>Total:</strong> ₹${order.totalPrice}</p>
        `
      );
    } else if (status === "Cancelled") {
      await sendEmail(
        "fkkhem@gmail.com",
        "lappu.singh@yandex.com",
        "❌ Your Order Has Been Cancelled",
        `
        <h2>Hi ${order.user.name},</h2>
        <p>We’re sorry, but your order <strong>${order._id}</strong> has been cancelled.</p>
        <p>If you have any questions, feel free to contact support.</p>
        `
      );
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

