const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

// Add new address
router.post("/", protect, async (req, res) => {
  const { label, addressLine, city, state, pincode, location } = req.body;
  try {
    const user = await User.findById(req.user._id);
    user.addresses.push({ label, addressLine, city, state, pincode, location });
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit existing address
router.put("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.id);
    if (!addr) return res.status(404).json({ message: "Address not found" });

    Object.assign(addr, req.body);
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all addresses
router.get("/", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.addresses);
});

// Delete address
router.delete("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
