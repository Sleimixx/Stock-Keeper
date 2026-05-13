import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Alert, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { searchProducts } from '@/db/database';
import { useCartStore } from '@/store/cartStore';
import { useSettingsStore } from '@/store/settingsStore';
import { formatUsd, formatLbp } from '@/utils/currency';
import type { Product } from '@/types';

export default function SellScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const { items, addProduct, removeProduct, setQty, totalUsd, clear } = useCartStore();
  const exchangeRate = useSettingsStore((s) => s.exchangeRate);

  const search = (text: string) => {
    setQuery(text);
    if (text.trim().length === 0) { setResults([]); return; }
    setResults(searchProducts(text));
  };

  useFocusEffect(useCallback(() => {
    if (query) setResults(searchProducts(query));
  }, [query]));

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('Out of stock', `${product.name} has no stock left.`);
      return;
    }
    addProduct(product);
    setQuery('');
    setResults([]);
    Keyboard.dismiss();
  };

  const total = totalUsd();

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search product, SKU..."
          value={query}
          onChangeText={search}
          returnKeyType="search"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/scan')}>
          <Text style={styles.scanBtnText}>📷</Text>
        </TouchableOpacity>
      </View>

      {/* Search results */}
      {results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.dropdownItem} onPress={() => addToCart(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownName}>{item.name}</Text>
                  {item.sku ? <Text style={styles.dropdownSub}>SKU: {item.sku}</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.dropdownPrice}>{formatUsd(item.price_usd)}</Text>
                  <Text style={[styles.dropdownSub, item.stock === 0 && { color: '#EF4444' }]}>
                    Stock: {item.stock}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Cart */}
      {items.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartText}>Cart is empty</Text>
          <Text style={styles.emptyCartSub}>Search or scan a product to add it</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.product.id)}
          style={styles.cartList}
          renderItem={({ item }) => (
            <View style={styles.cartRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartName}>{item.product.name}</Text>
                <Text style={styles.cartUnit}>{formatUsd(item.product.price_usd)} each</Text>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(item.product.id, item.qty - 1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(item.product.id, item.qty + 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.lineTotal}>{formatUsd(item.product.price_usd * item.qty)}</Text>
            </View>
          )}
        />
      )}

      {/* Footer */}
      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalBlock}>
            <Text style={styles.totalUsd}>{formatUsd(total)}</Text>
            <Text style={styles.totalLbp}>{formatLbp(total, exchangeRate)}</Text>
          </View>
          <View style={styles.footerBtns}>
            <TouchableOpacity style={styles.clearBtn} onPress={() => { Alert.alert('Clear cart?', '', [{ text: 'Cancel' }, { text: 'Clear', style: 'destructive', onPress: clear }]); }}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
              <Text style={styles.checkoutBtnText}>Checkout →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  scanBtn: { width: 46, height: 46, backgroundColor: '#2563EB', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scanBtnText: { fontSize: 22 },
  dropdown: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', maxHeight: 260 },
  dropdownItem: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownName: { fontSize: 15, fontWeight: '600' },
  dropdownSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  dropdownPrice: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyCartText: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  emptyCartSub: { fontSize: 14, color: '#9CA3AF' },
  cartList: { flex: 1 },
  cartRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cartName: { fontSize: 15, fontWeight: '600' },
  cartUnit: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  qtyNum: { fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  lineTotal: { fontSize: 15, fontWeight: '700', color: '#111827', minWidth: 64, textAlign: 'right' },
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', padding: 16, gap: 12 },
  totalBlock: { alignItems: 'flex-end' },
  totalUsd: { fontSize: 26, fontWeight: '800', color: '#111827' },
  totalLbp: { fontSize: 14, color: '#6B7280' },
  footerBtns: { flexDirection: 'row', gap: 10 },
  clearBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  clearBtnText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  checkoutBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center' },
  checkoutBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
