const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendEmail = async (to, subject, html) => {
  try {
    await resend.emails.send({
      from: process.env.MAIL_FROM || "shop@infounix.com",
      to,
      subject,
      html,
    });

    console.log("✅ Email sent to", to);
  } catch (error) {
    console.error("❌ Email Error:", error);
  }
};
