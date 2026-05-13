import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { insertProduct } from '@/db/database';
import { dollarsToCents } from '@/utils/currency';

export default function NewProductScreen() {
  const router = useRouter();
  const { barcode: initialBarcode } = useLocalSearchParams<{ barcode?: string }>();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState(initialBarcode ?? '');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('0');
  const [lowStock, setLowStock] = useState('5');

  const save = () => {
    if (!name.trim()) { Alert.alert('Name is required'); return; }
    if (!price.trim() || isNaN(parseFloat(price))) { Alert.alert('Valid price is required'); return; }
    insertProduct({
      name: name.trim(),
      sku: sku.trim() || null,
      barcode: barcode.trim() || null,
      price_usd: dollarsToCents(price),
      cost_usd: dollarsToCents(cost),
      stock: parseInt(stock, 10) || 0,
      low_stock: parseInt(lowStock, 10) || 5,
    });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        <Field label="Name *" value={name} onChange={setName} placeholder="e.g. Coca Cola 500ml" />
        <Field label="SKU" value={sku} onChange={setSku} placeholder="Optional" />
        <Field label="Barcode" value={barcode} onChange={setBarcode} placeholder="Optional" keyboardType="number-pad" />
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pricing & Stock</Text>
        <Field label="Price (USD) *" value={price} onChange={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
        <Field label="Cost (USD)" value={cost} onChange={setCost} placeholder="0.00" keyboardType="decimal-pad" />
        <Field label="Initial Stock" value={stock} onChange={setStock} placeholder="0" keyboardType="number-pad" />
        <Field label="Low Stock Alert" value={lowStock} onChange={setLowStock} placeholder="5" keyboardType="number-pad" />
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>Add Product</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType ?? 'default'}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
