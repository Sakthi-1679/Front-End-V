import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export default function ProfileScreen() {
  const { user, logoutUser } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logoutUser() },
    ]);
  };

  const isAdmin = user?.role?.toUpperCase() === UserRole.ADMIN;

  return (
    <SafeAreaView style={styles.container}>
      {/* Avatar */}
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: isAdmin ? '#fef3c7' : '#ede9fe' }]}>
          <Ionicons name={isAdmin ? 'shield-checkmark' : 'person'} size={44} color={isAdmin ? '#f59e0b' : '#6366f1'} />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: isAdmin ? '#fef3c7' : '#ede9fe' }]}>
          <Text style={[styles.roleText, { color: isAdmin ? '#d97706' : '#6366f1' }]}>
            {isAdmin ? '⚡ Admin' : '👤 Customer'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.card}>
        {[
          { icon: 'mail-outline', label: 'Email', value: user?.email },
          { icon: 'call-outline', label: 'Phone', value: user?.phone },
          { icon: 'location-outline', label: 'Area', value: user?.area },
          { icon: 'business-outline', label: 'City', value: user?.city },
        ].map(({ icon, label, value }) => (
          <View key={label} style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name={icon as any} size={18} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value || '—'}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>VKM Flowers • Kanchipuram</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3ff' },
  hero: { alignItems: 'center', paddingVertical: 32 },
  avatar: { width: 90, height: 90, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  name: { fontSize: 22, fontWeight: '900', color: '#1e1b4b' },
  roleBadge: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 13, fontWeight: '800' },
  card: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 24, padding: 8, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 10, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 20, marginTop: 24, paddingVertical: 16, borderRadius: 18, borderWidth: 1.5, borderColor: '#fee2e2', backgroundColor: '#fff5f5' },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },
  footer: { textAlign: 'center', marginTop: 'auto', paddingBottom: 20, color: '#d1d5db', fontSize: 12, fontWeight: '600' },
});
