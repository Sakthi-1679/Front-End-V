
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, User, LogOut, Menu, X, ShieldCheck } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logoutUser } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-indigo-600';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <ShoppingBag className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-800">VKM Flower Shop</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={isActive('/')}>Products</Link>
            {isAuthenticated ? (
              <>
                {!isAdmin && <Link to="/custom-order" className={isActive('/custom-order')}>Custom Order</Link>}
                {isAdmin ? (
                  <Link to="/admin" className={`flex items-center gap-1 ${isActive('/admin')}`}>
                    <ShieldCheck className="h-4 w-4" /> Admin Dashboard
                  </Link>
                ) : (
                  <Link to="/history" className={isActive('/history')}>My Orders</Link>
                )}
                <div className="flex items-center gap-4 pl-4 border-l">
                  <span className="text-sm text-gray-500">Hello, {user?.name}</span>
                  <button onClick={logoutUser} className="text-gray-500 hover:text-red-600">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-indigo-600">Login</Link>
                <Link to="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
             <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
               {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t px-4 py-2 space-y-3">
          <Link to="/" className="block py-2 text-gray-600" onClick={() => setIsOpen(false)}>Products</Link>
          {isAuthenticated ? (
            <>
              {!isAdmin && <Link to="/custom-order" className="block py-2 text-gray-600" onClick={() => setIsOpen(false)}>Custom Request</Link>}
              {isAdmin ? (
                <Link to="/admin" className="block py-2 text-indigo-600 font-bold" onClick={() => setIsOpen(false)}>Admin Dashboard</Link>
              ) : (
                <Link to="/history" className="block py-2 text-gray-600" onClick={() => setIsOpen(false)}>My Orders</Link>
              )}
              <button onClick={() => { logoutUser(); setIsOpen(false); }} className="block w-full text-left py-2 text-red-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2 text-gray-600" onClick={() => setIsOpen(false)}>Login</Link>
              <Link to="/signup" className="block py-2 text-indigo-600 font-bold" onClick={() => setIsOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} VKM Flower Shop. Specialized Service for Kanchipuram.
        </div>
      </footer>
    </div>
  );
};
