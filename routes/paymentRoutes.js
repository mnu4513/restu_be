const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Menu = require("../models/Menu");
const Address = require("../models/Address");

const { protect } = require("../middleware/authMiddleware");
const { sendEmail } = require("../utils/email");
const {
  userOrderEmail,
  adminOrderEmail
} = require("../utils/emailTemplates");

const { emitOrderUpdate } = require("../socket");

const router = express.Router();


// ================= RAZORPAY INSTANCE =================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// =====================================================
// ✅ CREATE RAZORPAY ORDER
// =====================================================
router.post("/create-order", protect, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    res.json(order);

  } catch (err) {
    console.error("Create Razorpay Order Error:", err);
    res.status(500).json({
      success: false,
      message: "Error creating Razorpay order",
    });
  }
});


// =====================================================
// ✅ VERIFY PAYMENT + CREATE ORDER + SEND EMAIL
// =====================================================
router.post("/verify", protect, async (req, res) => {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    items,
    addressId
  } = req.body;


  // ================= VERIFY SIGNATURE =================
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment signature",
    });
  }


  try {

    // ================= CALCULATE TOTAL =================
    let totalPrice = 0;

    for (let i of items) {
      const menuItem = await Menu.findById(i._id || i.menuItem);

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item not found: ${i._id || i.menuItem}`,
        });
      }

      totalPrice +=
        (menuItem.price - (menuItem.price * (menuItem.discount || 0)) / 100)
        * i.quantity;
    }


    // ================= VALIDATE ADDRESS =================
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid addressId format",
      });
    }

    const address = await Address.findOne({
      _id: new mongoose.Types.ObjectId(addressId),
      user: req.user._id,
    });

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address not found",
      });
    }


    // ================= SAVE ORDER =================
    const order = new Order({
      user: req.user._id,
      items: items.map(i => ({
        menuItem: i._id || i.menuItem,
        quantity: i.quantity,
      })),
      totalPrice,
      status: "Pending",
      deliveryAddress: {
        label: address.label,
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        location: address.location,
      },
      paymentInfo: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: "Paid",
      },
    });

    await order.save();


    // ================= POPULATE ORDER =================
    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.menuItem", "name price discount thumbnail"); // ⭐ added thumbnail


    // ================= SOCKET EMIT =================
    emitOrderUpdate(order.user._id.toString(), populatedOrder);


    // =====================================================
    // ⭐ BUILD ITEMS HTML WITH THUMBNAIL
    // =====================================================
    const itemsHtml = populatedOrder.items.map(item => {

      const product = item.menuItem;

      const finalPrice =
        product.price - (product.price * (product.discount || 0)) / 100;

      return `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #eee;">
          <img 
            src="${product.thumbnail}" 
            alt="${product.name}" 
            width="60"
            height="60"
            style="border-radius:8px; object-fit:cover;"
          />
        </td>

        <td style="padding:10px; border-bottom:1px solid #eee;">
          ${product.name}
        </td>

        <td style="padding:10px; border-bottom:1px solid #eee; text-align:center;">
          ${item.quantity}
        </td>

        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">
          ₹${finalPrice}
        </td>
      </tr>
      `;
    }).join("");


    // ================= SEND USER EMAIL =================
    await sendEmail(
      req.user.email,
      `Order Confirmed - ${process.env.APP_NAME}`,
      userOrderEmail(populatedOrder, req.user, itemsHtml)
    );


    // ================= SEND ADMIN EMAIL =================
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `New Order Received - ${order._id}`,
      adminOrderEmail(populatedOrder, req.user, itemsHtml)
    );


    res.json({
      success: true,
      order: populatedOrder,
    });

  } catch (err) {
    console.error("Verify Payment Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
