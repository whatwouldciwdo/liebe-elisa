'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { CrtShader } from './CrtEffect';
import { DailyRenderer } from '@/lib/dailyRenderer';
import { sound } from '@/lib/audio';

interface DailyCanvasProps {
  onSelectPlaylist?: (letter: string) => void;
}

export default function DailyCanvas({ onSelectPlaylist }: DailyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const onSelectPlaylistRef = useRef(onSelectPlaylist);
  onSelectPlaylistRef.current = onSelectPlaylist;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const getViewportSize = () => {
      const winW = typeof window !== 'undefined'
        ? (window.visualViewport ? Math.round(window.visualViewport.width) : window.innerWidth)
        : 390;
      const winH = typeof window !== 'undefined'
        ? (window.visualViewport ? Math.round(window.visualViewport.height) : window.innerHeight)
        : 844;
      const cW = container.clientWidth || winW;
      const cH = container.clientHeight || winH;
      return {
        width: Math.min(cW, winW),
        height: Math.min(cH, winH),
      };
    };

    const initialSize = getViewportSize();
    let width = initialSize.width;
    let height = initialSize.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 1. WebGL Renderer using canvas element
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(dpr);

    // 2. 2D Daily Canvas & Texture
    const dailyRenderer = new DailyRenderer();
    dailyRenderer.resize(width, height, dpr);
    dailyRenderer.onPlaySound = (type) => {
      if (type === 'hover') sound.playHover();
      else if (type === 'click') sound.playClick();
    };

    const dailyTexture = new THREE.CanvasTexture(dailyRenderer.canvas);
    dailyTexture.minFilter = THREE.LinearFilter;
    dailyTexture.magFilter = THREE.LinearFilter;

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
      map: dailyTexture,
      transparent: true,
    });
    const mainQuad = new THREE.Mesh(new THREE.PlaneGeometry(width, height), quadMat);
    mainScene.add(mainQuad);

    // 3. Post-Processing Pipeline (FBO + CRT Shader Quad)
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

    // 4. Pointer and Touch Drag Interactions
    let isPointerDown = false;
    let startX = 0;
    let didDrag = false;
    let lastHoverHit: string | null = null;

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      startX = e.clientX;
      didDrag = false;
      dailyRenderer.startDrag(e.clientX);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isPointerDown) {
        if (Math.abs(e.clientX - startX) > 6) {
          didDrag = true;
        }
        dailyRenderer.dragMove(e.clientX, width);
      }

      const hit = dailyRenderer.checkHit(mouseX, mouseY);
      if (hit !== lastHoverHit) {
        if (hit && !isPointerDown) sound.playHover();
        lastHoverHit = hit;
      }

      dailyRenderer.hoveredElement = hit;
      canvas.style.cursor = hit || isPointerDown ? 'pointer' : 'default';
    };

    const onPointerUp = () => {
      if (isPointerDown) {
        dailyRenderer.endDrag(width);
        isPointerDown = false;
      }
    };

    const onClick = (e: MouseEvent) => {
      if (didDrag) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const hit = dailyRenderer.checkHit(mouseX, mouseY);
      if (hit) {
        sound.playClick();

        if (hit === 'home') {
          router.push('/');
        } else if (hit === 'prev') {
          dailyRenderer.prev();
        } else if (hit === 'next') {
          dailyRenderer.next();
        } else if (hit === 'button') {
          const letter = dailyRenderer.currentSelectedLetter;
          if (onSelectPlaylistRef.current) {
            onSelectPlaylistRef.current(letter);
          } else {
            sound.playChime();
          }
        } else if (hit.startsWith('letter_')) {
          const idx = parseInt(hit.replace('letter_', ''), 10);
          dailyRenderer.jumpToIndex(idx);
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        dailyRenderer.prev();
      } else if (e.key === 'ArrowRight') {
        dailyRenderer.next();
      } else if (e.key === 'Enter' || e.key === ' ') {
        sound.playClick();
        const letter = dailyRenderer.currentSelectedLetter;
        if (onSelectPlaylistRef.current) onSelectPlaylistRef.current(letter);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);

    // 5. Resize Handler
    const onResize = () => {
      const size = getViewportSize();
      if (!size.width || !size.height) return;
      width = size.width;
      height = size.height;

      mainCamera.left = -width / 2;
      mainCamera.right = width / 2;
      mainCamera.top = height / 2;
      mainCamera.bottom = -height / 2;
      mainCamera.updateProjectionMatrix();

      mainQuad.geometry.dispose();
      mainQuad.geometry = new THREE.PlaneGeometry(width, height);
      dailyRenderer.resize(width, height, dpr);

      renderer.setSize(width, height);
      renderTarget.dispose();
      renderTarget = new THREE.WebGLRenderTarget(width * dpr, height * dpr, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      });
      crtMaterial.uniforms.tDiffuse.value = renderTarget.texture;
      crtMaterial.uniforms.uResolution.value.set(width * dpr, height * dpr);
    };

    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(container);

    // 6. Animation Loop
    let animationId: number;
    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);

      const time = currentTime * 0.001;

      // Update 2D Canvas Scene
      dailyRenderer.render(width, height);
      dailyTexture.needsUpdate = true;

      // Update CRT shader uniforms
      crtMaterial.uniforms.uTime.value = time;

      // Step 1: Render Scene to RenderTarget
      renderer.setRenderTarget(renderTarget);
      renderer.clear();
      renderer.render(mainScene, mainCamera);

      // Step 2: Render CRT Shader Quad to Canvas
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(postScene, postCamera);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);

      renderer.dispose();
      renderTarget.dispose();
    };
  }, [router]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full overflow-hidden select-none bg-black cursor-default"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        title="Ausify Daily - Right click to save image"
      />
    </div>
  );
}
