import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  notify: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((msg: string, t: ToastType = 'info') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    setType(t);
    setVisible(true);
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setVisible(false));
    }, 3000);
  }, [opacity]);

  const bg = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#6366f1';

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {visible && (
        <Animated.View style={[styles.toast, { backgroundColor: bg, opacity }]}>
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 14,
    zIndex: 9999,
    elevation: 10,
    alignItems: 'center',
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' },
});
