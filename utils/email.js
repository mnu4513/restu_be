const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendEmail = async ({
  to,
  subject,
  html,
  attachments = [],
  cc,
  bcc,
  from
}) => {
  try {

    const response = await resend.emails.send({
      from: from || process.env.MAIL_FROM || "shop@infounix.com",
      to,
      subject,
      html,
      cc,
      bcc,
      attachments: attachments.map(a => ({
        filename: a.filename,
        content: a.content,
        encoding: "base64",             // ⭐ REQUIRED
        // contentType: "application/pdf"  // ⭐ recommended
      }))
    });

    console.log("✅ Email sent:", response?.id || to);
    return response;

  } catch (error) {
    console.error("❌ Email Error:", error);
    throw error;
  }
};
