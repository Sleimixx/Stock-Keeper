import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { checkout, searchCustomers } from '@/db/database';
import { useCartStore } from '@/store/cartStore';
import { useSettingsStore } from '@/store/settingsStore';
import { formatUsd, formatLbp } from '@/utils/currency';

type PayCurrency = 'USD' | 'LBP';
type PayMethod = 'cash' | 'card' | 'transfer';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, totalUsd, clear } = useCartStore();
  const exchangeRate = useSettingsStore((s) => s.exchangeRate);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [payCurrency, setPayCurrency] = useState<PayCurrency>('USD');
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [loading, setLoading] = useState(false);

  const total = totalUsd();

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const invoiceId = checkout(items, {
        customer: customerName.trim()
          ? { name: customerName.trim(), phone: customerPhone.trim() || null, location: customerLocation.trim() || null }
          : null,
        payment_method: payMethod,
        payment_currency: payCurrency,
      });
      clear();
      router.replace({ pathname: '/invoice/[id]', params: { id: invoiceId } });
    } catch (e) {
      Alert.alert('Error', 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 20 }} keyboardShouldPersistTaps="handled">
      {/* Order summary */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {items.map((item) => (
          <View key={item.product.id} style={styles.summaryRow}>
            <Text style={styles.summaryName}>{item.product.name} × {item.qty}</Text>
            <Text style={styles.summaryPrice}>{formatUsd(item.product.price_usd * item.qty)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.totalUsd}>{formatUsd(total)}</Text>
            <Text style={styles.totalLbp}>{formatLbp(total, exchangeRate)}</Text>
          </View>
        </View>
      </View>

      {/* Payment */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <Text style={styles.label}>Currency</Text>
        <View style={styles.toggle}>
          {(['USD', 'LBP'] as PayCurrency[]).map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.toggleBtn, payCurrency === c && styles.toggleActive]}
              onPress={() => setPayCurrency(c)}
            >
              <Text style={[styles.toggleText, payCurrency === c && styles.toggleActiveText]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.label, { marginTop: 12 }]}>Method</Text>
        <View style={styles.toggle}>
          {(['cash', 'card', 'transfer'] as PayMethod[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, payMethod === m && styles.toggleActive]}
              onPress={() => setPayMethod(m)}
            >
              <Text style={[styles.toggleText, payMethod === m && styles.toggleActiveText]}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Customer (optional) */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput style={styles.input} placeholder="Name" value={customerName} onChangeText={setCustomerName} />
        <TextInput style={styles.input} placeholder="Phone" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Location" value={customerLocation} onChangeText={setCustomerLocation} />
      </View>

      <TouchableOpacity style={styles.confirmBtn} onPress={handleCheckout} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Confirm Sale</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  optional: { fontSize: 13, fontWeight: '400', color: '#9CA3AF' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryName: { fontSize: 14, color: '#374151', flex: 1, marginRight: 8 },
  summaryPrice: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalUsd: { fontSize: 20, fontWeight: '800' },
  totalLbp: { fontSize: 13, color: '#6B7280' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  toggle: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  toggleActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  toggleActiveText: { color: '#fff' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  confirmBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
