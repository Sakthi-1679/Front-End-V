
import React, { useState, useEffect } from 'react';
import { Product, Order, OrderStatus, User, CustomOrder } from '../types';
import { 
  getProducts, addProduct, updateProduct, deleteProduct, 
  getAllOrders, updateOrderStatus,
  deleteOrder,
  getAdminContact, updateAdminContact,
  getUserById,
  getAllCustomOrders, deleteCustomOrder
} from '../services/storage';
import { useNotification } from '../context/NotificationContext';
import { Plus, Trash2, Clock, Upload, X, Bell, Phone, User as UserIcon, MapPin, FileText, CheckCircle2, AlertCircle, ShoppingBag, ListChecks, Sparkles, Loader2, FileDigit, Pencil, Ban } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'custom'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingCustomCount, setPendingCustomCount] = useState(0);
  const [adminPhone, setAdminPhone] = useState('');

  const { notify, confirm } = useNotification();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newProd, setNewProd] = useState<Partial<Product>>({ title: '', price: 0, durationHours: 0, description: '', images: [] });

  const loadData = async () => {
    try {
        const [loadedProducts, loadedOrders, loadedCustomOrders, contact] = await Promise.all([
            getProducts(),
            getAllOrders(),
            getAllCustomOrders(),
            getAdminContact()
        ]);

        setProducts(loadedProducts);
        setOrders(loadedOrders);
        setCustomOrders(loadedCustomOrders);
        setAdminPhone(contact);

        setPendingOrdersCount(loadedOrders.filter(o => o.status === OrderStatus.PENDING).length);
        setPendingCustomCount(loadedCustomOrders.filter(o => o.status === OrderStatus.PENDING).length);
    } catch (error) {
        console.error("Error loading admin data:", error);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const handleUpdatePhone = async () => {
    if (!/^\d{10}$/.test(adminPhone)) {
        notify('Please enter a valid 10-digit phone number.', 'error');
        return;
    }
    try {
        await updateAdminContact(adminPhone);
        notify('Store contact number updated!', 'success');
    } catch (err) {
        notify('Failed to update contact number', 'error');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProd.title || newProd.price === undefined || newProd.durationHours === undefined) {
      notify("Please fill in all required fields.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const productData = {
        title: newProd.title,
        description: newProd.description || '',
        price: Number(newProd.price),
        durationHours: Number(newProd.durationHours),
        images: newProd.images && newProd.images.length > 0 
          ? newProd.images 
          : ['https://images.unsplash.com/photo-1522673607200-164883524354?auto=format&fit=crop&q=80&w=800']
      };
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        notify("Product updated successfully!", "success");
      } else {
        await addProduct(productData as Product);
        notify("Product added to catalog!", "success");
      }
      
      resetForm();
      await loadData();
    } catch (err: any) {
      notify(`Error: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsAddingProduct(false);
    setEditingProduct(null);
    setNewProd({ title: '', price: 0, durationHours: 0, description: '', images: [] });
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProd({ ...product });
    setIsAddingProduct(true);
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      try {
        const base64Images = await Promise.all(files.map(file => fileToBase64(file)));
        setNewProd(prev => ({ ...prev, images: [...(prev.images || []), ...base64Images] }));
      } catch (err) {
        notify("Failed to process images.", "error");
      }
    }
  };

  const removeNewImage = (index: number) => {
    setNewProd(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteProduct = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    confirm(
      "Delete Product?",
      "This item will be permanently removed from the catalog. This cannot be undone.",
      async () => {
        try {
          await deleteProduct(id);
          await loadData();
          notify("Product deleted.", "success");
        } catch (err: any) {
          notify(`Failed: ${err.message}`, "error");
        }
      }
    );
  };

  const handleStatusUpdate = async (type: 'normal' | 'custom', id: string, status: OrderStatus) => {
    try {
        await updateOrderStatus(type, id, status);
        await loadData();
        notify(`Order status updated to ${status}.`, "success");
    } catch (err) {
        notify('Failed to update status', 'error');
    }
  };

  const handleViewCustomer = async (userId: string) => {
    const user = await getUserById(userId);
    if (user) setSelectedUser(user);
    else notify("User details not found.", "error");
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const target = new Date(deadline);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return { label: 'Overdue!', color: 'text-red-600 font-bold' };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { label: `${hours}h ${minutes}m left`, color: 'text-indigo-600' };
  };

  const sortActive = (a: any, b: any) => {
    const deadlineA = new Date(a.expectedDeliveryAt || a.deadlineAt).getTime();
    const deadlineB = new Date(b.expectedDeliveryAt || b.deadlineAt).getTime();
    return deadlineA - deadlineB;
  };

  let filteredPending: any[] = [];
  let filteredActive: any[] = [];
  let filteredHistory: any[] = [];

  if (activeTab === 'orders') {
    const data = orders.map(o => ({ ...o, type: 'normal' }));
    filteredPending = data.filter(o => o.status === OrderStatus.PENDING);
    filteredActive = data.filter(o => o.status === OrderStatus.CONFIRMED).sort(sortActive);
    filteredHistory = data.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED);
  } else if (activeTab === 'custom') {
    const data = customOrders.map(o => ({ ...o, type: 'custom' }));
    filteredPending = data.filter(o => o.status === OrderStatus.PENDING);
    filteredActive = data.filter(o => o.status === OrderStatus.CONFIRMED).sort(sortActive);
    filteredHistory = data.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED);
  }

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const colors = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.CONFIRMED]: 'bg-indigo-100 text-indigo-800',
      [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [OrderStatus.CANCELLED]: 'bg-gray-100 text-gray-500',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border border-current opacity-70 whitespace-nowrap ${colors[status]}`}>{status}</span>;
  };

  const OrderRow: React.FC<{ order: any }> = ({ order }) => {
    const isCustom = order.type === 'custom';
    const timeStatus = order.status === OrderStatus.CONFIRMED ? getTimeRemaining(order.expectedDeliveryAt || order.deadlineAt) : null;

    return (
      <div className="bg-white border rounded-2xl p-4 flex flex-col gap-4 hover:shadow-lg transition-all relative overflow-hidden group">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${isCustom ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
        
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
             {isCustom ? (
               order.images && order.images[0] ? <img src={order.images[0]} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText /></div>
             ) : (
               <img src={order.productImage} className="w-full h-full object-cover" alt="" />
             )}
          </div>
          
          <div className="flex-grow space-y-1">
             <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-gray-900 text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">{isCustom ? "Custom Request" : order.productTitle}</h4>
                      <span className={`text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider shadow-sm ${isCustom ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
                          {isCustom ? 'CUSTOM' : 'CATALOG'}
                      </span>
                  </div>
                  {/* Bill ID Display */}
                  <div className="flex flex-col mt-0.5">
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: #{order.id}</p>
                     {order.billId && (
                       <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest flex items-center gap-1">
                          <FileDigit className="h-3 w-3" /> {order.billId}
                       </p>
                     )}
                  </div>
                </div>
                <StatusBadge status={order.status} />
             </div>

             <div className="hidden sm:block bg-gray-50 p-3 rounded-xl text-sm text-gray-600 leading-relaxed border border-gray-100">
                {isCustom ? order.description : (order.description || "No specific instructions provided.")}
             </div>
          </div>
        </div>

        <div className="sm:hidden bg-gray-50 p-2 rounded-lg text-xs text-gray-600 leading-relaxed border border-gray-100 italic">
          {isCustom ? order.description : (order.description || "No specific instructions.")}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
             <button onClick={() => handleViewCustomer(order.userId)} className="text-indigo-600 flex items-center gap-2 hover:bg-indigo-50 px-2 sm:px-3 py-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-colors border border-transparent hover:border-indigo-100">
                <UserIcon className="h-4 w-4" /> {isCustom ? order.contactName : "Customer Info"}
             </button>
             {!isCustom && <span className="font-black text-gray-900 text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 bg-gray-100 rounded-lg">Qty: {order.quantity} | ₹{order.totalPrice}</span>}
          </div>
          
          {timeStatus && (
            <div className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-black bg-white px-2 sm:px-3 py-1.5 rounded-lg shadow-sm border ${timeStatus.color}`}>
              <Clock className="h-3.5 w-3.5" /> {timeStatus.label}
            </div>
          )}
        </div>

        <div className="flex flex-row flex-wrap gap-2 pt-3 border-t md:flex-col md:border-t-0 md:pt-0 md:border-l md:pl-4 md:min-w-[140px]">
           {order.status === OrderStatus.PENDING && (
             <>
               <button onClick={() => handleStatusUpdate(order.type, order.id, OrderStatus.CONFIRMED)} className="flex-1 bg-green-600 text-white text-[10px] font-black py-3 px-2 rounded-xl hover:bg-green-700 shadow-md transition-all active:scale-95 uppercase tracking-wider">Accept</button>
               <button onClick={() => handleStatusUpdate(order.type, order.id, OrderStatus.CANCELLED)} className="flex-1 border-2 border-red-50 text-red-600 text-[10px] font-black py-3 px-2 rounded-xl hover:bg-red-50 transition-all active:scale-95 uppercase tracking-wider">Decline</button>
             </>
           )}
           {order.status === OrderStatus.CONFIRMED && (
             <button onClick={() => handleStatusUpdate(order.type, order.id, OrderStatus.COMPLETED)} className="w-full bg-indigo-600 text-white text-[10px] font-black py-4 rounded-xl hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest">
                <CheckCircle2 className="h-4 w-4" /> Mark Completed
             </button>
           )}
           {(order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) && (
             <button onClick={() => confirm("Delete Record?", "This order record will be permanently deleted.", () => {
                const action = order.type === 'normal' ? deleteOrder(order.id) : deleteCustomOrder(order.id);
                action.then(() => { loadData(); notify("Record deleted.", "success"); });
             })} className="text-gray-300 hover:text-red-500 p-3 rounded-full hover:bg-red-50 transition-all mx-auto">
                <Trash2 className="h-6 w-6" />
             </button>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24">
      {/* Responsive Header */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="text-center lg:text-left">
           <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Management Hub</h1>
           <p className="text-gray-400 font-bold text-xs sm:text-base mt-1">Operational Control Center</p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 sm:px-5 sm:py-3 flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <div className="flex flex-col flex-grow min-w-0">
                    <label className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">Support Line</label>
                    <input 
                        className="bg-transparent text-xs sm:text-sm font-black text-gray-900 outline-none w-full sm:w-32" 
                        value={adminPhone} 
                        onChange={(e) => setAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10 Digits"
                        maxLength={10}
                    />
                </div>
                <button onClick={handleUpdatePhone} className="text-[8px] sm:text-[10px] bg-indigo-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black uppercase tracking-widest shadow-md transition-all active:scale-95">Set</button>
            </div>

            <div className="w-full sm:w-auto flex p-1.5 bg-gray-100 rounded-2xl shadow-inner overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex min-w-max">
                  <button onClick={() => setActiveTab('products')} className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                      <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Catalog
                  </button>
                  <button onClick={() => setActiveTab('orders')} className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                      <ListChecks className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Orders {pendingOrdersCount > 0 && <span className="bg-red-500 text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-black">{pendingOrdersCount}</span>}
                  </button>
                  <button onClick={() => setActiveTab('custom')} className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'custom' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Custom {pendingCustomCount > 0 && <span className="bg-purple-500 text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-black">{pendingCustomCount}</span>}
                  </button>
                </div>
            </div>
        </div>
      </div>

      {activeTab === 'products' ? (
        <div className="space-y-6 sm:space-y-8 animate-fade-in px-2 sm:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:px-2">
            <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3 text-gray-900"><ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-500" /> Product Listings</h2>
            <button onClick={() => { setIsAddingProduct(!isAddingProduct); if(isAddingProduct) resetForm(); }} className="w-full sm:w-auto bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:shadow-gray-200 transition-all active:scale-95 font-black uppercase text-[10px] sm:text-xs tracking-widest">
              {isAddingProduct ? <><Ban className="h-5 w-5" /> Cancel</> : <><Plus className="h-5 w-5" /> Add New Item</>}
            </button>
          </div>

          {isAddingProduct && (
            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl border border-indigo-50 animate-fade-in">
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 sm:mb-8 border-b pb-4">
                 {editingProduct ? 'Update Product' : 'New Product Form'}
              </h3>
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Name</label>
                    <input className="w-full border-2 border-gray-100 p-3 sm:p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-gray-50 font-bold" value={newProd.title} onChange={e => setNewProd({...newProd, title: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Price (₹)</label>
                        <input type="number" className="w-full border-2 border-gray-100 p-3 sm:p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-gray-50 font-bold" value={newProd.price ?? ''} onChange={e => setNewProd({...newProd, price: Number(e.target.value)})} required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Prep Hours</label>
                        <input type="number" className="w-full border-2 border-gray-100 p-3 sm:p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-gray-50 font-bold" value={newProd.durationHours ?? ''} onChange={e => setNewProd({...newProd, durationHours: Number(e.target.value)})} required />
                    </div>
                </div>
                
                <div className="md:col-span-2 border-3 border-dashed border-gray-200 rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 bg-gray-50 text-center">
                   <div className="flex flex-col items-center gap-3">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      <p className="text-sm sm:text-lg font-black text-gray-900">Gallery Photos</p>
                      <label className="mt-2 flex items-center justify-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-black bg-white hover:bg-indigo-600 hover:text-white cursor-pointer transition-all shadow-lg active:scale-95 uppercase text-[10px] tracking-widest">
                        Browse Files
                        <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
                      </label>
                   </div>
                   {newProd.images && newProd.images.length > 0 && (
                     <div className="flex gap-4 sm:gap-6 mt-8 overflow-x-auto pb-4 justify-start sm:justify-center px-2">
                       {newProd.images.map((img, idx) => (
                         <div key={idx} className="relative flex-shrink-0">
                           <img src={img} className="h-20 w-20 sm:h-32 sm:w-32 object-cover rounded-2xl shadow-lg border-4 border-white" alt="" />
                           <button type="button" onClick={() => removeNewImage(idx)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 shadow-xl"><X className="h-3 w-3 sm:h-4 sm:w-4" /></button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Description</label>
                    <textarea rows={4} className="w-full border-2 border-gray-100 p-3 sm:p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-gray-50 font-bold transition-all resize-none" value={newProd.description} onChange={e => setNewProd({...newProd, description: e.target.value})} required />
                </div>
                <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6">
                  <button type="button" onClick={resetForm} className="px-8 py-3.5 text-gray-500 font-black hover:bg-gray-100 rounded-2xl uppercase tracking-[0.2em] text-[10px]">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-10 py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl hover:bg-indigo-700 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2">
                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : (editingProduct ? "Update Item" : "Save Item")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
               <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
               <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No products in catalog yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 px-2 sm:px-0">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-[24px] sm:rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group flex flex-col h-full">
                  <div className="relative h-48 sm:h-64 bg-gray-100 overflow-hidden">
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4 sm:p-6 gap-2">
                       <button onClick={(e) => { e.stopPropagation(); startEditProduct(p); }} className="bg-white/95 backdrop-blur-md text-gray-900 flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-white transition-all uppercase tracking-widest text-[9px] sm:text-[10px] shadow-xl">
                          <Pencil className="h-4 w-4 sm:h-5 sm:w-5" /> Edit
                       </button>
                       <button onClick={(e) => handleDeleteProduct(e, p.id)} className="bg-red-600/95 backdrop-blur-md text-white w-12 sm:w-14 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black flex items-center justify-center hover:bg-red-600 transition-all shadow-xl">
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                       </button>
                    </div>
                    <div className="absolute top-3 right-3 sm:top-5 sm:right-5 bg-white/95 backdrop-blur-md text-gray-900 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black shadow-xl flex items-center gap-2 border border-gray-100">
                       <Clock className="h-3.5 w-3.5 text-indigo-500" /> {p.durationHours}H PREP
                    </div>
                  </div>
                  <div className="p-4 sm:p-8 flex flex-col flex-grow">
                    <h3 className="font-black text-lg sm:text-xl text-gray-900 mb-1 sm:mb-2 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">{p.title}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-3 font-bold leading-relaxed flex-grow">{p.description}</p>
                    <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-50">
                      <span className="font-black text-2xl sm:text-3xl text-gray-900">₹{p.price}</span>
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                          <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 animate-fade-in px-2 sm:px-0">
          
          <div className="space-y-4 sm:space-y-6">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" /> Inbound ({filteredPending.length})
                </h3>
             </div>
             <div className="space-y-4">
                {filteredPending.length === 0 ? (
                    <div className="bg-white p-10 sm:p-16 rounded-[24px] sm:rounded-[40px] border border-dashed border-gray-200 text-center text-gray-400 font-black uppercase text-[9px] sm:text-[10px] tracking-widest flex flex-col items-center gap-2 sm:gap-3">
                        <ListChecks className="h-6 w-6 sm:h-8 sm:w-8 text-gray-200" />
                        Queue is Empty
                    </div>
                ) : filteredPending.map(o => <OrderRow key={o.id} order={o} />)}
             </div>
          </div>

          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-2">
                <h3 className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ${activeTab === 'custom' ? 'text-purple-400' : 'text-indigo-400'}`}>
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" /> Queue Progress ({filteredActive.length})
                </h3>
                <span className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border">Priority: Deadline</span>
             </div>
             <div className="space-y-4">
                {filteredActive.length === 0 ? (
                    <div className="bg-gray-50 p-12 sm:p-24 rounded-[24px] sm:rounded-[40px] border-3 border-dashed border-gray-200 text-center text-gray-300 font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em]">
                        Workshop Floor Clear.
                    </div>
                ) : filteredActive.map(o => <OrderRow key={o.id} order={o} />)}
             </div>

             {filteredHistory.length > 0 && (
                <div className="mt-12 sm:mt-20 space-y-4 sm:space-y-5">
                    <h3 className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] px-2">History</h3>
                    <div className="space-y-3">
                        {filteredHistory.slice(0, 10).map((o: any) => (
                            <div key={o.id} className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-wrap justify-between items-center gap-3 group hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-grow">
                                    <div className={`flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner ${o.status === OrderStatus.COMPLETED ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-300'}`}>
                                        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-gray-900 text-sm sm:text-base truncate">{o.type === 'custom' ? 'Custom Req' : o.productTitle}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">#{o.id} {o.billId ? `/ ${o.billId}` : ''}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-6 ml-auto">
                                    <StatusBadge status={o.status} />
                                    <button onClick={() => confirm("Delete Record?", "This order record will be permanently deleted.", () => {
                                        const action = o.type === 'normal' ? deleteOrder(o.id) : deleteCustomOrder(o.id);
                                        action.then(() => { loadData(); notify("Record deleted.", "success"); });
                                    })} className="text-gray-200 hover:text-red-500 transition-colors p-2 sm:p-3 hover:bg-red-50 rounded-full">
                                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )}
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6 z-[100] animate-fade-in">
            <div className="bg-white rounded-t-[40px] sm:rounded-[48px] w-full max-w-sm shadow-2xl overflow-hidden border border-white/20 transform transition-transform animate-scale-up">
                <div className="bg-indigo-600 px-6 sm:px-8 py-8 sm:py-12 flex flex-col items-center text-white relative">
                    <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-all"><X className="h-6 w-6 sm:h-8 sm:w-8" /></button>
                    <div className="h-20 w-20 sm:h-28 sm:w-28 bg-white/10 backdrop-blur-2xl rounded-[32px] sm:rounded-[40px] flex items-center justify-center text-white text-3xl sm:text-5xl font-black mb-4 sm:mb-6 border border-white/20 shadow-2xl">
                        {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="text-xl sm:text-3xl font-black tracking-tight">{selectedUser.name}</h4>
                    <span className="text-[10px] sm:text-sm text-indigo-100/60 font-black uppercase tracking-widest mt-1">{selectedUser.email}</span>
                </div>
                <div className="p-6 sm:p-10 space-y-4 sm:space-y-5 bg-white pb-10 sm:pb-10">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-4 sm:gap-5 bg-gray-50 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-gray-100">
                            <div className="h-10 w-10 sm:h-14 sm:w-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100"><Phone className="h-5 w-5 sm:h-6 sm:w-6" /></div>
                            <div>
                                <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Phone</p>
                                <p className="text-gray-900 font-black text-sm sm:text-lg">{selectedUser.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-5 bg-gray-50 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-gray-100">
                            <div className="h-10 w-10 sm:h-14 sm:w-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100"><MapPin className="h-5 w-5 sm:h-6 sm:w-6" /></div>
                            <div>
                                <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Service Area</p>
                                <p className="text-gray-900 font-black text-sm sm:text-lg">{selectedUser.area}</p>
                                <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase mt-0.5 tracking-wider">{selectedUser.city}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="w-full bg-gray-900 text-white font-black py-4 sm:py-6 rounded-[24px] sm:rounded-[32px] hover:bg-black transition-all shadow-2xl shadow-gray-200 mt-4 sm:mt-8 active:scale-[0.96] uppercase tracking-[0.2em] text-[10px]">Close</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
