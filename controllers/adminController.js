const User = require("../models/User.js");
const Order = require("../models/Order.js");
const { sendEmail } = require("../utils/email");
const { emitOrderUpdate } = require("../socket.js");


// ======================================================
// GET ALL USERS
// GET /api/admin/users
// ======================================================

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password");

    res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ======================================================
// GET ALL ORDERS
// GET /api/admin/orders
// ======================================================

exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";

    const query = {};

    // ==========================================
    // SEARCH
    // ==========================================

    if (search) {
      // Search by Order ID or User ID
      if (/^[0-9a-fA-F]{24}$/.test(search)) {
        query.$or = [
          {
            _id: search,
          },
          {
            user: search,
          },
        ];
      } else {
        // Search by user email or name
        const users = await User.find({
          $or: [
            {
              email: {
                $regex: search,
                $options: "i",
              },
            },
            {
              name: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        }).select("_id");

        query.user = {
          $in: users.map((user) => user._id),
        };
      }
    }

    // ==========================================
    // PAGINATION
    // ==========================================

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate(
        "user",
        "name email"
      )
      .populate(
        "items.menuItem",
        "name price discount thumbnail"
      )
      .populate(
        "deliveryPerson",
        "name email phone"
      )
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      orders,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error("getAllOrders error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ======================================================
// UPDATE ORDER STATUS
// PUT /api/admin/:id/status
// ======================================================

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // ==========================================
    // VALIDATE STATUS
    // ==========================================

    const allowedStatuses = [
      "Pending",
      "Accepted",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    let order = await Order.findById(req.params.id)
      .populate(
        "user",
        "name email"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    order.status = status;

    await order.save();

    // ==========================================
    // FULL POPULATION
    // ==========================================

    order = await Order.findById(order._id)
      .populate(
        "user",
        "name email"
      )
      .populate(
        "items.menuItem",
        "name price discount thumbnail"
      )
      .populate(
        "deliveryPerson",
        "name email phone"
      );

    // ==========================================
    // SOCKET UPDATE
    // ==========================================

    emitOrderUpdate(
      order.user._id.toString(),
      order
    );

    // ==========================================
    // BUILD ITEMS HTML
    // ==========================================

    const itemsHtml = order.items
      .map((item) => {
        const product = item.menuItem;

        const finalPrice =
          product.price -
          (product.price *
            (product.discount || 0)) /
            100;

        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;">
              <img
                src="${product.thumbnail}"
                width="60"
                height="60"
                style="border-radius:8px;object-fit:cover;"
              />
            </td>

            <td style="padding:10px;border-bottom:1px solid #eee;">
              ${product.name}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #eee;
                text-align:center;
              "
            >
              ${item.quantity}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #eee;
                text-align:right;
              "
            >
              ₹${finalPrice}
            </td>
          </tr>
        `;
      })
      .join("");

    // ==========================================
    // EMAIL TEMPLATES
    // ==========================================

    const {
      userOrderStatusEmail,
      adminOrderStatusEmail,
    } = require("../utils/emailTemplates");

    // ==========================================
    // USER EMAIL
    // ==========================================

    await sendEmail({
      to: order.user.email,

      subject: `Order ${order.status} - ${process.env.APP_NAME}`,

      html: userOrderStatusEmail(
        order,
        order.user,
        itemsHtml
      ),
    });

    // ==========================================
    // ADMIN EMAIL
    // ==========================================

    await sendEmail({
      to: process.env.ADMIN_EMAIL,

      subject: `Order ${order.status} - ${order._id}`,

      html: adminOrderStatusEmail(
        order,
        order.user,
        itemsHtml
      ),
    });

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error(
      "updateStatus error:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ======================================================
// ASSIGN DELIVERY PERSON
// PUT /api/admin/orders/:id/assign-delivery
// ======================================================

exports.assignDeliveryPerson = async (req, res) => {
  try {
    const { deliveryPersonId } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!deliveryPersonId) {
      return res.status(400).json({
        success: false,
        message: "Delivery person ID is required",
      });
    }

    // ==========================================
    // FIND DELIVERY USER
    // ==========================================

    const deliveryPerson = await User.findById(
      deliveryPersonId
    ).select("-password");

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Delivery person not found",
      });
    }

    // ==========================================
    // VERIFY ROLE
    // ==========================================

    if (deliveryPerson.role !== "delivery") {
      return res.status(400).json({
        success: false,
        message:
          "Selected user is not a delivery person",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ==========================================
    // CHECK ORDER STATUS
    // ==========================================

    if (
      order.status === "Delivered" ||
      order.status === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot assign delivery person to a completed or cancelled order",
      });
    }

    // ==========================================
    // ASSIGN DELIVERY PERSON
    // ==========================================

    order.deliveryPerson =
      deliveryPerson._id;

    order.deliveryStatus = "Assigned";

    order.deliveryAssignedAt =
      new Date();

    // Reset delivery timestamps when reassigning
    order.deliveryAcceptedAt = null;
    order.deliveryRejectedAt = null;
    order.deliveryPickedUpAt = null;
    order.deliveryDeliveredAt = null;

    await order.save();

    // ==========================================
    // FULL POPULATION
    // ==========================================

    const populatedOrder =
      await Order.findById(order._id)
        .populate(
          "user",
          "name email"
        )
        .populate(
          "items.menuItem",
          "name price discount thumbnail"
        )
        .populate(
          "deliveryPerson",
          "name email phone"
        );

    // ==========================================
    // CUSTOMER SOCKET UPDATE
    // ==========================================

    if (populatedOrder.user) {
      emitOrderUpdate(
        populatedOrder.user._id.toString(),
        populatedOrder
      );
    }

    // ==========================================
    // DELIVERY PERSON SOCKET UPDATE
    // ==========================================

    emitOrderUpdate(
      deliveryPerson._id.toString(),
      populatedOrder
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message:
        "Delivery person assigned successfully",
      order: populatedOrder,
    });
  } catch (err) {
    console.error(
      "assignDeliveryPerson error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};