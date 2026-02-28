import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
  RefreshControl, SafeAreaView, TextInput, Alert, ScrollView, Image, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllOrders, getAllCustomOrders, updateOrderStatus,
  deleteOrder, deleteCustomOrder,
  getAdminContact, updateAdminContact,
  getProducts, addProduct, updateProduct, deleteProduct,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import { Order, CustomOrder, OrderStatus, Product } from '../types';
import * as ImagePicker from 'expo-image-picker';

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: '#f59e0b', CONFIRMED: '#6366f1', COMPLETED: '#22c55e', CANCELLED: '#ef4444',
};
const STATUSES: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.COMPLETED, OrderStatus.CANCELLED];

export default function AdminDashboardScreen() {
  const { notify } = useToast();
  const [tab, setTab] = useState<'orders' | 'custom' | 'products' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [adminPhone, setAdminPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [editProd, setEditProd] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);

  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
  const pendingCustom = customOrders.filter(o => o.status === OrderStatus.PENDING).length;

  const load = useCallback(async (includePhone = false) => {
    try {
      const [o, c, p] = await Promise.all([getAllOrders(), getAllCustomOrders(), getProducts()]);
      setOrders(o);
      setCustomOrders(c);
      setProducts(p);
      if (includePhone) {
        const ph = await getAdminContact();
        setAdminPhone(ph);
        setPhoneInput(ph);
      }
    } catch (e) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(true); }, [load]);

  // ── Orders ──
  const changeStatus = async (type: 'normal' | 'custom', id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(type, id, status);
      load();
    } catch { notify('Failed to update status', 'error'); }
  };

  const removeOrder = (type: 'normal' | 'custom', id: string) => {
    Alert.alert('Delete', 'Remove this order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          type === 'normal' ? await deleteOrder(id) : await deleteCustomOrder(id);
          load();
        } catch { notify('Delete failed', 'error'); }
      }},
    ]);
  };

  // ── Products ──
  const openNewProd = () => {
    setEditProd({ title: '', description: '', price: 0, durationHours: 24, images: [] });
    setProductModal(true);
  };
  const openEditProd = (p: Product) => { setEditProd({ ...p }); setProductModal(true); };

  const pickProductImg = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, allowsMultipleSelection: true });
    if (!r.canceled) {
      const imgs = r.assets.map(a => a.base64 ? `data:image/jpeg;base64,${a.base64}` : null).filter(Boolean) as string[];
      setEditProd(p => ({ ...p, images: [...(p?.images ?? []), ...imgs].slice(0, 5) }));
    }
  };

  const saveProd = async () => {
    if (!editProd?.title || !editProd?.price) { notify('Title and price required', 'error'); return; }
    setSaving(true);
    try {
      if (editProd.id) {
        await updateProduct(editProd.id, editProd);
      } else {
        await addProduct(editProd as Omit<Product, 'id'>);
      }
      setProductModal(false);
      load();
      notify('Product saved!', 'success');
    } catch (e: any) { notify(e.message || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const removeProd = (id: string) => {
    Alert.alert('Delete Product', 'This will delete the product permanently.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteProduct(id); load(); notify('Deleted', 'success'); }
        catch { notify('Delete failed', 'error'); }
      }},
    ]);
  };

  // ── Render helpers ──
  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.cardTitle}>{item.productTitle}</Text>
          {item.billId && <Text style={styles.billId}>{item.billId}</Text>}
          <Text style={styles.meta}>Qty: {item.quantity} • ₹{item.totalPrice}</Text>
        </View>
        <TouchableOpacity onPress={() => removeOrder('normal', item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, gap: 6 }}>
        {STATUSES.map(s => (
          <TouchableOpacity key={s}
            style={[styles.statusChip, { backgroundColor: item.status === s ? STATUS_COLOR[s] : STATUS_COLOR[s] + '15' }]}
            onPress={() => changeStatus('normal', item.id, s)}>
            <Text style={[styles.statusChipText, { color: item.status === s ? '#fff' : STATUS_COLOR[s] }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCustom = ({ item }: { item: CustomOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.contactName}</Text>
          <Text style={styles.meta} numberOfLines={2}>{item.description}</Text>
          <Text style={[styles.meta, { marginTop: 4 }]}>{item.requestedDate} {item.requestedTime?.slice(0, 5)}</Text>
        </View>
        <TouchableOpacity onPress={() => removeOrder('custom', item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        {STATUSES.map(s => (
          <TouchableOpacity key={s}
            style={[styles.statusChip, { backgroundColor: item.status === s ? STATUS_COLOR[s] : STATUS_COLOR[s] + '15' }]}
            onPress={() => changeStatus('custom', item.id, s)}>
            <Text style={[styles.statusChipText, { color: item.status === s ? '#fff' : STATUS_COLOR[s] }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.prodCard}>
      {item.images?.[0] ? (
        <Image source={{ uri: item.images[0] }} style={styles.prodImg} resizeMode="cover" />
      ) : (
        <View style={[styles.prodImg, { backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="flower-outline" size={30} color="#a78bfa" />
        </View>
      )}
      <View style={{ flex: 1, padding: 12 }}>
        <Text style={styles.prodTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.prodPrice}>₹{item.price}</Text>
      </View>
      <View style={styles.prodActions}>
        <TouchableOpacity onPress={() => openEditProd(item)} style={[styles.prodBtn, { backgroundColor: '#ede9fe' }]}>
          <Ionicons name="pencil-outline" size={16} color="#6366f1" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeProd(item.id)} style={[styles.prodBtn, { backgroundColor: '#fee2e2' }]}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#6366f1" style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.statsRow}>
          {pendingOrders > 0 && <View style={styles.statBadge}><Text style={styles.statText}>{pendingOrders} orders</Text></View>}
          {pendingCustom > 0 && <View style={[styles.statBadge, { backgroundColor: '#f5f3ff' }]}><Text style={[styles.statText, { color: '#6366f1' }]}>{pendingCustom} custom</Text></View>}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'orders', label: 'Orders', badge: pendingOrders },
          { key: 'custom', label: 'Custom', badge: pendingCustom },
          { key: 'products', label: 'Catalog', badge: 0 },
          { key: 'settings', label: 'Settings', badge: 0 },
        ].map(t => (
          <TouchableOpacity key={t.key} style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
            onPress={() => setTab(t.key as any)}>
            <Text style={[styles.tabItemText, tab === t.key && styles.tabItemTextActive]}>{t.label}</Text>
            {t.badge > 0 && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{t.badge}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {tab === 'orders' && (
        <FlatList data={orders} keyExtractor={i => i.id} renderItem={renderOrder}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6366f1']} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders</Text>} />
      )}
      {tab === 'custom' && (
        <FlatList data={customOrders} keyExtractor={i => i.id} renderItem={renderCustom}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6366f1']} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No custom orders</Text>} />
      )}
      {tab === 'products' && (
        <>
          <TouchableOpacity style={styles.addBtn} onPress={openNewProd}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add Product</Text>
          </TouchableOpacity>
          <FlatList data={products} keyExtractor={i => i.id} renderItem={renderProduct}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#6366f1']} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No products</Text>} />
        </>
      )}
      {tab === 'settings' && (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>WhatsApp Number</Text>
            <Text style={styles.settingHint}>Admin receives order notifications on this number</Text>
            <View style={styles.settingRow}>
              <Ionicons name="logo-whatsapp" size={22} color="#22c55e" style={{ marginRight: 10 }} />
              <TextInput style={styles.settingInput} value={phoneInput} onChangeText={setPhoneInput}
                placeholder="10-digit number" keyboardType="phone-pad" maxLength={10} />
              <TouchableOpacity style={styles.settingSetBtn} onPress={async () => {
                try { await updateAdminContact(phoneInput); setAdminPhone(phoneInput); notify('WhatsApp number updated!', 'success'); }
                catch { notify('Update failed', 'error'); }
              }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Product Modal */}
      <Modal visible={productModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.modalTitle}>{editProd?.id ? 'Edit Product' : 'Add Product'}</Text>
              {[
                { key: 'title', label: 'Title *', placeholder: 'Rose Bouquet', keyboard: 'default' },
                { key: 'description', label: 'Description', placeholder: 'Fresh roses...', multi: true, keyboard: 'default' },
                { key: 'price', label: 'Price (₹) *', placeholder: '499', keyboard: 'numeric' },
                { key: 'durationHours', label: 'Duration (hours)', placeholder: '24', keyboard: 'numeric' },
              ].map(({ key, label, placeholder, multi, keyboard }) => (
                <View key={key} style={{ marginBottom: 14 }}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    style={[styles.modalInput, multi && { minHeight: 70, textAlignVertical: 'top' }]}
                    placeholder={placeholder}
                    placeholderTextColor="#9ca3af"
                    value={String((editProd as any)?.[key] ?? '')}
                    onChangeText={v => setEditProd(p => ({ ...p, [key]: keyboard === 'numeric' ? Number(v) || 0 : v }))}
                    multiline={multi}
                    keyboardType={keyboard as any}
                  />
                </View>
              ))}

              <Text style={styles.label}>Images</Text>
              <TouchableOpacity style={styles.photoPicker} onPress={pickProductImg}>
                <Ionicons name="images-outline" size={20} color="#6366f1" />
                <Text style={{ color: '#6366f1', fontWeight: '700', marginLeft: 8 }}>Add Images</Text>
              </TouchableOpacity>
              {(editProd?.images?.length ?? 0) > 0 && (
                <ScrollView horizontal style={{ marginTop: 10 }}>
                  {editProd?.images?.map((img, i) => (
                    <View key={i} style={{ marginRight: 10, position: 'relative' }}>
                      <Image source={{ uri: img }} style={{ width: 72, height: 72, borderRadius: 10 }} resizeMode="cover" />
                      <TouchableOpacity style={{ position: 'absolute', top: -6, right: -6 }}
                        onPress={() => setEditProd(p => ({ ...p, images: p?.images?.filter((_, j) => j !== i) }))}>
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setProductModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveProd} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3ff' },
  header: { padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1e1b4b' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  statBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statText: { fontSize: 12, fontWeight: '800', color: '#d97706' },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#e5e7eb', borderRadius: 14, padding: 4, gap: 4, marginBottom: 8 },
  tabItem: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabItemActive: { backgroundColor: '#fff', elevation: 2 },
  tabItemText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  tabItemTextActive: { color: '#6366f1' },
  tabBadge: { backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontWeight: '800', fontSize: 15, color: '#111827' },
  billId: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  deleteBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 6 },
  statusChipText: { fontSize: 11, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontWeight: '600' },
  // Products
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, marginBottom: 0, backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, elevation: 3, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  prodCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, alignItems: 'center' },
  prodImg: { width: 80, height: 80 },
  prodTitle: { fontWeight: '700', fontSize: 14, color: '#111827' },
  prodPrice: { fontSize: 15, fontWeight: '900', color: '#6366f1', marginTop: 4 },
  prodActions: { flexDirection: 'row', gap: 8, padding: 12 },
  prodBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  // Settings
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#374151', marginBottom: 4 },
  settingHint: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f9fafb' },
  settingInput: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '700' },
  settingSetBtn: { backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  modalInput: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  photoPicker: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#a78bfa', borderStyle: 'dashed', borderRadius: 14, padding: 14, justifyContent: 'center', backgroundColor: '#faf5ff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 10 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelText: { color: '#6b7280', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 2, paddingVertical: 16, borderRadius: 16, backgroundColor: '#6366f1', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
