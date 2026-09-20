export interface CreditToken {
  text: string;
  linkKey?: string;
  url?: string;
}

export interface CreditConfig {
  lines: CreditToken[][];
  badge: {
    show: boolean;
    topText: string;
    bottomText: string;
    linkKey?: string;
    url?: string;
  };
  showSparkles: boolean;
}

export const DEFAULT_CREDIT_CONFIG: CreditConfig = {
lines: [
    [
      { text: 'I built this website with my whole heart, just for you.' },
    ],
    [
      { text: 'I hope you like it and feel my love in every corner.' },
    ],
    [
      { text: 'Thank you for being my greatest inspiration.' },
    ],
    [
      { text: 'I love you so much.' },
    ],
    [
      { text: '' }, // Memberikan jarak (spacing) sebelum footer
    ],
    [
      { text: 'created by zuppy, made with love' },
    ],
  ],
  badge: {
    show: true,
    topText: 'From',
    bottomText: 'ZuppY',
    linkKey: '',
    url: '',
  },
  showSparkles: true,
};

// =========================================================================
// CUSTOMIZABLE PRIVACY OVERLAY CONFIGURATION (Cara 1: Kode Dinamis)
// =========================================================================
export interface PrivacyConfig {
  paragraphs: string[];
  footerPrefix: string;
  linkText: string;
  url: string;
}

export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  paragraphs: [
    'This space is exclusively made for us. We do not collect any personal data, only the sweet memories we create together every single day.',
    'Whenever you browse this website, the only statistic recorded is how incredibly lucky I am to have you in my life.',
    'Our privacy policy is very simple: all my love, care, and attention are strictly reserved for you. Every little story of ours is safely secured in my heart.',
    'You hold the exclusive rights to my heart, unconditionally and forever.',
  ],
  footerPrefix: 'To read the full terms and conditions of my love for you, click ',
  linkText: 'here.',
  url: '#', // Bisa kamu ganti dengan link Google Drive foto kalian berdua, atau link ke chat WhatsApp kamu
};

// =========================================================================
// CUSTOMIZABLE STATUS OVERLAY CONFIGURATION (Cara 1: Kode Dinamis)
// =========================================================================
export interface StatusConfig {
  text: string;
}

export const DEFAULT_STATUS_CONFIG: StatusConfig = {
  text: '1 MILLION SMILES / INFINITE MEMORIES / 1 PERFECT YOU',
};

// =========================================================================
// CUSTOMIZABLE HEADLINE & LABELS CONFIGURATION (Ganti Teks Headline di Sini)
// =========================================================================
export interface HeadlineConfig {
  line1: string;          // Baris 1: 'Discover and support local artists to'
  line2: string;          // Baris 2: 'take back your algorithm.'
  listenNow: string;      // Subtitle / Label: 'LISTEN NOW'
  whatIsAusify?: string;  // Tombol pojok kanan atas: 'WHAT IS AUSIFY?'
  dailyCdLabel?: string;  // Label bawah CD Kiri: 'CHOOSE A LETTER'
  vibeCdLabel?: string;   // Label bawah CD Kanan: 'CHOOSE A VIBE'
  watchVideo?: string;    // Tombol video bawah: '📼  WATCH AUSIFY VIDEO'
}

export const DEFAULT_HEADLINE_CONFIG: HeadlineConfig = {
  line1: 'Every love story is beautiful, but',
  line2: 'ours is my absolute favorite.',
  listenNow: 'START THE JOURNEY',
  whatIsAusify: 'WHAT IS AUSIFY?',
  dailyCdLabel: 'EXPLORE PLAYLIST',
  vibeCdLabel: 'EXPLORE MEMORIES',
  watchVideo: '📼  WATCH AUSIFY VIDEO',
};

// Helper: Word-wrap tokens cleanly for responsive Canvas text
export function wrapCreditTokens(
  ctx: CanvasRenderingContext2D,
  tokens: CreditToken[],
  maxW: number
): CreditToken[][] {
  if (tokens.length === 0 || (tokens.length === 1 && tokens[0].text.trim() === '')) {
    return [[{ text: '' }]];
  }

  // Measure total single line
  const totalW = tokens.reduce((acc, t) => acc + ctx.measureText(t.text).width, 0);
  if (totalW <= maxW) return [tokens];

  // Break token words
  const wordsWithTokens: CreditToken[] = [];
  for (const token of tokens) {
    if (!token.text.trim()) {
      wordsWithTokens.push(token);
      continue;
    }
    const words = token.text.split(' ');
    words.forEach((w, idx) => {
      const space = idx < words.length - 1 ? ' ' : '';
      wordsWithTokens.push({
        text: w + space,
        linkKey: token.linkKey,
        url: token.url,
      });
    });
  }

  const result: CreditToken[][] = [];
  let current: CreditToken[] = [];
  let currentW = 0;

  for (const tok of wordsWithTokens) {
    const tw = ctx.measureText(tok.text).width;
    if (currentW + tw <= maxW || current.length === 0) {
      current.push(tok);
      currentW += tw;
    } else {
      result.push(current);
      current = [tok];
      currentW = tw;
    }
  }
  if (current.length > 0) result.push(current);
  return result;
}

export function wrapPlainParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxW) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface CreditHitBox {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  url?: string;
}

export interface HudHitAreas {
  logo: { x: number; y: number; w: number; h: number };
  whatIsAusify: { x: number; y: number; w: number; h: number };
  dailyCd: { x: number; y: number; w: number; h: number };
  vibeCd: { x: number; y: number; w: number; h: number };
  watchVideo: { x: number; y: number; w: number; h: number };
  whoMadeThis: { x: number; y: number; w: number; h: number };
  privacy: { x: number; y: number; w: number; h: number };
  status: { x: number; y: number; w: number; h: number };

