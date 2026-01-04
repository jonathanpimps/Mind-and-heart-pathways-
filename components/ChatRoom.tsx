
import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Image as ImageIcon, Video, Paperclip, X, Play, Pause, User } from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';

interface ChatRoomProps {
  user: UserProfile;
  isOpen: boolean;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ user, isOpen }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' | 'audio' } | null>(null);
  
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

    // Trigger notification event
    window.dispatchEvent(new CustomEvent('newChatMessage', { detail: newMessage }));

    // Simulate Admin response
    setTimeout(() => {
      const adminMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: 'admin',
        senderName: 'Bea Michelle (Admin)',
        senderAvatar: 'https://picsum.photos/seed/admin/200',
        text: "Thank you for reaching out! I've received your message and will get back to you shortly.",
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

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale px-10">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <MessageCircleIcon className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium">Start a conversation with Bea Michelle's clinical team.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.senderId === user.id ? 'flex-row-reverse' : ''}`}>
            <div className="shrink-0">
              {msg.senderAvatar ? (
                <img src={msg.senderAvatar} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt={msg.senderName} />
              ) : (
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {msg.senderName.charAt(0)}
                </div>
              )}
            </div>
            <div className={`max-w-[75%] space-y-1 ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-bold text-slate-400">{msg.senderName}</span>
                <span className="text-[9px] text-slate-300">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className={`p-4 rounded-3xl text-sm shadow-sm ${
                msg.senderId === user.id 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                {msg.mediaType === 'image' && (
                  <img src={msg.mediaUrl} className="max-w-full rounded-xl mt-2 border border-black/5" alt="Shared" />
                )}
                {msg.mediaType === 'video' && (
                  <video src={msg.mediaUrl} controls className="max-w-full rounded-xl mt-2" />
                )}
                {msg.mediaType === 'audio' && (
                  <audio src={msg.mediaUrl} controls className="max-w-full mt-2" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Media Preview Box */}
      {previewMedia && (
        <div className="absolute bottom-24 left-6 right-6 p-4 bg-white/80 backdrop-blur-md rounded-3xl border border-indigo-100 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300 z-10">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            {previewMedia.type === 'image' && <img src={previewMedia.url} className="w-full h-full object-cover" />}
            {previewMedia.type === 'video' && <div className="w-full h-full flex items-center justify-center bg-slate-900"><Video className="text-white w-6 h-6" /></div>}
            {previewMedia.type === 'audio' && <div className="w-full h-full flex items-center justify-center bg-indigo-50"><Mic className="text-indigo-600 w-6 h-6" /></div>}
            <button onClick={() => setPreviewMedia(null)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"><X className="w-3 h-3" /></button>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Preview Attachment</p>
            <p className="text-[10px] text-slate-400">Add a message or send as is.</p>
          </div>
          <button 
            onClick={() => sendMessage({ mediaUrl: previewMedia.url, mediaType: previewMedia.type, text: inputText })}
            className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex items-center gap-3 bg-slate-50 rounded-[2rem] p-2 pl-6 border border-slate-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-600/5 transition-all">
          <input 
            type="text" 
            placeholder={isRecording ? 'Recording audio...' : 'Type your message...'}
            disabled={isRecording}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isRecording && (inputText.trim() || previewMedia) && sendMessage({ text: inputText })}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 py-3 disabled:text-red-500 font-medium"
          />
          
          <div className="flex items-center gap-1">
            <label className="p-3 hover:bg-slate-200 rounded-full cursor-pointer transition-colors text-slate-400 hover:text-indigo-600">
              <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
              <Paperclip className="w-5 h-5" />
            </label>
            
            <button 
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-200 hover:text-indigo-600'}`}
              title="Hold to record voice"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button 
              onClick={() => (inputText.trim() || previewMedia) && sendMessage({ text: inputText })}
              className={`p-3 rounded-full transition-all ${inputText.trim() || previewMedia ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-200 cursor-not-allowed'}`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-[9px] text-center mt-3 text-slate-400 font-bold uppercase tracking-widest">Hold <Mic className="w-2 h-2 inline" /> icon to record voice message</p>
      </div>
    </div>
  );
};

const MessageCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
);

export default ChatRoom;
