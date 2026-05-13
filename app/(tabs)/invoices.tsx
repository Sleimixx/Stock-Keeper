import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getInvoices } from '@/db/database';
import { formatUsd } from '@/utils/currency';
import type { Invoice } from '@/types';

export default function InvoicesScreen() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(useCallback(() => {
    setInvoices(getInvoices());
  }, []));

  const filtered = query.trim()
    ? invoices.filter((i) =>
        i.number.includes(query) ||
        (i.customer_name ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : invoices;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search invoice # or customer..."
        value={query}
        onChangeText={setQuery}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.empty}>No invoices yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: item.id } })}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowTop}>
                <Text style={styles.number}>{item.number}</Text>
                {item.status === 'refunded' && <View style={styles.refundBadge}><Text style={styles.refundBadgeText}>Refunded</Text></View>}
              </View>
              <Text style={styles.sub}>
                {new Date(item.created_at).toLocaleDateString()}{item.customer_name ? ` · ${item.customer_name}` : ''}
              </Text>
              <Text style={styles.sub}>{item.payment_method} · {item.payment_currency}</Text>
            </View>
            <Text style={[styles.amount, item.status === 'refunded' && { color: '#EF4444' }]}>
              {item.status === 'refunded' ? '−' : ''}{formatUsd(item.total_usd)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  search: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  row: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  number: { fontSize: 15, fontWeight: '700' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: '#111827' },
  refundBadge: { backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  refundBadgeText: { fontSize: 11, fontWeight: '600', color: '#EF4444' },
  empty: { textAlign: 'center', marginTop: 60, color: '#9CA3AF', fontSize: 16 },
});
