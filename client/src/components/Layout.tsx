
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, ShieldCheck, Flower2, Heart } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logoutUser } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top Promo Bar */}
      <div className="bg-rose-600 text-white text-center py-2 px-4 text-xs font-semibold tracking-wide">
        🌸 Free Delivery on orders above ₹499 &nbsp;|&nbsp; Kanchipuram Exclusive &nbsp;|&nbsp; Fresh blooms, every day
      </div>

      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="bg-gradient-to-br from-rose-400 to-rose-600 p-2 rounded-xl shadow-sm">
                <Flower2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">VKM <span className="text-rose-500">Flowers</span></span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link to="/" className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive('/') ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-rose-50 hover:text-rose-600'}`}>
                Shop
              </Link>
              {isAuthenticated && !isAdmin && (
                <>
                  <Link to="/custom-order" className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive('/custom-order') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}>
                    Custom Order
                  </Link>
                  <Link to="/history" className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive('/history') ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                    My Orders
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 ${isActive('/admin') ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}>
                  <ShieldCheck className="h-4 w-4" /> Dashboard
                </Link>
              )}
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                    <div className="w-6 h-6 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{user?.name?.split(' ')[0]}</span>
                  </div>
                  <button onClick={logoutUser} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-sm font-semibold text-gray-600 px-3 py-2 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">Login</Link>
                  <Link to="/signup" className="bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-bold px-5 py-2 rounded-xl hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-100 transition-all">
                    Sign Up Free
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-xl">
            <Link to="/" className="flex items-center py-3 px-3 rounded-xl text-gray-700 font-semibold hover:bg-rose-50 hover:text-rose-600 transition-all" onClick={() => setIsOpen(false)}>
              🌸 Shop Flowers
            </Link>
            {isAuthenticated ? (
              <>
                {!isAdmin && (
                  <>
                    <Link to="/custom-order" className="flex items-center py-3 px-3 rounded-xl text-gray-700 font-semibold hover:bg-orange-50 hover:text-orange-600 transition-all" onClick={() => setIsOpen(false)}>✨ Custom Order</Link>
                    <Link to="/history" className="flex items-center py-3 px-3 rounded-xl text-gray-700 font-semibold hover:bg-emerald-50 hover:text-emerald-600 transition-all" onClick={() => setIsOpen(false)}>📦 My Orders</Link>
                  </>
                )}
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-2 py-3 px-3 rounded-xl text-teal-700 font-semibold hover:bg-teal-50 transition-all" onClick={() => setIsOpen(false)}>
                    <ShieldCheck className="h-4 w-4" /> Admin Dashboard
                  </Link>
                )}
                <div className="border-t border-gray-100 pt-3 mt-2">
                  <div className="px-3 py-2 text-sm text-gray-500">Hello, <span className="font-bold text-gray-800">{user?.name}</span></div>
                  <button onClick={() => { logoutUser(); setIsOpen(false); }} className="w-full text-left py-3 px-3 rounded-xl text-red-600 font-semibold hover:bg-red-50 transition-all flex items-center gap-2">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-100 pt-3 mt-2 space-y-2">
                <Link to="/login" className="block py-3 px-3 rounded-xl text-gray-700 font-semibold hover:bg-rose-50 hover:text-rose-600 transition-all" onClick={() => setIsOpen(false)}>Login</Link>
                <Link to="/signup" className="block py-3 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-center hover:from-rose-600 hover:to-rose-700 shadow-sm transition-all" onClick={() => setIsOpen(false)}>Sign Up Free</Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-rose-400 to-rose-600 p-2 rounded-xl shadow-sm">
                <Flower2 className="h-5 w-5 text-white" />
              </div>
              <span className="font-black text-lg text-gray-900">VKM <span className="text-rose-500">Flowers</span></span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-gray-500 text-sm font-medium">Kanchipuram's Premier Floral Service</p>
              <p className="text-gray-400 text-xs">&copy; {new Date().getFullYear()} VKM Flower Shop. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-1.5 text-rose-500 text-sm font-semibold">
              <Heart className="h-4 w-4 fill-rose-500" /> Made with Love
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
