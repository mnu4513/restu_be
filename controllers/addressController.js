const Address = require("../models/Address");

/* =========================
   Helper: reset defaults
========================= */
const resetDefault = async (userId) => {
  await Address.updateMany(
    { user: userId, isDefault: true },
    { $set: { isDefault: false } }
  );
};

/* =========================
   ADD ADDRESS
========================= */
exports.addAddress = async (req, res) => {
  try {
    const count = await Address.countDocuments({
      user: req.user._id,
    });

    // First address auto-default
    if (count === 0) {
      req.body.isDefault = true;
    }

    // If setting default → reset others
    if (req.body.isDefault) {
      await resetDefault(req.user._id);
    }

    const address = new Address({
      ...req.body,
      user: req.user._id,
      lastUsed: new Date(),
    });

    await address.save();

    res.status(201).json(address);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   GET ALL ADDRESSES
========================= */
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      user: req.user._id,
    }).sort({ isDefault: -1, updatedAt: -1 });

    res.json(addresses);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   UPDATE ADDRESS
========================= */
exports.updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // If setting default → reset others
    if (req.body.isDefault) {
      await resetDefault(req.user._id);
    }

    Object.assign(address, req.body);
    address.lastUsed = new Date();

    await address.save();

    res.json(address);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   DELETE ADDRESS
   (FIXED: fallback default logic)
========================= */
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // If deleted address was default → assign new default
    if (address.isDefault) {
      const next = await Address.findOne({
        user: req.user._id,
      });

      if (next) {
        next.isDefault = true;
        next.lastUsed = new Date();
        await next.save();
      }
    }

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   GET DEFAULT ADDRESS
========================= */
exports.getDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      user: req.user._id,
      isDefault: true,
    });

    res.json(address);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   SET DEFAULT ADDRESS
========================= */
exports.setDefaultAddress = async (req, res) => {
  try {
    await resetDefault(req.user._id);

    const updated = await Address.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        isDefault: true,
        lastUsed: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};