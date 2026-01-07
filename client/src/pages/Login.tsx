
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { login } from '../services/storage';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginUser } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

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

      <div className="mt-8 pt-8 border-t border-gray-50 text-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed px-4">
          Securely managed by VKM Flower Shop Systems
        </p>
      </div>
    </div>
  );
};
