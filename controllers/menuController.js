const Menu = require("../models/Menu");

// Allowed major categories and their sub-categories
const categorySubCategories = {
  food: [
    "starter",
    "main",
    "dessert",
    "beverage",
    "sweet",
    "snack",
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


// @desc Get all menu items
// @route GET /api/menu
exports.getMenu = async (req, res) => {
  try {
    const items = await Menu.find();

    res.json(items);
  } catch (err) {
    console.error("🔥 Get Menu Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// @desc Add new menu item (Admin only)
// @route POST /api/menu
exports.addMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      thumbnail,
      images,
      price,
      discount,
      category,
      subCategory,
      isAvailable,
    } = req.body;


    // --------------------------------------------------
    // Validation
    // --------------------------------------------------

    // Name
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!name.trim() || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }


    // Description
    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (!description.trim() || description.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Description must be at least 5 characters",
      });
    }


    // Thumbnail
    if (!thumbnail) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail image is required",
      });
    }


    // Price
    if (price === undefined || price === null || price === "") {
      return res.status(400).json({
        success: false,
        message: "Price is required",
      });
    }

    if (isNaN(price) || Number(price) < 1) {
      return res.status(400).json({
        success: false,
        message: "Price must be a number greater than or equal to 1",
      });
    }


    // Discount
    if (
      discount !== undefined &&
      discount !== null &&
      discount !== "" &&
      (isNaN(discount) ||
        Number(discount) < 0 ||
        Number(discount) > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount must be a number between 0 and 100",
      });
    }


    // Major category
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!["food", "store"].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Category must be either 'food' or 'store'",
      });
    }


    // Sub-category
    if (!subCategory) {
      return res.status(400).json({
        success: false,
        message: "Sub-category is required",
      });
    }

    if (!categorySubCategories[category].includes(subCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sub-category '${subCategory}' for category '${category}'`,
      });
    }


    // Images
    if (images !== undefined && !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: "Images must be an array",
      });
    }


    // isAvailable
    if (
      isAvailable !== undefined &&
      typeof isAvailable !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be a boolean (true/false)",
      });
    }


    // --------------------------------------------------
    // Create new menu item
    // --------------------------------------------------

    const newItem = await Menu.create({
      name: name.trim(),
      description: description.trim(),
      thumbnail: String(thumbnail),
      images: Array.isArray(images) ? images : [],
      price: Number(price),
      discount:
        discount !== undefined &&
        discount !== null &&
        discount !== ""
          ? Number(discount)
          : 0,
      category,
      subCategory,
      isAvailable: isAvailable ?? true,
    });


    res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      item: newItem,
    });

  } catch (err) {
    console.error("🔥 Add Menu Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// @desc Update menu item
// @route PUT /api/menu/:id
exports.updateMenuItem = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }


    // --------------------------------------------------
    // Whitelisted fields only
    // --------------------------------------------------

    const allowedFields = [
      "name",
      "description",
      "thumbnail",
      "images",
      "price",
      "discount",
      "category",
      "subCategory",
      "isAvailable",
    ];


    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });


    // --------------------------------------------------
    // Validation
    // --------------------------------------------------

    // Name
    if (!item.name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!item.name.trim() || item.name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }


    // Description
    if (!item.description) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (
      !item.description.trim() ||
      item.description.trim().length < 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be at least 5 characters",
      });
    }


    // Thumbnail
    if (!item.thumbnail) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail image is required",
      });
    }


    // Price
    if (
      item.price === undefined ||
      item.price === null ||
      item.price === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Price is required",
      });
    }

    if (isNaN(item.price) || Number(item.price) < 1) {
      return res.status(400).json({
        success: false,
        message: "Price must be a number greater than or equal to 1",
      });
    }


    // Discount
    if (
      item.discount !== undefined &&
      item.discount !== null &&
      item.discount !== "" &&
      (isNaN(item.discount) ||
        Number(item.discount) < 0 ||
        Number(item.discount) > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount must be a number between 0 and 100",
      });
    }


    // Major category
    if (!item.category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!["food", "store"].includes(item.category)) {
      return res.status(400).json({
        success: false,
        message: "Category must be either 'food' or 'store'",
      });
    }


    // Sub-category
    if (!item.subCategory) {
      return res.status(400).json({
        success: false,
        message: "Sub-category is required",
      });
    }

    if (!categorySubCategories[item.category].includes(item.subCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sub-category '${item.subCategory}' for category '${item.category}'`,
      });
    }


    // Images
    if (item.images !== undefined && !Array.isArray(item.images)) {
      return res.status(400).json({
        success: false,
        message: "Images must be an array",
      });
    }


    // isAvailable
    if (
      item.isAvailable !== undefined &&
      typeof item.isAvailable !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be a boolean (true/false)",
      });
    }


    // --------------------------------------------------
    // Save
    // --------------------------------------------------
    // pre("save") will automatically recalculate finalPrice

    await item.save();


    res.json({
      success: true,
      message: "Menu item updated successfully",
      item,
    });

  } catch (err) {
    console.error("🔥 Update Menu Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// @desc Delete menu item
// @route DELETE /api/menu/:id
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: "Menu item deleted",
    });

  } catch (err) {
    console.error("🔥 Delete Menu Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
