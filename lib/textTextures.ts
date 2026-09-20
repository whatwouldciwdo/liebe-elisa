import * as THREE from 'three';

export function createTitleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Styling
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'italic 58px "Times New Roman", Georgia, serif';

  // Glow shadow
  ctx.shadowColor = '#ff2a8d';
  ctx.shadowBlur = 18;

  // Text gradient or color (lavender to cyan/pink)
  ctx.fillStyle = '#f0c6ff';

  ctx.fillText('Discover and support local artists to', canvas.width / 2, 110);
  ctx.fillText('take back your algorithm.', canvas.width / 2, 210);

  // Subtitle: ✦ ✧ LISTEN NOW ✧ ✦
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00f5d4';
  ctx.fillStyle = '#00f5d4';
  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.letterSpacing = '6px';
  ctx.fillText('✦ ✧ LISTEN NOW ✧ ✦', canvas.width / 2, 300);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createLabelTexture(text: string, color = '#ff77cc'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 100;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px "Courier New", monospace';
  ctx.letterSpacing = '4px';

  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
