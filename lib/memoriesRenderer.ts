import { MEMORY_MONTHS, type Memory } from './memories';

type Rect = { x: number; y: number; w: number; h: number };
type Hit = Rect & { id: string; origin?: Rect };
const ease = (n: number) => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, n)))) / 2;

// Canvas 2D -> Three.CanvasTexture -> shared CRT shader, like DailyRenderer.
export class MemoriesRenderer {
  canvas = document.createElement('canvas');
  ctx = this.canvas.getContext('2d')!;
  items: Memory[] = [];
  month = 0;
  scroll = 0;
  maxScroll = 0;
  hovered: string | null = null;
  status = 'LOADING MEMORIES…';
  selected: Memory | null = null;
  reducedMotion = false;
  private images = new Map<string, HTMLImageElement>();
  private hits: Hit[] = [];
  private origin: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private openedAt = 0;
  private width = 0;
  private height = 0;

  constructor(private detailCtx?: CanvasRenderingContext2D) {}

  resize(w: number, h: number, dpr: number) {
    this.width = w; this.height = h;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.detailCtx) {
      this.detailCtx.canvas.width = this.canvas.width;
      this.detailCtx.canvas.height = this.canvas.height;
      this.detailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  setMonth(index: number) {
    this.month = Math.max(0, Math.min(MEMORY_MONTHS.length - 1, index));
    this.selected = null; this.scroll = 0;
  }
  hit(x: number, y: number) {
    return this.hits.findLast(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)?.id ?? null;
  }
  activate(id: string) {
    if (id === 'prev') this.setMonth(this.month - 1);
    else if (id === 'next') this.setMonth(this.month + 1);
    else if (id === 'close') this.selected = null;
    else if (id.startsWith('photo:')) {
      const item = this.items.find(item => item.id === id.slice(6));
      const rect = this.hits.find(hit => hit.id === id);
      if (!item || !rect) return;
      this.selected = item; this.origin = rect.origin || rect; this.openedAt = performance.now();
    }
  }
  moveScroll(delta: number) { if (!this.selected) this.scroll = Math.max(0, Math.min(this.maxScroll, this.scroll + delta)); }
  private text(value: string, x: number, y: number, size: number, serif = false, align: CanvasTextAlign = 'left', maxWidth?: number) {
    const ctx = this.selected && this.detailCtx ? this.detailCtx : this.ctx;
    ctx.fillStyle = '#FF7FEC'; ctx.textBaseline = 'middle'; ctx.textAlign = align;
    ctx.font = `${size}px "${serif ? 'Instrument Serif' : 'Merchant Copy'}", ${serif ? 'serif' : 'monospace'}`;
    if (maxWidth) ctx.fillText(value, x, y, maxWidth); else ctx.fillText(value, x, y);
  }
  private button(id: string, label: string, rect: Rect) {
    this.hits.push({ ...rect, id });
    const ctx = this.selected && this.detailCtx ? this.detailCtx : this.ctx;
    if (this.hovered === id) { ctx.fillStyle = '#FF7FEC18'; ctx.fillRect(rect.x, rect.y, rect.w, rect.h); }
    this.text(label, rect.x + rect.w / 2, rect.y + rect.h / 2, 15, false, 'center', rect.w);
  }
  private image(item: Memory, rect: Rect, reveal = 1, exit = 0) {
    if (rect.y > this.height || rect.y + rect.h < 0 || reveal <= 0) return;
    let image = this.images.get(item.image_url);
    if (!image) {
      image = new Image(); image.crossOrigin = 'anonymous'; image.src = item.image_url;
      this.images.set(item.image_url, image);
    }
    const ctx = this.ctx;
    ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y + rect.h * exit, rect.w, rect.h * Math.max(0, reveal - exit)); ctx.clip();
    ctx.fillStyle = '#261022'; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    if (image.complete && image.naturalWidth) {
      const scale = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight);
      const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
      ctx.drawImage(image, rect.x + (rect.w - w) / 2, rect.y + (rect.h - h) / 2, w, h);
    } else this.text(image.complete ? 'IMAGE UNAVAILABLE' : 'LOADING…', rect.x + rect.w / 2, rect.y + rect.h / 2, 12, false, 'center', rect.w - 8);
    ctx.restore();
  }
  render(now: number) {
    const w = this.width, h = this.height, ctx = this.ctx;
    if (!w || !h) return;
    this.detailCtx?.clearRect(0, 0, w, h);
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); this.hits = [];
    const mobile = w < 640, pad = mobile ? 20 : 32;
    if (this.selected) {
      const item = this.selected;
      const imageH = Math.max(80, mobile ? Math.min(h * 0.5, (w - pad * 2) * 1.25) : Math.min(h - 80, w * 0.57 * 1.25));
      const imageW = imageH * 0.8, right = !mobile && this.origin.x > w / 2;
      const end = { x: mobile ? (w - imageW) / 2 : right ? w - pad - imageW : pad, y: mobile ? 20 : (h - imageH) / 2, w: imageW, h: imageH };
      const elapsed = this.reducedMotion ? 2000 : now - this.openedAt;
      this.image(item, end, ease((elapsed - 300) / 700));
      for (let index = 0; index < 6; index++) {
        const time = elapsed - index * 50;
        if (time < 0 || time > 840) continue;
        const t = (index + 1) / 7, lerp = (a: number, b: number) => a + (b - a) * t;
        this.image(item, { x: lerp(this.origin.x, end.x), y: lerp(this.origin.y, end.y), w: lerp(this.origin.w, end.w), h: lerp(this.origin.h, end.h) }, ease(time / 350), ease((time - 490) / 350));
      }
      const panelX = mobile ? pad : right ? pad : end.x + end.w;
      const panelW = mobile ? w - pad * 2 : w - imageW - pad * 2;
      const inset = mobile ? 0 : Math.min(80, panelW * 0.18);
      const textX = panelX + panelW / 2;
      const textW = panelW - inset * 2;
      const textY = mobile ? end.y + end.h + 40 : h * 0.5 - 32;
      this.text(MEMORY_MONTHS[this.month].label.toUpperCase(), textX, textY, 14, false, 'center', textW);
      this.text(item.title, textX, textY + 32, mobile ? 28 : 42, true, 'center', textW);
      let line = '', lineY = textY + 65;
      const textCtx = this.detailCtx || ctx;
      textCtx.font = '18px "Instrument Serif", serif';
      for (const word of item.caption.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (textCtx.measureText(next).width > textW && line) {
          if (lineY + 22 > h - 85) { line += '…'; break; }
          this.text(line, textX, lineY, 18, true, 'center', textW); lineY += 22; line = word;
        } else line = next;
      }
      if (lineY < h - 70) this.text(line, textX, lineY, 18, true, 'center', textW);
      const buttonW = Math.min(220, textW);
      this.button('close', '◄ BACK TO MEMORIES', { x: textX - buttonW / 2, y: h - 60, w: buttonW, h: 44 });
      return;
    }
    this.button('home', '◄ HOME', { x: pad - 8, y: 12, w: 90, h: 44 });
    const titleY = mobile ? Math.min(100, h * 0.17) : Math.min(135, h * 0.2);
    this.text('∘ ₊ ✦  Explore Memories  ✦ ₊ ∘', w / 2, titleY, mobile ? w * 0.076 : Math.min(70, w * 0.05), true, 'center');
    this.text('All the little moments I want to keep forever', w / 2, titleY + 42, mobile ? 19 : 27, true, 'center', w - pad * 2);
    const monthY = titleY + 70;
    this.text(MEMORY_MONTHS[this.month].label, w / 2, monthY + 22, mobile ? 25 : 32, true, 'center');
    if (this.month > 0) this.button('prev', '◄', { x: Math.max(pad, w / 2 - 210), y: monthY, w: 44, h: 44 });
    if (this.month < 13) this.button('next', '►', { x: Math.min(w - pad - 44, w / 2 + 166), y: monthY, w: 44, h: 44 });
    const top = monthY + 64, bottom = h - 32;
    const photos = this.items.filter(item => item.month === MEMORY_MONTHS[this.month].key);
    const columns = mobile ? 2 : w < 1040 ? 4 : 8, gap = 10;
    const cellW = (w - pad * 2 - gap * (columns - 1)) / columns, cellH = cellW * 1.25;
    this.maxScroll = Math.max(0, Math.ceil(photos.length / columns) * (cellH + 55) - (bottom - top));
    this.scroll = Math.min(this.maxScroll, this.scroll);
    ctx.save(); ctx.beginPath(); ctx.rect(0, top, w, Math.max(0, bottom - top)); ctx.clip();
    photos.forEach((item, index) => {
      const rect = { x: pad + index % columns * (cellW + gap), y: top + Math.floor(index / columns) * (cellH + 55) - this.scroll, w: cellW, h: cellH };
      this.image(item, rect);
      this.text(item.title, rect.x + cellW, rect.y + cellH + 16, 13, false, 'right', cellW);
      const y = Math.max(top, rect.y), end = Math.min(bottom, rect.y + cellH);
      if (end > y) this.hits.push({ id: `photo:${item.id}`, ...rect, y, h: end - y, origin: rect });
    });
    if (!photos.length) this.text(this.status || 'No memories yet for this month', w / 2, top + Math.max(24, (bottom - top) / 2), 22, true, 'center', w - pad * 2);
    ctx.restore();
    this.text(`${String(this.month + 1).padStart(2, '0')} / 14  ·  ${photos.length} MEMORIES`, w / 2, h - 16, 12, false, 'center');
  }
  dispose() { this.images.clear(); }
}