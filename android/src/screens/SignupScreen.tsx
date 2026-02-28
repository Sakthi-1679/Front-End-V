import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList, 'Signup'>;

export default function SignupScreen() {
  const nav = useNavigation<Nav>();
  const { loginUser } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', city: 'Kanchipuram', area: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.area) {
      notify('Please fill all fields', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await register({ ...form, email: form.email.trim().toLowerCase() });
      await loginUser(data);
    } catch (e: any) {
      notify(e.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ icon, placeholder, value, onChange, keyboard, secure, extra }: any) => (
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={18} color="#9ca3af" style={{ marginRight: 8 }} />
      <TextInput
        style={[styles.input, { flex: 1 }]}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard || 'default'}
        secureTextEntry={secure}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
        autoCorrect={false}
        {...extra}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Ionicons name="flower" size={48} color="#6366f1" />
          <Text style={styles.brand}>VKM Flowers</Text>
          <Text style={styles.sub}>Create your account</Text>
        </View>

        <View style={styles.card}>
          {[
            { key: 'name', icon: 'person-outline', placeholder: 'Full Name' },
            { key: 'email', icon: 'mail-outline', placeholder: 'Email', keyboard: 'email-address' },
            { key: 'phone', icon: 'call-outline', placeholder: 'Phone Number', keyboard: 'phone-pad' },
            { key: 'area', icon: 'location-outline', placeholder: 'Area (e.g. Anna Nagar)' },
          ].map(({ key, icon, placeholder, keyboard }) => (
            <View key={key} style={{ marginBottom: 14 }}>
              <Text style={styles.label}>{placeholder}</Text>
              <Field icon={icon} placeholder={placeholder} value={(form as any)[key]} onChange={set(key as any)} keyboard={keyboard} />
            </View>
          ))}

          <Text style={styles.label}>City</Text>
          <View style={[styles.inputRow, { backgroundColor: '#f3f4f6' }]}>
            <Ionicons name="business-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
            <Text style={[styles.input, { color: '#9ca3af' }]}>Kanchipuram (fixed)</Text>
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={form.password}
              onChangeText={set('password')}
              secureTextEntry={!showPwd}
            />
            <TouchableOpacity onPress={() => setShowPwd(v => !v)}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => nav.navigate('Login')} style={styles.link}>
            <Text style={styles.linkText}>Already have an account? <Text style={{ color: '#6366f1', fontWeight: '700' }}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3ff' },
  inner: { flexGrow: 1, padding: 24, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  brand: { fontSize: 26, fontWeight: '900', color: '#1e1b4b', marginTop: 10 },
  sub: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#6366f1', shadowOpacity: 0.1, shadowRadius: 20, elevation: 6 },
  label: { fontSize: 10, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#f9fafb' },
  input: { fontSize: 15, color: '#111827' },
  btn: { backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 22, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  link: { marginTop: 18, alignItems: 'center' },
  linkText: { color: '#6b7280', fontSize: 14 },
});
