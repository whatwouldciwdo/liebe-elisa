// Daily A-Z List Canvas 2D Renderer for Ausify
// Faithful to the official Ausify production engine

export const DAILY_LETTERS = [
  '031',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'PQR',
  'S',
  'T',
  'U',
  'V',
  'W',
  'XYZ',
];

// =========================================================================
// CUSTOMIZABLE DAILY PAGE CONFIGURATION (Ganti Teks /daily di Sini)
// =========================================================================
export interface DailyConfig {
  headerTitle: string;    // Judul Header: '∘ ₊ ✦  A-Z List  ✦ ₊ ∘'
  subtitleLine1: string;  // Baris 1: '23 playlists to help you explore the A-Z of'
  subtitleLine2: string;  // Baris 2: 'local sounds and discover more Australian music'
  homeText?: string;      // Tombol navigasi: '◄ HOME'
  buttonPrefix?: string;  // Awalan tombol: 'PLAY LIST'
}

export const DEFAULT_DAILY_CONFIG: DailyConfig = {
  headerTitle: '∘ ₊ ✦  A-Z List  ✦ ₊ ∘',
  subtitleLine1: 'An A-Z collection of all the little reasons',
  subtitleLine2: 'why I fall in love with you every single day',
  homeText: '◄ HOME',
  buttonPrefix: 'PLAY LIST',
};

export interface DailyHitAreas {
  home: { x: number; y: number; w: number; h: number };
  prev: { x: number; y: number; w: number; h: number };
  next: { x: number; y: number; w: number; h: number };
  button: { x: number; y: number; w: number; h: number };
  letters: { index: number; x: number; y: number; w: number; h: number }[];
}

