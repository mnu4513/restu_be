const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    label: {
      type: String,
      default: "Home",
      enum: ["Home", "Work", "Other"],
    },

    addressLine: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^[1-9][0-9]{5}$/,
    },

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* =========================
       FIXED GEO LOCATION FIELD
    ========================= */
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: false,
        validate: {
          validator: function (v) {
            // if provided, must be valid
            return !v || (Array.isArray(v) && v.length === 2);
          },
          message: "Coordinates must be [lng, lat]",
        },
      },
    },

    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/* =========================
   GEO INDEX
========================= */
addressSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Address", addressSchema);