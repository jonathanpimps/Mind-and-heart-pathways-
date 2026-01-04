
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, Blob, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageCircle, Info, User } from 'lucide-react';

interface LiveSessionProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle: string;
}

const LiveSession: React.FC<LiveSessionProps> = ({ isOpen, onClose, serviceTitle }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Accumulators for streaming text
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: isVideoOn 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Session opened');
            setIsActive(true);
            setIsConnecting(false);

            // Audio Stream - Mandatory destination connection to driveonaudioprocess
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (!isMicOn) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
            
            // Video Stream Capture
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                const interval = setInterval(() => {
                    if (videoRef.current && videoRef.current.readyState >= 2 && ctx) {
                        canvasRef.current!.width = videoRef.current.videoWidth;
                        canvasRef.current!.height = videoRef.current.videoHeight;
                        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
                        canvasRef.current!.toBlob((blob) => {
                            if (blob) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    const base64 = (reader.result as string).split(',')[1];
                                    sessionPromise.then(s => s.sendRealtimeInput({
                                        media: { data: base64, mimeType: 'image/jpeg' }
                                    }));
                                };
                                reader.readAsDataURL(blob);
                            }
                        }, 'image/jpeg', 0.6);
                    }
                }, 1000);
                (window as any)._frameInterval = interval;
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Transcription accumulation
            if (message.serverContent?.outputTranscription) {
                currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
                currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
                const you = currentInputTranscription.current.trim();
                const bea = currentOutputTranscription.current.trim();
                if (you || bea) {
                    setTranscript(prev => [...prev.slice(-6), you ? `You: ${you}` : '', bea ? `Bea: ${bea}` : ''].filter(Boolean));
                }
                currentInputTranscription.current = '';
                currentOutputTranscription.current = '';
            }

            // Audio Output Processing
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
              const buffer = await decodeAudioData(decode(audioData), outputContextRef.current, 24000, 1);
              const source = outputContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputContextRef.current.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => {
            console.error('Session error:', e);
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are Bea Michelle, a professional, calm, and deeply supportive counselor at the Mind & Heart Pathway. You are conducting a session for "${serviceTitle}". 
          Your voice should be soothing and encouraging. Keep responses relatively concise to maintain the flow of conversation. 
          Focus on being an empathetic listener and providing therapeutic presence.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Media acquisition error:', err);
      setIsConnecting(false);
    }
  };

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current = null;
    }
    if ((window as any)._frameInterval) {
        clearInterval((window as any)._frameInterval);
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();
    
    setIsActive(false);
    setIsConnecting(false);
  }, []);

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950 text-white overflow-hidden animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div className="p-4 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-serif text-xl shadow-lg shadow-indigo-600/20">MHP</div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Mind & Heart Pathway</h3>
            <p className="text-[10px] text-indigo-400 uppercase tracking-[0.2em] font-bold">{serviceTitle} Session</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-3 hover:bg-red-500/20 text-red-400 rounded-full transition-all group"
          title="End Session"
        >
          <PhoneOff className="w-6 h-6 group-hover:scale-110" />
        </button>
      </div>

      {/* Workspace */}
      <div className="flex-1 relative flex flex-col md:flex-row p-6 gap-6">
        {/* Bea Michelle AI View */}
        <div className="flex-[2] bg-slate-900 rounded-[2.5rem] overflow-hidden relative flex flex-col items-center justify-center border border-white/5 shadow-inner">
           {!isActive && !isConnecting ? (
             <div className="text-center p-8 animate-in slide-in-from-bottom duration-500">
               <div className="w-28 h-28 bg-indigo-600/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-600/20">
                 <Video className="w-12 h-12" />
               </div>
               <h2 className="text-3xl font-serif mb-4">Connect with Mind & Heart Pathway</h2>
               <p className="text-slate-400 mb-10 max-w-sm mx-auto leading-relaxed">Join a secure, private session. Bea is here to listen and guide you through your journey.</p>
               <button 
                onClick={startSession}
                className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-indigo-600/40"
               >
                 Connect Now
               </button>
             </div>
           ) : isConnecting ? (
             <div className="text-center">
               <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
               <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Securing Session...</p>
             </div>
           ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-t from-indigo-950/20 to-transparent">
               <div className="relative mb-8">
                  <div className={`w-48 h-48 rounded-full bg-indigo-600/5 flex items-center justify-center border-4 border-indigo-600/20 ${isActive ? 'animate-pulse' : ''}`}>
                    <div className="w-40 h-40 rounded-full bg-indigo-600/10 flex items-center justify-center border-2 border-indigo-600/30">
                      <img src="https://picsum.photos/seed/bea/200" alt="Bea Avatar" className="w-32 h-32 rounded-full object-cover shadow-2xl grayscale-[0.3]" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-emerald-500 w-8 h-8 rounded-full border-[6px] border-slate-900 shadow-xl"></div>
               </div>
               <h2 className="text-3xl font-serif text-white mb-2">Mind & Heart Pathway</h2>
               <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  <p className="text-indigo-400 text-sm font-medium uppercase tracking-[0.1em]">Session Active</p>
               </div>
             </div>
           )}

           {/* Transcript Overlay */}
           {isActive && transcript.length > 0 && (
             <div className="absolute bottom-8 left-8 right-8 p-6 bg-black/60 backdrop-blur-xl rounded-3xl border border-white/10 max-w-2xl mx-auto shadow-2xl animate-in slide-in-from-bottom duration-500">
               <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                 <MessageCircle className="w-3 h-3" /> Live Support Context
               </div>
               <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {transcript.map((line, i) => (
                  <p key={i} className={`text-sm leading-relaxed ${line.startsWith('You:') ? 'text-slate-400 italic' : 'text-white font-medium bg-white/5 p-3 rounded-2xl'}`}>
                    {line}
                  </p>
                ))}
               </div>
             </div>
           )}
        </div>

        {/* User Local Feed */}
        <div className="w-full md:w-96 h-64 md:h-auto bg-slate-900 rounded-[2.5rem] overflow-hidden relative border border-white/5 shadow-2xl">
           <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover transition-opacity duration-1000 ${isVideoOn ? 'opacity-100' : 'opacity-0'}`} 
           />
           <canvas ref={canvasRef} className="hidden" />
           {!isVideoOn && (
             <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 border border-white/5">
                  <User className="w-12 h-12" />
                </div>
             </div>
           )}
           <div className="absolute top-6 left-6 bg-black/60 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
             You
           </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-8 flex justify-center items-center gap-8 bg-black/60 border-t border-white/5 backdrop-blur-xl">
        <button 
          onClick={() => setIsMicOn(!isMicOn)}
          className={`p-5 rounded-3xl transition-all transform active:scale-90 flex flex-col items-center gap-1 ${isMicOn ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-red-500/20 text-red-500 border border-red-500/20'}`}
        >
          {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          <span className="text-[10px] font-bold uppercase tracking-widest">{isMicOn ? 'Mute' : 'Unmute'}</span>
        </button>

        <button 
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`p-5 rounded-3xl transition-all transform active:scale-90 flex flex-col items-center gap-1 ${isVideoOn ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-red-500/20 text-red-500 border border-red-500/20'}`}
        >
          {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          <span className="text-[10px] font-bold uppercase tracking-widest">{isVideoOn ? 'Camera' : 'Start'}</span>
        </button>

        <div className="w-px h-12 bg-white/10 mx-2"></div>

        <button 
          onClick={stopSession}
          className="p-5 bg-red-600 hover:bg-red-500 text-white rounded-[2rem] transition-all transform active:scale-90 shadow-2xl shadow-red-600/30 flex flex-col items-center gap-1"
        >
          <PhoneOff className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">End Call</span>
        </button>
      </div>

      <div className="bg-indigo-600/20 py-2 text-center text-[9px] text-indigo-400 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3">
        <Info className="w-3 h-3" /> Secure End-to-End Encrypted Session • AI Assisted Support
      </div>
    </div>
  );
};

export default LiveSession;
