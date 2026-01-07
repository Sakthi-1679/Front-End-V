
import React, { useState } from 'react';
import { register } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', city: 'Kanchipuram', area: ''
  });
  const { loginUser } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.city !== 'Kanchipuram') {
      notify('Service is currently available in Kanchipuram only.', 'error');
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      notify('Phone number must be exactly 10 digits.', 'error');
      return;
    }

    try {
      const response = await register(formData);
      loginUser(response);
      notify(`Account created! Welcome, ${formData.name}.`, 'success');
      navigate('/');
    } catch (err: any) {
      notify(err.message || 'Registration failed', 'error');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-[32px] shadow-2xl border border-gray-100 animate-fade-in">
      <h2 className="text-3xl font-black text-center mb-8 text-gray-900 tracking-tight">Create Account</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Full Name</label>
          <input type="text" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Email</label>
          <input type="email" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Password</label>
          <input type="password" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Phone Number (10 digits)</label>
          <input 
            type="tel" 
            pattern="[0-9]{10}"
            minLength={10}
            maxLength={10}
            required 
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all" 
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} 
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">City</label>
            <input type="text" value="Kanchipuram" disabled className="w-full bg-gray-100 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-400 cursor-not-allowed" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Area</label>
            <input type="text" placeholder="Area" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
          </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4">
          Create Account
        </button>
      </form>

      <div className="text-center mt-8">
        <span className="text-gray-400 font-bold text-sm">Already have an account? </span>
        <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-black text-sm">Login</Link>
      </div>
    </div>
  );
};
