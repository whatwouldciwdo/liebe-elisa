'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { CrtShader } from './CrtEffect';
import {
  PlaylistPlayerRenderer,
  PlaylistData,
  STREAMING_SERVICES,
} from '@/lib/playlistPlayerRenderer';
import { sound } from '@/lib/audio';
import SyncedLyricsModal from '@/components/modals/SyncedLyricsModal';

interface PlaylistPlayerCanvasProps {
  playlist: PlaylistData;
  initialTrackIndex?: number;
  likedTracks: Set<string>;
  onToggleLike: (trackId: string) => void;
  onOpenHowToDefy: () => void;
  onOpenLetterDropdown: () => void;
  onOpenMyLikes: () => void;
  onOpenAbout: () => void;
  onTrackChange?: (index: number) => void;
}

export default function PlaylistPlayerCanvas({
  playlist,
  initialTrackIndex = 0,
  likedTracks,
  onToggleLike,
  onOpenHowToDefy,
  onOpenLetterDropdown,
  onOpenMyLikes,
  onOpenAbout,
  onTrackChange,
}: PlaylistPlayerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const [activeTrackIndex, setActiveTrackIndex] = useState(initialTrackIndex);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);

  const onToggleLikeRef = useRef(onToggleLike);
  onToggleLikeRef.current = onToggleLike;

  const onOpenHowToDefyRef = useRef(onOpenHowToDefy);
  onOpenHowToDefyRef.current = onOpenHowToDefy;

  const onOpenLetterDropdownRef = useRef(onOpenLetterDropdown);
  onOpenLetterDropdownRef.current = onOpenLetterDropdown;

  const onOpenMyLikesRef = useRef(onOpenMyLikes);
  onOpenMyLikesRef.current = onOpenMyLikes;

  const onOpenAboutRef = useRef(onOpenAbout);
  onOpenAboutRef.current = onOpenAbout;

  const onTrackChangeRef = useRef(onTrackChange);
  onTrackChangeRef.current = onTrackChange;

  const rendererInstanceRef = useRef<PlaylistPlayerRenderer | null>(null);

  const currentTrack = playlist.tracks[activeTrackIndex];

  // Sync liked tracks
  useEffect(() => {
    if (rendererInstanceRef.current) {
      rendererInstanceRef.current.likedTracks = new Set(likedTracks);
    }
  }, [likedTracks]);

  // Jump to track if initialTrackIndex prop changes
  useEffect(() => {
    if (rendererInstanceRef.current && initialTrackIndex !== undefined) {
      if (rendererInstanceRef.current.currentTrackIndex !== initialTrackIndex) {
        rendererInstanceRef.current.jumpToTrack(initialTrackIndex);
        setActiveTrackIndex(initialTrackIndex);
      }
    }
  }, [initialTrackIndex]);

  // Play / Pause audio handler
  const togglePlayAudio = useCallback(() => {
    const audio = audioRef.current;
    const track = playlist.tracks[activeTrackIndex];

    if (audio && track?.audioUrl) {
      if (audio.paused) {
        audio.play().catch((e) => console.warn('Audio play error:', e));
      } else {
        audio.pause();
      }
    } else {
      // Fallback: visual-only disc spinning
      if (rendererInstanceRef.current) {
        rendererInstanceRef.current.togglePlay();
        setIsAudioPlaying(rendererInstanceRef.current.isPlaying);
      }
    }
  }, [playlist.tracks, activeTrackIndex]);

  const togglePlayRef = useRef(togglePlayAudio);
  togglePlayRef.current = togglePlayAudio;

  // Load new audio source when active track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.audioUrl) {
      if (audio.src !== currentTrack.audioUrl) {
        audio.src = currentTrack.audioUrl;
        audio.load();
        if (isAudioPlaying) {
          audio.play().catch((e) => console.warn('Audio auto-play blocked:', e));
        }
      }
    } else {
      audio.removeAttribute('src');
      setCurrentTime(0);
      setDuration(currentTrack?.duration || 0);
    }
  }, [activeTrackIndex, currentTrack?.audioUrl, isAudioPlaying, currentTrack?.duration]);

  // Handle seeking from lyrics modal or scrubber
  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Three.js & 2D Canvas setup
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 1. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    // 2. 2D Player Canvas & Texture
    const playerRenderer = new PlaylistPlayerRenderer();
    rendererInstanceRef.current = playerRenderer;
    playerRenderer.likedTracks = new Set(likedTracks);
    playerRenderer.resize(width, height, dpr);
    playerRenderer.setPlaylist(playlist, initialTrackIndex);

    playerRenderer.onPlaySound = (type) => {
      if (type === 'hover') sound.playHover();
      else if (type === 'click') sound.playClick();
      else if (type === 'chime') sound.playChime([523.25, 659.25, 783.99]);
    };

    const playerTexture = new THREE.CanvasTexture(playerRenderer.canvas);
    playerTexture.minFilter = THREE.LinearFilter;
    playerTexture.magFilter = THREE.LinearFilter;
    playerTexture.colorSpace = THREE.LinearSRGBColorSpace;

    const mainScene = new THREE.Scene();
    mainScene.background = new THREE.Color(0x000000);

    const mainCamera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0,
      10
    );
    mainCamera.position.z = 5;

    const quadMat = new THREE.MeshBasicMaterial({
      map: playerTexture,
      transparent: true,
    });
    const mainQuad = new THREE.Mesh(new THREE.PlaneGeometry(width, height), quadMat);
    mainScene.add(mainQuad);

    // 3. CRT Post-Processing Shader
    let renderTarget = new THREE.WebGLRenderTarget(width * dpr, height * dpr, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const crtMaterial = new THREE.ShaderMaterial({
      vertexShader: CrtShader.vertexShader,
      fragmentShader: CrtShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(CrtShader.uniforms),
    });
    crtMaterial.uniforms.tDiffuse.value = renderTarget.texture;
    crtMaterial.uniforms.uResolution.value.set(width * dpr, height * dpr);

    const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), crtMaterial);
    postScene.add(postQuad);

    // 3b. Crisp HUD Scene (Renders text, icons & buttons directly on top)
    const hudTexture = new THREE.CanvasTexture(playerRenderer.hudCanvas);
    hudTexture.minFilter = THREE.LinearFilter;
    hudTexture.magFilter = THREE.LinearFilter;
    hudTexture.colorSpace = THREE.LinearSRGBColorSpace;

    const hudScene = new THREE.Scene();
    const hudQuadMat = new THREE.MeshBasicMaterial({
      map: hudTexture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const hudQuad = new THREE.Mesh(new THREE.PlaneGeometry(width, height), hudQuadMat);
    hudScene.add(hudQuad);

    // 4. Pointer and Drag Interactions
    let isPointerDown = false;
    let startX = 0;
    let didDrag = false;
    let lastHoverHit: string | null = null;
    let lastTrackIndex = initialTrackIndex;

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      startX = e.clientX;
      didDrag = false;
      playerRenderer.startDrag(e.clientX);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isPointerDown) {
        if (Math.abs(e.clientX - startX) > 6) {
          didDrag = true;
        }
        playerRenderer.dragMove(e.clientX, width);
      }

      const hit = playerRenderer.checkHit(mouseX, mouseY);
      if (hit !== lastHoverHit) {
        if (hit && !isPointerDown) sound.playHover();
        lastHoverHit = hit;
      }

      playerRenderer.hoveredElement = hit;
      canvas.style.cursor = hit || isPointerDown ? 'pointer' : 'default';
    };

    const onPointerUp = () => {
      if (isPointerDown) {
        playerRenderer.endDrag(width);
        isPointerDown = false;
      }
    };

    const onClick = (e: MouseEvent) => {
      if (didDrag) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const hit = playerRenderer.checkHit(mouseX, mouseY);
      if (hit) {
        sound.playClick();

        if (hit === 'logo') {
          router.push('/');
        } else if (hit === 'whatIsAusify') {
          onOpenAboutRef.current?.();
        } else if (hit === 'heartBox') {
          const track = playlist.tracks[playerRenderer.currentTrackIndex];
          if (track) {
            onToggleLikeRef.current?.(String(track.id));
            sound.playChime([523.25, 659.25, 783.99]);
          }
        } else if (hit === 'playBox') {
          togglePlayRef.current?.();
        } else if (hit === 'nextBox') {
          playerRenderer.nextTrack();
        } else if (hit === 'lyricsBox') {
          setIsLyricsModalOpen(true);
        } else if (hit === 'goToDashboard') {
          router.push('/dashboard');
        } else if (hit === 'howToDefy') {
          onOpenHowToDefyRef.current?.();
        } else if (hit === 'dailySelector') {
          router.push('/daily');
        } else if (hit === 'myLikesCard') {
          onOpenMyLikesRef.current?.();
        } else if (hit.startsWith('disc_')) {
          const idx = parseInt(hit.replace('disc_', ''), 10);
          if (idx === playerRenderer.currentTrackIndex) {
            togglePlayRef.current?.();
          } else {
            playerRenderer.jumpToTrack(idx);
          }
        } else if (hit.startsWith('stream_')) {
          const svcId = hit.replace('stream_', '');
          const curTrack = playlist.tracks[playerRenderer.currentTrackIndex];
          if (curTrack) {
            const svc = STREAMING_SERVICES.find((s) => s.id === svcId);
            if (svc) {
              const query = encodeURIComponent(`${curTrack.name} ${curTrack.artist.name}`);
              window.open(`${svc.url}${query}`, '_blank');
            }
          }
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        playerRenderer.prevTrack();
      } else if (e.key === 'ArrowRight') {
        playerRenderer.nextTrack();
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlayRef.current?.();
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);

    // 5. Resize Handler
    const handleResize = () => {
      if (!container || !canvas) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;

      renderer.setSize(width, height);
      renderer.setPixelRatio(dpr);

      playerRenderer.resize(width, height, dpr);

      mainCamera.left = -width / 2;
      mainCamera.right = width / 2;
      mainCamera.top = height / 2;
      mainCamera.bottom = -height / 2;
      mainCamera.updateProjectionMatrix();

      mainQuad.geometry.dispose();
      mainQuad.geometry = new THREE.PlaneGeometry(width, height);

      hudQuad.geometry.dispose();
      hudQuad.geometry = new THREE.PlaneGeometry(width, height);

      renderTarget.dispose();
      renderTarget = new THREE.WebGLRenderTarget(width * dpr, height * dpr, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      });
      crtMaterial.uniforms.tDiffuse.value = renderTarget.texture;
      crtMaterial.uniforms.uResolution.value.set(width * dpr, height * dpr);
    };

    window.addEventListener('resize', handleResize);

    // 6. Animation Loop
    let animationFrameId: number;
    let startTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const time = (now - startTime) / 1000;

      // Update 2D Canvases
      playerRenderer.render(width, height, time);
      playerTexture.needsUpdate = true;
      hudTexture.needsUpdate = true;

      // Track change callback
      if (playerRenderer.currentTrackIndex !== lastTrackIndex) {
        lastTrackIndex = playerRenderer.currentTrackIndex;
        setActiveTrackIndex(lastTrackIndex);
        onTrackChangeRef.current?.(lastTrackIndex);
      }

      // 1. Render Background & Discs Scene to FBO
      renderer.setRenderTarget(renderTarget);
      renderer.render(mainScene, mainCamera);

      // 2. Render Post-Processing CRT Glitch Scene to screen
      renderer.setRenderTarget(null);
      crtMaterial.uniforms.uTime.value = time;
      renderer.render(postScene, postCamera);

      // 3. Render Crisp HUD Scene directly on top of CRT output without micro-jitter/blur
      renderer.autoClear = false;
      renderer.render(hudScene, mainCamera);
      renderer.autoClear = true;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', handleResize);

      renderTarget.dispose();
      crtMaterial.dispose();
      postQuad.geometry.dispose();
      quadMat.dispose();
      mainQuad.geometry.dispose();
      hudQuad.geometry.dispose();
      hudQuadMat.dispose();
      hudTexture.dispose();
      playerTexture.dispose();
      renderer.dispose();
    };
  }, [playlist, initialTrackIndex, likedTracks]);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden bg-black">
      {/* HTML5 Audio element */}
      <audio
        ref={audioRef}
        onPlay={() => {
          setIsAudioPlaying(true);
          if (rendererInstanceRef.current) rendererInstanceRef.current.isPlaying = true;
        }}
        onPause={() => {
          setIsAudioPlaying(false);
          if (rendererInstanceRef.current) rendererInstanceRef.current.isPlaying = false;
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || currentTrack?.duration || 0);
          }
        }}
        onEnded={() => {
          if (rendererInstanceRef.current) {
            rendererInstanceRef.current.nextTrack();
          }
        }}
      />

      {/* WebGL Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Floating Synced Lyrics HUD Button (Top Right) */}
      {currentTrack && (
        <button
          onClick={() => {
            sound.playClick();
            setIsLyricsModalOpen(true);
          }}
          className="absolute top-14 right-4 md:top-16 md:right-8 z-30 px-3 py-1.5 border border-[#FF7FEC] bg-black/85 backdrop-blur text-xs font-mono text-[#FF7FEC] hover:bg-[#FF7FEC] hover:text-black transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,127,236,0.3)]"
          title="Open Synced Lyrics (LRC Karaoke)"
        >
          <span>📜 LYRICS</span>
          {currentTrack.lyrics && (
            <span className="text-[10px] text-[#00f5d4] border border-[#00f5d4] px-1 font-bold">
              SYNCED
            </span>
          )}
        </button>
      )}

      {/* Karaoke Synced Lyrics Modal */}
      <SyncedLyricsModal
        isOpen={isLyricsModalOpen}
        onClose={() => setIsLyricsModalOpen(false)}
        trackTitle={currentTrack?.name || ''}
        artistName={currentTrack?.artist?.name || ''}
        artworkUrl={currentTrack?.artworkUrl}
        lyricsText={currentTrack?.lyrics || ''}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isAudioPlaying}
        onSeek={handleSeek}
        onTogglePlay={togglePlayAudio}
      />
    </div>
  );
}
