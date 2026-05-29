const PDFDocument = require("pdfkit");

exports.generateInvoiceBuffer = (order, user) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });

    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    /* ===================== HEADER ===================== */
    doc
      .fillColor("#0f172a")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(process.env.APP_NAME || "Food App", { align: "center" });

    doc
      .moveDown(0.3)
      .fontSize(14)
      .fillColor("#f97316")
      .text("INVOICE", { align: "center", underline: false });

    doc.moveDown(1);

    /* ===================== ORDER INFO CARD ===================== */
    doc
      .rect(40, doc.y, 515, 90)
      .fill("#f8fafc");

    doc.fillColor("#0f172a");

    doc
      .fontSize(10)
      .text(`Order ID: #${order._id}`, 50, doc.y + 10);

    doc
      .text(`Customer: ${user.name}`, 50, doc.y + 10);

    doc
      .text(`Email: ${user.email}`, 50, doc.y + 10);

    doc
      .text(`Status: ${order.status}`, 50, doc.y + 10);

    doc.moveDown(3);

    /* ===================== ITEMS SECTION TITLE ===================== */
    doc
      .fillColor("#0f172a")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Items Ordered");

    doc.moveDown(0.5);

    /* ===================== TABLE HEADER ===================== */
    doc
      .fontSize(10)
      .fillColor("#64748b")
      .text("Item", 50)
      .text("Qty", 300)
      .text("Price", 400);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#e2e8f0").stroke();

    doc.moveDown(0.5);

    /* ===================== ITEMS ===================== */
    order.items.forEach((item) => {
      const p = item.menuItem;

      const price =
        p.price - (p.price * (p.discount || 0)) / 100;

      doc
        .fillColor("#0f172a")
        .fontSize(11)
        .text(p.name, 50)
        .text(item.quantity.toString(), 300)
        .fillColor("#10b981")
        .text(`₹${price}`, 400);

      doc.moveDown(0.8);
    });

    /* ===================== TOTAL BOX ===================== */
    doc.moveDown(1);

    doc
      .rect(350, doc.y, 200, 50)
      .fill("#ecfdf5");

    doc
      .fillColor("#065f46")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`TOTAL: ₹${order.totalPrice}`, 360, doc.y + 18);

    doc.moveDown(3);

    /* ===================== FOOTER ===================== */
    doc
      .fillColor("#94a3b8")
      .fontSize(10)
      .text(
        `Thank you for ordering from ${process.env.APP_NAME}.`,
        50,
        doc.page.height - 80,
        { align: "center" }
      );

    doc
      .text(
        "This is a system generated invoice.",
        { align: "center" }
      );

    doc.end();
  });
};