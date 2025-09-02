const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Menu = require("../models/Menu");
const { protect } = require("../middleware/authMiddleware");
const Address = require("../models/Address");
const mongoose = require("mongoose");
const { sendEmail } = require("../utils/email");
const { emitOrderUpdate } = require("../socket");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Razorpay order
router.post("/create-order", protect, async (req, res) => {
  const { amount } = req.body;
  try {
    const options = {
      amount,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };
    const order = await razorpay.orders.create(options);
    console.log("DEBUG - Order model:", Order);
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Error creating Razorpay order" });
  }
});

// Verify Razorpay order
router.post("/verify", protect, async (req, res) => {
  
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, addressId } = req.body;

  // 🔐 Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid payment signature" });
  }

  try {
    // ✅ Calculate total from DB
    let totalPrice = 0;
    for (let i of items) {
      const menuItem = await Menu.findById(i._id || i.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item not found: ${i._id || i.menuItem}` });
      }
      totalPrice +=
        (menuItem.price - (menuItem.price * (menuItem.discount || 0)) / 100) *
        i.quantity;
    }

    // ✅ Fetch address snapshot
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: "Invalid addressId format" });
    }

    const address = await Address.findOne({
      _id: new mongoose.Types.ObjectId(addressId),
      user: req.user._id,
    });
    if (!address) return res.status(400).json({ message: "Address not found" });

   // ✅ save order with snapshot
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

    // ✅ Populate order fully
const populatedOrder = await Order.findById(order._id)
  .populate("user", "name email")
  .populate("items.menuItem", "name price discount");

// ✅ Emit to user + admin
emitOrderUpdate(order.user._id.toString(), populatedOrder);

    // send notification mail to user 
    await sendEmail(
  req.user.email,
  // "lappu.singh@yandex.com",
  "Your Order Has Been Placed ✅",
  `
  <h2>Thank you for your order!</h2>
  <p>Order ID: ${order._id}</p>
  <p>Total: ₹${order.totalPrice}</p>
  <p>Status: <strong>${order.status}</strong></p>
  <p>Delivery Address: ${order.deliveryAddress?.addressLine}, ${order.deliveryAddress?.city}, ${order.deliveryAddress?.state} - ${order.deliveryAddress?.pincode}</p>
  <br/>
  <p>We’ll keep you updated as your order progresses 🍽️</p>
  <p>Order ID: coming from paymentRoute</p>
  `
);

// send notification mail to admin 
await sendEmail(
  "fkkhem@gmail.com",
  "🚨 New Order Placed",
  `
  <h2>New Order Alert</h2>
  <p>User: ${req.user.name} (${req.user.email})</p>
  <p>Order ID: ${order._id}</p>
  <p>Total: ₹${order.totalPrice}</p>
  <p>Order ID: coming from paymentRoute</p>
  `
);
    res.json({ success: true, order });
  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
