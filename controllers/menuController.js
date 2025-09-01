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
  const { name, description, image, price, discount, category } = req.body;

  try {
    const newItem = new Menu({
      name,
      description,
      image,
      price,
      discount,
      category,
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Update menu item
// @route PUT /api/menu/:id
exports.updateMenuItem = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    Object.assign(item, req.body);
    await item.save();

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
