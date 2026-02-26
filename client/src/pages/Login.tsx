
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { login } from '../services/storage';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../types';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

const ADMIN_EMAIL = (import.meta as any).env?.VITE_ADMIN_EMAIL as string | undefined;
const ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD as string | undefined;

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const { loginUser, isAuthenticated, user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  // Auto-redirect if already logged in (persistent session from localStorage)
  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === UserRole.ADMIN ? '/admin' : '/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login(email.trim(), password.trim());
      if (response && response.user) {
        loginUser(response);
        notify(`Welcome back, ${response.user.name}!`, "success");
        
        if (response.user.role === UserRole.ADMIN) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      notify(err.message || 'Invalid credentials. Please verify your email and password.', "error");
    }
  };

  const fillAdminCredentials = () => {
    if (ADMIN_EMAIL) setEmail(ADMIN_EMAIL);
    if (ADMIN_PASSWORD) setPassword(ADMIN_PASSWORD);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 animate-fade-in mt-10">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Login</h2>
        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Access VKM Special Services</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2 px-1">Email</label>
          <input 
            type="email" 
            required 
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" 
            placeholder="example@mail.com"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2 px-1">Password</label>
          <input 
            type="password" 
            required 
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" 
            placeholder="••••••••"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-[0.98]">
          Sign In
        </button>
      </form>
      
      <div className="text-center mt-8">
        <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Need an account? </span>
        <Link to="/signup" className="text-indigo-600 hover:text-indigo-500 font-black text-xs uppercase tracking-widest underline decoration-2 underline-offset-4">Sign Up</Link>
      </div>

      {/* Admin Quick Access */}
      {ADMIN_EMAIL && ADMIN_PASSWORD && (
        <div className="mt-8 pt-8 border-t border-gray-100">
          <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Admin Quick Access</span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Email</span>
                <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{ADMIN_EMAIL}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Password</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-700 font-mono">
                    {showAdminPass ? ADMIN_PASSWORD : '•'.repeat(ADMIN_PASSWORD?.length ?? 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(v => !v)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    title={showAdminPass ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Use Admin Credentials
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
