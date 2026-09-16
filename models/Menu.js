const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Menu item name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be less than 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [5, "Description must be at least 5 characters"],
      maxlength: [500, "Description must be less than 500 characters"],
    },

    // Small image for order/cart/invoice
    thumbnail: {
      type: String,
      required: [true, "Thumbnail image is required"],
    },

    // Multiple images for product detail page
    images: [
      {
        type: String,
      },
    ],

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be at least 1"],
    },

    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },

    // Calculated discounted price
    finalPrice: {
      type: Number,
      default: 0,
    },

    // Major category
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["food", "store"],
        message: "Category must be either 'food' or 'store '",
      },
    },

    // Sub-category
    subCategory: {
      type: String,
      required: [true, "Sub-category is required"],
      enum: {
        values: [
          // Food
          "starter",
          "main",
          "dessert",
          "beverage",
          "sweet",
          "snack",

          // Store
          "toy",
          "stationery",
          "grocery",
          "personal_care",
          "grooming",
          "clothing",
          "footwear",
          "household",
          "electronics",

          // Common
          "other",
        ],
        message:
          "Invalid sub-category. Please select a valid sub-category.",
      },
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically calculate finalPrice before saving
menuSchema.pre("save", function () {
  this.finalPrice =
    this.price - (this.price * this.discount) / 100;
});

module.exports = mongoose.model("Menu", menuSchema);
