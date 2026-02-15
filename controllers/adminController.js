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
    res.status(500).json({ success: false, message: err.message });
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
    res.status(500).json({ success: false,  message: err.message });
  }
};



// @desc Update order status
// @route PUT /api/admin/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    let order = await Order.findById(req.params.id)
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;
    await order.save();

    // ===== FULL POPULATION =====
    order = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.menuItem", "name price discount thumbnail");

    // ===== SOCKET UPDATE =====
    emitOrderUpdate(order.user._id.toString(), order);

    // ===== BUILD ITEMS HTML =====
    const itemsHtml = order.items.map(item => {
      const product = item.menuItem;
      const finalPrice =
        product.price - (product.price * (product.discount || 0)) / 100;

      return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">
          <img src="${product.thumbnail}" width="60" height="60"
          style="border-radius:8px;object-fit:cover;" />
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;">
          ${product.name}
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">
          ${item.quantity}
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">
          ₹${finalPrice}
        </td>
      </tr>
      `;
    }).join("");

    const {
      userOrderStatusEmail,
      adminOrderStatusEmail
    } = require("../utils/emailTemplates");

    // ===== SEND USER EMAIL =====
    await sendEmail({
      to: order.user.email,
      subject: `Order ${order.status} - ${process.env.APP_NAME}`,
      html: userOrderStatusEmail(order, order.user, itemsHtml)
    });

    // ===== SEND ADMIN EMAIL =====
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `Order ${order.status} - ${order._id}`,
      html: adminOrderStatusEmail(order, order.user, itemsHtml)
    });

    res.json({ success: true, order });

  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



