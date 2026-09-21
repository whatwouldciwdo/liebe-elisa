'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { CrtShader } from './CrtEffect';
import { MemoriesRenderer } from '@/lib/memoriesRenderer';
import { fetchMemories, MEMORY_MONTHS } from '@/lib/memories';
import { sound } from '@/lib/audio';

export default function MemoriesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detailRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); }
    catch {
      const timeout = window.setTimeout(() => setError('WebGL tidak tersedia. Aktifkan hardware acceleration atau gunakan browser lain.'), 0);
      return () => window.clearTimeout(timeout);
    }
    let active = true;
    const gallery = new MemoriesRenderer(detailRef.current?.getContext('2d') ?? undefined);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => { gallery.reducedMotion = motion.matches; };
    updateMotion(); motion.addEventListener('change', updateMotion);
    fetchMemories().then(items => { if (active) { gallery.items = items; gallery.status = ''; } })
      .catch(() => { if (active) gallery.status = 'Memories unavailable — please try again later'; });

    const texture = new THREE.CanvasTexture(gallery.canvas);
    texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    scene.add(new THREE.Mesh(geometry, material));
    const target = new THREE.WebGLRenderTarget(1, 1);
    const postScene = new THREE.Scene();
    const crt = new THREE.ShaderMaterial({
      vertexShader: CrtShader.vertexShader, fragmentShader: CrtShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(CrtShader.uniforms),
    });
    crt.uniforms.tDiffuse.value = target.texture;
    postScene.add(new THREE.Mesh(geometry, crt));
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      gallery.resize(width, height, dpr); renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
      target.setSize(Math.round(width * dpr), Math.round(height * dpr));
      crt.uniforms.uResolution.value.set(width * dpr, height * dpr);
    };
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    window.visualViewport?.addEventListener('resize', resize);
    let pointer: { id: number; y: number; start: number; dragged: boolean } | null = null;
    const point = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      canvas.focus(); canvas.setPointerCapture(event.pointerId);
      pointer = { id: event.pointerId, y: event.clientY, start: event.clientY, dragged: false };
    };
    const move = (event: PointerEvent) => {
      if (pointer && pointer.id === event.pointerId) {
        if (Math.abs(event.clientY - pointer.start) > 6) pointer.dragged = true;
        if (pointer.dragged) gallery.moveScroll(pointer.y - event.clientY);
        pointer.y = event.clientY;
      }
      const p = point(event), hit = gallery.hit(p.x, p.y);
      if (hit !== gallery.hovered && hit) sound.playHover();
      gallery.hovered = hit; canvas.style.cursor = hit ? 'pointer' : 'default';
    };
    const up = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      if (!pointer.dragged) {
        const p = point(event), hit = gallery.hit(p.x, p.y);
        if (hit) { sound.playClick(); if (hit === 'home') router.push('/'); else gallery.activate(hit); }
      }
      pointer = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const cancel = () => { pointer = null; };
    const wheel = (event: WheelEvent) => { event.preventDefault(); gallery.moveScroll(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1)); };
    const key = (event: KeyboardEvent) => {
      if (!['Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Escape') gallery.selected = null;
      else if (!gallery.selected) {
        if (event.key === 'ArrowLeft') gallery.setMonth(gallery.month - 1);
        if (event.key === 'ArrowRight') gallery.setMonth(gallery.month + 1);
        if (event.key === 'ArrowDown') gallery.moveScroll(100);
        if (event.key === 'ArrowUp') gallery.moveScroll(-100);
        if (event.key === 'Enter') {
          const item = gallery.items.find(item => item.month === MEMORY_MONTHS[gallery.month].key);
          if (item) { gallery.scroll = 0; gallery.render(performance.now()); gallery.activate(`photo:${item.id}`); }
        }
      }
    };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('wheel', wheel, { passive: false }); canvas.addEventListener('keydown', key);
    let frame = 0;
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate); gallery.render(now); texture.needsUpdate = true;
      crt.uniforms.uTime.value = gallery.reducedMotion ? 0 : now / 1000;
      renderer.setRenderTarget(target); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(postScene, camera);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      active = false; cancelAnimationFrame(frame); observer.disconnect();
      motion.removeEventListener('change', updateMotion); window.visualViewport?.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('wheel', wheel); canvas.removeEventListener('keydown', key);
      gallery.dispose(); texture.dispose(); geometry.dispose(); material.dispose(); crt.dispose(); target.dispose(); renderer.dispose();
    };
  }, [router]);

  return <>
    <canvas ref={canvasRef} tabIndex={0} className="block w-full h-full touch-none outline-none"
      aria-label="Monthly memories. Left and right arrows change month, up and down scroll, Enter opens the first photo, Escape closes a photo." />
    <canvas ref={detailRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
    {error && <p role="alert" className="absolute inset-0 grid place-items-center p-8 text-[#FF7FEC]">{error}</p>}
  </>;
}