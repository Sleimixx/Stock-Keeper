import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getInvoice, getInvoiceItems, refundInvoice } from '@/db/database';
import { useSettingsStore } from '@/store/settingsStore';
import { formatUsd, formatLbpRaw } from '@/utils/currency';
import { shareInvoicePdf } from '@/utils/pdf';
import type { Invoice, InvoiceItem } from '@/types';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const exchangeRate = useSettingsStore((s) => s.exchangeRate);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [sharing, setSharing] = useState(false);

  useFocusEffect(useCallback(() => {
    const inv = getInvoice(Number(id));
    setInvoice(inv);
    setItems(getInvoiceItems(Number(id)));
  }, [id]));

  const handleRefund = () => {
    Alert.alert('Refund invoice?', 'Stock will be restored and invoice marked as refunded.', [
      { text: 'Cancel' },
      {
        text: 'Refund', style: 'destructive', onPress: () => {
          refundInvoice(Number(id));
          setInvoice((prev) => prev ? { ...prev, status: 'refunded' } : prev);
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!invoice) return;
    setSharing(true);
    try {
      await shareInvoicePdf(invoice, items);
    } finally {
      setSharing(false);
    }
  };

  if (!invoice) return <View style={styles.center}><Text>Loading…</Text></View>;

  return (
    <>
      <Stack.Screen options={{ title: invoice.number }} />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Header card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.number}>{invoice.number}</Text>
            <View style={[styles.badge, invoice.status === 'refunded' ? styles.badgeRefund : styles.badgePaid]}>
              <Text style={[styles.badgeText, invoice.status === 'refunded' ? styles.badgeRefundText : styles.badgePaidText]}>
                {invoice.status === 'refunded' ? 'Refunded' : 'Paid'}
              </Text>
            </View>
          </View>
          <Text style={styles.meta}>{new Date(invoice.created_at).toLocaleString()}</Text>
          {invoice.customer_name && (
            <Text style={styles.meta}>
              👤 {invoice.customer_name}{invoice.customer_phone ? ` · ${invoice.customer_phone}` : ''}{invoice.customer_location ? ` · ${invoice.customer_location}` : ''}
            </Text>
          )}
          <Text style={styles.meta}>Payment: {invoice.payment_method} · {invoice.payment_currency}</Text>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name_snapshot}</Text>
              <Text style={styles.itemQty}>×{item.qty}</Text>
              <Text style={styles.itemTotal}>{formatUsd(item.line_total_usd)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalUsd}>{formatUsd(invoice.total_usd)}</Text>
              <Text style={styles.totalLbp}>{formatLbpRaw(invoice.total_lbp)}</Text>
              <Text style={styles.rateHint}>Rate: 1 USD = {invoice.exchange_rate.toLocaleString()} LBP</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing ? <ActivityIndicator color="#fff" /> : <Text style={styles.shareBtnText}>📤  Share PDF</Text>}
        </TouchableOpacity>

        {invoice.status === 'paid' && (
          <TouchableOpacity style={styles.refundBtn} onPress={handleRefund}>
            <Text style={styles.refundBtnText}>Refund Invoice</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: { fontSize: 20, fontWeight: '800' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgePaid: { backgroundColor: '#DCFCE7' },
  badgeRefund: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 13, fontWeight: '700' },
  badgePaidText: { color: '#16A34A' },
  badgeRefundText: { color: '#EF4444' },
  meta: { fontSize: 14, color: '#6B7280' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  itemName: { flex: 1, fontSize: 14 },
  itemQty: { fontSize: 14, color: '#6B7280', marginHorizontal: 12 },
  itemTotal: { fontSize: 14, fontWeight: '600', minWidth: 64, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalUsd: { fontSize: 20, fontWeight: '800' },
  totalLbp: { fontSize: 13, color: '#6B7280' },
  rateHint: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  shareBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  shareBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  refundBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' },
  refundBtnText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});
