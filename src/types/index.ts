export interface Product {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  price_usd: number; // cents
  cost_usd: number;  // cents
  stock: number;
  low_stock: number;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  location: string | null;
  created_at: string;
}

export interface Invoice {
  id: number;
  number: string;
  customer_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_location: string | null;
  total_usd: number; // cents
  total_lbp: number;
  exchange_rate: number;
  payment_method: string;
  payment_currency: 'USD' | 'LBP';
  created_at: string;
  status: 'paid' | 'refunded';
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number | null;
  name_snapshot: string;
  price_usd_snapshot: number; // cents
  qty: number;
  line_total_usd: number; // cents
}

export interface StockMovement {
  id: number;
  product_id: number;
  delta: number;
  reason: string;
  ref_invoice_id: number | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface CheckoutData {
  customer: Pick<Customer, 'name' | 'phone' | 'location'> | null;
  payment_method: string;
  payment_currency: 'USD' | 'LBP';
}

export interface ReportSummary {
  total_usd: number;
  total_lbp: number;
  invoice_count: number;
}

export interface TopProduct {
  product_id: number | null;
  name: string;
  qty_sold: number;
  revenue_usd: number;
}

export interface DailyRevenue {
  date: string;
  total_usd: number;
}
