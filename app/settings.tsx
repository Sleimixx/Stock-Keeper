import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

export default function SettingsScreen() {
  const { exchangeRate, setExchangeRate } = useSettingsStore();
  const [rateInput, setRateInput] = useState(String(exchangeRate));

  const save = () => {
    const rate = parseInt(rateInput, 10);
    if (isNaN(rate) || rate <= 0) { Alert.alert('Enter a valid exchange rate'); return; }
    setExchangeRate(rate);
    Alert.alert('Saved', `Exchange rate set to 1 USD = ${rate.toLocaleString()} LBP`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Exchange Rate</Text>
        <Text style={styles.hint}>Used to display LBP amounts on invoices and reports.</Text>
        <Text style={styles.label}>1 USD =</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={rateInput}
            onChangeText={setRateInput}
            keyboardType="number-pad"
            placeholder="90000"
          />
          <Text style={styles.unit}>LBP</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.about}>Stock Keeper v1.0{'\n'}Offline-first POS for small shops.{'\n'}Data stored locally on this device.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 13, color: '#6B7280' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 16 },
  unit: { fontSize: 16, fontWeight: '600', color: '#374151' },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  about: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
});
