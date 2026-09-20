import * as THREE from 'three';

// Generate procedural Canvas Texture for "Choose a Letter" CD Case
export function createLetterCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Background dark purple/black
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 0, 512, 512);

  // Border frame
  ctx.strokeStyle = '#2d184c';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, 480, 480);

  // Dotted wavy snake path
  ctx.strokeStyle = '#00f5d4';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 6]);

  ctx.beginPath();
  // Start top left
  ctx.arc(80, 120, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#00f5d4';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(80, 120);
  ctx.lineTo(430, 120);
  ctx.arcTo(450, 120, 450, 150, 30);
  ctx.arcTo(450, 200, 420, 200, 30);
  ctx.lineTo(90, 200);
  ctx.arcTo(60, 200, 60, 230, 30);
  ctx.arcTo(60, 310, 90, 310, 30);
  ctx.lineTo(430, 310);
  ctx.arcTo(450, 310, 450, 340, 30);
  ctx.arcTo(450, 400, 420, 400, 30);
  ctx.lineTo(430, 400);
  ctx.stroke();

  // End dot
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(430, 400, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#00f5d4';
  ctx.fill();

  // Stars
  drawStar(ctx, 256, 120, 8, 24, 10, '#00f5d4');
  drawStar(ctx, 256, 400, 8, 24, 10, '#ff4bb6');

  // Center glowing heart in circle
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ff2a8d';
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(256, 256, 45, 0, Math.PI * 2);
  ctx.fill();

  // Heart inside
  ctx.fillStyle = '#0a0512';
  ctx.shadowBlur = 0;
  drawHeart(ctx, 256, 256, 22);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Generate procedural Canvas Texture for "Choose a Vibe" CD Case
export function createVibeCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Soft glowing lilac / pink retro gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#f9c5d1');
  grad.addColorStop(0.5, '#e0c3fc');
  grad.addColorStop(1, '#cbb4f9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Scanline overlay on cover
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let y = 0; y < 512; y += 4) {
    ctx.fillRect(0, y, 512, 2);
  }

  // Border frame
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 492);

  // Constellation connection lines
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([4, 5]);

  ctx.beginPath();
  ctx.moveTo(160, 180);
  ctx.lineTo(380, 240);
  ctx.lineTo(200, 390);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // Circle 1: Top-Left Star Ring
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(160, 180, 60, 0, Math.PI * 2);
  ctx.stroke();
  drawStar(ctx, 160, 180, 8, 30, 14, '#000000');

  // Circle 2: Right Heart Ring
  ctx.beginPath();
  ctx.arc(380, 240, 45, 0, Math.PI * 2);
  ctx.stroke();
  drawHeart(ctx, 380, 240, 20);

  // Circle 3: Bottom-Left Star Ring
  ctx.beginPath();
  ctx.arc(200, 390, 50, 0, Math.PI * 2);
  ctx.stroke();
  drawStar(ctx, 200, 390, 8, 26, 12, '#000000');

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Utility: 8-point retro star
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  color: string
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Utility: Heart shape
function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 30, size / 30);
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.bezierCurveTo(-15, -25, -35, -5, -35, 10);
  ctx.bezierCurveTo(-35, 25, -15, 35, 0, 45);
  ctx.bezierCurveTo(15, 35, 35, 25, 35, 10);
  ctx.bezierCurveTo(35, -5, 15, -25, 0, -5);
  ctx.fillStyle = '#ff2a8d';
  ctx.fill();
  ctx.restore();
}
