
import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, StickyNote, Calendar, Clock, Plus, Trash2, Filter, ChevronRight, User, Mail, MapPin, Heart } from 'lucide-react';
import { UserProfile, AdminNote, BookingDetails } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteTime, setNoteTime] = useState('12:00');
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
    setClients(allUsers.filter((u: UserProfile) => u.role !== 'ADMIN'));
    
    const allNotes = JSON.parse(localStorage.getItem('app_admin_notes') || '[]');
    setNotes(allNotes);

    const allBookings = JSON.parse(localStorage.getItem('app_bookings') || '[]');
    setBookings(allBookings);
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clientNotes = useMemo(() => {
    if (!selectedClient) return [];
    let filtered = notes.filter(n => n.userId === selectedClient.id);
    
    if (timeFilter !== 'all') {
      filtered = filtered.filter(n => {
        const hour = parseInt(n.time.split(':')[0]);
        if (timeFilter === 'morning') return hour >= 5 && hour < 12;
        if (timeFilter === 'afternoon') return hour >= 12 && hour < 17;
        if (timeFilter === 'evening') return hour >= 17 || hour < 5;
        return true;
      });
    }
    
    return filtered.sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
  }, [selectedClient, notes, timeFilter]);

  const addNote = () => {
    if (!selectedClient || !noteText.trim()) return;
    
    const newNote: AdminNote = {
      id: Math.random().toString(36).substr(2, 9),
      userId: selectedClient.id,
      text: noteText,
      date: noteDate,
      time: noteTime,
      createdAt: new Date().toISOString(),
    };
    
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    localStorage.setItem('app_admin_notes', JSON.stringify(updatedNotes));
    setNoteText('');
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('app_admin_notes', JSON.stringify(updatedNotes));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row p-6 gap-6 animate-in fade-in duration-500">
      {/* Sidebar: Client List */}
      <div className="w-full md:w-80 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Clients
            </h2>
            <button onClick={onLogout} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Logout</button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredClients.map(client => (
            <button 
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedClient?.id === client.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-700'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${selectedClient?.id === client.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                {client.avatarUrl ? <img src={client.avatarUrl} className="w-full h-full object-cover rounded-xl" /> : client.name.charAt(0)}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{client.name}</p>
                <p className={`text-[10px] truncate ${selectedClient?.id === client.id ? 'text-white/70' : 'text-slate-400'}`}>{client.email}</p>
              </div>
              <ChevronRight className={`w-4 h-4 ${selectedClient?.id === client.id ? 'text-white' : 'text-slate-200'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel: Client Details & Sticky Notes */}
      <div className="flex-1 flex flex-col md:flex-row gap-6">
        {selectedClient ? (
          <>
            {/* Client Info Panel */}
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-serif font-bold shadow-2xl border-4 border-white">
                  {selectedClient.avatarUrl ? <img src={selectedClient.avatarUrl} className="w-full h-full object-cover rounded-[2rem]" /> : selectedClient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold font-serif text-slate-900 mb-1">{selectedClient.name}</h2>
                  <p className="text-slate-500 flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4" /> {selectedClient.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Profile Details</h4>
                  <div className="space-y-3">
                    <p className="text-sm flex items-center gap-2 text-slate-600"><MapPin className="w-4 h-4 text-indigo-400" /> {selectedClient.location || 'No location set'}</p>
                    <p className="text-sm flex items-center gap-2 text-slate-600"><Calendar className="w-4 h-4 text-indigo-400" /> Joined {selectedClient.joinedDate}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedClient.focusAreas.map(area => (
                        <span key={area} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">{area}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Recent Bookings</h4>
                  <div className="space-y-2">
                    {bookings.filter(b => b.userId === selectedClient.id).slice(0, 3).map(b => (
                      <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-800">{b.serviceTitle}</p>
                        <p className="text-[10px] text-slate-500">{b.date} at {b.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Member Bio</h4>
                <p className="text-sm text-slate-600 leading-relaxed italic">"{selectedClient.bio || 'This member has not written a bio yet.'}"</p>
              </div>
            </div>

            {/* Sticky Notes Panel */}
            <div className="w-full md:w-96 bg-indigo-50 rounded-[2.5rem] shadow-xl border border-indigo-100 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-500">
              <div className="p-6 bg-white/40 backdrop-blur-md border-b border-indigo-100">
                <h3 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2 mb-4">
                  <StickyNote className="w-5 h-5 text-indigo-600" /> Sticky Notes
                </h3>
                
                <div className="space-y-4">
                  <textarea 
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write a private note..."
                    className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
                      <input 
                        type="date" 
                        value={noteDate}
                        onChange={(e) => setNoteDate(e.target.value)}
                        className="w-full pl-9 pr-2 py-2 bg-white border border-indigo-100 rounded-xl text-xs outline-none"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
                      <input 
                        type="time" 
                        value={noteTime}
                        onChange={(e) => setNoteTime(e.target.value)}
                        className="w-full pl-9 pr-2 py-2 bg-white border border-indigo-100 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={addNote}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Save Note
                  </button>
                </div>
              </div>

              {/* Notes List with Filters */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History</span>
                  <div className="flex gap-2">
                    <select 
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value as any)}
                      className="text-[9px] font-bold bg-white/50 border border-indigo-100 rounded-lg px-2 py-1 outline-none text-indigo-600"
                    >
                      <option value="all">All Times</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                    </select>
                  </div>
                </div>

                {clientNotes.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-400 font-medium italic">No private notes for this client yet.</p>
                  </div>
                ) : (
                  clientNotes.map(note => (
                    <div key={note.id} className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm relative group animate-in zoom-in duration-300">
                      <button 
                        onClick={() => deleteNote(note.id)}
                        className="absolute top-2 right-2 p-1.5 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <div className="flex items-center gap-2 mb-2 text-[9px] font-bold text-indigo-400 uppercase tracking-[0.1em]">
                        <Calendar className="w-3 h-3" /> {note.date} • <Clock className="w-3 h-3" /> {note.time}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{note.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center p-12 text-center opacity-60">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <User className="w-10 h-10 text-indigo-200" />
            </div>
            <h3 className="text-2xl font-serif text-slate-900 mb-2">Select a Client</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Click on a member from the list to view their details and manage private clinical notes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
