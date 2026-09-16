const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu"
      },
      quantity: {
        type: Number,
        default: 1
      }
    }
  ],

  totalPrice: Number,

  status: {
    type: String,
    enum: [
      "Pending",
      "Accepted",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled"
    ],
    default: "Pending",
  },

  // =========================
  // DELIVERY INFORMATION
  // =========================

  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  deliveryStatus: {
    type: String,
    enum: [
      "Unassigned",
      "Assigned",
      "Accepted",
      "Rejected",
      "Picked Up",
      "Out for Delivery",
      "Delivered"
    ],
    default: "Unassigned"
  },

  deliveryAssignedAt: {
    type: Date,
    default: null
  },

  deliveryAcceptedAt: {
    type: Date,
    default: null
  },

  deliveryPickedUpAt: {
    type: Date,
    default: null
  },

  deliveryDeliveredAt: {
    type: Date,
    default: null
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