interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

interface Effect {
  x: number;
  y: number;
  type: 'burn' | 'explosion';
  particles: Particle[];
  duration: number;
  maxDuration: number;
}

export class CocosWebAdapter {
  private static instance: CocosWebAdapter;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameStarted: boolean = false;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private tiles: Map<string, any> = new Map();
  private images: Map<string, HTMLImageElement> = new Map();
  private lastClickTime: number = 0;
  private lastClickCoords: { x: number; y: number } | null = null;
  private effects: Effect[] = [];

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    this.ctx = ctx;

    this.setupEventListeners();
  }

  static getInstance(): CocosWebAdapter {
    if (!CocosWebAdapter.instance) {
      CocosWebAdapter.instance = new CocosWebAdapter();
    }
    return CocosWebAdapter.instance;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      this.handleClick(x, y, 'mouse');
    });

    this.canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      this.handleClick(x, y, 'touch');
    });
  }

  private handleClick(x: number, y: number, type: 'mouse' | 'touch'): void {
    const currentTime = Date.now();
    const currentCoords = { x, y };
    
    if (this.lastClickTime && 
        currentTime - this.lastClickTime < 300 &&
        this.lastClickCoords &&
        Math.abs(currentCoords.x - this.lastClickCoords.x) < 10 &&
        Math.abs(currentCoords.y - this.lastClickCoords.y) < 10) {
      console.log(`Ignoring duplicate ${type} click at (${x}, ${y})`);
      return;
    }
    
    this.lastClickTime = currentTime;
    this.lastClickCoords = currentCoords;
    
    const tileSize = 50;
    const startX = (this.canvas.width - 6 * tileSize) / 2;
    const startY = (this.canvas.height - 8 * tileSize) / 2;
    
    const boardX = Math.floor((x - startX) / tileSize);
    const boardY = Math.floor((y - startY) / tileSize);
    
    console.log(`${type} click at canvas (${x}, ${y}) -> board (${boardX}, ${boardY})`);
    
    if (boardX >= 0 && boardX < 6 && boardY >= 0 && boardY < 8) {
      const tileKey = `${boardX},${boardY}`;
      const tile = this.tiles.get(tileKey);
      
      if (tile) {
        console.log(`Tile clicked: ${tile.type} at (${boardX}, ${boardY})`);
        const event = new CustomEvent('tileClick', {
          detail: {
            x: boardX,
            y: boardY,
            type: tile.type,
            tile: tile
          }
        });
        
        document.dispatchEvent(event);
      } else {
        console.log(`No tile at (${boardX}, ${boardY})`);
      }
    } else {
      console.log(`Click outside board area: (${boardX}, ${boardY})`);
    }
  }

  public async loadImage(src: string): Promise<HTMLImageElement> {
    if (this.images.has(src)) {
      return this.images.get(src)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  public createTile(x: number, y: number, type: string, imageSrc: string): any {
    const tileKey = `${x},${y}`;
    const tile = {
      x,
      y,
      type,
      imageSrc,
      element: null
    };
    
    this.tiles.set(tileKey, tile);
    return tile;
  }

  public removeTile(x: number, y: number): void {
    const tileKey = `${x},${y}`;
    this.tiles.delete(tileKey);
  }

  public updateTilePosition(x: number, y: number, newX: number, newY: number): void {
    const tileKey = `${x},${y}`;
    const tile = this.tiles.get(tileKey);
    
    if (tile) {
      this.tiles.delete(tileKey);
      tile.x = newX;
      tile.y = newY;
      this.tiles.set(`${newX},${newY}`, tile);
    }
  }

  public start(): void {
    if (this.gameStarted) return;
    
    this.gameStarted = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  public stop(): void {
    this.gameStarted = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private gameLoop(): void {
    if (!this.gameStarted) return;

    const currentTime = performance.now();
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.render();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const tileSize = 50;
    const startX = (this.canvas.width - 6 * tileSize) / 2;
    const startY = (this.canvas.height - 8 * tileSize) / 2;
    
    this.tiles.forEach((tile) => {
      const x = startX + tile.x * tileSize;
      const y = startY + tile.y * tileSize;
      
      this.ctx.fillStyle = '#2a2a4e';
      this.ctx.fillRect(x, y, tileSize, tileSize);
      
      const image = this.images.get(tile.imageSrc);
      if (image) {
        this.ctx.drawImage(image, x + 5, y + 5, tileSize - 10, tileSize - 10);
      } else {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(tile.type, x + tileSize / 2, y + tileSize / 2);
      }
    });
    
    this.updateEffects();
    this.renderEffects();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public getDeltaTime(): number {
    return this.deltaTime;
  }

  public getAllTiles(): Map<string, any> {
    return this.tiles;
  }

  public createBurnEffect(x: number, y: number): void {
    const tileSize = 50;
    const startX = (this.canvas.width - 6 * tileSize) / 2;
    const startY = (this.canvas.height - 8 * tileSize) / 2;
    
    const effectX = startX + x * tileSize + tileSize / 2;
    const effectY = startY + y * tileSize + tileSize / 2;
    
    const particles: Particle[] = [];
    
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x: effectX,
        y: effectY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2,
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#ff4444' : '#ffaa00',
        alpha: 1
      });
    }
    
    this.effects.push({
      x: effectX,
      y: effectY,
      type: 'burn',
      particles,
      duration: 1,
      maxDuration: 1
    });
  }

  public createExplosionEffect(x: number, y: number): void {
    const tileSize = 50;
    const startX = (this.canvas.width - 6 * tileSize) / 2;
    const startY = (this.canvas.height - 8 * tileSize) / 2;
    
    const effectX = startX + x * tileSize + tileSize / 2;
    const effectY = startY + y * tileSize + tileSize / 2;
    
    const particles: Particle[] = [];
    
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      particles.push({
        x: effectX,
        y: effectY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random() * 6,
        color: Math.random() > 0.7 ? '#ffff00' : '#ff6600',
        alpha: 1
      });
    }
    
    this.effects.push({
      x: effectX,
      y: effectY,
      type: 'explosion',
      particles,
      duration: 1,
      maxDuration: 1
    });
  }

  private updateEffects(): void {
    this.effects = this.effects.filter(effect => {
      effect.duration -= this.deltaTime / 1000;
      
      effect.particles = effect.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= this.deltaTime / 1000;
        particle.alpha = particle.life / particle.maxLife;
        
        if (effect.type === 'explosion') {
          particle.vy += 0.1;
        }
        
        return particle.life > 0;
      });
      
      return effect.duration > 0 && effect.particles.length > 0;
    });
  }

  private renderEffects(): void {
    this.effects.forEach(effect => {
      effect.particles.forEach(particle => {
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.restore();
      });
    });
  }
}