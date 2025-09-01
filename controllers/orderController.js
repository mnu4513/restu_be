const Order = require("../models/Order");
const Menu = require("../models/Menu");

// @desc Place new order
// @route POST /api/orders
exports.placeOrder = async (req, res) => {
  const { items } = req.body; // [{ menuItem, quantity }]
  try {
    // fetch all menu items in parallel
    const menuItems = await Promise.all(
      items?.map((i) => Menu.findById(i.menuItem))
    );

    let totalPrice = 0;
    for (let index = 0; index < items.length; index++) {
      const menuItem = menuItems[index];
      if (!menuItem) {
        return res
          .status(404)
          .json({ message: `Menu item not found: ${items[index].menuItem}` });
      }
      totalPrice +=
        (menuItem.price -
          (menuItem.price * (menuItem.discount || 0)) / 100) *
        items[index].quantity;
    }

    const order = new Order({
  user: req.user._id,
  items: items.map(i => ({ menuItem: i._id, quantity: i.quantity })),
  totalPrice,
  status: "Pending",
  deliveryAddress: req.body.deliveryAddress  // ✅ user-selected address snapshot
});


    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Cancel order (within 2 mins)
// @route PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your order" });
    }

    const diff =
      (Date.now() - new Date(order.createdAt).getTime()) / 1000 / 60;
    if (diff > 2) {
      return res
        .status(400)
        .json({ message: "Cancel time expired (2 minutes passed)" });
    }

    order.status = "Cancelled";
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get all orders for logged-in user
// @route GET /api/orders/my
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
    .populate("items.menuItem")
    .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
