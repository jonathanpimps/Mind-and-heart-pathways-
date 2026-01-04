
import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle2, AlertCircle, MessageSquareText } from 'lucide-react';
import { Service, BookingDetails, UserProfile } from '../types';

interface BookingModalProps {
  service: Service | null;
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ service, user, isOpen, onClose }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !service || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBooking: BookingDetails = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      serviceId: service.id,
      serviceTitle: service.title,
      date,
      time,
      reason,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const existingBookings = JSON.parse(localStorage.getItem('app_bookings') || '[]');
    localStorage.setItem('app_bookings', JSON.stringify([...existingBookings, newBooking]));

    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setReason('');
      // Trigger a custom event to notify App to refresh session availability
      window.dispatchEvent(new Event('bookingsUpdated'));
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100">
        <div className={`p-8 ${service.color} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 font-serif">Request Session</h3>
              <p className="text-sm text-slate-700 font-medium opacity-80">{service.title} • Mind & Heart Pathway</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-800" />
            </button>
          </div>
        </div>

        <div className="p-8">
          {submitted ? (
            <div className="text-center py-10 space-y-6 animate-in zoom-in">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-2xl font-bold font-serif text-slate-900 mb-2">Request Sent!</h4>
                <p className="text-slate-500 leading-relaxed px-4">Our intake coordinator will review your request and reason for visit. You'll be notified once approved.</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 text-left">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">Calls are only available during your approved appointment windows.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Date
                  </label>
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-medium text-sm"
                    onChange={e => setDate(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Time
                  </label>
                  <input
                    required
                    type="time"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-medium text-sm"
                    onChange={e => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MessageSquareText className="w-3 h-3" /> Reason for Session
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tell us briefly what you'd like to discuss..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-medium resize-none text-sm placeholder:text-slate-300"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className={`w-full py-5 rounded-2xl font-bold text-white shadow-xl shadow-indigo-600/10 transform active:scale-95 transition-all flex items-center justify-center gap-3 ${service.secondaryColor.replace('text-', 'bg-')}`}
                >
                  Confirm Request <Calendar className="w-5 h-5" />
                </button>
                <p className="text-center text-slate-400 text-[10px] mt-6 font-medium">Session approval typically takes 1-2 business hours.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
