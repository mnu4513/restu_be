const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
        },

        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],

    totalPrice: {
      type: Number,
    },

    // =========================
    // ORDER STATUS
    // =========================

    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    // =========================
    // DELIVERY INFORMATION
    // =========================

    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
        "Delivered",
      ],
      default: "Unassigned",
    },

    deliveryAssignedAt: {
      type: Date,
      default: null,
    },

    deliveryAcceptedAt: {
      type: Date,
      default: null,
    },

    deliveryRejectedAt: {
      type: Date,
      default: null,
    },

    deliveryPickedUpAt: {
      type: Date,
      default: null,
    },

    deliveryDeliveredAt: {
      type: Date,
      default: null,
    },

    // =========================
    // DELIVERY ADDRESS
    // =========================

    deliveryAddress: {
      label: {
        type: String,
        trim: true,
      },

      addressLine: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        trim: true,
      },

      state: {
        type: String,
        trim: true,
      },

      pincode: {
        type: String,
        trim: true,
      },

      location: {
        lat: {
          type: Number,
        },

        lng: {
          type: Number,
        },
      },
    },

    // =========================
    // PAYMENT INFORMATION
    // =========================

    paymentInfo: {
      orderId: {
        type: String,
      },

      paymentId: {
        type: String,
      },

      signature: {
        type: String,
      },

      status: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);