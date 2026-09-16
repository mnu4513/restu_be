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

    // Validation: Ensure label is provided -- if not, return 400 error (bydefault, Moongoose will set 'Home' as default, but we want to enforce user input)
if (!address.label) address.label = "Home";  
if (!["Home", "Work", "Other"].includes(address.label)) return res.status(400).json({ success: false, message: "Label must be one of: Home, Work, Other" });
if (!address.addressLine) return res.status(400).json({ success: false, message: "Full address is required" });
if (address.addressLine.length < 10) return res.status(400).json({ success: false, message: "Full address must be at least 10 characters" });
if (!address.city) return res.status(400).json({ success: false, message: "City is required" });
if (address.city.length < 3) return res.status(400).json({ success: false, message: "City must be at least 3 characters" });
if (!/^[a-zA-Z\s]+$/.test(address.city)) return res.status(400).json({ success: false, message: "City must contain only letters and spaces" });
if (!address.state) return res.status(400).json({ success: false, message: "State is required" });
if (address.state.length < 3) return res.status(400).json({ success: false, message: "State must be at least 3 characters" });
if (!/^[a-zA-Z\s]+$/.test(address.state)) return res.status(400).json({ success: false, message: "State must contain only letters and spaces" });
if (!address.pincode) return res.status(400).json({ success: false, message: "Pincode is required" });  
if (!/^[1-9][0-9]{5}$/.test(address.pincode)) return res.status(400).json({ success: false, message: "Pincode must be a valid 6-digit number" });

// Save the address
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

    // Validation: Ensure label is provided -- if not, return 400 error (bydefault, Moongoose will set 'Home' as default, but we want to enforce user input)
if (!address.label) address.label = "Home"; 
if (!["Home", "Work", "Other"].includes(address.label)) return res.status(400).json({ success: false, message: "Label must be one of 'Home', 'Work', or 'Other'" });
if (!address.addressLine) return res.status(400).json({ success: false, message: "Full address is required" });
if (address.addressLine.length < 10) return res.status(400).json({ success: false, message: "Full address must be at least 10 characters" });
if (!address.city) return res.status(400).json({ success: false, message: "City is required" });
if (address.city.length < 3) return res.status(400).json({ success: false, message: "City must be at least 3 characters" });
if (!/^[a-zA-Z\s]+$/.test(address.city)) return res.status(400).json({ success: false, message: "City must contain only letters and spaces" });
if (!address.state) return res.status(400).json({ success: false, message: "State is required" });
if (address.state.length < 3) return res.status(400).json({ success: false, message: "State must be at least 3 characters" });
if (!/^[a-zA-Z\s]+$/.test(address.state)) return res.status(400).json({ success: false, message: "State must contain only letters and spaces" });
if (!address.pincode) return res.status(400).json({ success: false, message: "Pincode is required" });  
if (!/^[1-9][0-9]{5}$/.test(address.pincode)) return res.status(400).json({ success: false, message: "Pincode must be a valid 6-digit number" });
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

      // If we are deleting the last address, no need to set a new default. The schema's default value will handle it when a new address is added.
      // If there's only one address left, it will automatically be default due to the schema's default value. If there are multiple addresses, we set the next one as default.
    // If there's a next address, set it as default and update lastUsed
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