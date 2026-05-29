exports.baseEmailTemplate = (content) => `
<div style="
  margin:0;
  padding:40px 12px;
  background:#0b1220;
  background-image:
    radial-gradient(circle at top left, rgba(249,115,22,0.25), transparent 30%),
    radial-gradient(circle at bottom right, rgba(16,185,129,0.18), transparent 35%);
  font-family:Arial, sans-serif;
">

  <div style="
    max-width:680px;
    margin:auto;
    background:#ffffff;
    border-radius:28px;
    overflow:hidden;
    box-shadow:0 25px 80px rgba(0,0,0,0.35);
  ">

    <!-- HEADER -->
    <div style="
      padding:45px 30px;
      text-align:center;
      background:linear-gradient(135deg,#f97316,#10b981);
      color:#fff;
    ">
      <h1 style="
        margin:0;
        font-size:32px;
        font-weight:800;
        letter-spacing:-0.5px;
      ">
        ${process.env.APP_NAME}
      </h1>

      <p style="
        margin-top:10px;
        font-size:14px;
        opacity:0.9;
      ">
        Fresh Food • Fast Delivery • Premium Taste
      </p>
    </div>

    ${content}

    <!-- FOOTER -->
    <div style="
      padding:22px;
      text-align:center;
      background:#f8fafc;
      color:#64748b;
      font-size:12px;
      border-top:1px solid #e2e8f0;
    ">
      <p style="margin:0 0 8px;">
        Made with ❤️ by ${process.env.APP_NAME}
      </p>

      <a href="https://restufe.vercel.app" style="
        color:#f97316;
        text-decoration:none;
        font-weight:600;
      ">
        Visit Website
      </a>

      <p style="margin-top:10px;">
        © ${new Date().getFullYear()} ${process.env.APP_NAME}
      </p>
    </div>

  </div>
</div>
`;

/* ===================== ITEM ROW ===================== */
const itemRow = (item) => `
<tr>
  <td colspan="4" style="
    background:#fff;
    border:1px solid #e2e8f0;
    border-radius:18px;
    padding:14px;
  ">
    <table width="100%">
      <tr>

        <td width="80">
          <img src="${item.image}" width="64" height="64" style="
            border-radius:14px;
            object-fit:cover;
          "/>
        </td>

        <td>
          <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">
            ${item.name}
          </p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">
            Qty: ${item.qty}
          </p>
        </td>

        <td align="right">
          <p style="margin:0;font-size:16px;font-weight:700;color:#10b981;">
            ₹${item.price}
          </p>
        </td>

      </tr>
    </table>
  </td>
</tr>
`;

/* ===================== USER ORDER EMAIL ===================== */
exports.userOrderEmail = (order, user, items) =>
  exports.baseEmailTemplate(`
  <div style="padding:40px 30px;color:#0f172a;">

    <div style="
      display:inline-block;
      padding:8px 16px;
      border-radius:999px;
      background:#dcfce7;
      color:#16a34a;
      font-size:12px;
      font-weight:700;
      margin-bottom:18px;
    ">
      ORDER CONFIRMED 🎉
    </div>

    <h2 style="margin:0;font-size:28px;">
      Hello ${user.name}
    </h2>

    <p style="color:#475569;line-height:1.6;font-size:14px;">
      Thanks for ordering from <b>${process.env.APP_NAME}</b>.
      Your food is being prepared with care.
    </p>

    <!-- ORDER CARD -->
    <div style="
      margin-top:25px;
      padding:20px;
      border-radius:20px;
      background:#f8fafc;
      border:1px solid #e2e8f0;
    ">
      <p><b>Order ID:</b> #${order._id}</p>
      <p><b>Status:</b> ${order.status}</p>
      <p><b>Total:</b> ₹${order.totalPrice}</p>
    </div>

    <!-- ITEMS -->
    <h3 style="margin-top:30px;">Your Items</h3>

    <table width="100%" cellspacing="0" cellpadding="0" style="
      border-collapse:separate;
      border-spacing:0 10px;
    ">
      <tbody>
        ${items}
      </tbody>
    </table>

    <!-- ADDRESS -->
    <div style="
      margin-top:30px;
      padding:18px;
      border-radius:18px;
      background:#fff7ed;
      border:1px solid #fed7aa;
    ">
      <b>Delivery Address</b>
      <p style="margin:6px 0 0;line-height:1.6;color:#7c2d12;">
        ${order.deliveryAddress.addressLine}<br/>
        ${order.deliveryAddress.city}, ${order.deliveryAddress.state}<br/>
        ${order.deliveryAddress.pincode}
      </p>
    </div>

    <div style="text-align:center;margin-top:35px;">
      <a href="https://restufe.vercel.app/orders" style="
        padding:14px 28px;
        border-radius:14px;
        background:linear-gradient(135deg,#f97316,#10b981);
        color:white;
        text-decoration:none;
        font-weight:700;
        display:inline-block;
      ">
        Track Order
      </a>
    </div>

  </div>
`);

