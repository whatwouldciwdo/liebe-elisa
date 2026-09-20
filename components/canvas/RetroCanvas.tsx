'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { CrtShader } from './CrtEffect';
import { HudRenderer } from '@/lib/hudRenderer';
import { sound } from '@/lib/audio';

interface RetroCanvasProps {
  onOpenLetter: () => void;
  onOpenVibe: () => void;
  onOpenAbout: () => void;
  onOpenVideo: () => void;
  onOpenWho: () => void;
  onOpenPrivacy: () => void;
  onOpenStatus: () => void;
}

export default function RetroCanvas({
  onOpenLetter,
  onOpenVibe,
  onOpenAbout,
  onOpenVideo,
  onOpenWho,
  onOpenPrivacy,
  onOpenStatus,
}: RetroCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // 1. WebGL Renderer with preserveDrawingBuffer enabled (for native "Save image as...")
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(dpr);

    // 2. 2D HUD Canvas & Texture (contains Top bar, animated logo, headline, LISTEN NOW, CDs, buttons, and Credit Overlay)
    const hudRenderer = new HudRenderer();
    hudRenderer.resize(width, height, dpr);

    const hudTexture = new THREE.CanvasTexture(hudRenderer.canvas);
    hudTexture.minFilter = THREE.LinearFilter;
    hudTexture.magFilter = THREE.LinearFilter;

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

    const hudMaterial = new THREE.MeshBasicMaterial({
      map: hudTexture,
      transparent: true,
    });
    const hudQuad = new THREE.Mesh(new THREE.PlaneGeometry(width, height), hudMaterial);
    mainScene.add(hudQuad);

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

    // 4. Mouse Interaction
    let lastHit: string | null = null;

    const onPointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const hit = hudRenderer.checkHit(mouseX, mouseY);
      if (
        hit &&
        hit !== 'creditCard' &&
        hit !== 'privacyCard' &&
        hit !== 'statusCard' &&
        hit !== 'overlayBackdrop'
      ) {
        if (lastHit !== hit) {
          sound.playHover();
          lastHit = hit;
        }
        hudRenderer.hoveredElement = hit;
        canvas.style.cursor = 'pointer';
        return;
      }

      hudRenderer.hoveredElement =
        hit === 'creditCard' ||
        hit === 'privacyCard' ||
        hit === 'statusCard' ||
        hit === 'overlayBackdrop'
          ? hit
          : null;
      lastHit = null;
      canvas.style.cursor = 'default';
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const hit = hudRenderer.checkHit(mouseX, mouseY);
      if (hit) {
        sound.playClick();

        // 1. Overlay Hits
        if (
          hit === 'overlayClose' ||
          hit === 'overlayBackdrop' ||
          hit === 'creditClose' ||
          hit === 'creditBackdrop'
        ) {
          hudRenderer.hideOverlay();
          return;
        }
        if (hit === 'creditCard' || hit === 'privacyCard' || hit === 'statusCard') {
          // Clicked inside card background, do not close
          return;
        }

        // Check dynamic link from creditConfig
        const dynamicUrl = hudRenderer.getLinkUrl(hit);
        if (dynamicUrl) {
          window.open(dynamicUrl, '_blank');
          return;
        }

        if (hit === 'linkEd') {
          window.open('https://ed.studio/?utm_source=ausify.com', '_blank');
          return;
        }
        if (hit === 'linkBureau') {
          window.open('https://bureauofeverything.com', '_blank');
          return;
        }
        if (hit === 'linkLevelTwo') {
          window.open('https://www.leveltwo.com.au/', '_blank');
          return;
        }
        if (hit === 'linkDisco') {
          window.open('https://www.disco.ac/', '_blank');
          return;
        }
        if (hit === 'linkMusicAus') {
          window.open('https://creative.gov.au/music-australia', '_blank');
          return;
        }
        if (hit === 'linkPrivacyHere') {
          window.open(
            hudRenderer.privacyConfig.url ||
              'https://creative.gov.au/about-us/corporate-documents/policies/privacy',
            '_blank'
          );
          return;
        }

        // 2. Standard HUD Hits
        if (hit === 'logo') sound.playGlitch();
        else if (hit === 'whatIsAusify') onOpenAbout();
        else if (hit === 'dailyCd') {
          sound.playChime();
          router.push('/daily');
        } else if (hit === 'vibeCd') {
          sound.playChime([587.33, 739.99, 880.0, 1174.66]);
          onOpenVibe();
        } else if (hit === 'watchVideo') onOpenVideo();
        else if (hit === 'whoMadeThis') {
          hudRenderer.showCreditOverlay();
        } else if (hit === 'privacy') {
          hudRenderer.showPrivacyOverlay();
        } else if (hit === 'status') {
          hudRenderer.showStatusOverlay();
        }
      }
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('click', onClick);

    // 5. Resize handler
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

      hudQuad.geometry.dispose();
      hudQuad.geometry = new THREE.PlaneGeometry(width, height);
      hudRenderer.resize(width, height, dpr);

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

    // 6. Render Loop
    let animationId: number;

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);

      const time = currentTime * 0.001;

      // Update 2D Canvas Scene
      hudRenderer.render(width, height, time);
      hudTexture.needsUpdate = true;

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
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      renderer.dispose();
      renderTarget.dispose();
    };
  }, [
    onOpenLetter,
    onOpenVibe,
    onOpenAbout,
    onOpenVideo,
    onOpenWho,
    onOpenPrivacy,
    onOpenStatus,
  ]);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full overflow-hidden select-none bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        title="Ausify WebGL Experience - Right click to save image"
      />
    </div>
  );
}
