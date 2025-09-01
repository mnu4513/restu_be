const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Menu = require("../models/Menu");
const { protect } = require("../middleware/authMiddleware");

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
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Error creating Razorpay order" });
  }
});

// ✅ Verify payment & save order
router.post("/verify", protect, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    items,
    deliveryAddress   // 👈 get selected address from frontend
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid payment signature" });
  }

  try {
    // ✅ Calculate total price properly
    let totalPrice = 0;

    for (let i of items) {
      const menuItem = await Menu.findById(i._id);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item not found: ${i._id}` });
      }
      totalPrice +=
        (menuItem.price -
          (menuItem.price * (menuItem.discount || 0)) / 100) *
        i.quantity;
    }

    // ✅ Save order with snapshot of delivery address
    const order = new Order({
      user: req.user._id,
      items: items.map(i => ({
        menuItem: i._id,
        quantity: i.quantity
      })),
      totalPrice,
      status: "Pending",
      deliveryAddress,   // 👈 store chosen address snapshot here
      paymentInfo: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: "Paid"
      }
    });

    await order.save();

    // ✅ Populate before sending back
    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.menuItem", "name price discount");

    res.json({ success: true, order: populatedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
