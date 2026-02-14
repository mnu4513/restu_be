exports.userOrderEmail = (order, user, itemsHtml) => `
<div style="font-family:Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
  <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    
    <div style="background:#10b981; color:#fff; padding:20px; text-align:center;">
      <h2 style="margin:0;">Order Confirmed 🎉</h2>
    </div>

    <div style="padding:30px; color:#333;">
      <p>Hello <strong>${user.name}</strong>,</p>

      <p>Thank you for shopping with <strong>${process.env.APP_NAME}</strong>.</p>

      <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin:20px 0;">
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Total Amount:</strong> ₹${order.totalPrice}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </div>

      <h3>Items Ordered</h3>

      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-top:10px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="text-align:left; padding:10px;">Image</th>
            <th style="text-align:left; padding:10px;">Item</th>
            <th style="text-align:center; padding:10px;">Qty</th>
            <th style="text-align:right; padding:10px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h3 style="margin-top:25px;">Delivery Address</h3>
      <p>
        ${order.deliveryAddress.addressLine}<br/>
        ${order.deliveryAddress.city}, ${order.deliveryAddress.state}<br/>
        ${order.deliveryAddress.pincode}
      </p>

      <p>We will notify you when your order is out for delivery.</p>

      <p style="margin-top:30px;">Regards,<br/>${process.env.APP_NAME}</p>
    </div>

    <div style="background:#f9fafb; text-align:center; padding:15px; font-size:12px; color:#888;">
      <a href="https://restufe.vercel.app" target="_blank" style="text-decoration:none; color:#888;">
        © ${new Date().getFullYear()} ${process.env.APP_NAME}
      </a>
    </div>

  </div>
</div>
`;



exports.adminOrderEmail = (order, user, itemsHtml) => `
<div style="font-family:Arial, sans-serif;">
  <h2>🚨 New Order Received</h2>

  <p><strong>Customer:</strong> ${user.name}</p>
  <p><strong>Email:</strong> ${user.email}</p>
  <p><strong>Order ID:</strong> ${order._id}</p>
  <p><strong>Total:</strong> ₹${order.totalPrice}</p>

  <h3>Address: </h3>
     <p>
        ${order.deliveryAddress.addressLine}<br/>
        ${order.deliveryAddress.city}, ${order.deliveryAddress.state}<br/>
        ${order.deliveryAddress.pincode}
      </p>


      <a href=https://restufe.vercel.app/admin/orders/> 
      <button > Manage Order</button>
      </a>
  <h3>Items</h3>

  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
    <thead>
      <tr style="background:#f3f4f6;">
        <th style="padding:8px;">Image</th>
        <th style="padding:8px;">Item</th>
        <th style="padding:8px;">Qty</th>
        <th style="padding:8px;">Price</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>
</div>
`;


exports.userOrderStatusEmail = (order, user, itemsHtml) => `
<div style="font-family:Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
  <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    
    <div style="background:${order.status === "Delivered" ? "#10b981" : "#ef4444"}; color:#fff; padding:20px; text-align:center;">
      <h2 style="margin:0;">Order ${order.status}</h2>
    </div>

    <div style="padding:30px; color:#333;">
      <p>Hello <strong>${user.name}</strong>,</p>

      <p>Your order status has been updated.</p>

      <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin:20px 0;">
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Total:</strong> ₹${order.totalPrice}</p>
      </div>

      <h3>Items</h3>

      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px;">Image</th>
            <th style="padding:10px;">Item</th>
            <th style="padding:10px;">Qty</th>
            <th style="padding:10px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h3 style="margin-top:25px;">Delivery Address</h3>
      <p>
        ${order.deliveryAddress.addressLine}<br/>
        ${order.deliveryAddress.city}, ${order.deliveryAddress.state}<br/>
        ${order.deliveryAddress.pincode}
      </p>

      <p style="margin-top:30px;">Regards,<br/>${process.env.APP_NAME}</p>
    </div>
  </div>
</div>
`;


exports.adminOrderStatusEmail = (order, user, itemsHtml) => `
<h2>📦 Order Status Updated</h2>

<p><strong>User:</strong> ${user.name}</p>
<p><strong>Email:</strong> ${user.email}</p>
<p><strong>Order ID:</strong> ${order._id}</p>
<p><strong>Status:</strong> ${order.status}</p>
<p><strong>Total:</strong> ₹${order.totalPrice}</p>

<h3>Items</h3>

<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="padding:8px;">Image</th>
      <th style="padding:8px;">Item</th>
      <th style="padding:8px;">Qty</th>
      <th style="padding:8px;">Price</th>
    </tr>
  </thead>
  <tbody>
    ${itemsHtml}
  </tbody>
</table>
`;
