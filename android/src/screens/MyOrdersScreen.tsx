import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserOrders, getUserCustomOrders } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Order, CustomOrder, OrderStatus } from '../types';

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#6366f1',
  COMPLETED: '#22c55e',
  CANCELLED: '#ef4444',
};
const STATUS_ICON: Record<OrderStatus, keyof typeof Ionicons.glyphMap> = {
  PENDING: 'time-outline',
  CONFIRMED: 'checkmark-circle-outline',
  COMPLETED: 'ribbon-outline',
  CANCELLED: 'close-circle-outline',
};

export default function MyOrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [custom, setCustom] = useState<CustomOrder[]>([]);
  const [tab, setTab] = useState<'orders' | 'custom'>('orders');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [o, c] = await Promise.all([getUserOrders(user.id), getUserCustomOrders(user.id)]);
      setOrders(o.reverse());
      setCustom(c.reverse());
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.cardTitle}>{item.productTitle || 'Product'}</Text>
          {item.billId && <Text style={styles.billId}>{item.billId}</Text>}
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
          <Ionicons name={STATUS_ICON[item.status]} size={12} color={STATUS_COLOR[item.status]} />
          <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.meta}>Qty: {item.quantity}</Text>
        <Text style={styles.price}>₹{item.totalPrice}</Text>
      </View>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</Text>
      {item.description ? <Text style={styles.note}>{item.description}</Text> : null}
      {item.status === OrderStatus.CONFIRMED && item.expectedDeliveryAt && (
        <View style={styles.deliveryChip}>
          <Ionicons name="bicycle-outline" size={13} color="#6366f1" />
          <Text style={styles.deliveryText}>
            Expected: {new Date(item.expectedDeliveryAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </Text>
        </View>
      )}
    </View>
  );

  const renderCustom = ({ item }: { item: CustomOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>Custom Order</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
          <Ionicons name={STATUS_ICON[item.status]} size={12} color={STATUS_COLOR[item.status]} />
          <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.note} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.date}>
        Req: {item.requestedDate} {item.requestedTime?.slice(0, 5)}
      </Text>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#6366f1" style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* Tab */}
      <View style={styles.tabs}>
        <View style={styles.tabInner}>
          <View style={[styles.tabBtn, tab === 'orders' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'orders' && styles.tabActiveText]}
              onPress={() => setTab('orders')}>Orders ({orders.length})</Text>
          </View>
          <View style={[styles.tabBtn, tab === 'custom' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'custom' && styles.tabActiveText]}
              onPress={() => setTab('custom')}>Custom ({custom.length})</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={tab === 'orders' ? orders : (custom as any[])}
        keyExtractor={i => i.id}
        renderItem={tab === 'orders' ? renderOrder : renderCustom}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6366f1']} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="receipt-outline" size={60} color="#d1d5db" />
            <Text style={{ color: '#9ca3af', marginTop: 12, fontWeight: '600' }}>No orders yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3ff' },
  header: { padding: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1e1b4b' },
  tabs: { paddingHorizontal: 16, marginBottom: 8 },
  tabInner: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 14, padding: 4, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontWeight: '700', fontSize: 13, color: '#6b7280' },
  tabActiveText: { color: '#6366f1' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontWeight: '800', fontSize: 15, color: '#111827', maxWidth: 200 },
  billId: { fontSize: 11, color: '#9ca3af', marginTop: 2, fontWeight: '600' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  price: { fontSize: 18, fontWeight: '900', color: '#6366f1' },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  note: { fontSize: 13, color: '#6b7280', marginTop: 6, fontStyle: 'italic' },
  deliveryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, backgroundColor: '#ede9fe', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  deliveryText: { fontSize: 12, color: '#6366f1', fontWeight: '700' },
});
