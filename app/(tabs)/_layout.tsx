import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

const ACTIVE = '#2563EB';
const INACTIVE = '#9CA3AF';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color }) => <TabIcon name="sell" color={color} />,
          headerRight: () => <CartBadge />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Invoices',
          tabBarIcon: ({ color }) => <TabIcon name="invoices" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <TabIcon name="inventory" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <TabIcon name="reports" color={color} />,
        }}
      />
    </Tabs>
  );
}

import { View, Text } from 'react-native';
import { useCartStore } from '@/store/cartStore';

function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    sell: '🛒',
    invoices: '🧾',
    inventory: '📦',
    reports: '📊',
  };
  return <Text style={{ fontSize: 22 }}>{icons[name]}</Text>;
}

function CartBadge() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  if (count === 0) return null;
  return (
    <View style={{ marginRight: 16, backgroundColor: ACTIVE, borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{count}</Text>
    </View>
  );
}
