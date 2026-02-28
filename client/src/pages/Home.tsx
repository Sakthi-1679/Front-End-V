
import React, { useState, useEffect } from 'react';
import { Product, UserRole } from '../types';
import { getProducts, placeOrder, getAdminContact } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Search, ShoppingCart, Clock, Info, ShieldAlert, Loader2, Flower, ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [orderQty, setOrderQty] = useState(1);
  const [orderNote, setOrderNote] = useState('');
  const [zoomedImages, setZoomedImages] = useState<string[]>([]);
  const [zoomedIndex, setZoomedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(data);
      })
      .catch(err => {
        console.warn("Could not fetch products, showing empty list.");
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const openZoom = (images: string[], index = 0) => {
    setZoomedImages(images);
    setZoomedIndex(index);
  };
  const closeZoom = () => setZoomedImages([]);
  const zoomPrev = (e: React.MouseEvent) => { e.stopPropagation(); setZoomedIndex(i => (i - 1 + zoomedImages.length) % zoomedImages.length); };
  const zoomNext = (e: React.MouseEvent) => { e.stopPropagation(); setZoomedIndex(i => (i + 1) % zoomedImages.length); };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOrderClick = (product: Product) => {
    if (user?.role === UserRole.ADMIN) {
      notify("Administrators cannot place personal orders.", "error");
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setOrderQty(1);
    setOrderNote('');
  };

  const submitOrder = async () => {
    if (!selectedProduct || !user) return;
    try {
      await placeOrder({
        userId: user.id,
        productId: selectedProduct.id,
        quantity: orderQty,
        description: orderNote
      });
      const adminPhone = await getAdminContact();
      const totalAmount = selectedProduct.price * orderQty;
      const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

      const message = [
        '🌸 *New Order – VKM Flowers*',
        '',
        `👤 Customer: ${user.name}`,
        `📞 Phone: ${user.phone}`,
        `📦 Product: ${selectedProduct.title}`,
        `🔢 Quantity: ${orderQty}`,
        orderNote ? `📝 Note: ${orderNote}` : '',
        `💰 Amount Due: ₹${totalAmount}`,
        `📅 Ordered On: ${now}`,
      ].filter(Boolean).join('\n');

      window.open(`https://wa.me/91${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
      setSelectedProduct(null);
      notify('Order placed! WhatsApp opened to notify admin.', 'success');
    } catch (e) {
      notify('Failed to place order. Please check your connection.', 'error');
    }
  };

  const isUserAdmin = user?.role === UserRole.ADMIN;

  const nextImage = () => {
    if (selectedProduct && selectedProduct.images.length > 1) {
      setActiveImageIndex((prev) => (prev + 1) % selectedProduct.images.length);
    }
  };

  const prevImage = () => {
    if (selectedProduct && selectedProduct.images.length > 1) {
      setActiveImageIndex((prev) => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      {!isAuthenticated && !loading && (
        <div className="bg-indigo-600 rounded-[32px] p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-10 -translate-y-10 blur-2xl"></div>
           <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full translate-x-10 translate-y-10 blur-3xl"></div>
           
           <div className="relative z-10">
             <div className="bg-white/10 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Flower className="h-8 w-8 text-white" />
             </div>
             <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Welcome to VKM Flower Shop</h1>
             <p className="text-indigo-100 font-medium text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
               Specialized floral services for Kanchipuram. Browse our catalog below and sign in to place your custom orders.
             </p>
           </div>
        </div>
      )}

      {/* Search Header */}
      <div className="relative max-w-lg mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 md:py-4 border-2 border-transparent bg-white rounded-full shadow-lg placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-0 text-sm font-semibold transition-all"
          placeholder="Search our collection..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
           <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-500" />
           <p className="font-bold text-sm tracking-widest uppercase">Loading Collection...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full group">
              <div className="relative h-40 md:h-64 w-full overflow-hidden bg-gray-100">
                <img 
                  src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300?text=No+Image'} 
                  alt={product.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-zoom-in" 
                  onClick={() => openZoom(product.images && product.images.length > 0 ? product.images : [], 0)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div onClick={() => openZoom(product.images && product.images.length > 0 ? product.images : [], 0)} className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <ZoomIn className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] md:text-xs font-black text-gray-700 flex items-center gap-1 shadow-sm">
                   <Clock className="h-3 w-3" /> {product.durationHours}h
                </div>
              </div>
              <div className="p-4 md:p-6 flex flex-col flex-grow">
                <div className="mb-2">
                  <h3 className="text-sm md:text-lg font-black text-gray-900 leading-tight line-clamp-1">{product.title}</h3>
                  <p className="text-xs md:text-sm text-gray-400 mt-1 font-medium line-clamp-2">{product.description}</p>
                </div>
                
                <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                   <span className="text-lg md:text-xl font-black text-indigo-600">₹{product.price}</span>
                   <button 
                    onClick={() => handleOrderClick(product)}
                    disabled={isUserAdmin}
                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl transition-all duration-200 text-xs md:text-sm font-black uppercase tracking-wider shadow-lg active:scale-95
                      ${isUserAdmin 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-900 text-white hover:bg-black'}`}
                  >
                    {isUserAdmin ? <ShieldAlert className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
             <Info className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-black text-gray-900">Catalog Empty</h3>
          <p className="text-gray-500 text-sm mt-1">Check back later for new arrivals.</p>
        </div>
      )}

      {/* Image Zoom Lightbox */}
      {zoomedImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in"
          onClick={closeZoom}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all z-10"
            onClick={closeZoom}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          {zoomedImages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">
              {zoomedIndex + 1} / {zoomedImages.length}
            </div>
          )}

          {/* Prev */}
          {zoomedImages.length > 1 && (
            <button
              onClick={zoomPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition-all z-10"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          {/* Image */}
          <img
            src={zoomedImages[zoomedIndex]}
            alt={`Photo ${zoomedIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl select-none animate-scale-up"
            onClick={e => e.stopPropagation()}
          />

          {/* Next */}
          {zoomedImages.length > 1 && (
            <button
              onClick={zoomNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition-all z-10"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}

          {/* Dot indicators */}
          {zoomedImages.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {zoomedImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={e => { e.stopPropagation(); setZoomedIndex(idx); }}
                  className={`rounded-full transition-all ${
                    idx === zoomedIndex ? 'bg-white w-5 h-2' : 'bg-white/40 w-2 h-2'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[600px] animate-scale-up">
            
            {/* Image Gallery Section */}
            <div className="w-full md:w-1/2 bg-gray-100 relative group flex items-center justify-center">
              {selectedProduct.images.length > 0 ? (
                <>
                  <img 
                    src={selectedProduct.images[activeImageIndex]} 
                    alt={selectedProduct.title} 
                    className="w-full h-64 md:h-full object-cover"
                  />
                  {selectedProduct.images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
                      <button onClick={nextImage} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {selectedProduct.images.map((_, idx) => (
                          <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeImageIndex ? 'bg-indigo-600 w-3' : 'bg-white/60'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                   <Info className="h-10 w-10 mb-2" />
                   <span className="text-xs uppercase font-bold">No Image</span>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
              <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{selectedProduct.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">{selectedProduct.description}</p>
              
              <div className="mt-auto space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Quantity</label>
                  <input type="number" min="1" value={orderQty} onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value)))} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Custom Notes (Optional)</label>
                  <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} rows={2} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none" placeholder="Any specific instructions..." />
                </div>

                <div className="bg-indigo-50/50 p-6 rounded-[24px] border border-indigo-100 flex flex-col items-center text-center">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Total Amount</span>
                  <span className="text-4xl font-black text-indigo-600">₹{selectedProduct.price * orderQty}</span>
                  <div className="text-[10px] text-indigo-400 font-bold uppercase mt-2 tracking-widest flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Ready in approx. {selectedProduct.durationHours * orderQty} Hours
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button onClick={() => setSelectedProduct(null)} className="py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 rounded-2xl transition-all">Cancel</button>
                  <button onClick={submitOrder} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Confirm Order</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
