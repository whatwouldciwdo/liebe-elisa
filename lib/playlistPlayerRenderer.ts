// Ausify Playlist Detail & Disc Player Canvas 2D Renderer
// Pixel-perfect 1:1 clone matching the official Ausify production player

export interface TrackData {
  id: string;
  name: string;
  artistId?: string;
  album?: string;
  year?: string;
  duration: number;
  artworkUrl?: string;
  artist: {
    id?: string;
    name: string;
  };
  links?: any[];
  audioUrl?: string;
  lyrics?: string;
}

export interface PlaylistData {
  id: string;
  name: string;
  type: string;
  tracks: TrackData[];
}

export interface PlayerHitAreas {
  logo: { x: number; y: number; w: number; h: number };
  whatIsAusify: { x: number; y: number; w: number; h: number };
  heartBox: { x: number; y: number; w: number; h: number };
  playBox: { x: number; y: number; w: number; h: number };
  nextBox: { x: number; y: number; w: number; h: number };
  lyricsBox?: { x: number; y: number; w: number; h: number };
  goToDashboard?: { x: number; y: number; w: number; h: number };
  howToDefy: { x: number; y: number; w: number; h: number };
  dailySelector: { x: number; y: number; w: number; h: number };
  myLikesCard: { x: number; y: number; w: number; h: number };
  discs: { index: number; x: number; y: number; radius: number }[];
  streaming: { service: string; x: number; y: number; w: number; h: number }[];
}

export const STREAMING_SERVICES = [
  { id: 'amazon-music', name: 'Amazon', icon: '/gl/images/player/trackinfo/amazon-music.png', url: 'https://music.amazon.com.au/search/' },
  { id: 'apple-music', name: 'Apple Music', icon: '/gl/images/player/trackinfo/apple-music.png', url: 'https://music.apple.com/au/search?term=' },
  { id: 'qobuz', name: 'Qobuz', icon: '/gl/images/player/trackinfo/qobuz.png', url: 'https://www.qobuz.com/au-en/search/tracks/' },
  { id: 'spotify', name: 'Spotify', icon: '/gl/images/player/trackinfo/spotify.png', url: 'https://open.spotify.com/search/' },
  { id: 'tidal', name: 'Tidal', icon: '/gl/images/player/trackinfo/tidal.png', url: 'https://tidal.com/search?q=' },
  { id: 'youtube-music', name: 'YouTube Music', icon: '/gl/images/player/trackinfo/youtube-music.png', url: 'https://music.youtube.com/search?q=' },
];

export const DAILY_LETTER_MAP: Record<string, number> = {
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
  'I': 9, 'J': 10, 'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15,
  'PQR': 16, 'S': 17, 'T': 18, 'U': 19, 'V': 20, 'W': 21, 'XYZ': 22, '123': 23,
};