  // Overlay common hit areas
  overlayClose?: { x: number; y: number; w: number; h: number };
  overlayBackdrop?: { x: number; y: number; w: number; h: number };

  // Credit Overlay links
  linkEd?: { x: number; y: number; w: number; h: number };
  linkBureau?: { x: number; y: number; w: number; h: number };
  linkLevelTwo?: { x: number; y: number; w: number; h: number };
  linkDisco?: { x: number; y: number; w: number; h: number };
  linkMusicAus?: { x: number; y: number; w: number; h: number };

  // Privacy Overlay links
  linkPrivacyHere?: { x: number; y: number; w: number; h: number };
}

export class HudRenderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public logoImage: HTMLImageElement | null = null;
  public dailyImage: HTMLImageElement | null = null;
  public vibeImage: HTMLImageElement | null = null;
  public creditImage: HTMLImageElement | null = null;
  public creditMobileImage: HTMLImageElement | null = null;
  public privacyImage: HTMLImageElement | null = null;
  public privacyMobileImage: HTMLImageElement | null = null;

  public assetsLoaded = {
    logo: false,
    daily: false,
    vibe: false,
    credit: false,
    creditMobile: false,
    privacy: false,
    privacyMobile: false,
    fonts: false,
  };

  public hitAreas: HudHitAreas;
  public hoveredElement: string | null = null;

  // Smooth hover zoom states
  public dailyScale = 1.0;
  public vibeScale = 1.0;
  public dailyTextScale = 1.0;
  public vibeTextScale = 1.0;

  // Overlays state ('credit' | 'privacy' | 'status' | null)
  public activeOverlay: 'credit' | 'privacy' | 'status' | null = null;
  public lastOverlay: 'credit' | 'privacy' | 'status' | null = null;
  public overlayAnim = 0;

  // Dynamic Credit Overlay state (Cara 1: Kode Dinamis)
  public creditConfig: CreditConfig = DEFAULT_CREDIT_CONFIG;
  public creditHitBoxes: CreditHitBox[] = [];
  public creditCardCenterY = 0;
  public creditCardW = 0;
  public creditCardH = 0;
  public lastWidth = 0;
  public lastHeight = 0;

  // Dynamic Privacy Overlay state (Cara 1: Kode Dinamis)
  public privacyConfig: PrivacyConfig = DEFAULT_PRIVACY_CONFIG;
  public privacyHitBox: { x: number; y: number; w: number; h: number } | null = null;
  public privacyCardCenterY = 0;
  public privacyCardW = 0;
  public privacyCardH = 0;

  // Dynamic Status Overlay state (Cara 1: Kode Dinamis)
  public statusConfig: StatusConfig = DEFAULT_STATUS_CONFIG;
  public statusCardLeft = 0;
  public statusCardTop = 0;
  public statusCardW = 0;
  public statusCardH = 0;

  // Customizable Headline & Labels Configuration
  public headlineConfig: HeadlineConfig = DEFAULT_HEADLINE_CONFIG;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.hitAreas = {
      logo: { x: 0, y: 0, w: 0, h: 0 },
      whatIsAusify: { x: 0, y: 0, w: 0, h: 0 },
      dailyCd: { x: 0, y: 0, w: 0, h: 0 },
      vibeCd: { x: 0, y: 0, w: 0, h: 0 },
      watchVideo: { x: 0, y: 0, w: 0, h: 0 },
      whoMadeThis: { x: 0, y: 0, w: 0, h: 0 },
      privacy: { x: 0, y: 0, w: 0, h: 0 },
      status: { x: 0, y: 0, w: 0, h: 0 },
    };

    if (typeof window !== 'undefined') {
      // 1. Logo sprite sheet
      const imgLogo = new Image();
      imgLogo.src = '/logo-pack.png';
      imgLogo.onload = () => {
        this.logoImage = imgLogo;
        this.assetsLoaded.logo = true;
      };

      // 2. Official Daily CD (Choose a Letter)
      const imgDaily = new Image();
      imgDaily.src = '/daily.png';
      imgDaily.onload = () => {
        this.dailyImage = imgDaily;
        this.assetsLoaded.daily = true;
      };

      // 3. Official Vibe CD (Choose a Vibe)
      const imgVibe = new Image();
      imgVibe.src = '/vibe.png';
      imgVibe.onload = () => {
        this.vibeImage = imgVibe;
        this.assetsLoaded.vibe = true;
      };

      // 4. Official Who Made This Credit Overlay Card
      const imgCredit = new Image();
      imgCredit.src = '/credit-overlay.png';
      imgCredit.onload = () => {
        this.creditImage = imgCredit;
        this.assetsLoaded.credit = true;
      };

      const imgCreditMobile = new Image();
      imgCreditMobile.src = '/credit-overlay-mobile.png';
      imgCreditMobile.onload = () => {
        this.creditMobileImage = imgCreditMobile;
        this.assetsLoaded.creditMobile = true;
      };

      // 5. Official Privacy Overlay Card
      const imgPrivacy = new Image();
      imgPrivacy.src = '/privacy-overlay.png';
      imgPrivacy.onload = () => {
        this.privacyImage = imgPrivacy;
        this.assetsLoaded.privacy = true;
      };

      const imgPrivacyMobile = new Image();
      imgPrivacyMobile.src = '/privacy-overlay-mobile.png';
      imgPrivacyMobile.onload = () => {
        this.privacyMobileImage = imgPrivacyMobile;
        this.assetsLoaded.privacyMobile = true;
      };

      // Preload fonts
      if (document.fonts) {
        document.fonts.ready.then(() => {
          this.assetsLoaded.fonts = true;
        });
      }
    }
  }

  showCreditOverlay() {
    this.activeOverlay = this.activeOverlay === 'credit' ? null : 'credit';
    if (this.activeOverlay) this.lastOverlay = 'credit';
  }

  showPrivacyOverlay() {
    this.activeOverlay = this.activeOverlay === 'privacy' ? null : 'privacy';
    if (this.activeOverlay) this.lastOverlay = 'privacy';
  }

  showStatusOverlay() {
    this.activeOverlay = this.activeOverlay === 'status' ? null : 'status';
    if (this.activeOverlay) this.lastOverlay = 'status';
  }

  hideOverlay() {
    this.activeOverlay = null;
  }

  resize(width: number, height: number, dpr = 1) {
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  render(width: number, height: number, time: number) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    const isMobile = width < 768;
    const margin = isMobile ? 8 : 16;
    const barHeight = isMobile ? 11 : 13;
    const centerX = width / 2;

    // ==========================================================
    // 1. TOP NEON PINK BAR (Exact Ausify Spec: #FF7FEC)
    // ==========================================================
    const barWidth = width - margin * 2;
    ctx.save();
    ctx.shadowColor = '#ff7fec';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff7fec';
    ctx.fillRect(margin, margin, barWidth, barHeight);

    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffaef6';
    ctx.fillRect(margin + 1, margin + 2, barWidth - 2, barHeight - 4);
    ctx.restore();

    // ==========================================================
    // 2. ANIMATED #AUSIFY LOGO (Sprite Sheet)
    // ==========================================================
    const logoY = margin + barHeight + 9;
    const logoW = isMobile ? 95 : 115;
    const logoH = isMobile ? 33 : 40;

    this.hitAreas.logo = { x: margin, y: logoY, w: logoW, h: logoH };

    if (this.assetsLoaded.logo && this.logoImage) {
      const frameIndex = Math.floor((time * 18) % 42);
      const col = frameIndex % 4;
      const row = Math.floor(frameIndex / 4);

      const frameWidth = 512;
      const frameHeight = 2058 / 11;

      ctx.save();
      if (this.hoveredElement === 'logo') {
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 16;
      }
      ctx.drawImage(
        this.logoImage,
        col * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight,
        margin,
        logoY,
        logoW,
        logoH
      );
      ctx.restore();
    } else {
      ctx.fillStyle = '#ff7fec';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('#AUSIFY', margin, logoY + 24);
    }

    // ==========================================================
    // 3. WHAT IS AUSIFY? (Top Right)
    // ==========================================================
    const textY = logoY + (logoH / 2) + 5;
    const isWhatHovered = this.hoveredElement === 'whatIsAusify';

    ctx.save();
    ctx.font = 'bold 15px "Merchant Copy", "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.shadowColor = isWhatHovered ? '#ffffff' : '#ff7fec';
    ctx.shadowBlur = isWhatHovered ? 16 : 10;
    ctx.fillStyle = isWhatHovered ? '#ffffff' : '#ff7fec';

    const whatText = this.headlineConfig.whatIsAusify || 'WHAT IS AUSIFY?';
    const textWidth = ctx.measureText(whatText).width;
    ctx.fillText(whatText, width - margin, textY);
    ctx.restore();

    this.hitAreas.whatIsAusify = {
      x: width - margin - textWidth - 8,
      y: logoY,
      w: textWidth + 16,
      h: logoH,
    };

    // ==========================================================
    // 4. MAIN HEADLINE (Slender, Crisp, Elegant Instrument Serif)
    // ==========================================================
    const headlineY = isMobile
      ? Math.max(logoY + logoH + (height < 600 ? 15 : 22), Math.round(height * 0.13))
      : Math.max(110, height / 2 - 240);

    const fontSize = isMobile ? (height < 600 ? 22 : Math.min(width * 0.065, 30)) : 56;
    const lineHeight = fontSize * 1.15;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const line1 = this.headlineConfig.line1;
    const line2 = this.headlineConfig.line2;

    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff7fec';

    if (line1) {
      ctx.font = `400 ${fontSize}px "Instrument Serif", Georgia, serif`;
      ctx.fillText(line1, centerX, headlineY);
    }

    if (line2) {
      ctx.font = `italic 400 ${fontSize}px "Instrument Serif", Georgia, serif`;
      ctx.fillText(line2, centerX, headlineY + (line1 ? lineHeight : 0));
    }
    ctx.restore();

    // ==========================================================
    // 5. "LISTEN NOW" (Centered between Headline and CDs)
    // ==========================================================
    const headlineLinesCount = (line1 ? 1 : 0) + (line2 ? 1 : 0);
    const listenNowY = headlineY + lineHeight * Math.max(1, headlineLinesCount) + (height < 600 ? 10 : 14);
    ctx.save();
    ctx.font = 'bold 13px "Merchant Copy", "Courier New", monospace';
    ctx.letterSpacing = '3px';
    ctx.fillStyle = '#ff7fec';
    ctx.shadowColor = '#ff7fec';
    ctx.shadowBlur = 6;
    ctx.fillText(this.headlineConfig.listenNow, centerX, listenNowY);
    ctx.restore();

    // ==========================================================
    // 6. TWO OFFICIAL CD JEWEL CASES & LABELS
    // ==========================================================
    const footerYEst = height - (isMobile ? 24 : 32);
    const bottomBtnYEst = footerYEst - (isMobile ? 46 : 56);
    const availCdH = bottomBtnYEst - (listenNowY + 16) - (isMobile ? 32 : 46);
    const maxCdFromH = Math.max(isMobile ? 75 : 120, Math.floor(availCdH));

    const cdSize = isMobile
      ? Math.min(width * 0.40, 180, maxCdFromH)
      : Math.min(width * 0.22, 260, maxCdFromH);
    const spacing = isMobile ? cdSize * 0.55 : Math.max(cdSize * 0.75, 175);
    const cdBaseY = isMobile
      ? Math.max(listenNowY + 20, Math.min(listenNowY + 30, (bottomBtnYEst - 24 + listenNowY) / 2 - cdSize / 2))
      : Math.max(listenNowY + 35, height / 2 - cdSize * 0.45);

    const floatSpeed = 0.9;
    const float1 = Math.sin(time * floatSpeed) * 4;
    const float2 = Math.sin(time * floatSpeed + Math.PI) * 4;

    const isDailyHovered = this.hoveredElement === 'dailyCd';
    const isVibeHovered = this.hoveredElement === 'vibeCd';

    const targetDailyZoom = isDailyHovered ? 1.06 : 1.0;
    const targetVibeZoom = isVibeHovered ? 1.06 : 1.0;
    const targetDailyTextZoom = isDailyHovered ? 1.07 : 1.0;
    const targetVibeTextZoom = isVibeHovered ? 1.07 : 1.0;

    const lerpSpeed = 0.045;
    this.dailyScale += (targetDailyZoom - this.dailyScale) * lerpSpeed;
    this.vibeScale += (targetVibeZoom - this.vibeScale) * lerpSpeed;
    this.dailyTextScale += (targetDailyTextZoom - this.dailyTextScale) * lerpSpeed;
    this.vibeTextScale += (targetVibeTextZoom - this.vibeTextScale) * lerpSpeed;

    // --- LEFT CD: daily.png ("CHOOSE A LETTER") ---
    const cd1X = centerX - spacing - cdSize / 2;
    const cd1Y = cdBaseY + float1;

    this.hitAreas.dailyCd = {
      x: cd1X,
      y: cd1Y,
      w: cdSize,
      h: cdSize + 40,
    };

    if (this.assetsLoaded.daily && this.dailyImage) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.translate(cd1X + cdSize / 2, cd1Y + cdSize / 2);
      ctx.scale(this.dailyScale, this.dailyScale);
      ctx.drawImage(this.dailyImage, -cdSize / 2, -cdSize / 2, cdSize, cdSize);
      ctx.restore();
    }

    const label1CenterX = cd1X + cdSize / 2;
    const label1Y = cd1Y + cdSize + 22;

    ctx.save();
    ctx.font = 'bold 15px "Merchant Copy", "Courier New", monospace';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isDailyHovered ? '#ffffff' : '#ff7fec';
    ctx.shadowBlur = 0;
    ctx.translate(label1CenterX, label1Y);
    ctx.scale(this.dailyTextScale, this.dailyTextScale);
    ctx.fillText(this.headlineConfig.dailyCdLabel || 'CHOOSE A LETTER', 0, 0);
    ctx.restore();

    // --- RIGHT CD: vibe.png ("CHOOSE A VIBE") ---
    const cd2X = centerX + spacing - cdSize / 2;
    const cd2Y = cdBaseY + float2;

    this.hitAreas.vibeCd = {
      x: cd2X,
      y: cd2Y,
      w: cdSize,
      h: cdSize + 40,
    };

    if (this.assetsLoaded.vibe && this.vibeImage) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.translate(cd2X + cdSize / 2, cd2Y + cdSize / 2);
      ctx.scale(this.vibeScale, this.vibeScale);
      ctx.drawImage(this.vibeImage, -cdSize / 2, -cdSize / 2, cdSize, cdSize);
      ctx.restore();
    }

    const label2CenterX = cd2X + cdSize / 2;
    const label2Y = cd2Y + cdSize + 22;

    ctx.save();
    ctx.font = 'bold 15px "Merchant Copy", "Courier New", monospace';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isVibeHovered ? '#ffffff' : '#ff7fec';
    ctx.shadowBlur = 0;
    ctx.translate(label2CenterX, label2Y);
    ctx.scale(this.vibeTextScale, this.vibeTextScale);
    ctx.fillText(this.headlineConfig.vibeCdLabel || 'CHOOSE A VIBE', 0, 0);
    ctx.restore();

    // ==========================================================
    // 7. BOTTOM CONTROLS & FOOTER
    // ==========================================================
    const footerY = height - (isMobile ? 24 : 32);
    const bottomBtnY = footerY - (isMobile ? 46 : 56);
    const btnW = isMobile ? 220 : 260;
    const btnH = 34;
    const btnX = centerX - btnW / 2;

    this.hitAreas.watchVideo = { x: btnX, y: bottomBtnY, w: btnW, h: btnH };

    const isVideoHovered = this.hoveredElement === 'watchVideo';

    ctx.save();
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = isVideoHovered ? 14 : 6;
    ctx.fillStyle = isVideoHovered ? 'rgba(0, 245, 212, 0.25)' : 'rgba(0, 0, 0, 0.75)';
    ctx.strokeRect(btnX, bottomBtnY, btnW, btnH);
    ctx.fillRect(btnX, bottomBtnY, btnW, btnH);

    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isVideoHovered ? '#ffffff' : '#00f5d4';
    ctx.fillText(this.headlineConfig.watchVideo || '📼  WATCH AUSIFY VIDEO', centerX, bottomBtnY + btnH / 2);
    ctx.restore();

    // Footer Links: WHO MADE THIS?  ●  PRIVACY  ●  STATUS
    ctx.font = '11px "Merchant Copy", "Courier New", monospace';
    ctx.fillStyle = '#888888';

    const whoText = 'WHO MADE THIS?';
    const privText = 'PRIVACY';
    const statusText = 'STATUS';

    const sep = '  ●  ';
    const whoW = ctx.measureText(whoText).width;
    const sepW = ctx.measureText(sep).width;
    const privW = ctx.measureText(privText).width;
    const statW = ctx.measureText(statusText).width;

    const totalFooterW = whoW + sepW + privW + sepW + statW;
    let curX = centerX - totalFooterW / 2;

    // WHO MADE THIS?
    this.hitAreas.whoMadeThis = { x: curX - 5, y: footerY - 10, w: whoW + 10, h: 20 };
    ctx.fillStyle = this.hoveredElement === 'whoMadeThis' ? '#ffffff' : '#888888';
    ctx.textAlign = 'left';
    ctx.fillText(whoText, curX, footerY);
    curX += whoW;

    ctx.fillStyle = '#444444';
    ctx.fillText(sep, curX, footerY);
    curX += sepW;

    // PRIVACY
    this.hitAreas.privacy = { x: curX - 5, y: footerY - 10, w: privW + 10, h: 20 };
    ctx.fillStyle = this.hoveredElement === 'privacy' ? '#ffffff' : '#888888';
    ctx.fillText(privText, curX, footerY);
    curX += privW;

    ctx.fillStyle = '#444444';
    ctx.fillText(sep, curX, footerY);
    curX += sepW;

    // STATUS
    this.hitAreas.status = { x: curX - 5, y: footerY - 10, w: statW + 10, h: 20 };
    ctx.fillStyle = this.hoveredElement === 'status' ? '#ffffff' : '#888888';
    ctx.fillText(statusText, curX, footerY);

    // ==========================================================
    // 8. OVERLAYS: WHO MADE THIS?, PRIVACY, & STATUS (Bottom-Anchored, NO PINK SHADOW)
    // ==========================================================
    const targetAnim = this.activeOverlay !== null ? 1.0 : 0.0;
    this.overlayAnim += (targetAnim - this.overlayAnim) * 0.15;

    const shownOverlay = this.activeOverlay || this.lastOverlay;

    if (this.overlayAnim > 0.01 && shownOverlay) {
      // Darkened Backdrop
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${this.overlayAnim * 0.8})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      this.hitAreas.overlayBackdrop = { x: 0, y: 0, w: width, h: height };

      // --- A. CREDIT OVERLAY (WHO MADE THIS? - Cara 1: Kode Dinamis & Responsif) ---
      if (shownOverlay === 'credit') {
        const cardW = isMobile ? Math.min(width * 0.94, 440) : Math.min(width * 0.90, 740);
        const availTextW = cardW - (isMobile ? 32 : 64);
        const inset = 6;
        const closeSize = isMobile ? 22 : 26;

        // Font & line height responsif
        const fontSize = isMobile ? (width < 360 ? 10 : 11) : 13.5;
        const lineHeight = isMobile ? (width < 360 ? 15 : 17.5) : 22;
        ctx.font = `${fontSize}px "Merchant Copy", "Courier New", monospace`;

        // Auto-wrap setiap baris token agar tidak tumpah/berantakan di mobile
        const allWrappedLines: CreditToken[][] = [];
        this.creditConfig.lines.forEach((line) => {
          const wrapped = wrapCreditTokens(ctx, line, availTextW);
          allWrappedLines.push(...wrapped);
        });

        // Hitung total tinggi teks secara presisi
        let totalTextH = 0;
        allWrappedLines.forEach((line) => {
          if (line.length === 1 && line[0].text.trim() === '') {
            totalTextH += isMobile ? 10 : 14;
          } else {
            totalTextH += lineHeight;
          }
        });

        // Header space aman di bawah tombol close [X]
        const headerH = inset + closeSize + (isMobile ? 12 : 18);
        const badgeH = isMobile ? 32 : 38;
        const badgeGap = isMobile ? 14 : 20;
        const badgeTotal = this.creditConfig.badge.show ? badgeH + badgeGap : 0;
        const bottomPad = isMobile ? 22 : 32;

        const cardH = headerH + totalTextH + badgeTotal + bottomPad;

        const targetY = isMobile
          ? Math.max(cardH * 0.52, height - cardH * 0.44)
          : height - cardH * 0.46;
        const startY = height + cardH;
        const cardCenterY = startY + (targetY - startY) * this.overlayAnim;

        this.creditCardCenterY = cardCenterY;
        this.creditCardW = cardW;
        this.creditCardH = cardH;

        ctx.save();
        ctx.translate(centerX, cardCenterY);
        ctx.rotate(0.0285);

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // 1. Kotak Pink Solid
        ctx.fillStyle = '#FF7FEC';
        ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH + 180);

        // 2. Garis Bingkai Hitam Bagian Dalam
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.3;
        ctx.strokeRect(-cardW / 2 + inset, -cardH / 2 + inset, cardW - inset * 2, cardH - inset * 2 + 180);

        // 3. Tombol Tutup [ X ] di Pojok Kanan Atas
        const closeX = cardW / 2 - inset - closeSize;
        const closeY = -cardH / 2 + inset;
        ctx.fillStyle = this.hoveredElement === 'overlayClose' ? '#222222' : '#000000';
        ctx.fillRect(closeX, closeY, closeSize, closeSize);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const pad = isMobile ? 5 : 6;
        ctx.moveTo(closeX + pad, closeY + pad);
        ctx.lineTo(closeX + closeSize - pad, closeY + closeSize - pad);
        ctx.moveTo(closeX + closeSize - pad, closeY + pad);
        ctx.lineTo(closeX + pad, closeY + closeSize - pad);
        ctx.stroke();

        // 4. Dekorasi Bintang (Hanya di Desktop, di Mobile disembunyikan agar lega & rapi)
        if (this.creditConfig.showSparkles && !isMobile) {
          ctx.font = '15px "Merchant Copy", monospace';
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('*. *', -cardW / 2 + 45, -cardH / 2 + headerH + 6);
          ctx.fillText('* .*', cardW / 2 - 45, -cardH / 2 + headerH + 6);
        }

        // 5. Render Baris Teks Dinamis
        ctx.font = `${fontSize}px "Merchant Copy", "Courier New", monospace`;
        ctx.textBaseline = 'middle';

        this.creditHitBoxes = [];

        let curY = -cardH / 2 + headerH;

        allWrappedLines.forEach((line) => {
          if (line.length === 1 && line[0].text.trim() === '') {
            curY += isMobile ? 10 : 14;
            return;
          }

          const tokenWidths = line.map((tok) => ctx.measureText(tok.text).width);
          const totalLineW = tokenWidths.reduce((a, b) => a + b, 0);
          let tokenX = -totalLineW / 2;

          line.forEach((tok, tokIdx) => {
            const tw = tokenWidths[tokIdx];
            const isHovered = Boolean(tok.linkKey && this.hoveredElement === tok.linkKey);

            ctx.fillStyle = '#000000';
            ctx.textAlign = 'left';
            ctx.fillText(tok.text, tokenX, curY);

            if (tok.linkKey) {
              ctx.strokeStyle = isHovered ? '#FFFFFF' : '#000000';
              ctx.lineWidth = 1.1;
              ctx.beginPath();
              ctx.moveTo(tokenX, curY + (isMobile ? 6 : 8));
              ctx.lineTo(tokenX + tw, curY + (isMobile ? 6 : 8));
              ctx.stroke();

              this.creditHitBoxes.push({
                key: tok.linkKey,
                x: tokenX,
                y: curY - 9,
                w: tw,
                h: 18,
                url: tok.url,
              });
            }

            tokenX += tw;
          });

          curY += lineHeight;
        });

        // 6. Badge / Logo di Bagian Bawah
        if (this.creditConfig.badge.show) {
          const badgeY = curY + (isMobile ? 10 : 16);
          const badgeW = isMobile ? 74 : 88;
          const badgeH = isMobile ? 32 : 38;
          const isBadgeHovered = Boolean(
            this.creditConfig.badge.linkKey && this.hoveredElement === this.creditConfig.badge.linkKey
          );

          ctx.fillStyle = isBadgeHovered ? '#333333' : '#000000';
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(-badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 12);
          } else {
            ctx.fillRect(-badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH);
          }
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${isMobile ? 8 : 9.5}px "Merchant Copy", "Courier New", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(this.creditConfig.badge.topText, 0, badgeY - (isMobile ? 5 : 6));
          ctx.fillText(this.creditConfig.badge.bottomText, 0, badgeY + (isMobile ? 5 : 6));

          if (this.creditConfig.badge.linkKey) {
            this.creditHitBoxes.push({
              key: this.creditConfig.badge.linkKey,
              x: -badgeW / 2,
              y: badgeY - badgeH / 2,
              w: badgeW,
              h: badgeH,
              url: this.creditConfig.badge.url,
            });
          }
        }

        ctx.restore();
      }

      // --- B. PRIVACY OVERLAY (Cara 1: Kode Dinamis & Responsif) ---
      if (shownOverlay === 'privacy') {
        const cardW = isMobile ? Math.min(width * 0.94, 460) : Math.min(width * 0.90, 800);
        const availTextW = cardW - (isMobile ? 28 : 56);
        const inset = 6;
        const closeSize = isMobile ? 22 : 26;

        const fontSize = isMobile ? (width < 360 ? 8.5 : 9.5) : 11.5;
        const lineHeight = isMobile ? (width < 360 ? 13 : 14.5) : 17;
        const pGap = isMobile ? 6 : 10;
        ctx.font = `${fontSize}px "Merchant Copy", "Courier New", monospace`;

        // Wrap paragraphs
        const wrappedParagraphs: string[][] = this.privacyConfig.paragraphs.map((p) =>
          wrapPlainParagraph(ctx, p, availTextW)
        );

        // Wrap footer text
        const footerFullText = this.privacyConfig.footerPrefix + this.privacyConfig.linkText;
        const footerLines = wrapPlainParagraph(ctx, footerFullText, availTextW);

        // Calculate total height
        let totalLines = 0;
        wrappedParagraphs.forEach((pLines) => {
          totalLines += pLines.length;
        });
        totalLines += footerLines.length;

        const headerH = inset + closeSize + (isMobile ? 8 : 14);
        const totalTextH = totalLines * lineHeight + wrappedParagraphs.length * pGap;
        const bottomPad = isMobile ? 22 : 32;
        const cardH = headerH + totalTextH + bottomPad;

        const targetY = isMobile
          ? Math.max(cardH * 0.50, height - cardH * 0.46)
          : height - cardH * 0.46;
        const startY = height + cardH;
        const cardCenterY = startY + (targetY - startY) * this.overlayAnim;

        this.privacyCardCenterY = cardCenterY;
        this.privacyCardW = cardW;
        this.privacyCardH = cardH;

        ctx.save();
        ctx.translate(centerX, cardCenterY);
        ctx.rotate(0.0285);

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // 1. Kotak Pink Solid
        ctx.fillStyle = '#FF7FEC';
        ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH + 180);

        // 2. Garis Bingkai Hitam Bagian Dalam
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.3;
        ctx.strokeRect(-cardW / 2 + inset, -cardH / 2 + inset, cardW - inset * 2, cardH - inset * 2 + 180);

        // 3. Tombol Tutup [ X ] di Pojok Kanan Atas
        const closeX = cardW / 2 - inset - closeSize;
        const closeY = -cardH / 2 + inset;
        ctx.fillStyle = this.hoveredElement === 'overlayClose' ? '#222222' : '#000000';
        ctx.fillRect(closeX, closeY, closeSize, closeSize);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const pad = isMobile ? 5 : 6;
        ctx.moveTo(closeX + pad, closeY + pad);
        ctx.lineTo(closeX + closeSize - pad, closeY + closeSize - pad);
        ctx.moveTo(closeX + closeSize - pad, closeY + pad);
        ctx.lineTo(closeX + pad, closeY + closeSize - pad);
        ctx.stroke();

        // 4. Render Paragraphs Text
        ctx.font = `${fontSize}px "Merchant Copy", "Courier New", monospace`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let curY = -cardH / 2 + headerH;

        wrappedParagraphs.forEach((pLines) => {
          pLines.forEach((line) => {
            ctx.fillText(line, 0, curY);
            curY += lineHeight;
          });
          curY += pGap;
        });

        // 5. Render Footer Line with Clickable "here." Link
        this.privacyHitBox = null;
        const isPrivacyLinkHovered = this.hoveredElement === 'linkPrivacyHere';

        footerLines.forEach((fLine, idx) => {
          const isLastLine = idx === footerLines.length - 1;
          if (isLastLine && fLine.includes(this.privacyConfig.linkText)) {
            const linkStr = this.privacyConfig.linkText;
            const splitIdx = fLine.lastIndexOf(linkStr);
            const prefixPart = fLine.substring(0, splitIdx);
            const linkPart = linkStr;

            const prefixW = ctx.measureText(prefixPart).width;
            const linkW = ctx.measureText(linkPart).width;
            const fullW = prefixW + linkW;
            const startX = -fullW / 2;

            ctx.textAlign = 'left';
            ctx.fillText(prefixPart, startX, curY);

            const linkX = startX + prefixW;
            ctx.fillText(linkPart, linkX, curY);

            // Underline
            ctx.strokeStyle = isPrivacyLinkHovered ? '#FFFFFF' : '#000000';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(linkX, curY + (isMobile ? 5 : 7));
            ctx.lineTo(linkX + linkW, curY + (isMobile ? 5 : 7));
            ctx.stroke();

            this.privacyHitBox = {
              x: linkX,
              y: curY - 8,
              w: linkW,
              h: 16,
            };
            ctx.textAlign = 'center';
          } else {
            ctx.fillText(fLine, 0, curY);
          }
          curY += lineHeight;
        });

        ctx.restore();
      }

      // --- C. STATUS OVERLAY (Cara 1: Kode Dinamis & Responsif) ---
      if (shownOverlay === 'status') {
        const statusText = this.statusConfig.text;
        const maxW = width - 16;

        let fontSize = isMobile ? 11.5 : 14;
        ctx.font = `${fontSize}px "Merchant Copy", "Courier New", monospace`;
        let textW = ctx.measureText(statusText).width;

        const padding = isMobile ? 50 : 80;
        if (textW + padding > maxW) {
          fontSize = Math.max(8.5, fontSize * ((maxW - padding) / textW));
          ctx.font = `${fontSize}px "Merchant Copy", "Courier New", monospace`;
          textW = ctx.measureText(statusText).width;
        }

        const cardW = Math.min(maxW, textW + padding);
        const visibleH = isMobile ? 58 : 66;
        const targetTop = height - visibleH;
        const startTop = height + 10;
        const cardTop = startTop + (targetTop - startTop) * this.overlayAnim;
        const cardLeft = centerX - cardW / 2;

        this.statusCardLeft = cardLeft;
        this.statusCardTop = cardTop;
        this.statusCardW = cardW;
        this.statusCardH = visibleH;

        ctx.save();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // 1. Solid Pink Box
        ctx.fillStyle = '#FF7FEC';
        ctx.fillRect(cardLeft, cardTop, cardW, height + 20 - cardTop);

        // 2. Inner Black Border Line
        const inset = 5;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cardLeft + inset, height);
        ctx.lineTo(cardLeft + inset, cardTop + inset);
        ctx.lineTo(cardLeft + cardW - inset, cardTop + inset);
        ctx.lineTo(cardLeft + cardW - inset, height);
        ctx.stroke();

        // 3. Close Button [X] in Top Right Corner
        const closeSize = isMobile ? 20 : 22;
        const closeX = cardLeft + cardW - inset - closeSize - 1;
        const closeY = cardTop + inset + 1;

        ctx.fillStyle = this.hoveredElement === 'overlayClose' ? '#222222' : '#000000';
        ctx.fillRect(closeX, closeY, closeSize, closeSize);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const pad = 5;
        ctx.moveTo(closeX + pad, closeY + pad);
        ctx.lineTo(closeX + closeSize - pad, closeY + closeSize - pad);
        ctx.moveTo(closeX + closeSize - pad, closeY + pad);
        ctx.lineTo(closeX + pad, closeY + closeSize - pad);
        ctx.stroke();

        // 4. Status Monospace Text (Centered)
        ctx.fillStyle = '#000000';
        ctx.font = `${fontSize}px "Merchant Copy", "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          statusText,
          centerX,
          cardTop + visibleH / 2 + (isMobile ? 8 : 10)
        );

        ctx.restore();

        // Hit Area for Close
        this.hitAreas.overlayClose = {
          x: closeX - 2,
          y: closeY - 2,
          w: closeSize + 4,
          h: closeSize + 4,
        };
      }
    } else {
      this.lastOverlay = null;
      delete this.hitAreas.overlayClose;
      delete this.hitAreas.overlayBackdrop;
      delete this.hitAreas.linkEd;
      delete this.hitAreas.linkBureau;
      delete this.hitAreas.linkLevelTwo;
      delete this.hitAreas.linkDisco;
      delete this.hitAreas.linkMusicAus;
      delete this.hitAreas.linkPrivacyHere;
    }
  }

  checkHit(mouseX: number, mouseY: number): string | null {
    // If an overlay is active, prioritize overlay hit areas
    if (this.activeOverlay !== null) {
      if (this.activeOverlay === 'credit') {
        const cos = Math.cos(-0.0285);
        const sin = Math.sin(-0.0285);
        const centerX = this.lastWidth / 2;
        const dx = mouseX - centerX;
        const dy = mouseY - this.creditCardCenterY;
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        // 1. Close button
        const isMobile = this.lastWidth < 768;
        const closeSize = isMobile ? 22 : 26;
        const inset = 6;
        const closeX = this.creditCardW / 2 - inset - closeSize;
        const closeY = -this.creditCardH / 2 + inset;

        if (
          localX >= closeX - 4 &&
          localX <= closeX + closeSize + 4 &&
          localY >= closeY - 4 &&
          localY <= closeY + closeSize + 4
        ) {
          return 'overlayClose';
        }

        // 2. Dynamic Credit links
        for (const box of this.creditHitBoxes) {
          if (
            localX >= box.x &&
            localX <= box.x + box.w &&
            localY >= box.y &&
            localY <= box.y + box.h
          ) {
            return box.key;
          }
        }

        // 3. Inside credit card
        if (
          localX >= -this.creditCardW / 2 &&
          localX <= this.creditCardW / 2 &&
          localY >= -this.creditCardH / 2
        ) {
          return 'creditCard';
        }

        return 'overlayBackdrop';
      }

      if (this.activeOverlay === 'privacy') {
        const cos = Math.cos(-0.0285);
        const sin = Math.sin(-0.0285);
        const centerX = this.lastWidth / 2;
        const dx = mouseX - centerX;
        const dy = mouseY - this.privacyCardCenterY;
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        // 1. Close button
        const isMobile = this.lastWidth < 768;
        const closeSize = isMobile ? 22 : 26;
        const inset = 6;
        const closeX = this.privacyCardW / 2 - inset - closeSize;
        const closeY = -this.privacyCardH / 2 + inset;

        if (
          localX >= closeX - 4 &&
          localX <= closeX + closeSize + 4 &&
          localY >= closeY - 4 &&
          localY <= closeY + closeSize + 4
        ) {
          return 'overlayClose';
        }

        // 2. Link "here."
        const link = this.privacyHitBox;
        if (
          link &&
          localX >= link.x &&
          localX <= link.x + link.w &&
          localY >= link.y &&
          localY <= link.y + link.h
        ) {
          return 'linkPrivacyHere';
        }

        // 3. Inside privacy card
        if (
          localX >= -this.privacyCardW / 2 &&
          localX <= this.privacyCardW / 2 &&
          localY >= -this.privacyCardH / 2
        ) {
          return 'privacyCard';
        }

        return 'overlayBackdrop';
      }

      if (this.activeOverlay === 'status') {
        if (
          this.hitAreas.overlayClose &&
          mouseX >= this.hitAreas.overlayClose.x &&
          mouseX <= this.hitAreas.overlayClose.x + this.hitAreas.overlayClose.w &&
          mouseY >= this.hitAreas.overlayClose.y &&
          mouseY <= this.hitAreas.overlayClose.y + this.hitAreas.overlayClose.h
        ) {
          return 'overlayClose';
        }

        if (
          mouseX >= this.statusCardLeft &&
          mouseX <= this.statusCardLeft + this.statusCardW &&
          mouseY >= this.statusCardTop
        ) {
          return 'statusCard';
        }

        return 'overlayBackdrop';
      }

      if (
        this.hitAreas.overlayClose &&
        mouseX >= this.hitAreas.overlayClose.x &&
        mouseX <= this.hitAreas.overlayClose.x + this.hitAreas.overlayClose.w &&
        mouseY >= this.hitAreas.overlayClose.y &&
        mouseY <= this.hitAreas.overlayClose.y + this.hitAreas.overlayClose.h
      ) {
        return 'overlayClose';
      }

      return 'overlayBackdrop';
    }

    for (const [key, rect] of Object.entries(this.hitAreas)) {
      if (
        rect &&
        mouseX >= rect.x &&
        mouseX <= rect.x + rect.w &&
        mouseY >= rect.y &&
        mouseY <= rect.y + rect.h
      ) {
        return key;
      }
    }
    return null;
  }

  getLinkUrl(key: string): string | null {
    for (const box of this.creditHitBoxes) {
      if (box.key === key && box.url) {
        return box.url;
      }
    }
    return null;
  }
}
