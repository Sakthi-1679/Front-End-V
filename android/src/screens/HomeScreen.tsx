import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  Image, Modal, ScrollView, ActivityIndicator, RefreshControl,
  Linking, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProducts, placeOrder, getAdminContact } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Product, UserRole } from '../types';

export default function HomeScreen() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  const load = useCallback(async () => {
    try { setProducts(await getProducts()); } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  const openOrder = (p: Product) => {
    if (user?.role === UserRole.ADMIN) { notify('Admins cannot place orders', 'error'); return; }
    setSelected(p); setQty(1); setNote(''); setImgIdx(0);
  };

  const submitOrder = async () => {
    if (!selected || !user) return;
    setOrdering(true);
    try {
      await placeOrder({ userId: user.id, productId: selected.id, quantity: qty, description: note });
      const adminPhone = await getAdminContact();
      const total = selected.price * qty;
      const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      const msg = [
        '🌸 *New Order – VKM Flowers*', '',
        `👤 Customer: ${user.name}`,
        `📞 Phone: ${user.phone}`,
        `📦 Product: ${selected.title}`,
        `🔢 Quantity: ${qty}`,
        note ? `📝 Note: ${note}` : '',
        `💰 Amount: ₹${total}`,
        `📅 Date: ${now}`,
      ].filter(Boolean).join('\n');
      Linking.openURL(`https://wa.me/91${adminPhone}?text=${encodeURIComponent(msg)}`);
      setSelected(null);
      notify('Order placed! WhatsApp opened to notify admin.', 'success');
    } catch (e: any) { notify(e.message || 'Failed to place order', 'error'); }
    finally { setOrdering(false); }
  };

  const renderProduct = ({ item: p }: { item: Product }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={() => openOrder(p)}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => { setZoomImg(null); openOrder(p); }}>
        {p.images?.[0] ? (
          <TouchableOpacity onPress={() => setZoomImg(p.images[0])} activeOpacity={0.9}>
            <Image source={{ uri: p.images[0] }} style={styles.cardImg} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.cardImg, { backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="flower-outline" size={48} color="#a78bfa" />
          </View>
        )}
      </TouchableOpacity>
      {p.images?.length > 1 && (
        <View style={styles.imgCount}>
          <Ionicons name="images-outline" size={11} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 3 }}>{p.images.length}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{p.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{p.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.price}>₹{p.price}</Text>
          <TouchableOpacity style={styles.orderBtn} onPress={() => openOrder(p)}>
            <Text style={styles.orderBtnText}>Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.headerSub}>Fresh flowers, just for you</Text>
        </View>
        <View style={styles.logo}><Ionicons name="flower" size={28} color="#6366f1" /></View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search flowers..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color="#9ca3af" /></TouchableOpacity> : null}
      </View>

      {/* Products */}
      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={styles.list}
          renderItem={renderProduct}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6366f1']} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="flower-outline" size={60} color="#d1d5db" />
              <Text style={{ color: '#9ca3af', marginTop: 12, fontWeight: '600' }}>No products found</Text>
            </View>
          }
        />
      )}

      {/* Order Modal */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Images */}
              {selected?.images && selected.images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imgScroll}>
                  {selected.images.map((img, i) => (
                    <TouchableOpacity key={i} onPress={() => setZoomImg(img)}>
                      <Image source={{ uri: img }} style={styles.modalImg} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>{selected?.title}</Text>
                <Text style={styles.modalDesc}>{selected?.description}</Text>

                {/* Qty */}
                <Text style={styles.sectionLabel}>Quantity</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                    <Ionicons name="remove" size={20} color="#6366f1" />
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{qty}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => q + 1)}>
                    <Ionicons name="add" size={20} color="#6366f1" />
                  </TouchableOpacity>
                  <Text style={styles.totalPrice}>₹{(selected?.price ?? 0) * qty}</Text>
                </View>

                {/* Note */}
                <Text style={styles.sectionLabel}>Note (optional)</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Any special instructions..."
                  placeholderTextColor="#9ca3af"
                  value={note}
                  onChangeText={setNote}
                  multiline
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelected(null)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={submitOrder} disabled={ordering}>
                    {ordering ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Place Order</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Zoom Modal */}
      <Modal visible={!!zoomImg} animationType="fade" transparent>
        <TouchableOpacity style={styles.zoomOverlay} activeOpacity={1} onPress={() => setZoomImg(null)}>
          <Image source={{ uri: zoomImg ?? '' }} style={styles.zoomImg} resizeMode="contain" />
          <TouchableOpacity style={styles.zoomClose} onPress={() => setZoomImg(null)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1e1b4b' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  logo: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 16, marginTop: 8, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  list: { padding: 16, paddingTop: 4, gap: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8 },
  cardImg: { width: '100%', height: 140 },
  imgCount: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3 },
  cardBody: { padding: 12 },
  cardTitle: { fontWeight: '800', fontSize: 14, color: '#111827' },
  cardDesc: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price: { fontSize: 16, fontWeight: '900', color: '#6366f1' },
  orderBtn: { backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  orderBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  imgScroll: { paddingHorizontal: 16, paddingTop: 16 },
  modalImg: { width: 200, height: 160, borderRadius: 16, marginRight: 10 },
  modalBody: { padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  modalDesc: { fontSize: 14, color: '#6b7280', marginTop: 6, lineHeight: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  qtyNum: { fontSize: 20, fontWeight: '900', color: '#111827', minWidth: 30, textAlign: 'center' },
  totalPrice: { marginLeft: 'auto', fontSize: 20, fontWeight: '900', color: '#6366f1' },
  noteInput: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, minHeight: 80, fontSize: 14, color: '#111827', textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 10 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelText: { color: '#6b7280', fontWeight: '700', fontSize: 15 },
  confirmBtn: { flex: 2, paddingVertical: 16, borderRadius: 16, backgroundColor: '#6366f1', alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  // Zoom
  zoomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  zoomImg: { width: '100%', height: '80%' },
  zoomClose: { position: 'absolute', top: 48, right: 20, backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 50 },
});
