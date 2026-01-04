
import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Image as ImageIcon, Video, Paperclip, X, User, MessageCircle, Minimize2, Maximize2 } from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';

interface ChatWindowProps {
  user: UserProfile;
  isOpen: boolean;
  onToggle: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ user, isOpen, onToggle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' | 'audio' } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('app_chats') || '[]');
    setMessages(saved);
    scrollToBottom();
  }, [isOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const sendMessage = (msgData: Partial<ChatMessage>) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      senderName: user.preferredName || user.name,
      senderAvatar: user.avatarUrl,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...msgData,
    };

    const updated = [...messages, newMessage];
    setMessages(updated);
    localStorage.setItem('app_chats', JSON.stringify(updated));
    setInputText('');
    setPreviewMedia(null);
    scrollToBottom();

    window.dispatchEvent(new CustomEvent('newChatMessage', { detail: newMessage }));

    // Simulate Admin response
    setTimeout(() => {
      const adminMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: 'admin',
        senderName: 'Bea Michelle (Admin)',
        senderAvatar: 'https://picsum.photos/seed/admin/200',
        text: "Peace be with you. I've received your message and will respond as soon as I am available.",
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      const final = [...updated, adminMsg];
      setMessages(final);
      localStorage.setItem('app_chats', JSON.stringify(final));
      scrollToBottom();
      window.dispatchEvent(new CustomEvent('newChatMessage', { detail: adminMsg }));
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio';
      setPreviewMedia({ url: reader.result as string, type: type as any });
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewMedia({ url: reader.result as string, type: 'audio' });
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access error:', err);
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  if (!isOpen) return (
    <button 
      onClick={onToggle}
      className="fixed bottom-10 right-10 w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center group hover:scale-105 active:scale-95 transition-all z-50 border-4 border-white/20"
    >
      <MessageCircle className="w-10 h-10 group-hover:rotate-12 transition-transform" />
      <span className="absolute right-full mr-6 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
        Chat with Admin
      </span>
    </button>
  );

  return (
    <div className={`fixed bottom-10 right-10 z-50 w-[400px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col transition-all duration-300 overflow-hidden ${isMinimized ? 'h-20' : 'h-[600px]'}`}>
      {/* Header */}
      <div className="p-5 bg-indigo-600 text-white flex justify-between items-center cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-serif font-bold text-lg overflow-hidden">
             <img src="https://picsum.photos/seed/admin/100" className="w-full h-full object-cover" alt="Admin" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">Bea Michelle</h4>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-medium opacity-80">Online Support</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.senderId === user.id ? 'flex-row-reverse' : ''}`}>
                <div className="shrink-0">
                  {msg.senderAvatar ? (
                    <img src={msg.senderAvatar} className="w-7 h-7 rounded-full object-cover border border-slate-200" alt={msg.senderName} />
                  ) : (
                    <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                      {msg.senderName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className={`max-w-[80%] space-y-1 ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl text-xs shadow-sm ${
                    msg.senderId === user.id 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                    {msg.mediaType === 'image' && <img src={msg.mediaUrl} className="max-w-full rounded-lg mt-2" />}
                    {msg.mediaType === 'video' && <video src={msg.mediaUrl} controls className="max-w-full rounded-lg mt-2" />}
                    {msg.mediaType === 'audio' && <audio src={msg.mediaUrl} controls className="max-w-full mt-2" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Media Preview */}
          {previewMedia && (
            <div className="px-6 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-indigo-200">
                {previewMedia.type === 'image' ? <img src={previewMedia.url} className="w-full h-full object-cover" /> : <Mic className="w-full h-full p-3 text-indigo-400" />}
                <button onClick={() => setPreviewMedia(null)} className="absolute top-0 right-0 bg-black/50 text-white rounded-bl-lg p-0.5"><X className="w-3 h-3" /></button>
              </div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase">Ready to send...</p>
            </div>
          )}

          {/* Input */}
          <div className="p-6 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1.5 pl-4 border border-slate-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-600/5 transition-all">
              <input 
                type="text" 
                placeholder={isRecording ? 'Recording...' : 'Message Bea...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (inputText.trim() || previewMedia) && sendMessage({ text: inputText })}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 py-2 disabled:opacity-50"
              />
              <div className="flex items-center gap-0.5">
                <label className="p-2 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors text-slate-400">
                  <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                  <Paperclip className="w-4 h-4" />
                </label>
                <button 
                  onMouseDown={startRecording} onMouseUp={stopRecording}
                  className={`p-2 rounded-lg transition-all ${isRecording ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-slate-200'}`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => (inputText.trim() || previewMedia) && sendMessage({ text: inputText })}
                  className={`p-2 rounded-lg transition-all ${inputText.trim() || previewMedia ? 'bg-indigo-600 text-white' : 'text-slate-200'}`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWindow;
