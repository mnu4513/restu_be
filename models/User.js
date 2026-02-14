const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  number: { type: Number, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" }, 
  addresses: [
    {
      label: { type: String, default: "Home" },   // e.g. "Home", "Work"
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      location: {
        lat: { type: Number },
        lng: { type: Number }
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
