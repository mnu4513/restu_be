const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or "hotmail", "yahoo", or custom SMTP
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // app password
  },
});

// send email helper
exports.sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"My Restaurant" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("✅ Email sent to:", to);
  } catch (err) {
    console.error("❌ Email Error:", err);
  }
};
