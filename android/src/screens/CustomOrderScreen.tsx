import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Linking, SafeAreaView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { placeCustomOrder, getAdminContact } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CustomOrderScreen() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { notify('Photo access denied', 'error'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      const b64s = result.assets
        .map(a => a.base64 ? `data:image/jpeg;base64,${a.base64}` : null)
        .filter(Boolean) as string[];
      setImages(prev => [...prev, ...b64s].slice(0, 5));
    }
  };

  const submit = async () => {
    if (!desc || !date || !time || !name || !phone) {
      notify('Please fill all required fields', 'error');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      await placeCustomOrder({
        userId: user.id, description: desc, requestedDate: date,
        requestedTime: time, contactName: name, contactPhone: phone, images,
      });
      const adminPhone = await getAdminContact();
      const msg = [
        '🎨 *Custom Order – VKM Flowers*', '',
        `👤 Name: ${name}`, `📞 Phone: ${phone}`,
        `📝 Description: ${desc}`,
        `📅 Date: ${date} at ${time}`,
        images.length ? `📷 Photos: ${images.length} image(s) — check app` : '',
      ].filter(Boolean).join('\n');
      Linking.openURL(`https://wa.me/91${adminPhone}?text=${encodeURIComponent(msg)}`);
      setDesc(''); setDate(''); setTime(''); setImages([]);
      notify('Custom order placed! WhatsApp opened.', 'success');
    } catch (e: any) { notify(e.message || 'Failed to place order', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Custom Order</Text>
          <Text style={styles.sub}>Describe your dream arrangement</Text>
        </View>

        {[
          { label: 'Your Description *', icon: 'create-outline', value: desc, setter: setDesc, multi: true, placeholder: 'E.g. 50 white roses with baby breath...' },
          { label: 'Delivery Date * (YYYY-MM-DD)', icon: 'calendar-outline', value: date, setter: setDate, placeholder: '2026-03-15' },
          { label: 'Delivery Time * (HH:MM)', icon: 'time-outline', value: time, setter: setTime, placeholder: '10:00' },
          { label: 'Contact Name *', icon: 'person-outline', value: name, setter: setName, placeholder: 'Your name' },
          { label: 'Contact Phone *', icon: 'call-outline', value: phone, setter: setPhone, placeholder: '9876543210', keyboard: 'phone-pad' },
        ].map(({ label, icon, value, setter, multi, placeholder, keyboard }) => (
          <View key={label} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputRow, multi && { alignItems: 'flex-start' }]}>
              <Ionicons name={icon as any} size={18} color="#9ca3af" style={[{ marginRight: 8 }, multi && { marginTop: 2 }]} />
              <TextInput
                style={[styles.input, multi && { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                value={value}
                onChangeText={setter}
                multiline={multi}
                keyboardType={(keyboard as any) || 'default'}
              />
            </View>
          </View>
        ))}

        {/* Photos */}
        <View style={styles.field}>
          <Text style={styles.label}>Reference Photos (optional, max 5)</Text>
          <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
            <Ionicons name="images-outline" size={22} color="#6366f1" />
            <Text style={styles.photoPickerText}>Add Photos</Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {images.map((img, i) => (
                <View key={i} style={styles.imgThumbWrap}>
                  <Image source={{ uri: img }} style={styles.imgThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.imgRemove} onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}>
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>Place Custom Order</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3ff' },
  inner: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '900', color: '#1e1b4b' },
  sub: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  field: { marginBottom: 18 },
  label: { fontSize: 10, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  photoPicker: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#a78bfa', borderStyle: 'dashed', borderRadius: 14, padding: 16, justifyContent: 'center', backgroundColor: '#faf5ff' },
  photoPickerText: { color: '#6366f1', fontWeight: '700', fontSize: 14 },
  imgThumbWrap: { marginRight: 10, position: 'relative' },
  imgThumb: { width: 80, height: 80, borderRadius: 12 },
  imgRemove: { position: 'absolute', top: -6, right: -6 },
  btn: { flexDirection: 'row', backgroundColor: '#6366f1', borderRadius: 18, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', marginTop: 8, elevation: 4, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 10 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
