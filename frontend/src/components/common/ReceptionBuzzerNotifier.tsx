import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Bell, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface BuzzerPayload {
  id?: number;
  tokenNumber: string;
  patientName: string;
  doctorName: string;
  roomNumber: string;
  timestamp: string;
}

export const ReceptionBuzzerNotifier: React.FC = () => {
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState<BuzzerPayload | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('bvg_buzzer_sound_enabled') !== 'false';
  });
  const audioCtxRef = useRef<AudioContext | null>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('bvg_buzzer_sound_enabled', String(next));
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Note 2: C5 (523.25 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.22);
      gain2.gain.setValueAtTime(0.28, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.75);
    } catch (e) {
      console.warn('Audio chime muted by autoplay safety', e);
    }
  };

  useEffect(() => {
    // 1. Listen via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('bvg_buzzer_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.tokenNumber) {
          setActiveAlert(event.data);
          playChime();
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    // 2. Fallback Storage event listener for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bvg_buzzer_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.tokenNumber) {
            setActiveAlert(parsed);
            playChime();
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [soundEnabled]);

  // Receptionist, Nurse, Staff can see & hear the alert; Patients should not see staff buzzer
  if (user?.role === 'PATIENT' || !activeAlert) {
    return null;
  }

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white rounded-2xl p-4 shadow-2xl border-2 border-teal-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/30 border border-teal-300 flex items-center justify-center shrink-0 animate-bounce">
            <Bell className="w-5 h-5 text-teal-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-teal-300 bg-teal-900/80 px-2 py-0.5 rounded-md border border-teal-500/40">
                Patient Called to Consultation
              </span>
              <span className="text-xs text-teal-200 font-mono">{activeAlert.timestamp}</span>
            </div>
            <div className="text-sm sm:text-base font-black text-white mt-0.5">
              Token <span className="font-mono text-teal-300 bg-black/30 px-1.5 py-0.5 rounded-md">{activeAlert.tokenNumber}</span>: {activeAlert.patientName}
            </div>
            <p className="text-xs text-teal-100 font-medium">
              Consulting: <strong className="text-white">{activeAlert.doctorName}</strong> in <strong className="text-teal-200">{activeAlert.roomNumber}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-teal-600/40">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute buzzer sound' : 'Unmute buzzer sound'}
            className="p-2 rounded-xl bg-teal-900/60 hover:bg-teal-900 text-teal-200 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-300" />}
          </button>
          <button
            onClick={() => setActiveAlert(null)}
            className="flex items-center px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 text-xs font-black rounded-xl transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Acknowledge & Silence
          </button>
        </div>
      </div>
    </div>
  );
};
