'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import LetterModal from '@/components/modals/LetterModal';
import VibeModal from '@/components/modals/VibeModal';
import VideoModal from '@/components/modals/VideoModal';
import InfoModal from '@/components/modals/InfoModal';

// Load RetroCanvas client-side only (WebGL requires window and document)
const RetroCanvas = dynamic(() => import('@/components/canvas/RetroCanvas'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-[#ff4bb6] font-mono select-none">
      <div className="relative text-xl md:text-2xl font-bold tracking-widest animate-pulse">
        (( LOADING PAGE ))
      </div>
      <div className="mt-3 text-xs text-[#00f5d4] tracking-wider">
        INITIALIZING CRT WEBGL ENGINE...
      </div>
    </div>
  ),
});

export default function HomePage() {
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [isVibeOpen, setIsVibeOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [infoType, setInfoType] = useState<'about' | 'who' | 'privacy' | 'status' | null>(null);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 
        MAIN WEBGL CANVAS LAYER
        Includes:
        - Top Neon Bar (solid 13px pink rectangle)
        - Animated Official #AUSIFY Sprite Sheet Logo
        - "WHAT IS AUSIFY?" in Merchant Copy Font
        - Central Headline in Instrument Serif with authentic Chromatic Aberration
        - 3D Rotating CD Cases (Choose a Letter & Choose a Vibe)
        - "WATCH AUSIFY VIDEO" VHS button
        - Footer links: WHO MADE THIS? ● PRIVACY ● STATUS
        
        Everything passes through the CRT GLSL Post-Processing Shader.
        When right-clicked, browsers target this <canvas> and show "Save image as...".
        When inspected with DevTools, it reveals the <canvas> element.
      */}
      <RetroCanvas
        onOpenLetter={() => setIsLetterOpen(true)}
        onOpenVibe={() => setIsVibeOpen(true)}
        onOpenAbout={() => setInfoType('about')}
        onOpenVideo={() => setIsVideoOpen(true)}
        onOpenWho={() => setInfoType('who')}
        onOpenPrivacy={() => setInfoType('privacy')}
        onOpenStatus={() => setInfoType('status')}
      />

      {/* MODALS */}
      <LetterModal isOpen={isLetterOpen} onClose={() => setIsLetterOpen(false)} />
      <VibeModal isOpen={isVibeOpen} onClose={() => setIsVibeOpen(false)} />
      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
      <InfoModal
        isOpen={infoType !== null}
        onClose={() => setInfoType(null)}
        type={infoType || 'about'}
      />

      {/* 
        PHANTOM / HEADLESS DOM FOR SEO & ACCESSIBILITY
        Invisible to human eyes, but indexed by Googlebot and readable by Screen Readers.
      */}
      <div
        className="pointer-events-none opacity-0 select-none absolute inset-0 -z-50 overflow-hidden w-px h-px"
        aria-hidden="false"
      >
        <h1>Ausify Your Algo | Search. Listen. Defy. #Ausify</h1>
        <p>
          Discover and support local artists to take back your algorithm.
        </p>
        <h2>LISTEN NOW</h2>
        <nav>
          <a href="#letter">CHOOSE A LETTER</a>
          <a href="#vibe">CHOOSE A VIBE</a>
          <a href="#video">WATCH AUSIFY VIDEO</a>
          <a href="#who">WHO MADE THIS?</a>
          <a href="#privacy">PRIVACY</a>
          <a href="#status">STATUS</a>
        </nav>
        <section>
          <p>
            Your destination for searching and discovering Australian music. Find new
            Aussie artists, bands, and homegrown talent from Melbourne, Sydney, Brisbane
            and beyond.
          </p>
          <p>
            We acknowledge the many Traditional Custodians of Country throughout
            Australia and honour their Elders past and present. We respect their deep
            enduring connection to their lands, waterways and surrounding clan groups since
            time immemorial. We cherish the richness of First Nations Peoples artistic and
            cultural expressions.
          </p>
        </section>
      </div>
    </main>
  );
}
