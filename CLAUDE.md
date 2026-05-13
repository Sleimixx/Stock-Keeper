# Stock-Keeper

Mobile app for small-shop inventory + point-of-sale. Single local user, offline-first.

## Status

Pre-code. Spec locked, scaffolding not yet started. Develop on branch `claude/barcode-stock-tracker-plan-gb2Jb`.

## Stack

- **Expo (React Native)** — iOS + Android from one codebase
- **expo-sqlite** — local-first storage, no backend
- **expo-camera** — barcode scanning (optional input, not required)
- **expo-print + expo-sharing** — PDF invoices, share via WhatsApp/email
- **Zustand** — state management
- **victory-native** or **react-native-gifted-charts** — reports charts

## Core flows

Four bottom-tab screens:

1. **Sell** (default) — search / scan / type to add products to a cart, checkout creates an invoice and decrements stock in a single SQLite transaction.
2. **Invoices** — list + detail, share as PDF, refund (negative invoice + stock restore).
3. **Inventory** — product CRUD, low-stock badges, barcode optional.
4. **Reports** — revenue cards (today/week/month), line chart, top products, CSV export.

UX principle: the fastest path to a sale is one tap from app open. Don't add menus, categories, or fields unless asked.

## Data model

```
products(id, name, sku, barcode, price_usd, cost_usd, stock, low_stock, created_at)

customers(id, name, phone, location, created_at)

invoices(
  id, number, customer_id,
  customer_name, customer_phone, customer_location,  -- snapshots
  total_usd, total_lbp, exchange_rate,
  payment_method, payment_currency,  -- 'USD' or 'LBP'
  created_at, status
)

invoice_items(id, invoice_id, product_id, name_snapshot, price_usd_snapshot, qty, line_total_usd)

stock_movements(id, product_id, delta, reason, ref_invoice_id, created_at)

settings(key, value)  -- holds exchange_rate, low_stock_default, etc.
```

Snapshots on `invoices` and `invoice_items` are intentional: changing a product price or a customer's phone later must not mutate historical invoices.

## Key decisions

- **No tax.** Don't add a tax field anywhere.
- **No auth, no multi-user.** One local operator. Don't introduce login screens.
- **Dual currency: USD + LBP.** Products are priced in USD. One exchange rate lives in settings and is editable. Each invoice snapshots the rate at time of sale. Invoices and reports display both currencies.
- **Payment currency is tracked per invoice** (`payment_currency` = USD or LBP) so reports can show "collected $X USD + Y LBP" separately — this matters in practice for cash reconciliation.
- **Customers are optional** on every sale. Anonymous checkout stays one tap.
- **Barcode is one input among three** (search, scan, type SKU). Never force scanning.

## Build phases

1. **MVP** — Expo scaffold, SQLite schema + migrations, Inventory CRUD, Sell screen with cart + checkout.
2. **Invoices** — list, detail, PDF generation, share sheet.
3. **Reports** — aggregation queries, charts, top products, CSV export.
4. **Polish** — refunds, low-stock alerts, optional Bluetooth ESC/POS receipt printing, optional Supabase cloud sync for multi-device.

## Conventions

- Money stored as integers in cents (USD) to avoid float drift. LBP computed on read using the invoice's snapshotted rate.
- All stock changes go through `stock_movements` — never mutate `products.stock` without writing a movement row, so the audit log stays complete.
- Checkout is one SQL transaction: insert invoice → insert invoice_items → insert stock_movements → update product stock. All or nothing.
