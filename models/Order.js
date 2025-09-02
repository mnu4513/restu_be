const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
      quantity: { type: Number, default: 1 },
    },
  ],
  totalPrice: Number,
  status: {
  type: String,
  enum: ["Pending", "Accepted", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
  default: "Pending",
},

  deliveryAddress: {
    label: String,
    addressLine: String,
    city: String,
    state: String,
    pincode: String,
    location: {
      lat: Number,
      lng: Number,
    },
  },
  paymentInfo: {
    orderId: String,
    paymentId: String,
    signature: String,
    status: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
