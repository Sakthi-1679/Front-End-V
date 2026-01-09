
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminDashboard } from './pages/AdminDashboard';
import { CustomOrderForm } from './pages/CustomOrder';
import { UserRole, OrderStatus } from './types';
import { getUserOrders, getUserCustomOrders, getAdminContact } from './services/storage';
import { Package, ShoppingBag, Clock, FileText, Phone, X, ZoomIn } from 'lucide-react';

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const colors = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800 border-blue-200',
    [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[status]}`}>{status}</span>;
};

const History: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [customOrders, setCustomOrders] = React.useState<any[]>([]);
  const [adminPhone, setAdminPhone] = React.useState('');
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);

  const load = async () => {
    if (user) {
      try {
        const uOrders = await getUserOrders(user.id);
        const uCustom = await getUserCustomOrders(user.id);
        const contact = await getAdminContact();

        setOrders(uOrders);
        setCustomOrders(uCustom);
        setAdminPhone(contact);
      } catch (e) {
        console.error("Failed to load history data");
      }
    }
  };

  React.useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const getTimeStatus = (deadline: string) => {
    const now = new Date();
    const target = new Date(deadline);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "Arriving shortly...";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `ETA: ${hours}h ${mins}m`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Your Activity</h1>
        </div>
        {adminPhone && (
            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Store Support: {adminPhone}
            </div>
        )}
      </div>

      <section>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
          <ShoppingBag className="h-5 w-5 text-indigo-500" /> Product Orders
        </h2>
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="flex h-full">
                  <div className="w-32 bg-gray-100 flex-shrink-0">
                     <img src={order.productImage || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900 line-clamp-1 mr-2" title={order.productTitle}>{order.productTitle}</h3>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Order #{order.id}</p>
                      {order.status === OrderStatus.CONFIRMED && (
                        <p className="text-xs font-bold text-indigo-600 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" /> {getTimeStatus(order.expectedDeliveryAt)}
                        </p>
                      )}
                      {order.description && <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2 italic line-clamp-2">"{order.description}"</p>}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t flex justify-between items-end">
                      <div className="text-sm text-gray-600 font-medium">Qty: {order.quantity}</div>
                      <div className="text-lg font-bold text-indigo-600">₹{order.totalPrice}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-2 border-t text-[10px] text-gray-400 flex justify-between items-center">
                   <span className="flex items-center gap-1 uppercase font-bold tracking-wider">Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                   <span className="flex items-center gap-1 text-indigo-400 font-bold"><Phone className="h-3 w-3" /> {adminPhone}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
          <FileText className="h-5 w-5 text-indigo-500" /> Custom Requests
        </h2>
        {customOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No custom requests found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customOrders.map(o => (
              <div key={o.id} className="bg-white rounded-xl shadow-sm border border-l-4 border-l-indigo-500 p-5 hover:shadow-md transition-shadow flex flex-col">
                 <div className="flex justify-between items-start mb-3">
                   <div>
                      <h3 className="font-bold text-gray-900">Request #{o.id}</h3>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" /> {new Date(o.createdAt).toLocaleDateString()}
                      </div>
                   </div>
                   <StatusBadge status={o.status} />
                 </div>
                 
                 <p className="text-gray-700 text-sm mb-4 line-clamp-3 bg-gray-50 p-3 rounded flex-grow">
                   {o.description}
                 </p>

                 <div className="text-xs text-gray-500 mb-3 font-bold text-indigo-600">
                    <p>Required by: {o.requestedDate} at {o.requestedTime}</p>
                    {o.status === OrderStatus.CONFIRMED && (
                      <p className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" /> {getTimeStatus(o.deadlineAt)}
                      </p>
                    )}
                 </div>

                 {o.images && o.images.length > 0 && (
                   <div className="flex -space-x-2 overflow-hidden py-1 mb-3">
                     {o.images.map((img: string, i: number) => (
                       <div key={i} className="relative group cursor-pointer" onClick={() => setLightboxImage(img)}>
                         <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-sm transition-transform hover:scale-110 hover:z-10" src={img} alt=""/>
                       </div>
                     ))}
                   </div>
                 )}

                 <div className="pt-3 border-t mt-auto text-[10px] flex justify-end">
                     <span className="flex items-center gap-1 text-indigo-400 font-bold uppercase tracking-widest"><Phone className="h-3 w-3" /> Contact Shop: {adminPhone}</span>
                 </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox for Custom Order Images */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300">
            <X className="h-8 w-8" />
          </button>
          <img src={lightboxImage} alt="Full size" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean; customerOnly?: boolean }> = ({ children, adminOnly = false, customerOnly = false }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && user?.role !== UserRole.ADMIN) return <Navigate to="/" />;
  if (customerOnly && user?.role === UserRole.ADMIN) return <Navigate to="/admin" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/custom-order" element={<ProtectedRoute customerOnly><CustomOrderForm /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute customerOnly><History /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </Layout>
        </HashRouter>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
