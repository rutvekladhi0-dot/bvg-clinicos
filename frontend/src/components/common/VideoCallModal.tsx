import React, { useState } from 'react';
import { X, Video, VideoOff, Mic, MicOff, PhoneOff, Maximize2, Minimize2, Shield, User } from 'lucide-react';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  userName: string;
  doctorName?: string;
  patientName?: string;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  roomName,
  userName,
  doctorName,
  patientName,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  // Clean room identifier
  const cleanRoom = encodeURIComponent(`BVG-ClinicOS-${roomName.replace(/[^a-zA-Z0-9]/g, '-')}`);
  const userParam = encodeURIComponent(userName);
  const jitsiUrl = `https://meet.jit.si/${cleanRoom}#userInfo.displayName="${userParam}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className={`bg-slate-900 w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-5xl rounded-2xl h-[85vh]'} shadow-2xl border border-slate-800 flex flex-col overflow-hidden transition-all`}>
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  BVG TeleHealth Encrypted Video Consultation
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                  Live HD Room
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {doctorName ? `Doctor: ${doctorName}` : ''} {patientName ? `• Patient: ${patientName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="flex items-center px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
            >
              <PhoneOff className="w-3.5 h-3.5 mr-1.5" />
              End Call
            </button>
          </div>
        </div>

        {/* Video Frame */}
        <div className="flex-1 w-full bg-black relative">
          <iframe
            src={jitsiUrl}
            title="BVG ClinicOS Video Consultation"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
          />
        </div>

      </div>
    </div>
  );
};
