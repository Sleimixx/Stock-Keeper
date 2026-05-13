import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getProduct, updateProduct, deleteProduct, adjustStock } from '@/db/database';
import { dollarsToCents, centsToString } from '@/utils/currency';
import type { Product } from '@/types';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [lowStock, setLowStock] = useState('');
  const [adjustDelta, setAdjustDelta] = useState('');

  useFocusEffect(useCallback(() => {
    const p = getProduct(Number(id));
    if (!p) { router.back(); return; }
    setProduct(p);
    setName(p.name);
    setSku(p.sku ?? '');
    setBarcode(p.barcode ?? '');
    setPrice(centsToString(p.price_usd));
    setCost(centsToString(p.cost_usd));
    setLowStock(String(p.low_stock));
  }, [id]));

  const save = () => {
    if (!name.trim()) { Alert.alert('Name is required'); return; }
    updateProduct(Number(id), {
      name: name.trim(),
      sku: sku.trim() || null,
      barcode: barcode.trim() || null,
      price_usd: dollarsToCents(price),
      cost_usd: dollarsToCents(cost),
      low_stock: parseInt(lowStock, 10) || 5,
    });
    router.back();
  };

  const applyAdjust = () => {
    const delta = parseInt(adjustDelta, 10);
    if (isNaN(delta) || delta === 0) { Alert.alert('Enter a non-zero number'); return; }
    adjustStock(Number(id), delta, 'manual');
    setAdjustDelta('');
    const p = getProduct(Number(id));
    if (p) setProduct(p);
  };

  const handleDelete = () => {
    Alert.alert('Delete product?', 'This cannot be undone.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteProduct(Number(id)); router.back(); } },
    ]);
  };

  if (!product) return null;

  return (
    <>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* Stock card */}
        <View style={styles.stockCard}>
          <Text style={styles.stockNum}>{product.stock}</Text>
          <Text style={styles.stockLabel}>in stock</Text>
          <View style={styles.adjustRow}>
            <TextInput
              style={styles.adjustInput}
              value={adjustDelta}
              onChangeText={setAdjustDelta}
              placeholder="±qty  (e.g. +10 or -3)"
              keyboardType="numbers-and-punctuation"
            />
            <TouchableOpacity style={styles.adjustBtn} onPress={applyAdjust}>
              <Text style={styles.adjustBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <Field label="Name *" value={name} onChange={setName} />
          <Field label="SKU" value={sku} onChange={setSku} />
          <Field label="Barcode" value={barcode} onChange={setBarcode} keyboardType="number-pad" />
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <Field label="Price (USD)" value={price} onChange={setPrice} keyboardType="decimal-pad" />
          <Field label="Cost (USD)" value={cost} onChange={setCost} keyboardType="decimal-pad" />
          <Field label="Low Stock Alert" value={lowStock} onChange={setLowStock} keyboardType="number-pad" />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Product</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function Field({ label, value, onChange, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad' | 'numbers-and-punctuation';
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? 'default'}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  stockCard: { backgroundColor: '#2563EB', borderRadius: 14, padding: 20, alignItems: 'center', gap: 4 },
  stockNum: { fontSize: 48, fontWeight: '800', color: '#fff' },
  stockLabel: { fontSize: 14, color: '#BFDBFE' },
  adjustRow: { flexDirection: 'row', gap: 8, marginTop: 12, width: '100%' },
  adjustInput: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  adjustBtn: { backgroundColor: '#1D4ED8', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  adjustBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  deleteBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' },
  deleteBtnText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});
