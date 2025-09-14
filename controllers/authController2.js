// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");

let otpStore = {}; // in-memory OTP store for testing; use Redis in production

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Basic throttle: allow OTP request every 60s per phone (for testing)
const canRequestOtp = (phone) => {
  const rec = otpStore[phone];
  if (!rec) return true;
  return Date.now() - (rec.lastRequestedAt || 0) > 60 * 1000;
};

// Validate/normalize phone (basic). You should use libphonenumber for robust validation.
const normalizePhone = (raw) => {
  if (!raw) return null;
  return String(raw).trim(); // expect E.164 like +919876543210
};

/**
 * Send OTP via Meta WhatsApp Cloud API
 * Required env:
 *  - WHATSAPP_TOKEN  (permanent token or app token)
 *  - WHATSAPP_PHONE_NUMBER_ID (phone number id from business manager)
 */
exports.sendOtp = async (req, res) => {
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ success: false, message: "Phone number required" });

    const phone = normalizePhone(number);
    if (!phone) return res.status(400).json({ success: false, message: "Invalid phone number" });

    if (!canRequestOtp(phone)) {
      return res.status(429).json({ success: false, message: "OTP recently requested. Please wait a bit." });
    }

    const otp = generateOtp();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

    otpStore[phone] = {
      otp: Number(otp),
      expires,
      attempts: 0,
      lastRequestedAt: Date.now(),
    };

    // If testing locally without meta credentials, don't call API but return success.
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    console.log(token, phoneNumberId)
    if (!token || !phoneNumberId) {
      console.warn("WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — OTP generated but not sent:", otp);
      return res.json({
        success: true,
        message: "OTP generated (WHATSAPP not configured). In production the OTP will be sent via WhatsApp.",
      });
    }

    // Build Meta WhatsApp Cloud API request
    const endpoint = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to: phone, // must be in E.164 format with +countrycode
      type: "text",
      text: {
        body: `Your verification code is ${otp}. It will expire in 5 minutes. Do not share this code with anyone.`,
      },
    };

    // Send the message
    await axios.post(endpoint, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res.json({ success: true, message: "OTP sent via WhatsApp" });
  } catch (err) {
    console.error("sendOtp error:", err?.response?.data || err?.message || err);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { number, otp } = req.body;
    if (!number) return res.status(400).json({ success: false, message: "Phone number required" });
    if (!otp) return res.status(400).json({ success: false, message: "OTP required" });

    const phone = normalizePhone(number);
    const record = otpStore[phone];
    if (!record) return res.status(400).json({ success: false, message: "OTP not requested for this number" });

    if (Date.now() > record.expires) {
      delete otpStore[phone];
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // increment attempts and possibly lock after too many tries
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 10) {
      delete otpStore[phone];
      return res.status(429).json({ success: false, message: "Too many attempts. Request a new OTP." });
    }

    if (Number(otp) === Number(record.otp)) {
      delete otpStore[phone];
      return res.json({ success: true, message: "OTP verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (err) {
    console.error("verifyOtp error:", err?.message || err);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, email, number, password } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    if (!email) return res.status(400).json({ success: false, message: "E-mail is required" });
    if (!number) return res.status(400).json({ success: false, message: "Phone is required" });
    if (!password) return res.status(400).json({ success: false, message: "Password is required" });

    let userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: "User already exists with this E-mail" });

    userExists = await User.findOne({ number });
    if (userExists) return res.status(400).json({ success: false, message: "User already exists with this number" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, number, password: hashed });

    return res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("registerUser error:", err?.message || err);
    return res.status(500).json({ success: false, message: "Failed to register user" });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email/Phone and password required" });

    let user = await User.findOne({ email });
    if (!user) user = await User.findOne({ number: email }); // allow login with phone or email in same field

    if (user && (await bcrypt.compare(password, user.password))) {
      return res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        number: user.number,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ success: false, message: "Invalid email/phone or password" });
    }
  } catch (err) {
    console.error("loginUser error:", err?.message || err);
    return res.status(500).json({ success: false, message: "Failed to login" });
  }
};

// Profile
exports.getProfile = async (req, res) => {
  // expects auth middleware to set req.user
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
  res.json({ success: true, user: req.user });
};
