"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Phone, PhoneCall, Delete, X, AlertCircle, Volume2, ShieldCheck, Check } from 'lucide-react';
import { useCallStore } from '../../store/useCallStore';
import { apiFetch } from '../../lib/api';

interface NumericKeypadProps {
  onCallInitiated?: (data: any) => void;
}

export function NumericKeypad({ onCallInitiated }: NumericKeypadProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDialing, setIsDialing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const { activeCall, setActiveCall } = useCallStore();

  const keypadButtons = [
    { key: '1', sub: ' ' },
    { key: '2', sub: 'ABC' },
    { key: '3', sub: 'DEF' },
    { key: '4', sub: 'GHI' },
    { key: '5', sub: 'JKL' },
    { key: '6', sub: 'MNO' },
    { key: '7', sub: 'PQRS' },
    { key: '8', sub: 'TUV' },
    { key: '9', sub: 'WXYZ' },
    { key: '*', sub: ' ' },
    { key: '0', sub: '+' },
    { key: '#', sub: ' ' },
  ];

  // DTMF Audio Feedback
  const playDtmfTone = useCallback((key: string) => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freqMap: Record<string, number> = {
        '1': 697, '2': 697, '3': 697,
        '4': 770, '5': 770, '6': 770,
        '7': 852, '8': 852, '9': 852,
        '*': 941, '0': 941, '#': 941,
      };

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqMap[key] || 700, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (_) {}
  }, []);

  const handleKeyPress = (key: string) => {
    setErrorMessage(null);
    playDtmfTone(key);
    setPhoneNumber(prev => prev + key);
  };

  const handleBackspace = () => {
    setErrorMessage(null);
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMessage(null);
    setPhoneNumber('');
  };

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'INPUT' && activeEl.id !== 'dialpad-input') {
        return;
      }
      if (activeEl && activeEl.tagName === 'TEXTAREA') {
        return;
      }

      if (/^[0-9*#]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === '+') {
        setPhoneNumber(prev => prev + '+');
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitiateCall();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phoneNumber, isDialing, activeCall]);

  const normalizePhoneNumber = (raw: string): string => {
    let cleaned = raw.replace(/[^\d+*#]/g, '');
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    } else if (cleaned.length === 10 && !cleaned.startsWith('+')) {
      cleaned = '+91' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = '+91' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+') && cleaned.length >= 10) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const isValidNumber = (num: string): boolean => {
    const cleaned = num.replace(/[^\d]/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleInitiateCall = async () => {
    if (isDialing) return;
    if (activeCall) {
      setErrorMessage('A call is already active. Please conclude the current call first.');
      return;
    }

    const normalized = normalizePhoneNumber(phoneNumber);
    if (!isValidNumber(normalized)) {
      setErrorMessage('Please enter a valid 10-15 digit phone number.');
      return;
    }

    setIsDialing(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch('/telephony/outbound-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: normalized })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Call initiation failed. Please verify provider connectivity.');
      }

      const data = await res.json();
      setSuccessNotice('Connecting call...');
      if (onCallInitiated) {
        onCallInitiated({ ...data, to: normalized });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Outbound call failed.');
    } finally {
      setIsDialing(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none text-[#202020]">
      {/* Number Display Input */}
      <div className="w-full flex items-center bg-[#FAFCFA] border border-[#E1E6E1] focus-within:border-[#039A01] rounded-xl px-3 py-2 mb-3">
        <input 
          id="dialpad-input"
          type="text" 
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number..."
          className="w-full bg-transparent text-base font-bold text-[#202020] outline-none placeholder-[#849389]"
        />
        {phoneNumber && (
          <button 
            type="button" 
            onClick={handleBackspace} 
            className="p-1 text-[#5F6962] hover:text-[#202020] transition-colors"
          >
            <Delete className="w-4 h-4" />
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="w-full p-2 mb-3 text-xs bg-[#FDF2F2] border border-[#F8C8C8] text-[#B91C1C] rounded-lg flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Keypad Grid (3 columns) */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mb-4">
        {keypadButtons.map((btn) => (
          <button
            key={btn.key}
            type="button"
            onClick={() => handleKeyPress(btn.key)}
            className="flex flex-col items-center justify-center h-12 bg-[#FAFCFA] hover:bg-[#E7F4E8] active:bg-[#C8E6CA] border border-[#E1E6E1] hover:border-[#039A01] rounded-xl transition-all shadow-2xs active:scale-95"
          >
            <span className="text-base font-bold text-[#202020] leading-none">{btn.key}</span>
            {btn.sub.trim() && (
              <span className="text-[9px] font-bold text-[#5F6962] tracking-wider mt-0.5">{btn.sub}</span>
            )}
          </button>
        ))}
      </div>

      {/* Call CTA Button */}
      <button
        type="button"
        onClick={handleInitiateCall}
        disabled={isDialing || !phoneNumber}
        className="w-full max-w-[280px] h-11 bg-[#039A01] hover:bg-[#028001] active:bg-[#026601] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
      >
        <Phone className="w-4 h-4" />
        <span>{isDialing ? 'Connecting...' : 'Initiate Call'}</span>
      </button>
    </div>
  );
}
