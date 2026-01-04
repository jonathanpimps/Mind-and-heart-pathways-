
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, MessageSquare, Phone, MapPin, Mail, Instagram, Twitter, Facebook, ExternalLink, Play, Heart, Star, ShieldCheck, Sparkles, Lock, Clock, X, Bell, MessageCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import BookingModal from './components/BookingModal';
import LiveSession from './components/LiveSession';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import ChatWindow from './components/ChatWindow';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';
import { SERVICES, RESOURCES, getIcon } from './constants';
import { Service, UserProfile, BookingDetails, ChatMessage } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'appointments' | 'chat'>('profile');
  const [activeLiveService, setActiveLiveService] = useState<string>('');
  const [activeBookings, setActiveBookings] = useState<BookingDetails[]>([]);
  const [notifications, setNotifications] = useState<ChatMessage[]>([]);

  const refreshBookings = useCallback(() => {
    const allBookings = JSON.parse(localStorage.getItem('app_bookings') || '[]');
    if (user) {
      const userBookings = allBookings.filter((b: BookingDetails) => b.userId === user.id);
      // Sort by creation date descending to show latest first
      setActiveBookings(userBookings.sort((a: BookingDetails, b: BookingDetails) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } else {
      setActiveBookings([]);
    }
  }, [user]);

  useEffect(() => {
    const savedUser = localStorage.getItem('app_current_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    refreshBookings();
    
    const handleNewMessage = (e: any) => {
      const msg = e.detail as ChatMessage;
      if (msg.senderId !== user?.id && !isChatOpen) {
        setNotifications(prev => [...prev, msg]);
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== msg.id));
        }, 8000);
      }
    };

    window.addEventListener('bookingsUpdated', refreshBookings);
    window.addEventListener('newChatMessage' as any, handleNewMessage);
    return () => {
      window.removeEventListener('bookingsUpdated', refreshBookings);
      window.removeEventListener('newChatMessage' as any, handleNewMessage);
    };
  }, [refreshBookings, user?.id, isChatOpen]);

  const handleAuthSuccess = (userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem('app_current_user', JSON.stringify(userData));
    setIsAuthOpen(false);
    refreshBookings();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('app_current_user');
    setIsProfileOpen(false);
    setIsChatOpen(false);
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('app_current_user', JSON.stringify(updatedUser));
    
    const storedUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
    const updatedUsers = storedUsers.map((u: any) => u.id === updatedUser.id ? { ...u, ...updatedUser } : u);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
  };

  const requireAuth = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      setIsAuthOpen(true);
    }
  };

  const openProfile = (tab: 'profile' | 'appointments' | 'chat' = 'profile') => {
    requireAuth(() => {
      setProfileInitialTab(tab);
      setIsProfileOpen(true);
    });
  };

  const getActiveAppointment = (serviceId: string) => {
    if (!user) return null;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    return activeBookings.find(b => {
      if (b.serviceId !== serviceId || b.status !== 'APPROVED') return false;
      if (b.date !== today) return false;
      const [scheduledHour, scheduledMin] = b.time.split(':').map(Number);
      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledHour, scheduledMin, 0, 0);
      const diffMs = Math.abs(now.getTime() - scheduledDate.getTime());
      const diffMins = diffMs / (1000 * 60);
      return diffMins <= 60; 
    });
  };

  const openBooking = (service: Service) => {
    requireAuth(() => {
      setSelectedService(service);
      setIsBookingOpen(true);
    });
  };

  const handleCallAttempt = (service: Service) => {
    requireAuth(() => {
      const activeAppt = getActiveAppointment(service.id);
      if (activeAppt) {
        setActiveLiveService(service.title);
        setIsLiveSessionOpen(true);
      } else {
        alert(`Sessions for ${service.title} are only accessible during your approved appointment times.`);
        openProfile('appointments');
      }
    });
  };

  // If Admin is logged in, show the Admin Dashboard instead of the public app
  if (user?.role === 'ADMIN') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar 
        user={user} 
        onLoginClick={() => setIsAuthOpen(true)} 
        onProfileClick={() => openProfile('profile')} 
      />

      {/* Notification Toast System */}
      <div className="fixed top-24 right-6 z-[200] space-y-3 max-w-sm w-full">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className="bg-white rounded-[2rem] p-4 shadow-2xl border border-indigo-100 flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 cursor-pointer hover:scale-[1.02] transition-transform" 
            onClick={() => {
              setIsChatOpen(true);
              setNotifications(prev => prev.filter(x => x.id !== n.id));
            }}
          >
            <div className="shrink-0 relative">
               {n.senderAvatar ? (
                 <img src={n.senderAvatar} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-50" />
               ) : (
                 <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">{n.senderName.charAt(0)}</div>
               )}
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-xs font-bold text-slate-800">{n.senderName}</span>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{n.text || (n.mediaType ? `Sent a ${n.mediaType}` : 'New message')}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setNotifications(prev => prev.filter(x => x.id !== n.id)) }} className="p-1 hover:bg-slate-100 rounded-full text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-8 shadow-sm border border-indigo-100">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              Clinical & Counselling • Mentorship • Holistic Healing
            </div>
            <h1 className="text-6xl md:text-8xl font-bold leading-[1.05] mb-8 text-slate-900 font-serif tracking-tight">
              The healing <br />
              <span className="italic text-indigo-600 font-serif">haven.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed max-w-2xl font-light">
              “A diagnosis may explain the journey but it does not define the destination. A diagnosis may identify the challenge, but it does not limit the calling. Mistakes may shape our story, but healing and deliverance may transform it. This space honors growth, restoration, and becoming whole again.”
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all hover:translate-y-[-2px] active:translate-y-0"
              >
                Schedule Session <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => requireAuth(() => setIsChatOpen(true))}
                className="bg-white border border-slate-200 hover:border-indigo-300 px-10 py-5 rounded-2xl font-bold text-lg text-slate-800 flex items-center justify-center gap-3 transition-all hover:bg-slate-50"
              >
                <div className="p-1 bg-indigo-50 rounded-lg"><MessageCircle className="w-5 h-5 text-indigo-600 fill-indigo-600" /></div>
                Message Admin
              </button>
            </div>
          </div>
        </div>
        
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[80%] h-full opacity-30 pointer-events-none overflow-hidden hidden lg:block">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse"></div>
          <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-sky-200 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse delay-700"></div>
          <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-emerald-100 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse delay-1000"></div>
        </div>
        
        <div className="mt-24 lg:mt-0 lg:absolute lg:top-1/2 lg:-translate-y-1/2 lg:right-10 w-full lg:w-5/12 p-6">
           <div className="relative group perspective-1000">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src="https://picsum.photos/seed/therapy-hero/800/1000" 
                  alt="Therapy Office" 
                  className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
              </div>
              <div className="absolute -bottom-8 -left-8 bg-white p-8 rounded-3xl shadow-2xl max-w-[260px] hidden sm:block border border-slate-100 animate-in slide-in-from-left duration-700">
                <div className="flex gap-2 mb-4">
                  {[1,2,3].map(i => <Sparkles key={i} className="w-5 h-5 text-indigo-400" />)}
                </div>
                <p className="text-lg font-serif italic text-slate-800 leading-tight">"The first step towards change is the courage to be seen."</p>
                <p className="text-xs font-bold text-indigo-600 mt-4 uppercase tracking-widest">— Bea Michelle</p>
              </div>
           </div>
        </div>
      </section>

      {/* Member Dashboard Integration */}
      {user && (
        <section className="px-6 relative z-30 pb-20">
          <MemberDashboard 
            user={user} 
            bookings={activeBookings} 
            onOpenChat={() => setIsChatOpen(true)}
            onOpenAppointments={() => openProfile('appointments')}
          />
        </section>
      )}

      {/* Services Grid */}
      <section id="services" className="py-32 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24 max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 font-serif tracking-tight text-slate-900">Clinical & Spiritual Interventions.</h2>
            <p className="text-xl text-slate-500 leading-relaxed font-light">
              Gated access to live clinical tools ensures professional oversight and dedicated care.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {SERVICES.map((service) => {
              const activeAppt = getActiveAppointment(service.id);
              return (
                <div key={service.id} className={`group relative p-10 rounded-[3rem] bg-gradient-to-br ${service.themeClass} border border-slate-100/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 flex flex-col`}>
                  <div className={`w-16 h-16 ${service.color} ${service.secondaryColor} rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative`}>
                    {getIcon(service.icon, "w-8 h-8")}
                    {activeAppt && (
                       <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-slate-800 font-serif tracking-tight">{service.title}</h3>
                  <p className="text-slate-600 mb-10 leading-relaxed font-light text-lg">{service.description}</p>
                  <div className="flex flex-wrap gap-4 mt-auto">
                    <button onClick={() => openBooking(service)} className="flex-1 px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95">
                      Schedule
                    </button>
                    <button onClick={() => handleCallAttempt(service)} className={`p-4 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${activeAppt ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'}`}>
                      {activeAppt ? <Phone className="w-6 h-6 animate-pulse" /> : <Lock className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <span className="text-2xl font-bold font-serif text-slate-900 tracking-tighter">Mind & Heart Pathway</span>
          </div>
          <p className="text-slate-500 font-light leading-relaxed max-w-md mx-auto">Dedicated to providing holistic mental and spiritual health care through empathy and excellence.</p>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.4em] mt-10">© 2024 Mind & Heart Pathway by Bea Michelle</p>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={handleAuthSuccess} />
      {user && (
        <ProfileModal 
          user={user} 
          isOpen={isProfileOpen} 
          initialTab={profileInitialTab}
          onClose={() => setIsProfileOpen(false)} 
          onUpdate={handleUpdateProfile} 
          onLogout={handleLogout} 
        />
      )}
      <BookingModal service={selectedService} user={user} isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      <LiveSession isOpen={isLiveSessionOpen} onClose={() => setIsLiveSessionOpen(false)} serviceTitle={activeLiveService} />

      {/* Chat Window Toggle (The messaging feature) */}
      {user && (
        <ChatWindow 
          user={user} 
          isOpen={isChatOpen} 
          onToggle={() => setIsChatOpen(!isChatOpen)} 
        />
      )}

      {/* AI Discovery FAB */}
      <button 
        onClick={() => requireAuth(() => { setActiveLiveService('Mind & Heart Pathway Virtual Support'); setIsLiveSessionOpen(true); })}
        className="fixed bottom-32 right-10 w-16 h-16 bg-white text-indigo-600 rounded-2xl shadow-xl flex items-center justify-center group hover:scale-105 active:scale-95 transition-all z-40 border border-slate-100"
        title="AI Assistant"
      >
        <span className="sr-only">AI Assistant</span>
        <Sparkles className="w-7 h-7" />
      </button>
    </div>
  );
};

export default App;
