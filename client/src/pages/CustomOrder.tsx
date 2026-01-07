
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { placeCustomOrder, getAdminContact } from '../services/storage';
import { useNavigate } from 'react-router-dom';
import { Upload, Calendar, Clock, User as UserIcon, Phone, FileText, X, Loader2 } from 'lucide-react';

export const CustomOrderForm: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    requestedDate: '',
    requestedTime: '',
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
  });
  const [images, setImages] = useState<string[]>([]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      try {
        const base64Images = await Promise.all(files.map(file => fileToBase64(file)));
        setImages(prev => [...prev, ...base64Images]);
      } catch (err) {
        notify("Failed to process images.", "error");
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      notify("Please upload at least one reference photo.", "error");
      return;
    }

    if (!/^\d{10}$/.test(formData.contactPhone)) {
      notify("Please enter a valid 10-digit phone number.", "error");
      return;
    }

    setLoading(true);
    try {
      await placeCustomOrder({
        userId: user!.id,
        ...formData,
        images: images 
      });
      const adminPhone = await getAdminContact();
      notify(`Custom request submitted! Support: ${adminPhone}`, "success");
      navigate('/history');
    } catch (err: any) {
      notify(`Submission failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 animate-fade-in">
      <div className="bg-indigo-600 px-8 py-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-2xl mb-4 backdrop-blur-md">
           <Upload className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Custom Creations</h2>
        <p className="text-indigo-100 font-bold text-sm mt-2 opacity-80 uppercase tracking-widest">
          Share your vision, we bring the flowers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-8">
        
        {/* Reference Images */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Reference Photos (Required)</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-48 border-4 border-gray-100 border-dashed rounded-[32px] cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <p className="text-sm text-gray-500 font-bold"><span className="text-indigo-600">Click to upload</span> photos</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-black">PNG, JPG up to 10MB</p>
              </div>
              <input type="file" className="hidden" multiple onChange={handleFileChange} />
            </label>
          </div>
          {images.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar">
              {images.map((img, i) => (
                <div key={i} className="relative flex-shrink-0 group">
                  <img src={img} alt="preview" className="h-24 w-24 object-cover rounded-2xl border-4 border-white shadow-lg" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 shadow-xl hover:scale-110 transition-transform"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" /> Required Date
            </label>
            <input type="date" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
              value={formData.requestedDate} onChange={e => setFormData({...formData, requestedDate: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Preferred Time
            </label>
            <input type="time" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
              value={formData.requestedTime} onChange={e => setFormData({...formData, requestedTime: e.target.value})}
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <UserIcon className="h-3.5 w-3.5" /> Recipient Name
            </label>
            <input type="text" required placeholder="Who is this for?" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
              value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> Contact Phone
            </label>
            <input 
              type="tel" 
              required 
              pattern="[0-9]{10}"
              minLength={10}
              maxLength={10}
              placeholder="10-digit mobile number" 
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
              value={formData.contactPhone} 
              onChange={e => setFormData({...formData, contactPhone: e.target.value.replace(/\D/g, '')})}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
             <FileText className="h-3.5 w-3.5" /> Describe Your Request
          </label>
          <textarea required rows={5} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all resize-none"
            placeholder="Tell us about the colors, flower types, and occasion..."
            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-black py-5 rounded-[24px] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting Request</> : 'Submit Custom Order'}
          </button>
          <p className="text-center text-[10px] font-black text-gray-400 mt-4 uppercase tracking-widest">We will call you within 2 hours to confirm</p>
        </div>

      </form>
    </div>
  );
};
