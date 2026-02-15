const PDFDocument = require("pdfkit");

exports.generateInvoiceBuffer = (order, user) => {
  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({ margin: 40 });

    const buffers = [];
    doc.on("data", chunk => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // HEADER
    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Customer: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Status: ${order.status}`);
    doc.moveDown();

    doc.text("Items:", { underline: true });
    doc.moveDown(0.5);

    order.items.forEach(item => {
      const p = item.menuItem;
      const price = p.price - (p.price * (p.discount || 0)) / 100;
      doc.text(`${p.name}  x ${item.quantity}  - ₹${price}`);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: ₹${order.totalPrice}`, { align: "right" });

    doc.end();
  });
};