export class DailyRenderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  public letters = DAILY_LETTERS;
  public currentIndex = 0; // Starts on '123'
  public currentSpin = 0; // In units of items (0 = '123' at center)
  public targetSpin = 0;

  // Customizable Page Text Configuration
  public config: DailyConfig = DEFAULT_DAILY_CONFIG;

  // Drag interaction state
  public isDragging = false;
  public dragStartX = 0;
  public dragStartSpin = 0;
  public dragLastX = 0;
  public dragVelocity = 0;

  public hoveredElement: string | null = null;
  public hitAreas: DailyHitAreas = {
    home: { x: 0, y: 0, w: 0, h: 0 },
    prev: { x: 0, y: 0, w: 0, h: 0 },
    next: { x: 0, y: 0, w: 0, h: 0 },
    button: { x: 0, y: 0, w: 0, h: 0 },
    letters: [],
  };

  // Sound callback
  public onPlaySound?: (type: 'hover' | 'click') => void;
  private lastSelectedLetter: string = '123';

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  public get currentSelectedLetter(): string {
    const n = this.letters.length;
    const idx = ((Math.round(this.currentSpin) % n) + n) % n;
    return this.letters[idx];
  }

  public next() {
    this.targetSpin += 1;
    this.onPlaySound?.('click');
  }

  public prev() {
    this.targetSpin -= 1;
    this.onPlaySound?.('click');
  }

  public jumpToIndex(index: number) {
    const n = this.letters.length;
    const curMod = ((Math.round(this.targetSpin) % n) + n) % n;
    let diff = index - curMod;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    this.targetSpin += diff;
    this.onPlaySound?.('click');
  }

  public startDrag(clientX: number) {
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragLastX = clientX;
    this.dragStartSpin = this.targetSpin;
    this.dragVelocity = 0;
  }

  public dragMove(clientX: number, width: number) {
    if (!this.isDragging) return;
    const deltaX = clientX - this.dragStartX;
    const itemPixelSpan = width < 768 ? 90 : 130;
    this.targetSpin = this.dragStartSpin - deltaX / itemPixelSpan;

    this.dragVelocity = clientX - this.dragLastX;
    this.dragLastX = clientX;
  }

  public endDrag(width: number) {
    if (!this.isDragging) return;
    this.isDragging = false;
    // Apply inertia and snap to nearest integer index
    const itemPixelSpan = width < 768 ? 90 : 130;
    const inertia = (-this.dragVelocity / itemPixelSpan) * 3;
    this.targetSpin = Math.round(this.targetSpin + inertia);
  }

  public resize(width: number, height: number, dpr = 1) {
    if (!width || !height || width <= 0 || height <= 0) return;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  public render(width: number, height: number) {
    if (!width || !height || width <= 0 || height <= 0) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    const isMobile = width < 768;
    const centerX = width / 2;

    if (isNaN(this.currentSpin)) this.currentSpin = 0;
    if (isNaN(this.targetSpin)) this.targetSpin = 0;

    // Smooth lerp towards targetSpin
    this.currentSpin += (this.targetSpin - this.currentSpin) * 0.12;
    const activeLetter = this.currentSelectedLetter;
    if (activeLetter !== this.lastSelectedLetter) {
      this.lastSelectedLetter = activeLetter;
      this.onPlaySound?.('hover');
    }

    this.hitAreas.letters = [];

    // ==========================================================
    // ==========================================================
    // 1. TOP LEFT "◄ HOME" BUTTON
    // ==========================================================
    const homeText = this.config.homeText || '◄ HOME';
    ctx.font = 'bold 14px "Merchant Copy", monospace';
    ctx.letterSpacing = '1px';
    const homeW = ctx.measureText(homeText).width;
    const homeX = isMobile ? 20 : 32;
    const homeY = isMobile ? 30 : 40;

    this.hitAreas.home = {
      x: homeX - 6,
      y: homeY - 16,
      w: homeW + 12,
      h: 28,
    };

    ctx.fillStyle = this.hoveredElement === 'home' ? '#FFFFFF' : '#FF7FEC';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(homeText, homeX, homeY);

    // ==========================================================
    // 2. HEADER: ∘ ₊ ✦  A-Z List  ✦ ₊ ∘
    // ==========================================================
    const titleY = isMobile ? Math.max(92, height * 0.12) : Math.max(135, height * 0.16);
    const titleFontSize = isMobile ? Math.min(width * 0.088, 46) : Math.min(width * 0.05, 70);
    ctx.font = `${titleFontSize}px "Instrument Serif", serif`;
    ctx.fillStyle = '#FF7FEC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.config.headerTitle, centerX, titleY);

    // ==========================================================
    // 3. SUBTITLE: 23 playlists to help you explore...
    // ==========================================================
    const subFontSize = isMobile ? Math.min(width * 0.046, 20) : Math.min(width * 0.022, 28);
    ctx.font = `${subFontSize}px "Instrument Serif", serif`;
    ctx.fillStyle = '#FF7FEC';

    const subGap1 = titleFontSize * 0.72;
    const subGap2 = subGap1 + subFontSize * 1.35;

    if (this.config.subtitleLine1) {
      ctx.fillText(this.config.subtitleLine1, centerX, titleY + subGap1);
    }
    if (this.config.subtitleLine2) {
      ctx.fillText(this.config.subtitleLine2, centerX, titleY + subGap2);
    }

    // ==========================================================
    // 5. THE A-Z ARCH WHEEL
    // ==========================================================
    // Mathematical Arch Curve Formula:
    // archY = baseY - Math.sin((screenX / width) * Math.PI) * archHeight
    const archBaseY = isMobile ? height * 0.69 : height * 0.63;
    const archHeight = isMobile ? height * 0.14 : height * 0.16;
    const itemSpacing = isMobile ? 85 : 125;

    const n = this.letters.length; // 23
    const totalSlots = n * 2; // 46 slots (letters and ⊹ separators)
    const slotStep = itemSpacing / 2;
    const totalSpan = totalSlots * slotStep;

    // Apex coordinates
    const apexY = archBaseY - archHeight;

    // ==========================================================
    // 4. PREV / NEXT ARROWS ON SIDES
    // ==========================================================
    const arrowY = apexY + 25;
    const arrowMargin = isMobile ? 22 : 64;

    ctx.font = `bold ${isMobile ? 28 : 36}px "Merchant Copy", monospace`;
    ctx.textBaseline = 'middle';

    // ◄ Left Arrow
    this.hitAreas.prev = {
      x: arrowMargin - 20,
      y: arrowY - 25,
      w: 40,
      h: 50,
    };
    ctx.fillStyle = this.hoveredElement === 'prev' ? '#FFFFFF' : '#FF7FEC';
    ctx.textAlign = 'center';
    ctx.fillText('◄', arrowMargin, arrowY);

    // ► Right Arrow
    this.hitAreas.next = {
      x: width - arrowMargin - 20,
      y: arrowY - 25,
      w: 40,
      h: 50,
    };
    ctx.fillStyle = this.hoveredElement === 'next' ? '#FFFFFF' : '#FF7FEC';
    ctx.textAlign = 'center';
    ctx.fillText('►', width - arrowMargin, arrowY);

    // Draw all visible items along the arc
    for (let slot = 0; slot < totalSlots; slot++) {
      const isLetter = slot % 2 === 0;
      const letterIndex = slot / 2;

      // Calculate position relative to current spin offset
      const slotOffset = slot * slotStep - this.currentSpin * itemSpacing;
      // Wrap around perimeter
      const relX =
        ((((slotOffset + totalSpan / 2) % totalSpan) + totalSpan) % totalSpan) -
        totalSpan / 2;

      const screenX = centerX + relX;

      // Cull items off screen
      if (screenX < -80 || screenX > width + 80) continue;

      // Arch calculation
      const normX = screenX / width;
      const archY = archBaseY - Math.sin(normX * Math.PI) * archHeight;

      // Tangent slope and angle
      const slope = -((Math.PI / width) * Math.cos(normX * Math.PI) * archHeight);
      let rot = Math.atan(slope);
      rot = Math.max(-0.55, Math.min(0.55, rot));

      ctx.save();
      ctx.translate(screenX, archY);
      ctx.rotate(rot);

      if (isLetter) {
        const letterName = this.letters[letterIndex];
        const isCenter = Math.abs(relX) < slotStep * 0.8;

        const letterFontSize = isCenter
          ? (isMobile ? 36 : 52)
          : (isMobile ? 24 : 34);

        ctx.font = `${letterFontSize}px "Instrument Serif", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const isHovered = this.hoveredElement === `letter_${letterIndex}`;
        const isFocused = isCenter || isHovered;

        ctx.save();
        if (isFocused) {
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = isCenter ? 12 : 8;
        } else {
          ctx.fillStyle = '#FF7FEC';
          ctx.shadowBlur = 0;
        }

        ctx.fillText(letterName, 0, 0);
        ctx.restore();

        // Record hit area for clicking directly on a letter
        this.hitAreas.letters.push({
          index: letterIndex,
          x: screenX - 30,
          y: archY - 30,
          w: 60,
          h: 60,
        });
      } else {
        // Decorator star separator
        ctx.font = `${isMobile ? 14 : 18}px "Merchant Copy", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FF7FEC';
        ctx.fillText('⊹', 0, 0);
      }

      ctx.restore();
    }

    // ==========================================================
    // 6. CENTER SELECTION POINTER LINES
    // ==========================================================
    const lineLen = isMobile ? 38 : 55;
    const lineGap = isMobile ? 34 : 48;

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;

    // Top Pointer Line (pointing down to center letter)
    ctx.beginPath();
    ctx.moveTo(centerX, apexY - lineGap - lineLen);
    ctx.lineTo(centerX, apexY - lineGap);
    ctx.stroke();

    // Bottom Pointer Line (pointing up to center letter)
    ctx.beginPath();
    ctx.moveTo(centerX, apexY + lineGap);
    ctx.lineTo(centerX, apexY + lineGap + lineLen);
    ctx.stroke();

    // ==========================================================
    // 7. ACTION BUTTON: [ PLAY LIST '...' ]
    // ==========================================================
    const prefix = this.config.buttonPrefix || 'PLAY LIST';
    const buttonText = `${prefix} ‘${activeLetter}’`;
    ctx.font = `bold ${isMobile ? 15 : 18}px "Merchant Copy", monospace`;
    ctx.letterSpacing = '1.5px';
    const btnTextW = ctx.measureText(buttonText).width;

    const btnPadX = isMobile ? 28 : 42;
    const btnW = btnTextW + btnPadX * 2;
    const btnH = isMobile ? 48 : 56;
    const btnX = centerX - btnW / 2;
    const btnY = apexY + lineGap + lineLen + (isMobile ? 32 : 48);

    this.hitAreas.button = {
      x: btnX,
      y: btnY,
      w: btnW,
      h: btnH,
    };

    const isBtnHovered = this.hoveredElement === 'button';

    // Box Background
    ctx.fillStyle = isBtnHovered ? '#FF7FEC' : '#000000';
    ctx.fillRect(btnX, btnY, btnW, btnH);

    // Box Border
    ctx.strokeStyle = '#FF7FEC';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    // Box Text
    ctx.fillStyle = isBtnHovered ? '#000000' : '#FF7FEC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(buttonText, centerX, btnY + btnH / 2);
  }

  public checkHit(mouseX: number, mouseY: number): string | null {
    // 1. Home button
    const h = this.hitAreas.home;
    if (mouseX >= h.x && mouseX <= h.x + h.w && mouseY >= h.y && mouseY <= h.y + h.h) {
      return 'home';
    }

    // 2. Prev arrow
    const p = this.hitAreas.prev;
    if (mouseX >= p.x && mouseX <= p.x + p.w && mouseY >= p.y && mouseY <= p.y + p.h) {
      return 'prev';
    }

    // 3. Next arrow
    const n = this.hitAreas.next;
    if (mouseX >= n.x && mouseX <= n.x + n.w && mouseY >= n.y && mouseY <= n.y + n.h) {
      return 'next';
    }

    // 4. Action Button
    const b = this.hitAreas.button;
    if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
      return 'button';
    }

    // 5. Direct letter clicks
    for (const l of this.hitAreas.letters) {
      if (mouseX >= l.x && mouseX <= l.x + l.w && mouseY >= l.y && mouseY <= l.y + l.h) {
        return `letter_${l.index}`;
      }
    }

    return null;
  }
}
