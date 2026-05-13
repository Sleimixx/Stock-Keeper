import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getProducts, searchProducts } from '@/db/database';
import { formatUsd } from '@/utils/currency';
import type { Product } from '@/types';

export default function InventoryScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(useCallback(() => {
    refresh();
  }, []));

  const refresh = () => {
    setProducts(getProducts());
  };

  const filtered = query.trim() ? searchProducts(query) : products;
  const sorted = [...filtered].sort((a, b) => {
    const aLow = a.stock <= a.low_stock ? 0 : 1;
    const bLow = b.stock <= b.low_stock ? 0 : 1;
    return aLow - bLow || a.name.localeCompare(b.name);
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/product/new')}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.empty}>No products yet. Tap + to add one.</Text>}
        renderItem={({ item }) => {
          const isLow = item.stock <= item.low_stock;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  {isLow && (
                    <View style={styles.lowBadge}>
                      <Text style={styles.lowBadgeText}>{item.stock === 0 ? 'Out' : 'Low'}</Text>
                    </View>
                  )}
                </View>
                {item.sku ? <Text style={styles.sub}>SKU: {item.sku}</Text> : null}
                {item.barcode ? <Text style={styles.sub}>Barcode: {item.barcode}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>{formatUsd(item.price_usd)}</Text>
                <Text style={[styles.stock, isLow && { color: '#EF4444' }]}>
                  {item.stock} in stock
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  addBtn: { width: 46, height: 46, backgroundColor: '#2563EB', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 28, color: '#fff', lineHeight: 32 },
  row: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  price: { fontSize: 15, fontWeight: '700', color: '#111827' },
  stock: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  lowBadge: { backgroundColor: '#FEF9C3', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  lowBadgeText: { fontSize: 11, fontWeight: '700', color: '#CA8A04' },
  empty: { textAlign: 'center', marginTop: 60, color: '#9CA3AF', fontSize: 16 },
});
