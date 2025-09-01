const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" }, // ✅ must reference Menu
      quantity: { type: Number, default: 1 },
    },
  ],
  totalPrice: Number,
  status: {
    type: String,
    enum: ["Pending", "Delivered", "Cancelled"],
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
      lng: Number
    }
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
