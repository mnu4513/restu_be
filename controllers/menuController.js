const Menu = require("../models/Menu");

// @desc Get all menu items
// @route GET /api/menu
exports.getMenu = async (req, res) => {
  try {
    const items = await Menu.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
      isAvailable
    } = req.body;

//  Validation: Ensure required fields are provided
if (!name) return res.status(400).json({ success: false, message: "Name is required" });
if (!name.trim() || name.trim().length < 2) return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
if (!description) return res.status(400).json({ success: false, message: "Description is required" });
if (!description.trim() || description.trim().length < 5) return res.status(400).json({ success: false, message: "Description must be at least 5 characters" });
if (!thumbnail) return res.status(400).json({ success: false, message: "Thumbnail image is required" });
if (!price) return res.status(400).json({ success: false, message: "Price is required" });
if (isNaN(price) || price < 1) return res.status(400).json({ success: false, message: "Price must be a number greater than or equal to 1" });
if (discount && (isNaN(discount) || discount < 0 || discount > 100)) return res.status(400).json({ success: false, message: "Discount must be a number between 0 and 100" });
if (!category) return res.status(400).json({ success: false, message: "Category is required" });
if (!["starter", "main", "dessert", "beverage", "sweet", "other"].includes(category)) return res.status(400).json({ success: false, message: "Category must be one of: starter, main, dessert, beverage, sweet, other" });
if (isAvailable !== undefined && typeof isAvailable !== "boolean") return res.status(400).json({ success: false, message: "isAvailable must be a boolean (True/False)" });





// Create new menu item
    const newItem = await Menu.create({
      name: name.trim(),
      description: description.trim(),
      thumbnail: String(thumbnail),
      images: Array.isArray(images) ? images : [],
      price: Number(price),
      discount: Number(discount) || 0,
      category: category || "other",
      isAvailable: isAvailable ?? true,
    });

    res.status(201).json(newItem);
  } catch (err) {
    console.error("🔥 Add Menu Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



// @desc Update menu item
// @route PUT /api/menu/:id
exports.updateMenuItem = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);

    if (!item)
      return res.status(404).json({ success: false, message: "Item not found" });

    // 🔥 Whitelisted fields only
    const allowedFields = [
      "name",
      "description",
      "thumbnail",
      "images",
      "price",
      "discount",
      "category",
      "isAvailable"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    // Validation: Ensure required fields are provided correctly
    if (item.name && (!item.name.trim() || item.name.trim().length < 2)) {
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
    };
    if (item.description && (!item.description.trim() || item.description.trim().length < 5)) {
      return res.status(400).json({ success: false, message: "Description must be at least 5 characters" });
    }; 
    if (item.price !== undefined && (isNaN(item.price) || item.price < 1)) {
      return res.status(400).json({ success: false, message: "Price must be a number greater than or equal to 1" });
    }; 
    if (item.discount !== undefined && (isNaN(item.discount) || item.discount < 0 || item.discount > 100)) {
      return res.status(400).json({ success: false, message: "Discount must be a number between 0 and 100" });
    }; 
    if (item.category && !["starter", "main", "dessert", "beverage", "sweet", "other"].includes(item.category)) {
      return res.status(400).json({ success: false, message: "Category must be one of: starter, main, dessert, beverage, sweet, other" });
    }; 
    if (item.isAvailable !== undefined && typeof item.isAvailable !== "boolean") {
      return res.status(400).json({ success: false, message: "isAvailable must be a boolean (True/False)" });
    }; 

    await item.save(); // finalPrice auto recalculated

    res.json(item);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// @desc Delete menu item
// @route DELETE /api/menu/:id
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    await item.deleteOne(); // ✅ modern alternative to remove()
    res.json({ success: true, message: "Menu item deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
