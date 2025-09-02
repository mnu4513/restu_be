const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  getDefaultAddress,
  setDefaultAddress
} = require("../controllers/addressController");

const router = express.Router();

// Routes
router.post("/", protect, addAddress);          // Add new address
router.get("/", protect, getAddresses);         // Get all addresses
router.get("/default", protect, getDefaultAddress); // Get default address
router.put("/:id", protect, updateAddress);     // Update address
router.delete("/:id", protect, deleteAddress);  // Delete address
router.put("/:id/default", protect, setDefaultAddress);

module.exports = router;
