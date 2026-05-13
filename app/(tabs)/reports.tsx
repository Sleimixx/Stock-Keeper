import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { getReportSummary, getTopProducts, getDailyRevenue, getInvoices } from '@/db/database';
import { useSettingsStore } from '@/store/settingsStore';
import { formatUsd, formatLbpRaw } from '@/utils/currency';
import type { ReportSummary, TopProduct, DailyRevenue } from '@/types';

type Range = 'today' | 'week' | 'month';

function dateRange(range: Range): [string, string] {
  const now = new Date();
  const to = new Date(now);
  to.setDate(to.getDate() + 1);
  const from = new Date(now);
  if (range === 'today') {
    from.setHours(0, 0, 0, 0);
  } else if (range === 'week') {
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else {
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
  }
  return [from.toISOString(), to.toISOString()];
}

export default function ReportsScreen() {
  const router = useRouter();
  const exchangeRate = useSettingsStore((s) => s.exchangeRate);
  const [range, setRange] = useState<Range>('today');
  const [summary, setSummary] = useState<ReportSummary>({ total_usd: 0, total_lbp: 0, invoice_count: 0 });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);

  useFocusEffect(useCallback(() => {
    load(range);
  }, [range]));

  const load = (r: Range) => {
    const [from, to] = dateRange(r);
    setSummary(getReportSummary(from, to));
    setTopProducts(getTopProducts(from, to));
    setDailyRevenue(getDailyRevenue(from, to));
  };

  const exportCsv = async () => {
    const invoices = getInvoices();
    const header = 'Invoice #,Date,Customer,Total USD,Total LBP,Payment,Currency,Status\n';
    const rows = invoices.map((inv) =>
      [
        inv.number,
        new Date(inv.created_at).toLocaleDateString(),
        inv.customer_name ?? '',
        (inv.total_usd / 100).toFixed(2),
        inv.total_lbp,
        inv.payment_method,
        inv.payment_currency,
        inv.status,
      ].join(','),
    ).join('\n');
    await Share.share({ message: header + rows, title: 'Invoices Export' });
  };

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.total_usd), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Settings shortcut */}
      <TouchableOpacity style={styles.settingsLink} onPress={() => router.push('/settings')}>
        <Text style={styles.settingsLinkText}>⚙️  Exchange Rate: 1 USD = {exchangeRate.toLocaleString()} LBP</Text>
      </TouchableOpacity>

      {/* Range tabs */}
      <View style={styles.rangeTabs}>
        {(['today', 'week', 'month'] as Range[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeTab, range === r && styles.rangeTabActive]}
            onPress={() => { setRange(r); load(r); }}
          >
            <Text style={[styles.rangeTabText, range === r && styles.rangeTabActiveText]}>
              {r === 'today' ? 'Today' : r === 'week' ? '7 Days' : '30 Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary cards */}
      <View style={styles.cards}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardLabel}>Revenue</Text>
          <Text style={styles.cardValue}>{formatUsd(summary.total_usd)}</Text>
          <Text style={styles.cardSub}>{formatLbpRaw(summary.total_lbp)}</Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardLabel}>Sales</Text>
          <Text style={styles.cardValue}>{summary.invoice_count}</Text>
          <Text style={styles.cardSub}>invoices</Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardLabel}>Avg Sale</Text>
          <Text style={styles.cardValue}>
            {summary.invoice_count > 0 ? formatUsd(Math.round(summary.total_usd / summary.invoice_count)) : '$0'}
          </Text>
        </View>
      </View>

      {/* Bar chart */}
      {dailyRevenue.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Daily Revenue</Text>
          <View style={styles.bars}>
            {dailyRevenue.map((d) => (
              <View key={d.date} style={styles.barCol}>
                <View style={[styles.bar, { height: Math.max(4, (d.total_usd / maxRevenue) * 80) }]} />
                <Text style={styles.barLabel}>{new Date(d.date).getDate()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Top products */}
      {topProducts.length > 0 && (
        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Top Products</Text>
          {topProducts.map((p, i) => (
            <View key={`${p.product_id}-${i}`} style={styles.topRow}>
              <Text style={styles.topRank}>#{i + 1}</Text>
              <Text style={styles.topName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.topQty}>{p.qty_sold} sold</Text>
              <Text style={styles.topRevenue}>{formatUsd(p.revenue_usd)}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.exportBtn} onPress={exportCsv}>
        <Text style={styles.exportBtnText}>📤  Export CSV</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  settingsLink: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12 },
  settingsLinkText: { fontSize: 14, color: '#2563EB', fontWeight: '500' },
  rangeTabs: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 3, gap: 3 },
  rangeTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  rangeTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  rangeTabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  rangeTabActiveText: { color: '#111827', fontWeight: '700' },
  cards: { flexDirection: 'row', gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 4 },
  cardLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  cardValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  cardSub: { fontSize: 11, color: '#9CA3AF' },
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 100 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '100%', backgroundColor: '#2563EB', borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#9CA3AF' },
  listCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topRank: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', width: 24 },
  topName: { flex: 1, fontSize: 14 },
  topQty: { fontSize: 13, color: '#6B7280' },
  topRevenue: { fontSize: 14, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  exportBtn: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  exportBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
});
