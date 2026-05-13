import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Invoice, InvoiceItem } from '../types';
import { formatUsd, formatLbpRaw } from './currency';

export async function shareInvoicePdf(invoice: Invoice, items: InvoiceItem[]) {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td>${item.name_snapshot}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">${formatUsd(item.price_usd_snapshot)}</td>
        <td style="text-align:right">${formatUsd(item.line_total_usd)}</td>
      </tr>`,
    )
    .join('');

  const customerBlock = invoice.customer_name
    ? `<p><strong>Customer:</strong> ${invoice.customer_name}${invoice.customer_phone ? ` · ${invoice.customer_phone}` : ''}${invoice.customer_location ? ` · ${invoice.customer_location}` : ''}</p>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { color: #555; font-size: 13px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #f3f4f6; text-align: left; padding: 8px; font-size: 13px; }
  td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  .totals { margin-top: 20px; text-align: right; }
  .totals p { margin: 4px 0; font-size: 14px; }
  .totals .grand { font-size: 18px; font-weight: bold; }
  .footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; }
</style>
</head>
<body>
  <h1>Invoice ${invoice.number}</h1>
  <div class="meta">
    <p>${new Date(invoice.created_at).toLocaleString()}</p>
    ${customerBlock}
    <p>Payment: ${invoice.payment_method.toUpperCase()} · ${invoice.payment_currency}</p>
  </div>
  <table>
    <thead>
      <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <p class="grand">${formatUsd(invoice.total_usd)}</p>
    <p style="color:#555">${formatLbpRaw(invoice.total_lbp)}</p>
    <p style="font-size:11px;color:#aaa">Rate: 1 USD = ${invoice.exchange_rate.toLocaleString()} LBP</p>
  </div>
  <div class="footer">Stock Keeper · ${invoice.number}</div>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Invoice ${invoice.number}` });
}
