import * as SQLite from 'expo-sqlite';
import type { Product, Customer, Invoice, InvoiceItem, CartItem, CheckoutData, TopProduct, DailyRevenue, ReportSummary } from '../types';

export const db = SQLite.openDatabaseSync('stockkeeper.db');

export function initDatabase() {
  db.execSync(`PRAGMA journal_mode = WAL;`);
  db.execSync(`PRAGMA foreign_keys = ON;`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      sku        TEXT,
      barcode    TEXT,
      price_usd  INTEGER NOT NULL DEFAULT 0,
      cost_usd   INTEGER NOT NULL DEFAULT 0,
      stock      INTEGER NOT NULL DEFAULT 0,
      low_stock  INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      phone      TEXT,
      location   TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      number            TEXT NOT NULL UNIQUE,
      customer_id       INTEGER REFERENCES customers(id),
      customer_name     TEXT,
      customer_phone    TEXT,
      customer_location TEXT,
      total_usd         INTEGER NOT NULL DEFAULT 0,
      total_lbp         INTEGER NOT NULL DEFAULT 0,
      exchange_rate     INTEGER NOT NULL DEFAULT 0,
      payment_method    TEXT NOT NULL DEFAULT 'cash',
      payment_currency  TEXT NOT NULL DEFAULT 'USD',
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      status            TEXT NOT NULL DEFAULT 'paid'
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id          INTEGER NOT NULL REFERENCES invoices(id),
      product_id          INTEGER REFERENCES products(id),
      name_snapshot       TEXT NOT NULL,
      price_usd_snapshot  INTEGER NOT NULL,
      qty                 INTEGER NOT NULL,
      line_total_usd      INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id     INTEGER NOT NULL REFERENCES products(id),
      delta          INTEGER NOT NULL,
      reason         TEXT NOT NULL,
      ref_invoice_id INTEGER REFERENCES invoices(id),
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Default settings
  db.runSync(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('exchange_rate', '90000')`,
  );
  db.runSync(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('low_stock_default', '5')`,
  );
  db.runSync(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('invoice_counter', '0')`,
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    [key],
  );
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  db.runSync(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value]);
}

export function getExchangeRate(): number {
  return parseInt(getSetting('exchange_rate') ?? '90000', 10);
}

// ─── Products ────────────────────────────────────────────────────────────────

export function getProducts(): Product[] {
  return db.getAllSync<Product>(`SELECT * FROM products ORDER BY name ASC`);
}

export function searchProducts(query: string): Product[] {
  const q = `%${query}%`;
  return db.getAllSync<Product>(
    `SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? OR barcode LIKE ? ORDER BY name ASC`,
    [q, q, q],
  );
}

export function getProductByBarcode(barcode: string): Product | null {
  return db.getFirstSync<Product>(
    `SELECT * FROM products WHERE barcode = ?`,
    [barcode],
  ) ?? null;
}

export function getProduct(id: number): Product | null {
  return db.getFirstSync<Product>(
    `SELECT * FROM products WHERE id = ?`,
    [id],
  ) ?? null;
}

export function insertProduct(p: Omit<Product, 'id' | 'created_at'>): number {
  const result = db.runSync(
    `INSERT INTO products (name, sku, barcode, price_usd, cost_usd, stock, low_stock)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [p.name, p.sku ?? null, p.barcode ?? null, p.price_usd, p.cost_usd, p.stock, p.low_stock],
  );
  if (p.stock > 0) {
    db.runSync(
      `INSERT INTO stock_movements (product_id, delta, reason) VALUES (?, ?, 'initial')`,
      [result.lastInsertRowId, p.stock],
    );
  }
  return result.lastInsertRowId;
}

export function updateProduct(id: number, p: Partial<Omit<Product, 'id' | 'created_at'>>) {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (p.name !== undefined) { fields.push('name = ?'); values.push(p.name); }
  if (p.sku !== undefined) { fields.push('sku = ?'); values.push(p.sku); }
  if (p.barcode !== undefined) { fields.push('barcode = ?'); values.push(p.barcode); }
  if (p.price_usd !== undefined) { fields.push('price_usd = ?'); values.push(p.price_usd); }
  if (p.cost_usd !== undefined) { fields.push('cost_usd = ?'); values.push(p.cost_usd); }
  if (p.low_stock !== undefined) { fields.push('low_stock = ?'); values.push(p.low_stock); }
  if (fields.length === 0) return;
  values.push(id);
  db.runSync(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function adjustStock(productId: number, delta: number, reason: string, refInvoiceId?: number) {
  db.runSync(
    `UPDATE products SET stock = stock + ? WHERE id = ?`,
    [delta, productId],
  );
  db.runSync(
    `INSERT INTO stock_movements (product_id, delta, reason, ref_invoice_id) VALUES (?, ?, ?, ?)`,
    [productId, delta, reason, refInvoiceId ?? null],
  );
}

export function deleteProduct(id: number) {
  db.runSync(`DELETE FROM products WHERE id = ?`, [id]);
}

// ─── Customers ───────────────────────────────────────────────────────────────

export function searchCustomers(query: string): Customer[] {
  const q = `%${query}%`;
  return db.getAllSync<Customer>(
    `SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC`,
    [q, q],
  );
}

export function upsertCustomer(name: string, phone: string | null, location: string | null): Customer {
  const existing = db.getFirstSync<Customer>(
    `SELECT * FROM customers WHERE name = ? LIMIT 1`,
    [name],
  );
  if (existing) {
    db.runSync(
      `UPDATE customers SET phone = ?, location = ? WHERE id = ?`,
      [phone ?? existing.phone, location ?? existing.location, existing.id],
    );
    return { ...existing, phone: phone ?? existing.phone, location: location ?? existing.location };
  }
  const result = db.runSync(
    `INSERT INTO customers (name, phone, location) VALUES (?, ?, ?)`,
    [name, phone ?? null, location ?? null],
  );
  return { id: result.lastInsertRowId, name, phone: phone ?? null, location: location ?? null, created_at: new Date().toISOString() };
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export function checkout(items: CartItem[], data: CheckoutData): number {
  const exchangeRate = getExchangeRate();
  const totalUsd = items.reduce((sum, i) => sum + i.product.price_usd * i.qty, 0);
  const totalLbp = Math.round((totalUsd / 100) * exchangeRate);

  let customerId: number | null = null;
  if (data.customer?.name) {
    const c = upsertCustomer(data.customer.name, data.customer.phone ?? null, data.customer.location ?? null);
    customerId = c.id;
  }

  // Generate invoice number
  db.runSync(`UPDATE settings SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'invoice_counter'`);
  const counter = parseInt(getSetting('invoice_counter') ?? '1', 10);
  const invoiceNumber = `INV-${String(counter).padStart(5, '0')}`;

  const invoiceResult = db.runSync(
    `INSERT INTO invoices (number, customer_id, customer_name, customer_phone, customer_location,
      total_usd, total_lbp, exchange_rate, payment_method, payment_currency)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoiceNumber,
      customerId,
      data.customer?.name ?? null,
      data.customer?.phone ?? null,
      data.customer?.location ?? null,
      totalUsd,
      totalLbp,
      exchangeRate,
      data.payment_method,
      data.payment_currency,
    ],
  );
  const invoiceId = invoiceResult.lastInsertRowId;

  for (const item of items) {
    const lineTotal = item.product.price_usd * item.qty;
    db.runSync(
      `INSERT INTO invoice_items (invoice_id, product_id, name_snapshot, price_usd_snapshot, qty, line_total_usd)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoiceId, item.product.id, item.product.name, item.product.price_usd, item.qty, lineTotal],
    );
    adjustStock(item.product.id, -item.qty, 'sale', invoiceId);
  }

  return invoiceId;
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export function getInvoices(): Invoice[] {
  return db.getAllSync<Invoice>(`SELECT * FROM invoices ORDER BY created_at DESC`);
}

export function getInvoice(id: number): Invoice | null {
  return db.getFirstSync<Invoice>(`SELECT * FROM invoices WHERE id = ?`, [id]) ?? null;
}

export function getInvoiceItems(invoiceId: number): InvoiceItem[] {
  return db.getAllSync<InvoiceItem>(
    `SELECT * FROM invoice_items WHERE invoice_id = ?`,
    [invoiceId],
  );
}

export function refundInvoice(invoiceId: number) {
  const items = getInvoiceItems(invoiceId);
  for (const item of items) {
    if (item.product_id) {
      adjustStock(item.product_id, item.qty, 'refund', invoiceId);
    }
  }
  db.runSync(`UPDATE invoices SET status = 'refunded' WHERE id = ?`, [invoiceId]);
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export function getReportSummary(from: string, to: string): ReportSummary {
  const row = db.getFirstSync<ReportSummary>(
    `SELECT
       COALESCE(SUM(total_usd), 0) AS total_usd,
       COALESCE(SUM(total_lbp), 0) AS total_lbp,
       COUNT(*) AS invoice_count
     FROM invoices
     WHERE status = 'paid' AND created_at >= ? AND created_at < ?`,
    [from, to],
  );
  return row ?? { total_usd: 0, total_lbp: 0, invoice_count: 0 };
}

export function getTopProducts(from: string, to: string, limit = 10): TopProduct[] {
  return db.getAllSync<TopProduct>(
    `SELECT
       ii.product_id,
       ii.name_snapshot AS name,
       SUM(ii.qty) AS qty_sold,
       SUM(ii.line_total_usd) AS revenue_usd
     FROM invoice_items ii
     JOIN invoices inv ON inv.id = ii.invoice_id
     WHERE inv.status = 'paid' AND inv.created_at >= ? AND inv.created_at < ?
     GROUP BY ii.product_id, ii.name_snapshot
     ORDER BY qty_sold DESC
     LIMIT ?`,
    [from, to, limit],
  );
}

export function getDailyRevenue(from: string, to: string): DailyRevenue[] {
  return db.getAllSync<DailyRevenue>(
    `SELECT
       DATE(created_at) AS date,
       SUM(total_usd) AS total_usd
     FROM invoices
     WHERE status = 'paid' AND created_at >= ? AND created_at < ?
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [from, to],
  );
}