/* ===================== ADMIN ORDER EMAIL ===================== */
exports.adminOrderEmail = (order, user, items) =>
  exports.baseEmailTemplate(`
  <div style="padding:40px 30px;">

    <div style="
      display:inline-block;
      padding:8px 16px;
      border-radius:999px;
      background:#fee2e2;
      color:#dc2626;
      font-size:12px;
      font-weight:700;
      margin-bottom:18px;
    ">
      NEW ORDER 🚨
    </div>

    <h2 style="margin:0;">New Order Received</h2>

    <div style="
      margin-top:20px;
      padding:20px;
      border-radius:20px;
      background:#f8fafc;
      border:1px solid #e2e8f0;
    ">
      <p><b>Customer:</b> ${user.name}</p>
      <p><b>Email:</b> ${user.email}</p>
      <p><b>Order ID:</b> #${order._id}</p>
      <p><b>Total:</b> ₹${order.totalPrice}</p>
    </div>

    <h3 style="margin-top:25px;">Address</h3>
    <p style="line-height:1.6;">
      ${order.deliveryAddress.addressLine}<br/>
      ${order.deliveryAddress.city}, ${order.deliveryAddress.state}<br/>
      ${order.deliveryAddress.pincode}
    </p>

    <h3>Items</h3>

    <table width="100%" cellspacing="0" cellpadding="0" style="
      border-collapse:separate;
      border-spacing:0 10px;
    ">
      <tbody>
        ${items}
      </tbody>
    </table>

    <div style="text-align:center;margin-top:35px;">
      <a href="https://restufe.vercel.app/admin/orders" style="
        padding:14px 28px;
        border-radius:14px;
        background:#111827;
        color:white;
        text-decoration:none;
        font-weight:700;
      ">
        Manage Orders
      </a>
    </div>

  </div>
`);

/* ===================== USER STATUS EMAIL ===================== */
exports.userOrderStatusEmail = (order, user, items) =>
  exports.baseEmailTemplate(`
  <div style="padding:40px 30px;">

    <div style="
      display:inline-block;
      padding:8px 16px;
      border-radius:999px;
      background:${order.status === "Delivered" ? "#dcfce7" : "#fee2e2"};
      color:${order.status === "Delivered" ? "#16a34a" : "#dc2626"};
      font-size:12px;
      font-weight:700;
      margin-bottom:18px;
    ">
      ORDER ${order.status.toUpperCase()}
    </div>

    <h2 style="margin:0;">Hi ${user.name}</h2>

    <p style="color:#475569;">
      Your order status has been updated.
    </p>

    <div style="
      padding:20px;
      border-radius:18px;
      background:#f8fafc;
      border:1px solid #e2e8f0;
    ">
      <p><b>ID:</b> #${order._id}</p>
      <p><b>Status:</b> ${order.status}</p>
      <p><b>Total:</b> ₹${order.totalPrice}</p>
    </div>

    <table width="100%" cellspacing="0" cellpadding="0" style="
      border-collapse:separate;
      border-spacing:0 10px;
      margin-top:20px;
    ">
      <tbody>
        ${items}
      </tbody>
    </table>

    <div style="text-align:center;margin-top:35px;">
      <a href="https://restufe.vercel.app/orders" style="
        padding:14px 28px;
        border-radius:14px;
        background:linear-gradient(135deg,#f97316,#10b981);
        color:white;
        text-decoration:none;
        font-weight:700;
      ">
        View Order
      </a>
    </div>

  </div>
`);

/* ===================== ADMIN STATUS EMAIL ===================== */
exports.adminOrderStatusEmail = (order, user, items) =>
  exports.baseEmailTemplate(`
  <div style="padding:40px 30px;">

    <h2 style="margin:0;">📦 Order Updated</h2>

    <div style="
      margin-top:20px;
      padding:20px;
      border-radius:20px;
      background:#f8fafc;
      border:1px solid #e2e8f0;
    ">
      <p><b>User:</b> ${user.name}</p>
      <p><b>Email:</b> ${user.email}</p>
      <p><b>ID:</b> #${order._id}</p>
      <p><b>Status:</b> ${order.status}</p>
      <p><b>Total:</b> ₹${order.totalPrice}</p>
    </div>

    <table width="100%" cellspacing="0" cellpadding="0" style="
      border-collapse:separate;
      border-spacing:0 10px;
      margin-top:20px;
    ">
      <tbody>
        ${items}
      </tbody>
    </table>

    <div style="text-align:center;margin-top:35px;">
      <a href="https://restufe.vercel.app/admin/orders" style="
        padding:14px 28px;
        border-radius:14px;
        background:#111827;
        color:white;
        text-decoration:none;
        font-weight:700;
      ">
        Open Admin Panel
      </a>
    </div>

  </div>
`);