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

    if (!name?.trim())
      return res.status(400).json({ message: "Item name is required" });

    if (!description?.trim())
      return res.status(400).json({ message: "Item description is required" });

    if (price === undefined || price === null)
      return res.status(400).json({ message: "Item price is required" });

    if (!thumbnail)
      return res.status(400).json({ message: "Thumbnail is required" });

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
    res.status(500).json({ message: err.message });
  }
};



// @desc Update menu item
// @route PUT /api/menu/:id
exports.updateMenuItem = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);

    if (!item)
      return res.status(404).json({ message: "Item not found" });

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

    await item.save(); // finalPrice auto recalculated

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// @desc Delete menu item
// @route DELETE /api/menu/:id
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    await item.deleteOne(); // ✅ modern alternative to remove()
    res.json({ message: "Menu item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
