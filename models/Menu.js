const mongoose = require("mongoose");

// ==========================================
// CATEGORY → SUB-CATEGORY MAPPING
// ==========================================

const categorySubCategories = {
  food: [
    "starter",
    "main",
    "dessert",
    "beverage",
    "sweet",
    "snack",
    "other",
  ],

  store: [
    "toy",
    "stationery",
    "grocery",
    "personal_care",
    "grooming",
    "clothing",
    "footwear",
    "household",
    "electronics",
    "other",
  ],
};


// ==========================================
// MENU SCHEMA
// ==========================================

const menuSchema = new mongoose.Schema(
  {
    // ========================================
    // BASIC INFORMATION
    // ========================================

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


    // ========================================
    // IMAGES
    // ========================================

    // Small image for order/cart/invoice
    thumbnail: {
      type: String,
      required: [true, "Thumbnail image is required"],
      trim: true,
    },

    // Multiple images for product detail page
    images: [
      {
        type: String,
        trim: true,
      },
    ],


    // ========================================
    // PRICING
    // ========================================

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

    // Calculated automatically before save
    finalPrice: {
      type: Number,
      default: 0,
      min: [0, "Final price cannot be negative"],
    },


    // ========================================
    // MAJOR CATEGORY
    // ========================================

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["food", "store"],
        message: "Category must be either 'food' or 'store'",
      },
      trim: true,
      lowercase: true,
    },


    // ========================================
    // SUB-CATEGORY
    // ========================================

    subCategory: {
      type: String,
      required: [true, "Sub-category is required"],
      trim: true,
      lowercase: true,
    },


    // ========================================
    // AVAILABILITY
    // ========================================

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


// ==========================================
// VALIDATE CATEGORY + SUB-CATEGORY
// ==========================================

menuSchema.pre("validate", function () {
  const allowedSubCategories =
    categorySubCategories[this.category];

  if (!allowedSubCategories) {
    this.invalidate(
      "category",
      `Invalid category '${this.category}'`
    );

    return;
  }

  if (!allowedSubCategories.includes(this.subCategory)) {
    this.invalidate(
      "subCategory",
      `Invalid sub-category '${this.subCategory}' for category '${this.category}'`
    );
  }
});


// ==========================================
// CALCULATE FINAL PRICE
// ==========================================

menuSchema.pre("save", function () {
  this.finalPrice =
    this.price - (this.price * this.discount) / 100;
});


// ==========================================
// EXPORT
// ==========================================

module.exports = mongoose.model("Menu", menuSchema);