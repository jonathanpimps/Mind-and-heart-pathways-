
import React, { useState, useEffect } from 'react';
import { Menu, X, Heart, User } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onLoginClick: () => void;
  onProfileClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLoginClick, onProfileClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Resources', href: '#resources' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-6'
    }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 font-serif">
            Mind & Heart Pathway
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-slate-600 hover:text-indigo-600 font-semibold transition-colors text-sm"
            >
              {link.name}
            </a>
          ))}
          
          {user ? (
            <button 
              onClick={onProfileClick}
              className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-2 rounded-2xl hover:bg-slate-50 transition-all group"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">
                {user.name.charAt(0)}
              </div>
              <span className="text-sm font-bold text-slate-700">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button 
              onClick={onLoginClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 text-sm"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6 text-slate-800" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 p-8 flex flex-col gap-6 animate-in slide-in-from-top duration-300 shadow-2xl">
          {navLinks.map(link => (
            <a 
              key={link.name} 
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-xl font-bold text-slate-800 hover:text-indigo-600 font-serif"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-6 border-t border-slate-100">
            {user ? (
              <button 
                onClick={() => { onProfileClick(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-4 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800"
              >
                <User className="w-5 h-5 text-indigo-600" /> Profile Dashboard
              </button>
            ) : (
              <button 
                onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-600/20"
              >
                Sign In to Platform
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
