
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { placeCustomOrder, getAdminContact } from '../services/storage';
import { useNavigate } from 'react-router-dom';
import { Upload, Calendar, Clock, User as UserIcon, Phone, FileText, X, Loader2, Sparkles } from 'lucide-react';

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

      // Send custom order details to admin via WhatsApp
      const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      const message = [
        '🌸 *New Custom Order – VKM Flowers*',
        '',
        `👤 Name: ${formData.contactName}`,
        `📞 Phone: ${formData.contactPhone}`,
        `📅 Required Date: ${formData.requestedDate}`,
        `⏰ Preferred Time: ${formData.requestedTime}`,
        `📝 Description: ${formData.description}`,
        '',
        `📸 Photos: ${images.length} reference photo(s) attached – customer will share them in this chat.`,
        '',
        `🕒 Submitted: ${now}`,
      ].join('\n');

      const waUrl = `https://wa.me/91${adminPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');

      notify(`Custom request submitted! WhatsApp opened – please also send your reference photos in that chat.`, 'success');
      navigate('/history');
    } catch (err: any) {
      notify(`Submission failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 px-4 sm:px-0">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        {/* Orange Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-300/20 rounded-full translate-x-16 -translate-y-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-300/20 rounded-full -translate-x-8 translate-y-8 blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur p-3.5 rounded-2xl border border-white/30 flex-shrink-0">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Custom Creations</h2>
              <p className="text-orange-100 font-medium text-sm mt-0.5">Share your vision, we bring the flowers</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-7">

          {/* Reference Images */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
              <Upload className="h-3.5 w-3.5 text-orange-500" /> Reference Photos (Required)
            </label>
            <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-orange-200 rounded-2xl cursor-pointer bg-orange-50 hover:bg-orange-100/50 transition-all group">
              <div className="flex flex-col items-center py-5">
                <Upload className="w-9 h-9 mb-3 text-orange-300 group-hover:text-orange-500 transition-colors" />
                <p className="text-sm text-gray-600 font-semibold"><span className="text-orange-600 font-bold">Click to upload</span> reference photos</p>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">PNG, JPG up to 10MB each</p>
              </div>
              <input type="file" className="hidden" multiple onChange={handleFileChange} />
            </label>
            {images.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
                {images.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={img} alt="preview" className="h-20 w-20 object-cover rounded-xl border-2 border-orange-100 shadow-md" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-orange-500" /> Required Date
              </label>
              <input type="date" required className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 font-medium text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all"
                value={formData.requestedDate} onChange={e => setFormData({...formData, requestedDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-orange-500" /> Preferred Time
              </label>
              <input type="time" required className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 font-medium text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all"
                value={formData.requestedTime} onChange={e => setFormData({...formData, requestedTime: e.target.value})}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                <UserIcon className="h-3.5 w-3.5 text-orange-500" /> Recipient Name
              </label>
              <input type="text" required placeholder="Who is this for?" className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all"
                value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-orange-500" /> Contact Phone
              </label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                minLength={10}
                maxLength={10}
                placeholder="10-digit mobile number"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all"
                value={formData.contactPhone}
                onChange={e => setFormData({...formData, contactPhone: e.target.value.replace(/\D/g, '')})}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-orange-500" /> Describe Your Request
            </label>
            <textarea required rows={5} className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all resize-none"
              placeholder="Tell us about the colors, flower types, occasion, and any specific requirements..."
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-3">
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-100 hover:from-orange-600 hover:to-amber-600 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting Request...</> : 'Submit Custom Order'}
            </button>
            <p className="text-center text-xs text-gray-400 font-medium">We will call you within 2 hours to confirm your order</p>
          </div>

        </form>
      </div>
    </div>
  );
};

