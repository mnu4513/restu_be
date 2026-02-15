const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/email");

let otpStore = {}; // in-memory OTP store for testing; use Redis in production

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Basic throttle: allow OTP request every 60s per phone (for testing)
const canRequestOtp = (email) => {
  const rec = otpStore[email];
  if (!rec) return true;
  return Date.now() - (rec.lastRequestedAt || 0) > 60 * 1000;
};

exports.sendOtp = async (req, res) => {
  try {
    const { email, name } = req.body;

    // ================= VALIDATION =================
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    // ================= RATE LIMIT =================
    if (!canRequestOtp(email)) {
      return res.status(429).json({
        success: false,
        message: "OTP recently requested. Please wait before trying again."
      });
    }

    // ================= GENERATE OTP =================
    const otp = generateOtp();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore[email] = {
      otp: Number(otp),
      expires,
      attempts: 0,
      lastRequestedAt: Date.now(),
    };

    // ================= EMAIL TEMPLATE =================
    const emailHtml = `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
      <div style="max-width:500px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
        
        <div style="background:#2563eb; color:white; text-align:center; padding:20px;">
          <h2 style="margin:0;">Account Verification</h2>
        </div>

        <div style="padding:30px; color:#333;">
          <p style="font-size:16px;">Hello <strong>${name}</strong>,</p>

          <p style="font-size:15px;">
            Thank you for registering. Please use the One-Time Password (OTP) below to complete your verification.
          </p>

          <div style="text-align:center; margin:30px 0;">
            <div style="
              display:inline-block;
              background:#f1f5f9;
              padding:15px 30px;
              font-size:28px;
              font-weight:bold;
              letter-spacing:4px;
              border-radius:8px;
              color:#111827;
            ">
              ${otp}
            </div>
          </div>

          <p style="font-size:14px; color:#555;">
            This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.
          </p>

          <p style="font-size:14px; color:#555;">
            If you did not request this OTP, please ignore this email.
          </p>

          <p style="margin-top:30px;">
            Best regards,<br>
            <strong>${process.env.APP_NAME || "Your Company"}</strong>
          </p>
        </div>

        <div style="background:#f9fafb; text-align:center; padding:15px; font-size:12px; color:#888;">
          <a href="https://restufe.vercel.app" target="_blank" style="text-decoration:none;color:#888;">
            © ${new Date().getFullYear()} ${process.env.APP_NAME || "Your Company"}
          </a>
        </div>

      </div>
    </div>
    `;

    // ================= SEND EMAIL =================
    await sendEmail({
      to: email,
      subject: "Your OTP for Registration",
      html: emailHtml
    });

    return res.json({
      success: true,
      message: "OTP sent successfully to your email"
    });

  } catch (err) {
    console.error("sendOtp error:", err?.message || err);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
};



exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "E-mail required" });
    if (!otp) return res.status(400).json({ success: false, message: "OTP required" });
    const record = otpStore[email];
    console.log(otpStore)
    if (!record) return res.status(400).json({ success: false, message: "OTP not requested for this E-mail or expired" });

    if (Date.now() > record.expires) {
      delete otpStore[email];
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // increment attempts and possibly lock after too many tries
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 10) {
      delete otpStore[email];
      return res.status(429).json({ success: false, message: "Too many attempts. Request a new OTP." });
    }

    if (Number(otp) === Number(record.otp)) {
      delete otpStore[email];
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

    const user = await User.create({ name, email, number, password });

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
  console.log('hit aaya')
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email/Phone and password required" });

    let user = await User.findOne({ email });
    if (!user) user = await User.findOne({ number: email }); // allow login with phone or email in same field

    if (user && (password == user.password)) {
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