export class PlaylistPlayerRenderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public hudCanvas: HTMLCanvasElement;
  public hudCtx: CanvasRenderingContext2D;

  public playlist: PlaylistData | null = null;
  public currentTrackIndex = 0;
  public isPlaying = false;
  public likedTracks = new Set<string>();

  // Smooth carousel animation
  public currentTrackPos = 0;
  public targetTrackPos = 0;
  public discSpinAngle = 0;

  // Drag interaction
  public isDragging = false;
  public dragStartX = 0;
  public dragStartPos = 0;
  public dragVelocity = 0;
  public dragLastX = 0;

  // Assets
  public logoImage: HTMLImageElement | null = null;
  public streamingImages: Map<string, HTMLImageElement> = new Map();
  public controlImages: Map<string, HTMLImageElement> = new Map();
  public artworkCache: Map<string, HTMLImageElement> = new Map();

  public hoveredElement: string | null = null;
  public hitAreas: PlayerHitAreas = {
    logo: { x: 0, y: 0, w: 0, h: 0 },
    whatIsAusify: { x: 0, y: 0, w: 0, h: 0 },
    heartBox: { x: 0, y: 0, w: 0, h: 0 },
    playBox: { x: 0, y: 0, w: 0, h: 0 },
    nextBox: { x: 0, y: 0, w: 0, h: 0 },
    lyricsBox: { x: 0, y: 0, w: 0, h: 0 },
    goToDashboard: { x: 0, y: 0, w: 0, h: 0 },
    howToDefy: { x: 0, y: 0, w: 0, h: 0 },
    dailySelector: { x: 0, y: 0, w: 0, h: 0 },
    myLikesCard: { x: 0, y: 0, w: 0, h: 0 },
    discs: [],
    streaming: [],
  };

  public onPlaySound?: (type: 'hover' | 'click' | 'chime') => void;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.hudCanvas = document.createElement('canvas');
    this.hudCtx = this.hudCanvas.getContext('2d')!;

    if (typeof window !== 'undefined') {
      // 1. Logo
      const imgLogo = new Image();
      imgLogo.src = '/logo-pack.png';
      imgLogo.onload = () => { this.logoImage = imgLogo; };

      // 2. Streaming icons
      STREAMING_SERVICES.forEach((svc) => {
        const img = new Image();
        img.src = svc.icon;
        img.onload = () => { this.streamingImages.set(svc.id, img); };
      });

      // 3. Controls (all states: normal, hover, active, plus track-heart, list)
      [
        'heart', 'heart-hover', 'heart-active',
        'pause', 'pause-hover', 'pause-active',
        'play', 'play-hover', 'play-active',
        'skip', 'skip-hover', 'skip-active',
        'track-heart',
        'list', 'list-hover',
      ].forEach((name) => {
        const img = new Image();
        img.src = `/gl/images/player/${name}.png`;
        img.onload = () => { this.controlImages.set(name, img); };
      });

      // 4. Preload Merchant Copy custom fonts into document.fonts
      if (typeof document !== 'undefined' && document.fonts) {
        document.fonts.load('32px "Merchant Copy Doublesize"');
        document.fonts.load('30px "Merchant Copy Doublesize"');
        document.fonts.load('28px "Merchant Copy Doublesize"');
        document.fonts.load('26px "Merchant Copy Doublesize"');
        document.fonts.load('24px "Merchant Copy Doublesize"');
        document.fonts.load('22px "Merchant Copy Doublesize"');
        document.fonts.load('20px "Merchant Copy Doublesize"');
        document.fonts.load('18px "Merchant Copy Doublesize"');
        document.fonts.load('16px "Merchant Copy Doublesize"');
        document.fonts.load('15px "Merchant Copy"');
        document.fonts.load('14px "Merchant Copy"');
        document.fonts.load('13px "Merchant Copy"');
        document.fonts.load('12px "Merchant Copy"');
        document.fonts.load('11px "Merchant Copy"');
        document.fonts.load('10px "Merchant Copy"');
      }
    }
  }

  public setPlaylist(data: PlaylistData, initialIndex = 0) {
    this.playlist = data;
    this.currentTrackIndex = Math.max(0, Math.min(initialIndex, data.tracks.length - 1));
    this.currentTrackPos = this.currentTrackIndex;
    this.targetTrackPos = this.currentTrackIndex;
    this.preloadArtworkAround(this.currentTrackIndex);
  }

  public preloadArtworkAround(index: number) {
    if (!this.playlist || typeof window === 'undefined') return;
    const tracks = this.playlist.tracks;
    const toPreload = [index - 3, index - 2, index - 1, index, index + 1, index + 2, index + 3];

    toPreload.forEach((i) => {
      if (i >= 0 && i < tracks.length) {
        const url = tracks[i]?.artworkUrl;
        if (url && !this.artworkCache.has(url)) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = url;
          img.onload = () => { this.artworkCache.set(url, img); };
        }
      }
    });
  }

  public nextTrack() {
    if (!this.playlist) return;
    if (this.currentTrackIndex < this.playlist.tracks.length - 1) {
      this.currentTrackIndex++;
    } else {
      this.currentTrackIndex = 0; // loop back to first track
    }
    this.targetTrackPos = this.currentTrackIndex;
    this.preloadArtworkAround(this.currentTrackIndex);
    this.onPlaySound?.('click');
  }

  public prevTrack() {
    if (!this.playlist) return;
    if (this.currentTrackIndex > 0) {
      this.currentTrackIndex--;
    } else {
      this.currentTrackIndex = this.playlist.tracks.length - 1;
    }
    this.targetTrackPos = this.currentTrackIndex;
    this.preloadArtworkAround(this.currentTrackIndex);
    this.onPlaySound?.('click');
  }

  public jumpToTrack(index: number) {
    if (!this.playlist) return;
    this.currentTrackIndex = Math.max(0, Math.min(index, this.playlist.tracks.length - 1));
    this.targetTrackPos = this.currentTrackIndex;
    this.preloadArtworkAround(this.currentTrackIndex);
    this.onPlaySound?.('click');
  }

  public togglePlay() {
    this.isPlaying = !this.isPlaying;
    this.onPlaySound?.('click');
  }

  public toggleHeart() {
    if (!this.playlist) return;
    const track = this.playlist.tracks[this.currentTrackIndex];
    if (!track) return;

    const trackIdStr = String(track.id);
    if (this.likedTracks.has(trackIdStr)) {
      this.likedTracks.delete(trackIdStr);
    } else {
      this.likedTracks.add(trackIdStr);
    }
    this.onPlaySound?.('chime');
  }

  public startDrag(clientX: number) {
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragLastX = clientX;
    this.dragStartPos = this.targetTrackPos;
    this.dragVelocity = 0;
  }

  public dragMove(clientX: number, width: number) {
    if (!this.isDragging || !this.playlist) return;
    const deltaX = clientX - this.dragStartX;
    const discSpacing = width < 768 ? 206 : 308;
    this.targetTrackPos = this.dragStartPos - deltaX / discSpacing;

    this.dragVelocity = clientX - this.dragLastX;
    this.dragLastX = clientX;
  }

  public endDrag(width: number) {
    if (!this.isDragging || !this.playlist) return;
    this.isDragging = false;
    const discSpacing = width < 768 ? 206 : 308;
    const inertia = (-this.dragVelocity / discSpacing) * 2;
    const targetIdx = Math.round(this.targetTrackPos + inertia);
    this.currentTrackIndex = Math.max(0, Math.min(targetIdx, this.playlist.tracks.length - 1));
    this.targetTrackPos = this.currentTrackIndex;
    this.preloadArtworkAround(this.currentTrackIndex);
  }

  public resize(width: number, height: number, dpr = 1) {
    if (!width || !height || width <= 0 || height <= 0) return;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.hudCanvas.width = Math.floor(width * dpr);
    this.hudCanvas.height = Math.floor(height * dpr);
    this.hudCtx.resetTransform();
    this.hudCtx.scale(dpr, dpr);
  }

  public render(width: number, height: number, time: number) {
    if (!width || !height || !this.playlist) return;
    const ctx = this.ctx;
    const hudCtx = this.hudCtx;
    ctx.clearRect(0, 0, width, height);
    hudCtx.clearRect(0, 0, width, height);

    const isMobile = width < 768;
    const margin = isMobile ? 12 : 24;
    const barHeight = isMobile ? 9 : 12;
    const centerX = width / 2;

    // Smooth lerp to track position
    this.currentTrackPos += (this.targetTrackPos - this.currentTrackPos) * 0.14;

    if (this.isPlaying) {
      this.discSpinAngle += 0.035;
    }

    const tracks = this.playlist.tracks;
    const currentTrack = tracks[this.currentTrackIndex] || tracks[0];

    // ==========================================================
    // 1. TOP NEON PINK BAR & LOGO (Responsive: desktop & mobile)
    // ==========================================================
    const barWidth = width - margin * 2;
    hudCtx.save();
    hudCtx.shadowColor = '#FF7FEC';
    hudCtx.shadowBlur = 10;
    hudCtx.fillStyle = '#FF7FEC';
    hudCtx.fillRect(margin, margin, barWidth, isMobile ? 6 : barHeight);
    hudCtx.restore();

    // Top Header: #AUSIFY LOGO & WHAT IS AUSIFY?
    const logoY = margin + (isMobile ? 10 : barHeight + 8);
    const logoW = isMobile ? 80 : 105;
    const logoH = isMobile ? 28 : 36;
    this.hitAreas.logo = { x: margin, y: logoY, w: logoW, h: logoH };

    if (this.logoImage && this.logoImage.complete) {
      const frameIndex = Math.floor((time * 18) % 42);
      const col = frameIndex % 4;
      const row = Math.floor(frameIndex / 4);
      const frameWidth = 512;
      const frameHeight = 2058 / 11;

      hudCtx.save();
      if (this.hoveredElement === 'logo') {
        hudCtx.shadowColor = '#00f5d4';
        hudCtx.shadowBlur = 14;
      }
      hudCtx.drawImage(
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
      hudCtx.restore();
    } else {
      hudCtx.fillStyle = '#FF7FEC';
      hudCtx.font = isMobile ? 'bold 16px monospace' : 'bold 20px monospace';
      hudCtx.fillText('#AUSIFY', margin, logoY + (isMobile ? 18 : 22));
    }

    // Top Right: WHAT IS AUSIFY?
    const whatText = 'WHAT IS AUSIFY?';
    hudCtx.font = isMobile ? '12px "Merchant Copy", monospace' : '14px "Merchant Copy", monospace';
    hudCtx.letterSpacing = '1px';
    const whatW = hudCtx.measureText(whatText).width;
    const whatX = width - margin;
    const whatY = logoY + logoH / 2;

    this.hitAreas.whatIsAusify = {
      x: whatX - whatW - 8,
      y: logoY,
      w: whatW + 16,
      h: logoH,
    };

    const isWhatHover = this.hoveredElement === 'whatIsAusify';
    hudCtx.save();
    hudCtx.shadowColor = isWhatHover ? '#FFFFFF' : '#FF7FEC';
    hudCtx.shadowBlur = isWhatHover ? 14 : 4;
    hudCtx.fillStyle = isWhatHover ? '#FFFFFF' : '#FF7FEC';
    hudCtx.textAlign = 'right';
    hudCtx.textBaseline = 'middle';
    hudCtx.fillText(whatText, whatX, whatY);
    hudCtx.restore();

    // ==========================================================
    // 3. TRACK TITLE, ARTIST NAME, CD DISCS & CONTROLS
    // ==========================================================
    if (currentTrack && tracks.length > 0) {
      // Adaptive info start: scale with height, minimum clears the top bar
      const topBarBottom = logoY + logoH + 8; // bottom of logo + small gap
      const infoStartY = isMobile
        ? Math.max(topBarBottom, Math.round(height * 0.22))
        : Math.max(margin + barHeight + 45, height * 0.14);

      // Track Title (e.g. "That's When I Think Of You" / "Adore Me")
      hudCtx.save();
      let titleFontSize = isMobile ? (height < 500 ? 20 : 26) : 30;
      hudCtx.font = `${titleFontSize}px "Merchant Copy Doublesize", monospace`;
      const titleW = hudCtx.measureText(currentTrack.name).width;
      if (titleW > width - 36) {
        titleFontSize = Math.max(isMobile ? 16 : 22, Math.floor(titleFontSize * ((width - 36) / titleW)));
        hudCtx.font = `${titleFontSize}px "Merchant Copy Doublesize", monospace`;
      }
      hudCtx.letterSpacing = '0.5px';
      hudCtx.fillStyle = '#FF7FEC';
      hudCtx.shadowColor = '#FF7FEC';
      hudCtx.shadowBlur = 4;
      hudCtx.textAlign = 'center';
      hudCtx.textBaseline = 'middle';
      hudCtx.fillText(currentTrack.name, centerX, infoStartY);

      // Artist Name (e.g. "1927" / "Emily Wurramara")
      const titleGap = isMobile ? (height < 500 ? 24 : 30) : 34;
      const artistY = infoStartY + titleGap;
      let artistFontSize = isMobile ? (height < 500 ? 16 : 20) : 22;
      hudCtx.font = `${artistFontSize}px "Merchant Copy Doublesize", monospace`;
      const artistMeasureW = hudCtx.measureText(currentTrack.artist.name).width;
      if (artistMeasureW > width - 36) {
        artistFontSize = Math.max(isMobile ? 12 : 16, Math.floor(artistFontSize * ((width - 36) / artistMeasureW)));
        hudCtx.font = `${artistFontSize}px "Merchant Copy Doublesize", monospace`;
      }
      hudCtx.letterSpacing = '0.5px';
      hudCtx.fillText(currentTrack.artist.name, centerX, artistY);
      hudCtx.restore();

      // 6 Streaming Icons in a neat row right below artist
      // On very short screens (landscape), skip icons to save vertical space
      const showStreamIcons = height >= 500;
      const streamGap = isMobile ? (height < 500 ? 22 : 30) : 36;
      const streamY = showStreamIcons ? artistY + streamGap : artistY + 8;
      const iconSize = isMobile ? (height < 500 ? 15 : 18) : 22;
      const iconGap = isMobile ? 12 : 16;
      const totalStreamW =
        STREAMING_SERVICES.length * iconSize + (STREAMING_SERVICES.length - 1) * iconGap;
      const streamStartX = centerX - totalStreamW / 2;

      this.hitAreas.streaming = [];

      if (showStreamIcons) {
        STREAMING_SERVICES.forEach((svc, i) => {
          const ix = streamStartX + i * (iconSize + iconGap);
          const isHovered = this.hoveredElement === `stream_${svc.id}`;

          this.hitAreas.streaming.push({
            service: svc.id,
            x: ix - 3,
            y: streamY - iconSize / 2 - 3,
            w: iconSize + 6,
            h: iconSize + 6,
          });

          const iconImg = this.streamingImages.get(svc.id);
          hudCtx.save();
          if (isHovered) {
            hudCtx.shadowColor = '#FFFFFF';
            hudCtx.shadowBlur = 8;
            hudCtx.fillStyle = '#FFFFFF';
          } else {
            hudCtx.shadowColor = '#FF7FEC';
            hudCtx.shadowBlur = 3;
            hudCtx.fillStyle = '#FF7FEC';
          }

          if (iconImg && iconImg.complete && iconImg.naturalWidth > 0) {
            hudCtx.drawImage(iconImg, ix, streamY - iconSize / 2, iconSize, iconSize);
          } else {
            hudCtx.font = '10px ui-monospace, "Courier New", monospace';
            hudCtx.textAlign = 'center';
            hudCtx.textBaseline = 'middle';
            hudCtx.fillText(svc.name.slice(0, 3), ix + iconSize / 2, streamY);
          }
          hudCtx.restore();
        });
      }

      // ==========================================================
      // 4. THE CIRCULAR CD DISCS CAROUSEL (Exact Image 1 Spec)
      // ==========================================================
      const isVeryShort = height < 500; // landscape phone or very compact screen
      const _boxH = isMobile ? 46 : 56;
      const _boxGap = isMobile ? (isVeryShort ? 28 : 48) : 75; // smaller gap on landscape
      const _bottomH = isMobile ? 48 : 42;
      const _safeBot = isMobile ? 4 : 8;

      // Ideal radius from width
      let cdRadius = isMobile
        ? Math.min(width * 0.25, 94)
        : Math.min(width * 0.135, 136);

      // Shrink radius if vertical space is insufficient (landscape / short phone)
      const infoEndY = streamY + (isMobile ? (isVeryShort ? 8 : 14) : 18);
      const availV = height - infoEndY - _bottomH - _safeBot - _boxH - _boxGap;
      const maxRadiusH = Math.floor((availV - 8) / 2);
      if (maxRadiusH > 0 && maxRadiusH < cdRadius) {
        cdRadius = Math.max(isMobile ? (isVeryShort ? 40 : 52) : 68, maxRadiusH);
      }

      const cdDiameter = cdRadius * 2;
      const cdGap = isMobile ? 22 : 32;
      const cdSpacing = cdDiameter + cdGap;

      // Clamp cdCenterY so disc + controls never overlap bottom bar
      const idealCdY = Math.round(height * 0.52);
      const minCdY = infoEndY + cdRadius + 8;
      const maxCdY = height - _bottomH - _safeBot - _boxH - _boxGap - cdRadius;
      const cdCenterY = Math.max(minCdY, Math.min(idealCdY, maxCdY));

      this.hitAreas.discs = [];

      // Range of visible discs: render -3 to +3
      const centerIdx = Math.round(this.currentTrackPos);
      const renderMin = Math.max(0, centerIdx - 3);
      const renderMax = Math.min(tracks.length - 1, centerIdx + 3);

      for (let idx = renderMin; idx <= renderMax; idx++) {
        const track = tracks[idx];
        const relPos = idx - this.currentTrackPos;
        const screenX = centerX + relPos * cdSpacing;

        // Cull off screen
        if (screenX < -cdRadius || screenX > width + cdRadius) continue;

        const dist = Math.abs(relPos);
        const isCenterDisc = dist < 0.45;

        // Dim non-center discs slightly, active center disc is 1.0 brightness
        const alpha = Math.max(0.35, 1.0 - dist * 0.35);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(screenX, cdCenterY);

        // --- 1. CIRCLE CLIP FOR DISC ---
        ctx.beginPath();
        ctx.arc(0, 0, cdRadius, 0, Math.PI * 2);
        ctx.clip();

        // --- 2. ALBUM ARTWORK ROTATING IF ACTIVE ---
        ctx.save();
        if (isCenterDisc && this.isPlaying) {
          ctx.rotate(this.discSpinAngle);
        }

        const artwork = this.artworkCache.get(track.artworkUrl || '');
        if (artwork && artwork.complete && artwork.naturalWidth > 0) {
          ctx.drawImage(artwork, -cdRadius, -cdRadius, cdDiameter, cdDiameter);
        } else {
          // Fallback artistic CD pattern
          ctx.fillStyle = '#180f24';
          ctx.fillRect(-cdRadius, -cdRadius, cdDiameter, cdDiameter);
          ctx.fillStyle = '#FF7FEC';
          ctx.font = '12px ui-monospace, "Courier New", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(track.name.slice(0, 16), 0, -10);
        }
        ctx.restore();

        // --- 3. CD SURFACE IRIDESCENCE & LIGHTING REFLECTION ---
        const sheen = ctx.createLinearGradient(-cdRadius, -cdRadius, cdRadius, cdRadius);
        sheen.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
        sheen.addColorStop(0.3, 'rgba(0, 245, 212, 0.08)');
        sheen.addColorStop(0.5, 'rgba(255, 127, 236, 0.08)');
        sheen.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
        sheen.addColorStop(1, 'rgba(255, 255, 255, 0.22)');
        ctx.fillStyle = sheen;
        ctx.fill();

        // --- 4. TRANSPARENT PLASTIC CENTER HUB & SPINDLE HOLE ---
        ctx.beginPath();
        ctx.arc(0, 0, cdRadius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(12, 10, 16, 0.88)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, cdRadius * 0.24, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, cdRadius * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, cdRadius - 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = isCenterDisc ? 'rgba(255, 127, 236, 0.6)' : 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();

        this.hitAreas.discs.push({
          index: idx,
          x: screenX,
          y: cdCenterY,
          radius: cdRadius,
        });

        // Pink pixel heart below CD disc if track is liked
        const isTrackLiked = this.likedTracks.has(String(track.id)) || this.likedTracks.has(track.id);
        if (isTrackLiked) {
          const heartW = 21;
          const heartH = 18;
          const heartX = screenX - heartW / 2;
          const heartY = cdCenterY + cdRadius + (isMobile ? 14 : 20);

          hudCtx.save();
          hudCtx.globalAlpha = alpha;
          hudCtx.shadowColor = '#FF7FEC';
          hudCtx.shadowBlur = 6;
          const trackHeart = this.controlImages.get('track-heart');
          if (trackHeart && trackHeart.complete && trackHeart.naturalWidth > 0) {
            hudCtx.drawImage(trackHeart, heartX, heartY, heartW, heartH);
          } else {
            drawPixelHeart(hudCtx, screenX, heartY + heartH / 2, '#FF7FEC');
          }
          hudCtx.restore();
        }
      }

      // ==========================================================
      // 5. FOUR CONTROL BOXES BELOW DISCS: [ ♥ ]  [ ▶/❚❚ ]  [ ►► ]  [ 📜 LRC ]
      // ==========================================================
      const boxW = isMobile ? 60 : 74;
      const boxH = _boxH; // reuse the pre-computed value (46 mobile / 56 desktop)
      const boxGap = isMobile ? 8 : 11;

      const totalBoxesW = boxW * 4 + boxGap * 3;
      const startBoxX = centerX - totalBoxesW / 2;

      // controlsY: placed exactly _boxGap below the disc bottom, clamped above bottom bar
      const controlsYRaw = cdCenterY + cdRadius + (isMobile ? _boxGap : _boxGap);
      const controlsYMax = height - _bottomH - _safeBot - boxH;
      const controlsY = Math.min(controlsYRaw, controlsYMax);

      // --- Box 1: [ ♥ ] Heart button ---
      const box1X = startBoxX;
      this.hitAreas.heartBox = { x: box1X, y: controlsY, w: boxW, h: boxH };
      const isHeartHover = this.hoveredElement === 'heartBox';
      const heartSpriteName = isHeartHover ? 'heart-hover' : 'heart';
      const heartSprite = this.controlImages.get(heartSpriteName);

      hudCtx.save();
      if (heartSprite && heartSprite.complete && heartSprite.naturalWidth > 0) {
        hudCtx.drawImage(heartSprite, box1X, controlsY, boxW, boxH);
      } else {
        hudCtx.fillStyle = isHeartHover ? '#FF7FEC' : '#000000';
        hudCtx.fillRect(box1X, controlsY, boxW, boxH);
        hudCtx.strokeStyle = '#FF7FEC';
        hudCtx.lineWidth = 1.5;
        hudCtx.strokeRect(box1X, controlsY, boxW, boxH);
        drawPixelHeart(hudCtx, box1X + boxW / 2, controlsY + boxH / 2, isHeartHover ? '#000000' : '#FF7FEC', isMobile ? 2.0 : 2.5);
      }
      hudCtx.restore();

      // --- Box 2: [ ▶ ] / [ ❚❚ ] Play/Pause button ---
      const box2X = startBoxX + boxW + boxGap;
      this.hitAreas.playBox = { x: box2X, y: controlsY, w: boxW, h: boxH };
      const isPlayHover = this.hoveredElement === 'playBox';

      const playSpriteName = this.isPlaying
        ? (isPlayHover ? 'pause-hover' : 'pause')
        : (isPlayHover ? 'play-hover' : 'play');
      const playSprite = this.controlImages.get(playSpriteName);

      hudCtx.save();
      if (playSprite && playSprite.complete && playSprite.naturalWidth > 0) {
        hudCtx.drawImage(playSprite, box2X, controlsY, boxW, boxH);
      } else {
        hudCtx.fillStyle = isPlayHover ? '#FF7FEC' : '#000000';
        hudCtx.fillRect(box2X, controlsY, boxW, boxH);
        hudCtx.strokeStyle = '#FF7FEC';
        hudCtx.lineWidth = 1.5;
        hudCtx.strokeRect(box2X, controlsY, boxW, boxH);
        const iconColor = isPlayHover ? '#000000' : '#FF7FEC';
        if (this.isPlaying) {
          drawPixelPause(hudCtx, box2X + boxW / 2, controlsY + boxH / 2, iconColor, isMobile ? 1.0 : 1.2);
        } else {
          drawPixelPlay(hudCtx, box2X + boxW / 2, controlsY + boxH / 2, iconColor, isMobile ? 1.0 : 1.2);
        }
      }
      hudCtx.restore();

      // --- Box 3: [ ►► ] Next track button ---
      const box3X = startBoxX + (boxW + boxGap) * 2;
      this.hitAreas.nextBox = { x: box3X, y: controlsY, w: boxW, h: boxH };
      const isNextHover = this.hoveredElement === 'nextBox';

      const skipSprite = this.controlImages.get(isNextHover ? 'skip-hover' : 'skip');

      hudCtx.save();
      if (skipSprite && skipSprite.complete && skipSprite.naturalWidth > 0) {
        hudCtx.drawImage(skipSprite, box3X, controlsY, boxW, boxH);
      } else {
        hudCtx.fillStyle = isNextHover ? '#FF7FEC' : '#000000';
        hudCtx.fillRect(box3X, controlsY, boxW, boxH);
        hudCtx.strokeStyle = '#FF7FEC';
        hudCtx.lineWidth = 1.5;
        hudCtx.strokeRect(box3X, controlsY, boxW, boxH);
        const iconColor = isNextHover ? '#000000' : '#FF7FEC';
        drawPixelNext(hudCtx, box3X + boxW / 2, controlsY + boxH / 2, iconColor, isMobile ? 1.0 : 1.2);
      }
      hudCtx.restore();

      // --- Box 4: [ 📜 LRC ] Synced Lyrics button ---
      const box4X = startBoxX + (boxW + boxGap) * 3;
      this.hitAreas.lyricsBox = { x: box4X, y: controlsY, w: boxW, h: boxH };
      const isLyricsHover = this.hoveredElement === 'lyricsBox';
      const hasLyrics = Boolean(currentTrack?.lyrics && currentTrack.lyrics.trim().length > 0);

      hudCtx.save();
      const lrcBgColor = isLyricsHover ? (hasLyrics ? '#00f5d4' : '#FF7FEC') : '#000000';
      const lrcBorderColor = hasLyrics ? '#00f5d4' : '#FF7FEC';
      const lrcTextColor = isLyricsHover ? '#000000' : (hasLyrics ? '#00f5d4' : '#FF7FEC');

      hudCtx.fillStyle = lrcBgColor;
      hudCtx.fillRect(box4X, controlsY, boxW, boxH);
      hudCtx.strokeStyle = lrcBorderColor;
      hudCtx.lineWidth = 1.5;
      hudCtx.strokeRect(box4X, controlsY, boxW, boxH);

      hudCtx.fillStyle = lrcTextColor;
      hudCtx.font = isMobile ? 'bold 11px monospace' : 'bold 13px monospace';
      hudCtx.textAlign = 'center';
      hudCtx.textBaseline = 'middle';
      hudCtx.fillText('LRC', box4X + boxW / 2, controlsY + boxH / 2);
      hudCtx.restore();

    } else {
      // --- EMPTY PLAYLIST STATE ---
      this.hitAreas.discs = [];
      this.hitAreas.streaming = [];
      this.hitAreas.heartBox = { x: 0, y: 0, w: 0, h: 0 };
      this.hitAreas.playBox = { x: 0, y: 0, w: 0, h: 0 };
      this.hitAreas.nextBox = { x: 0, y: 0, w: 0, h: 0 };
      this.hitAreas.lyricsBox = { x: 0, y: 0, w: 0, h: 0 };

      hudCtx.save();
      hudCtx.font = `${isMobile ? 18 : 22}px "Merchant Copy Doublesize", monospace`;
      hudCtx.fillStyle = '#FF7FEC';
      hudCtx.textAlign = 'center';
      hudCtx.textBaseline = 'middle';
      hudCtx.shadowColor = '#FF7FEC';
      hudCtx.shadowBlur = 8;
      hudCtx.fillText(`(( PLAYLIST ${this.playlist.name} IS EMPTY ))`, centerX, height * 0.42);

      hudCtx.font = `${isMobile ? 11 : 13}px "Merchant Copy", monospace`;
      hudCtx.fillStyle = '#00f5d4';
      hudCtx.shadowColor = '#00f5d4';
      hudCtx.shadowBlur = 6;
      hudCtx.fillText('UPLOAD AUDIO & SYNCED LRC LYRICS IN DASHBOARD', centerX, height * 0.48);

      const btnW = isMobile ? 220 : 260;
      const btnH = 38;
      const btnX = centerX - btnW / 2;
      const btnY = height * 0.54;
      const isDashHover = this.hoveredElement === 'goToDashboard';

      hudCtx.fillStyle = isDashHover ? '#00f5d4' : '#000000';
      hudCtx.fillRect(btnX, btnY, btnW, btnH);
      hudCtx.strokeStyle = '#00f5d4';
      hudCtx.lineWidth = 1.5;
      hudCtx.strokeRect(btnX, btnY, btnW, btnH);

      hudCtx.fillStyle = isDashHover ? '#000000' : '#00f5d4';
      hudCtx.font = 'bold 12px monospace';
      hudCtx.textAlign = 'center';
      hudCtx.textBaseline = 'middle';
      hudCtx.fillText('[ ➕ OPEN DASHBOARD ]', centerX, btnY + btnH / 2);
      hudCtx.restore();

      this.hitAreas.goToDashboard = { x: btnX, y: btnY, w: btnW, h: btnH };
    }

    // ==========================================================
    // 6. BOTTOM BAR:
    // Mobile:  [ 🎫 ]  |  [ DAILY 23 - 123 ▼ ]  |  [ 💌 ]
    // Desktop: [ 🎫 HOW TO DEFY ]  |  [ DAILY 23 - 123 ▼ ]
    // Attached flush against the bottom edge (media_1789922254438.png)
    // ==========================================================
    const bottomBoxH = isMobile ? 48 : 42;
    const bottomRowY = height - bottomBoxH;

    if (isMobile) {
      // --- MOBILE: 3 BUTTONS AT BOTTOM (1:1 Exact Match with Gambar 1 Referensi) ---
      const iconBtnW = 44;
      const dayIndex = DAILY_LETTER_MAP[this.playlist.name] || 23;
      const labelText = `DAILY ${dayIndex} - ${this.playlist.name}`;

      // Measure text and fit cleanly
      let fontSize = 12;
      hudCtx.font = `${fontSize}px "Merchant Copy", monospace`;
      hudCtx.letterSpacing = '0px';
      let textW = hudCtx.measureText(labelText).width;
      const arrowW = 8;
      const arrowGap = 7;
      let totalContentW = textW + arrowGap + arrowW;

      // Ideal box width: content + at least 16px padding on each side
      const minPadding = 16;
      let selBoxW = Math.max(164, Math.ceil(totalContentW + minPadding * 2));

      // Ensure selBoxW fits within screen alongside the 2 icon buttons
      const maxSelBoxW = Math.max(140, width - (iconBtnW * 2 + 28));
      if (selBoxW > maxSelBoxW) {
        selBoxW = maxSelBoxW;
      }

      // If content still exceeds selBoxW with safety padding, scale down font
      while (totalContentW > selBoxW - 22 && fontSize > 9) {
        fontSize -= 0.5;
        hudCtx.font = `${fontSize}px "Merchant Copy", monospace`;
        textW = hudCtx.measureText(labelText).width;
        totalContentW = textW + arrowGap + arrowW;
      }

      const btnGap = Math.max(12, Math.min(42, Math.floor((width - selBoxW - iconBtnW * 2) / 2)));
      const selX = Math.round(centerX - selBoxW / 2);
      const leftBtnX = selX - btnGap - iconBtnW;
      const rightBtnX = selX + selBoxW + btnGap;

      // 1. Left Icon Button: [ 🎫 ] (How to Defy)
      this.hitAreas.howToDefy = {
        x: leftBtnX,
        y: bottomRowY,
        w: iconBtnW,
        h: bottomBoxH,
      };

      const isDefyHover = this.hoveredElement === 'howToDefy';
      hudCtx.save();
      hudCtx.fillStyle = isDefyHover ? '#FF7FEC' : '#000000';
      hudCtx.fillRect(leftBtnX, bottomRowY, iconBtnW, bottomBoxH);
      hudCtx.strokeStyle = '#FF7FEC';
      hudCtx.lineWidth = 1.5;
      hudCtx.beginPath();
      hudCtx.moveTo(leftBtnX, height);
      hudCtx.lineTo(leftBtnX, bottomRowY);
      hudCtx.lineTo(leftBtnX + iconBtnW, bottomRowY);
      hudCtx.lineTo(leftBtnX + iconBtnW, height);
      hudCtx.stroke();

      // Ticket icon inside left box (centered horizontally, 6px below top border)
      const tW = 19;
      const tH = 27;
      const tX = Math.round(leftBtnX + (iconBtnW - tW) / 2);
      const tY = bottomRowY + 6;
      const tColor = isDefyHover ? '#000000' : '#FF7FEC';
      hudCtx.strokeStyle = tColor;
      hudCtx.lineWidth = 1.3;

      hudCtx.beginPath();
      hudCtx.moveTo(tX, tY);
      hudCtx.lineTo(tX + tW, tY);
      hudCtx.lineTo(tX + tW, tY + tH);
      // 3 teeth wavy stub
      hudCtx.lineTo(tX + tW - 3, tY + tH - 3.5);
      hudCtx.lineTo(tX + tW - 6.5, tY + tH);
      hudCtx.lineTo(tX + tW - 9.5, tY + tH - 3.5);
      hudCtx.lineTo(tX + tW - 13, tY + tH);
      hudCtx.lineTo(tX + tW - 16, tY + tH - 3.5);
      hudCtx.lineTo(tX, tY + tH);
      hudCtx.closePath();
      hudCtx.stroke();

      // Checkmark
      hudCtx.beginPath();
      hudCtx.moveTo(tX + 5, tY + 10);
      hudCtx.lineTo(tX + 8, tY + 13);
      hudCtx.lineTo(tX + 14, tY + 7);
      hudCtx.stroke();

      // Lines
      hudCtx.beginPath();
      hudCtx.moveTo(tX + 4.5, tY + 16.5);
      hudCtx.lineTo(tX + 14.5, tY + 16.5);
      hudCtx.stroke();
      hudCtx.beginPath();
      hudCtx.moveTo(tX + 4.5, tY + 20);
      hudCtx.lineTo(tX + 14.5, tY + 20);
      hudCtx.stroke();
      hudCtx.restore();

      // 2. Center Button: [ DAILY 23 - 123 ▼ ] (Play List)
      this.hitAreas.dailySelector = {
        x: selX,
        y: bottomRowY,
        w: selBoxW,
        h: bottomBoxH,
      };

      const isSelHover = this.hoveredElement === 'dailySelector';
      hudCtx.save();
      hudCtx.fillStyle = isSelHover ? '#FF7FEC' : '#000000';
      hudCtx.fillRect(selX, bottomRowY, selBoxW, bottomBoxH);
      hudCtx.strokeStyle = '#FF7FEC';
      hudCtx.lineWidth = 1.5;
      hudCtx.beginPath();
      hudCtx.moveTo(selX, height);
      hudCtx.lineTo(selX, bottomRowY);
      hudCtx.lineTo(selX + selBoxW, bottomRowY);
      hudCtx.lineTo(selX + selBoxW, height);
      hudCtx.stroke();

      const textColor = isSelHover ? '#000000' : '#FF7FEC';
      hudCtx.fillStyle = textColor;
      hudCtx.font = `${fontSize}px "Merchant Copy", monospace`;
      hudCtx.letterSpacing = '0px';
      hudCtx.textAlign = 'left';
      hudCtx.textBaseline = 'middle';

      const contentStartX = Math.round(selX + (selBoxW - totalContentW) / 2);
      hudCtx.fillText(labelText, contentStartX, bottomRowY + bottomBoxH / 2);

      const arrowCx = Math.round(contentStartX + textW + arrowGap + arrowW / 2);
      const arrowCy = Math.round(bottomRowY + bottomBoxH / 2);
      drawPixelDownArrow(hudCtx, arrowCx, arrowCy, textColor);
      hudCtx.restore();

      // 3. Right Icon Button: [ 💌 ] (My Likes)
      this.hitAreas.myLikesCard = {
        x: rightBtnX,
        y: bottomRowY,
        w: iconBtnW,
        h: bottomBoxH,
      };

      const isLikesHover = this.hoveredElement === 'myLikesCard';
      hudCtx.save();
      hudCtx.fillStyle = isLikesHover ? '#FF7FEC' : '#000000';
      hudCtx.fillRect(rightBtnX, bottomRowY, iconBtnW, bottomBoxH);
      hudCtx.strokeStyle = '#FF7FEC';
      hudCtx.lineWidth = 1.5;
      hudCtx.beginPath();
      hudCtx.moveTo(rightBtnX, height);
      hudCtx.lineTo(rightBtnX, bottomRowY);
      hudCtx.lineTo(rightBtnX + iconBtnW, bottomRowY);
      hudCtx.lineTo(rightBtnX + iconBtnW, height);
      hudCtx.stroke();

      const listSprite = this.controlImages.get(isLikesHover ? 'list-hover' : 'list');
      const lW = 19;
      const lH = 28;
      const lX = Math.round(rightBtnX + (iconBtnW - lW) / 2);
      const lY = bottomRowY + 6;
      if (listSprite && listSprite.complete && listSprite.naturalWidth > 0) {
        hudCtx.drawImage(listSprite, lX, lY, lW, lH);
      } else {
        const lColor = isLikesHover ? '#000000' : '#FF7FEC';
        hudCtx.strokeStyle = lColor;
        hudCtx.lineWidth = 1.2;
        hudCtx.strokeRect(lX, lY, lW, lH);
        drawPixelHeart(hudCtx, lX + lW / 2, lY + lH / 2, lColor, 1.2);
      }
      hudCtx.restore();

    } else {
      // --- DESKTOP BOTTOM BAR ---
      const defyText = 'HOW TO DEFY';
      hudCtx.font = '14px "Merchant Copy", monospace';
      hudCtx.letterSpacing = '1px';
      const defyBoxW = 184;
      const defyX = 18;

      this.hitAreas.howToDefy = {
        x: defyX,
        y: bottomRowY,
        w: defyBoxW,
        h: bottomBoxH,
      };

      const isDefyHover = this.hoveredElement === 'howToDefy';
      hudCtx.save();
      if (isDefyHover) {
        hudCtx.fillStyle = '#FF7FEC';
        hudCtx.fillRect(defyX, bottomRowY, defyBoxW, bottomBoxH);
        hudCtx.strokeStyle = '#FF7FEC';
      } else {
        hudCtx.fillStyle = '#000000';
        hudCtx.fillRect(defyX, bottomRowY, defyBoxW, bottomBoxH);
        hudCtx.strokeStyle = '#FF7FEC';
      }
      hudCtx.lineWidth = 1.5;
      hudCtx.beginPath();
      hudCtx.moveTo(defyX, height);
      hudCtx.lineTo(defyX, bottomRowY);
      hudCtx.lineTo(defyX + defyBoxW, bottomRowY);
      hudCtx.lineTo(defyX + defyBoxW, height);
      hudCtx.stroke();

      const ticketX = defyX + 14;
      const ticketY = bottomRowY + 7;
      const ticketW = 18;
      const ticketH = 27;
      const ticketColor = isDefyHover ? '#000000' : '#FF7FEC';
      hudCtx.strokeStyle = ticketColor;
      hudCtx.lineWidth = 1.2;

      hudCtx.beginPath();
      hudCtx.moveTo(ticketX, ticketY + ticketH);
      hudCtx.lineTo(ticketX, ticketY);
      hudCtx.lineTo(ticketX + ticketW, ticketY);
      hudCtx.lineTo(ticketX + ticketW, ticketY + ticketH);
      hudCtx.lineTo(ticketX + ticketW * 0.75, ticketY + ticketH - 3);
      hudCtx.lineTo(ticketX + ticketW * 0.5, ticketY + ticketH);
      hudCtx.lineTo(ticketX + ticketW * 0.25, ticketY + ticketH - 3);
      hudCtx.closePath();
      hudCtx.stroke();

      hudCtx.beginPath();
      hudCtx.moveTo(ticketX + 4.5, ticketY + 8.5);
      hudCtx.lineTo(ticketX + 7.5, ticketY + 11.5);
      hudCtx.lineTo(ticketX + 13.5, ticketY + 5.5);
      hudCtx.stroke();

      hudCtx.beginPath();
      hudCtx.moveTo(ticketX + 4.5, ticketY + 16);
      hudCtx.lineTo(ticketX + 13.5, ticketY + 16);
      hudCtx.stroke();

      hudCtx.fillStyle = ticketColor;
      hudCtx.textAlign = 'left';
      hudCtx.textBaseline = 'middle';
      hudCtx.fillText(defyText, ticketX + ticketW + 12, bottomRowY + bottomBoxH / 2);
      hudCtx.restore();

      // --- Bottom Selector: [ DAILY [Index] - [Name] ▼ ] ---
      const dayIndex = DAILY_LETTER_MAP[this.playlist.name] || 23;
      const labelText = `DAILY ${dayIndex} - ${this.playlist.name}`;
      hudCtx.font = '14px "Merchant Copy", monospace';
      hudCtx.letterSpacing = '1px';
      const textW = hudCtx.measureText(labelText).width;
      const arrowW = 8;
      const arrowGap = 8;
      const totalContentW = textW + arrowGap + arrowW;
      const selBoxW = Math.max(194, Math.ceil(totalContentW + 36));
      const selX = centerX - selBoxW / 2;

      this.hitAreas.dailySelector = {
        x: selX,
        y: bottomRowY,
        w: selBoxW,
        h: bottomBoxH,
      };

      const isSelHover = this.hoveredElement === 'dailySelector';
      hudCtx.save();
      hudCtx.fillStyle = isSelHover ? '#FF7FEC' : '#000000';
      hudCtx.fillRect(selX, bottomRowY, selBoxW, bottomBoxH);
      hudCtx.strokeStyle = '#FF7FEC';
      hudCtx.lineWidth = 1.5;
      hudCtx.beginPath();
      hudCtx.moveTo(selX, height);
      hudCtx.lineTo(selX, bottomRowY);
      hudCtx.lineTo(selX + selBoxW, bottomRowY);
      hudCtx.lineTo(selX + selBoxW, height);
      hudCtx.stroke();

      const textColor = isSelHover ? '#000000' : '#FF7FEC';
      hudCtx.fillStyle = textColor;
      hudCtx.textAlign = 'left';
      hudCtx.textBaseline = 'middle';
      const contentStartX = Math.round(selX + (selBoxW - totalContentW) / 2);
      hudCtx.fillText(labelText, contentStartX, bottomRowY + bottomBoxH / 2);

      const arrowCx = Math.round(contentStartX + textW + arrowGap + arrowW / 2);
      const arrowCy = Math.round(bottomRowY + bottomBoxH / 2);
      drawPixelDownArrow(hudCtx, arrowCx, arrowCy, textColor);
      hudCtx.restore();

      this.hitAreas.myLikesCard = { x: 0, y: 0, w: 0, h: 0 };
    }
  }

  public checkHit(mouseX: number, mouseY: number): string | null {
    const check = (box: { x: number; y: number; w: number; h: number }) =>
      mouseX >= box.x && mouseX <= box.x + box.w && mouseY >= box.y && mouseY <= box.y + box.h;

    if (check(this.hitAreas.logo)) return 'logo';
    if (check(this.hitAreas.whatIsAusify)) return 'whatIsAusify';
    if (check(this.hitAreas.heartBox)) return 'heartBox';
    if (check(this.hitAreas.playBox)) return 'playBox';
    if (check(this.hitAreas.nextBox)) return 'nextBox';
    if (this.hitAreas.lyricsBox && check(this.hitAreas.lyricsBox)) return 'lyricsBox';
    if (this.hitAreas.goToDashboard && check(this.hitAreas.goToDashboard)) return 'goToDashboard';
    if (check(this.hitAreas.howToDefy)) return 'howToDefy';
    if (check(this.hitAreas.dailySelector)) return 'dailySelector';
    if (check(this.hitAreas.myLikesCard)) return 'myLikesCard';

    // Discs
    for (const d of this.hitAreas.discs) {
      const dx = mouseX - d.x;
      const dy = mouseY - d.y;
      if (dx * dx + dy * dy <= d.radius * d.radius) {
        return `disc_${d.index}`;
      }
    }

    // Streaming
    for (const s of this.hitAreas.streaming) {
      if (check(s)) return `stream_${s.service}`;
    }

    return null;
  }
}

function drawPixelHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, scale = 2.1) {
  ctx.save();
  ctx.fillStyle = color;
  const p = scale;
  const startX = cx - (16 * p) / 2;
  const startY = cy - (14 * p) / 2;
  const rows = [
    '  ████    ████  ',
    ' ██████  ██████ ',
    '████████████████',
    '████████████████',
    '████████████████',
    ' ██████████████ ',
    ' ██████████████ ',
    '  ████████████  ',
    '   ██████████   ',
    '    ████████    ',
    '     ██████     ',
    '      ████      ',
    '       ██       ',
  ];
  rows.forEach((r, rowIdx) => {
    for (let colIdx = 0; colIdx < r.length; colIdx++) {
      if (r[colIdx] === '█') {
        ctx.fillRect(startX + colIdx * p, startY + rowIdx * p, p, p);
      }
    }
  });
  ctx.restore();
}

function drawPixelDownArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  const x = Math.round(cx);
  const y = Math.round(cy);
  // 8px wide at top, 7px high pixel triangle matching reference
  ctx.fillRect(x - 4, y - 3, 8, 1);
  ctx.fillRect(x - 3, y - 2, 6, 2);
  ctx.fillRect(x - 2, y,     4, 2);
  ctx.fillRect(x - 1, y + 2, 2, 2);
  ctx.restore();
}

function drawPixelPause(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, scale = 1.0) {
  ctx.save();
  ctx.fillStyle = color;
  const barW = Math.round(6 * scale);
  const barH = Math.round(22 * scale);
  const gap = Math.round(8 * scale);
  ctx.fillRect(cx - gap / 2 - barW, cy - barH / 2, barW, barH);
  ctx.fillRect(cx + gap / 2, cy - barH / 2, barW, barH);
  ctx.restore();
}

function drawPixelPlay(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, scale = 1.0) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const size = Math.round(13 * scale);
  ctx.moveTo(cx - size * 0.7, cy - size);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx - size * 0.7, cy + size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPixelNext(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, scale = 1.0) {
  ctx.save();
  ctx.fillStyle = color;
  const size = Math.round(12 * scale);
  const gap = Math.round(13 * scale);
  // Triangle 1
  ctx.beginPath();
  ctx.moveTo(cx - gap, cy - size);
  ctx.lineTo(cx - gap + size * 1.1, cy);
  ctx.lineTo(cx - gap, cy + size);
  ctx.closePath();
  ctx.fill();
  // Triangle 2
  ctx.beginPath();
  ctx.moveTo(cx + 1, cy - size);
  ctx.lineTo(cx + 1 + size * 1.1, cy);
  ctx.lineTo(cx + 1, cy + size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
