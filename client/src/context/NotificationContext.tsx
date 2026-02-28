
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notify: (message: string, type?: NotificationType) => void;
  confirm: (title: string, message: string, onConfirm: () => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const confirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ title, message, onConfirm });
  }, []);

  const handleConfirm = () => {
    if (confirmState) confirmState.onConfirm();
    setConfirmState(null);
  };

  return (
    <NotificationContext.Provider value={{ notify, confirm }}>
      {children}
      
      {/* Toast Notifications container */}
      <div className="fixed bottom-6 right-6 z-[200] space-y-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-slide-in-right max-w-sm
            ${n.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' : 
              n.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' : 
              'bg-indigo-50/90 border-indigo-200 text-indigo-800'}`}>
            {n.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
            {n.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {n.type === 'info' && <Info className="h-5 w-5" />}
            <span className="text-sm font-bold leading-tight">{n.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))} className="ml-auto p-1 hover:bg-black/5 rounded-full">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{confirmState.title}</h3>
              <p className="text-gray-500 font-bold text-sm leading-relaxed">{confirmState.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-gray-100 border-t">
              <button onClick={() => setConfirmState(null)} className="bg-white py-6 text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirm} className="bg-white py-6 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors">
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};
