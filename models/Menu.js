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

    // 🔥 Small image for order/cart/invoice
    thumbnail: {
      type: String,
      required: [true, "Thumbnail image is required"],
    },

    // 🔥 Multiple images for product detail page
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

    // 🔥 Computed discounted price (optional virtual)
    finalPrice: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["starter", "main", "dessert", "beverage", "sweet", "other"],
      default: "other",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔥 Auto calculate finalPrice before save
menuSchema.pre("save", function (next) {
  if (this.discount > 0) {
    this.finalPrice = this.price - (this.price * this.discount) / 100;
  } else {
    this.finalPrice = this.price;
  }
  next();
});

module.exports = mongoose.model("Menu", menuSchema);
