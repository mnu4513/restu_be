const Address = require("../models/Address");

// Add new address
exports.addAddress = async (req, res) => {
  try {
    const existingAddresses = await Address.countDocuments({ user: req.user._id });

    // Case 1: First address → force as default
    if (existingAddresses === 0) {
      req.body.isDefault = true;
    }

    // Case 2: User set this as default → reset others
    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    // Save address
    const address = new Address({ ...req.body, user: req.user._id });
    await address.save();

    res.status(201).json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get all addresses
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ message: "Address not found" });

    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    Object.assign(address, req.body);
    await address.save();
    res.json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ message: "Address not found" });
    res.json({ message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get default address
exports.getDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ user: req.user._id, isDefault: true });
    res.json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Set default address
// @route PUT /api/addresses/:id/default
exports.setDefaultAddress = async (req, res) => {
  try {
    // Remove default from all user addresses
    await Address.updateMany({ user: req.user._id }, { isDefault: false });

    // Set the chosen one as default
    const updated = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isDefault: true },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Address not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
