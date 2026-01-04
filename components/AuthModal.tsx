
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Loader2, Info } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Pre-seed an admin account for demo purposes if none exists
  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
    const hasAdmin = storedUsers.some((u: any) => u.role === 'ADMIN');
    if (!hasAdmin) {
      const adminUser = {
        id: 'admin-001',
        name: 'Bea Michelle',
        email: 'admin@mhp.com',
        password: 'admin',
        focusAreas: [],
        joinedDate: new Date().toLocaleDateString(),
        role: 'ADMIN'
      };
      localStorage.setItem('app_users', JSON.stringify([...storedUsers, adminUser]));
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API delay
    setTimeout(() => {
      try {
        const storedUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
        
        if (mode === 'signup') {
          if (storedUsers.find((u: any) => u.email === formData.email)) {
            throw new Error('User already exists with this email.');
          }
          const newUser: UserProfile = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.name,
            email: formData.email,
            focusAreas: [],
            joinedDate: new Date().toLocaleDateString(),
            role: 'USER'
          };
          localStorage.setItem('app_users', JSON.stringify([...storedUsers, { ...newUser, password: formData.password }]));
          onAuthSuccess(newUser);
        } else {
          const user = storedUsers.find((u: any) => u.email === formData.email && u.password === formData.password);
          if (!user) {
            throw new Error('Invalid email or password.');
          }
          const { password, ...userProfile } = user;
          onAuthSuccess(userProfile as UserProfile);
        }
        onClose();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10">
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="p-10 pt-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-serif mb-3 text-slate-900">
              {mode === 'login' ? 'Welcome Back' : 'Create Profile'}
            </h2>
            <p className="text-slate-500 text-sm">
              {mode === 'login' 
                ? 'Continue your journey to holistic wellness' 
                : 'Join our sanctuary for spiritual and mental growth'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    required
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 text-slate-700"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input
                  required
                  type="email"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 text-slate-700"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input
                  required
                  type="password"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 text-slate-700"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center flex flex-col gap-3">
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
            <div className="pt-4 border-t border-slate-50">
               <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-1">Demo Admin Credentials</p>
               <p className="text-[10px] text-slate-400">admin@mhp.com / admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
