
import React from 'react';
import { Calendar, Clock, MessageCircle, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile, BookingDetails } from '../types';

interface MemberDashboardProps {
  user: UserProfile;
  bookings: BookingDetails[];
  onOpenChat: () => void;
  onOpenAppointments: () => void;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ user, bookings, onOpenChat, onOpenAppointments }) => {
  const latestBooking = bookings[0];

  return (
    <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-indigo-600/5 border border-slate-100 max-w-6xl mx-auto -mt-20 relative z-20 animate-in slide-in-from-bottom-10 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center text-white text-3xl font-serif font-bold shadow-xl overflow-hidden border-4 border-white">
            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-1">Welcome back, {user.preferredName || user.name.split(' ')[0]}</h2>
            <p className="text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Member since {user.joinedDate}
            </p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={onOpenChat} className="flex-1 md:flex-none px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-100 transition-all">
            <MessageCircle className="w-5 h-5" /> Message Bea
          </button>
          <button onClick={onOpenAppointments} className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all">
            View History <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mt-12 pt-12 border-t border-slate-100 grid md:grid-cols-3 gap-8">
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Latest Appointment</h4>
          {latestBooking ? (
            <div>
              <div className="flex justify-between items-start mb-4">
                <p className="font-bold text-slate-900">{latestBooking.serviceTitle}</p>
                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                  latestBooking.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {latestBooking.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-500">
                <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-400" /> {latestBooking.date}</p>
                <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-400" /> {latestBooking.time}</p>
              </div>
              {latestBooking.status === 'APPROVED' && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4" /> Call Gated Access Open at {latestBooking.time}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm mb-4">No upcoming sessions.</p>
              <button className="text-indigo-600 font-bold text-xs uppercase tracking-widest">Schedule Now</button>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Mental Wellness Score</h4>
          <div className="flex items-end gap-1 mb-4">
            <span className="text-5xl font-serif font-bold text-slate-900">82</span>
            <span className="text-slate-400 font-bold text-xl mb-1">/100</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">You've attended 3 sessions this month. Your spiritual resilience is trending upwards.</p>
        </div>

        <div className="p-6 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-600/20">
          <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-6">Daily Encouragement</h4>
          <p className="text-lg font-serif italic mb-6">"Peace is not the absence of trouble, but the presence of God."</p>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-80">
            <CheckCircle2 className="w-4 h-4" /> Recommended for your journey
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
