
import React, { useState, useEffect, useRef } from 'react';
import { X, User, MapPin, Sparkles, LogOut, CheckCircle2, ShieldCheck, Calendar, Clock, Trash2, ArrowRight, MessageSquareText, Camera, MessageCircle } from 'lucide-react';
import { UserProfile, BookingDetails } from '../types';
import ChatRoom from './ChatRoom';

interface ProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  initialTab?: 'profile' | 'appointments' | 'chat';
  onClose: () => void;
  onUpdate: (user: UserProfile) => void;
  onLogout: () => void;
}

const FOCUS_OPTIONS = [
  'Anxiety & Stress', 'Spiritual Growth', 'Relationships', 
  'Career Development', 'Faith Transitions', 'Inner Peace',
  'Mental Resilience', 'Grief Support'
];

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, initialTab = 'profile', onClose, onUpdate, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile>(user);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'appointments' | 'chat'>(initialTab);
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const allBookings = JSON.parse(localStorage.getItem('app_bookings') || '[]');
      setBookings(allBookings.filter((b: BookingDetails) => b.userId === user.id));
      setProfile(user); 
      setActiveTab(initialTab); // Respect the initialTab whenever modal opens
    }
  }, [isOpen, user, initialTab]);

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFocusArea = (area: string) => {
    const newAreas = profile.focusAreas.includes(area)
      ? profile.focusAreas.filter(a => a !== area)
      : [...profile.focusAreas, area];
    setProfile({ ...profile, focusAreas: newAreas });
  };

  const handleSave = () => {
    onUpdate(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const simulateApproval = (bookingId: string) => {
    const allBookings = JSON.parse(localStorage.getItem('app_bookings') || '[]');
    const updated = allBookings.map((b: BookingDetails) => 
      b.id === bookingId ? { ...b, status: b.status === 'APPROVED' ? 'PENDING' : 'APPROVED' } : b
    );
    localStorage.setItem('app_bookings', JSON.stringify(updated));
    setBookings(updated.filter((b: BookingDetails) => b.userId === user.id));
    window.dispatchEvent(new Event('bookingsUpdated'));
  };

  const deleteBooking = (bookingId: string) => {
    const allBookings = JSON.parse(localStorage.getItem('app_bookings') || '[]');
    const updated = allBookings.filter((b: BookingDetails) => b.id !== bookingId);
    localStorage.setItem('app_bookings', JSON.stringify(updated));
    setBookings(updated.filter((b: BookingDetails) => b.userId === user.id));
    window.dispatchEvent(new Event('bookingsUpdated'));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in zoom-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative h-[85vh]">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-20">
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Sidebar */}
        <div className="md:w-1/3 bg-slate-50 p-10 border-r border-slate-100 flex flex-col h-full">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative group">
              <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-bold font-serif shadow-xl shadow-indigo-600/20 mb-6 overflow-hidden border-4 border-white">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} className="w-full h-full object-cover" />
                ) : profile.name.charAt(0)}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 right-[-4px] p-2 bg-white text-indigo-600 rounded-xl shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-serif mb-1">{profile.preferredName || profile.name}</h3>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Wellness Member</p>
          </div>
          
          <nav className="space-y-2 flex-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <User className="w-4 h-4" /> My Profile
            </button>
            <button 
              onClick={() => setActiveTab('appointments')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'appointments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Calendar className="w-4 h-4" /> Sessions {bookings.length > 0 && <span className="ml-auto bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px]">{bookings.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <MessageCircle className="w-4 h-4" /> Direct Messages
            </button>
          </nav>
          
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <button 
              onClick={onLogout}
              className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
            <div className="p-5 bg-indigo-600/5 rounded-2xl border border-indigo-600/10">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Privacy Guard</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed font-medium">Chat history is private and strictly between you and clinical staff.</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:w-2/3 flex flex-col h-full bg-white relative">
          {activeTab === 'profile' && (
            <div className="p-10 animate-in slide-in-from-right duration-500 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-bold font-serif text-slate-900">Account Settings</h2>
                <button 
                  onClick={handleSave}
                  className={`px-6 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                    isSaved ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isSaved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : 'Update Profile'}
                </button>
              </div>
              
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={e => setProfile({...profile, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Preferred Name</label>
                    <input 
                      type="text" 
                      value={profile.preferredName || ''}
                      onChange={e => setProfile({...profile, preferredName: e.target.value})}
                      placeholder="How should we call you?"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      disabled
                      type="email" 
                      value={profile.email}
                      className="w-full bg-slate-100 border border-slate-100 rounded-2xl px-5 py-3 outline-none text-slate-400 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                    <input 
                      type="text" 
                      value={profile.location || ''}
                      onChange={e => setProfile({...profile, location: e.target.value})}
                      placeholder="e.g. Chicago, IL"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Personal Wellness Bio</label>
                  <textarea 
                    rows={3}
                    value={profile.bio || ''}
                    onChange={e => setProfile({...profile, bio: e.target.value})}
                    placeholder="Share what's on your mind today..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium resize-none"
                  ></textarea>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Areas of Interest</label>
                  <div className="flex flex-wrap gap-2">
                    {FOCUS_OPTIONS.map(area => (
                      <button
                        key={area}
                        onClick={() => toggleFocusArea(area)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                          profile.focusAreas.includes(area)
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="p-10 animate-in slide-in-from-right duration-500 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-bold font-serif text-slate-900">Session History</h2>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Admin View</span>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                   <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                   <p className="text-slate-400 font-medium">No sessions scheduled yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((booking) => (
                    <div key={booking.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-lg mb-1">{booking.serviceTitle}</h4>
                          <div className="flex items-center gap-4 text-slate-500 text-xs font-medium mb-3">
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-400" /> {booking.time}</span>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <div className="flex items-center gap-2 mb-1.5">
                                <MessageSquareText className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goal</span>
                             </div>
                             <p className="text-sm text-slate-600 leading-relaxed italic">"{booking.reason || 'Not provided.'}"</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ml-4 shrink-0 h-fit ${
                          booking.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {booking.status}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                        <button 
                          onClick={() => simulateApproval(booking.id)}
                          className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${
                            booking.status === 'APPROVED' ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                          }`}
                        >
                          {booking.status === 'APPROVED' ? 'Revoke (Sim)' : 'Approve (Sim)'}
                        </button>
                        <button 
                          onClick={() => deleteBooking(booking.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex-1 overflow-hidden animate-in slide-in-from-right duration-500">
              <ChatRoom user={user} isOpen={isOpen} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
