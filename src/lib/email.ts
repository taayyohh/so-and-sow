import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.forwardemail.net',
  port: 465,
  secure: true,
  auth: {
    user: 'no-reply@ifthen.club',
    pass: process.env.FORWARD_EMAIL,
  },
});

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string | null;
}

export async function sendOrderConfirmation(
  to: string,
  customerName: string,
  items: OrderItem[],
  total: number,
  shippingAmount: number
) {
  const itemRows = items.map(item =>
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #333; color: #ccc;">${item.name}${item.size ? ` (${item.size})` : ''}</td>
      <td style="padding: 8px; border-bottom: 1px solid #333; color: #ccc; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #333; color: #ccc; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="background: #000; color: #fff; font-family: 'Courier New', monospace; padding: 40px; max-width: 600px; margin: 0 auto;">
      <h1 style="font-size: 18px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 30px;">Order Confirmed</h1>
      <p style="color: #aaa; font-size: 14px;">Hi ${customerName || 'there'},</p>
      <p style="color: #aaa; font-size: 14px;">Thank you for your order. Here are the details:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <th style="padding: 8px; border-bottom: 1px solid #555; color: #888; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Item</th>
          <th style="padding: 8px; border-bottom: 1px solid #555; color: #888; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
          <th style="padding: 8px; border-bottom: 1px solid #555; color: #888; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Price</th>
        </tr>
        ${itemRows}
      </table>

      <div style="border-top: 1px solid #555; padding-top: 15px; margin-top: 10px;">
        <p style="color: #aaa; font-size: 14px; margin: 5px 0;">Shipping: $${shippingAmount.toFixed(2)}</p>
        <p style="color: #fff; font-size: 16px; font-weight: bold; margin: 5px 0;">Total: $${total.toFixed(2)}</p>
      </div>

      <p style="color: #666; font-size: 12px; margin-top: 30px;">You can check your order status at <a href="https://sowandso.nappynina.com/orders" style="color: #aaa;">sowandso.nappynina.com/orders</a></p>
      <p style="color: #666; font-size: 12px;">Questions? Reach out to <a href="mailto:team@lucid.haus" style="color: #aaa;">team@lucid.haus</a></p>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
        <p style="color: #555; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Lucidhaus</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: 'Lucidhaus <no-reply@ifthen.club>',
      to,
      subject: `Order Confirmed — Lucidhaus`,
      html,
    });
    console.log('Order confirmation email sent to', to);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    // Don't throw — email failure shouldn't break the order
  }
}
