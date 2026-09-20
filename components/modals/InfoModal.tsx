'use client';

import React from 'react';
import Link from 'next/link';
import { X, Globe, Terminal, Shield, Award } from 'lucide-react';
import { sound } from '@/lib/audio';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'about' | 'who' | 'privacy' | 'status';
}

export default function InfoModal({ isOpen, onClose, type }: InfoModalProps) {
  if (!isOpen) return null;

  const contentMap = {
    about: {
      title: 'WHAT IS AUSIFY?',
      icon: Globe,
      color: '#ff2a8d',
      body: (
        <div className="space-y-4 text-sm leading-relaxed text-gray-300">
          <p className="text-white font-semibold">
            Algorithms are spoon-feeding you the same 50 global pop tracks on repeat. Ausify is a digital defiance experiment.
          </p>
          <p>
            Australia is home to some of the world's most vibrant, unconventional, and genre-defying independent artists. From Melbourne's gritty laneway rock to remote Indigenous communities making groundbreaking hip hop, Ausify connects listeners directly with homegrown Aussie sounds.
          </p>
          <p className="text-[#00f5d4] border-l-2 border-[#00f5d4] pl-3 italic">
            "Search. Listen. Defy the algorithm."
          </p>
        </div>
      ),
    },
    who: {
      title: 'WHO MADE THIS?',
      icon: Award,
      color: '#00f5d4',
      body: (
        <div className="space-y-4 text-sm leading-relaxed text-gray-300">
          <p>
            Ausify is an award-winning creative digital experience developed by creative agencies <strong className="text-white">ED. Studio</strong>, <strong className="text-white">Bureau of Everything</strong>, and <strong className="text-white">Music Australia</strong>.
          </p>
          <p>
            Built using modern WebGL Shaders, Next.js, and procedural sound design to replicate the tactile nostalgia of 90s cassette tapes and CD jewel cases.
          </p>
        </div>
      ),
    },
    privacy: {
      title: 'PRIVACY & ALGORITHM POLICY',
      icon: Shield,
      color: '#ffbe0b',
      body: (
        <div className="space-y-4 text-sm leading-relaxed text-gray-300">
          <p>
            Unlike mainstream streaming monopolies, Ausify does <strong>NOT</strong> track your personal data, build behavioral advertising dossiers, or sell your habits to third-party data brokers.
          </p>
          <p>
            Your listening discovery is purely serendipitous, unfiltered, and private.
          </p>
        </div>
      ),
    },
    status: {
      title: 'SYSTEM STATUS',
      icon: Terminal,
      color: '#00f5d4',
      body: (
        <div className="space-y-3 text-sm text-gray-300 font-mono">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <span>WEBGL CRT PIPELINE:</span>
            <span className="text-[#00f5d4] font-bold">OPERATIONAL [60 FPS]</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <span>DISCO AUDIO STREAM:</span>
            <span className="text-[#00f5d4] font-bold">ONLINE</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <span>CATALOG ARTIST DATABASE:</span>
            <span className="text-[#ff2a8d] font-bold">2,480+ TRACKS</span>
          </div>
          <div className="flex items-center justify-between">
            <span>COMMUNITY FEED:</span>
            <span className="text-[#00f5d4] font-bold">UNFILTERED</span>
          </div>
        </div>
      ),
    },
  };

  const current = contentMap[type] || contentMap.about;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-lg bg-[#0e061a] border-2 rounded-lg p-6 font-mono text-white shadow-2xl"
        style={{ borderColor: current.color, boxShadow: `0 0 35px ${current.color}33` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
          <div className="flex items-center gap-2" style={{ color: current.color }}>
            <Icon className="w-5 h-5" />
            <h2 className="text-lg font-bold tracking-widest uppercase">{current.title}</h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 hover:text-white transition-all hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {current.body}

        {/* Footer Button */}
        <div className="mt-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3 py-1.5 rounded bg-black/60 hover:bg-[#ff2a8d] hover:text-black text-xs uppercase tracking-widest border border-[#ff2a8d] text-[#ff2a8d] transition-all"
          >
            Track Manager ↗
          </Link>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded bg-[#1f1035] hover:bg-[#321a55] text-xs uppercase tracking-widest border border-gray-700 transition-all"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
