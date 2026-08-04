import { orderStatusLabel } from "@/lib/order-status";
import type { AdminOrder, OrderItem } from "@/lib/types";

type InvoiceCompany = {
  name: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo_url?: string | null;
  currency_symbol?: string;
};

const escape = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

/**
 * Standalone printable invoice, opened in its own window so the admin layout
 * never needs print-specific styles. Ported from the previous build.
 */
export function invoiceHtml(order: AdminOrder, items: OrderItem[], company: InvoiceCompany): string {
  const currency = company.currency_symbol ?? "৳";
  const money = (amount: number) => `${currency}${Number(amount).toLocaleString("en-IN")}`;

  const date = order.order_date
    ? new Date(order.order_date).toLocaleDateString("en-GB", {
        timeZone: "Asia/Dhaka",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const rows = items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">
          ${escape(item.product_name)}
          ${item.variant_label ? `<span style="color:#666;font-size:12px"> — ${escape(item.variant_label)}</span>` : ""}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${money(item.unit_price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${money(item.total_price)}</td>
      </tr>`,
    )
    .join("");

  const summaryRow = (label: string, value: string, strong = false) => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:${strong ? 16 : 13}px${
      strong ? ";font-weight:700;color:#2A8B74;border-top:1px solid #e5e7eb;padding-top:10px" : ""
    }">
      <span style="${strong ? "" : "color:#666"}">${escape(label)}</span>
      <span>${value}</span>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice ${escape(order.order_number)}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 20px; color: #1a1a1a; }
    .invoice { max-width: 800px; margin: 0 auto; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;border-bottom:3px solid #2A8B74;padding-bottom:20px">
      <div>
        ${company.logo_url ? `<img src="${escape(company.logo_url)}" alt="" style="height:40px;margin-bottom:8px">` : ""}
        <h1 style="margin:0;color:#2A8B74;font-size:24px">${escape(company.name)}</h1>
        <p style="margin:4px 0 0;color:#666;font-size:12px">${escape(company.tagline ?? "Guided by nature")}</p>
        ${company.address ? `<p style="margin:4px 0 0;color:#666;font-size:12px">${escape(company.address)}</p>` : ""}
        ${
          company.phone || company.email
            ? `<p style="margin:2px 0 0;color:#666;font-size:12px">${escape(
                [company.phone, company.email].filter(Boolean).join(" · "),
              )}</p>`
            : ""
        }
      </div>
      <div style="text-align:right">
        <h2 style="margin:0;color:#2A8B74;font-size:20px">INVOICE</h2>
        <p style="margin:4px 0 0;color:#666;font-size:13px">#${escape(order.order_number)}</p>
        <p style="margin:2px 0 0;color:#666;font-size:12px">${escape(date)}</p>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-bottom:24px">
      <div>
        <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px">BILL TO</p>
        <p style="margin:4px 0 0;font-weight:600;font-size:14px">${escape(order.customer.name)}</p>
        ${order.customer.phone ? `<p style="margin:2px 0 0;color:#666;font-size:12px">${escape(order.customer.phone)}</p>` : ""}
        ${order.customer.address ? `<p style="margin:2px 0 0;color:#666;font-size:12px">${escape(order.customer.address)}</p>` : ""}
      </div>
      <div style="text-align:right">
        <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px">STATUS</p>
        <p style="margin:4px 0 0;font-weight:600;font-size:14px;color:${order.status === "delivered" ? "#22c55e" : "#f59e0b"}">${escape(orderStatusLabel(order.status))}</p>
        <p style="margin:6px 0 0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px">PAYMENT</p>
        <p style="margin:4px 0 0;font-size:13px">${escape(order.payment.method ?? "COD")}</p>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#666;border-bottom:2px solid #e5e7eb">#</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #e5e7eb">Product</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#666;border-bottom:2px solid #e5e7eb">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;border-bottom:2px solid #e5e7eb">Price</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;border-bottom:2px solid #e5e7eb">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-bottom:30px">
      <div style="width:260px">
        ${summaryRow("Subtotal", money(order.subtotal))}
        ${order.discount > 0 ? summaryRow(`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`, `− ${money(order.discount)}`) : ""}
        ${summaryRow("Delivery", order.delivery_charge === 0 ? "Free" : money(order.delivery_charge))}
        ${summaryRow("Total", money(order.total), true)}
      </div>
    </div>

    ${order.notes ? `<p style="font-size:12px;color:#666;margin-bottom:20px"><strong>Notes:</strong> ${escape(order.notes)}</p>` : ""}

    <div style="border-top:1px solid #e5e7eb;padding-top:16px;text-align:center;color:#888;font-size:11px">
      <p style="margin:0">Thank you for your order! | ${escape(company.name)}</p>
      <p style="margin:4px 0 0">This is a computer generated invoice.</p>
    </div>

    <div class="no-print" style="text-align:center;margin-top:20px">
      <button onclick="window.print()" style="background:#2A8B74;color:white;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:14px">
        Print / Download PDF
      </button>
    </div>
  </div>
</body>
</html>`;
}

/** Opens the invoice in a new tab. Returns false when a popup blocker stops it. */
export function openInvoice(order: AdminOrder, items: OrderItem[], company: InvoiceCompany): boolean {
  const win = window.open("", "_blank");

  if (!win) return false;

  win.document.write(invoiceHtml(order, items, company));
  win.document.close();

  return true;
}
