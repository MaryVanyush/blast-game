import { CocosWebAdapter } from '../adapters/CocosWebAdapter';
import { TileType, Position, GameConfig, GameState, BoosterState } from '../types/GameTypes';

export class GameManager {
  private adapter: CocosWebAdapter;
  private config: GameConfig;
  private gameState: GameState;
  private boosterState: BoosterState;
  private tileImages: { [key in TileType]: string };

  private lastClickTime: number = 0;
  private lastClickCoords: { x: number; y: number } | null = null;

  constructor() {
    this.config = {
      boardWidth: 6,
      boardHeight: 8,
      targetScore: 500,
      maxMoves: 20,
      shuffleCount: 3,
      bombCount: 3
    };

    this.gameState = {
      score: 0,
      movesLeft: this.config.maxMoves,
      isGameOver: false,
      isProcessing: false,
      bombMode: false
    };

    this.boosterState = {
      shuffleCount: this.config.shuffleCount,
      bombCount: this.config.bombCount
    };

    this.tileImages = {
      [TileType.STAR_BLUE]: 'src/img/block_blue.png',
      [TileType.STAR_GREEN]: 'src/img/block_green.png',
      [TileType.STAR_RED]: 'src/img/block_red.png',
      [TileType.STAR_PURPLE]: 'src/img/block_purpure.png',
      [TileType.STAR_ORANGE]: 'src/img/block_yellow.png',
      [TileType.BOMB]: 'src/img/icon_booster_bomb.png'
    };

    this.adapter = CocosWebAdapter.getInstance();
  }

  public async initialize(): Promise<void> {
    try {
      console.log('Initializing Blast Game with Cocos Creator 2.4.x...');
      
      await this.loadImages();
      
      await this.generateBoard();
      
      this.setupEventListeners();
      
      this.hideLoadingScreen();
      
      this.adapter.start();
      
      this.updateUI();
      
      console.log('Blast Game initialized successfully!');
      
    } catch (error) {
      console.error('Failed to initialize Blast Game:', error);
      this.showError('Ошибка инициализации игры');
    }
  }

  private async loadImages(): Promise<void> {
    const imagePromises = Object.values(this.tileImages).map(src => 
      this.adapter.loadImage(src)
    );
    
    await Promise.all(imagePromises);
    console.log('All images loaded successfully');
  }

  private async generateBoard(): Promise<void> {
    console.log('Generating board...');
    
    this.adapter.getAllTiles().clear();
    
    for (let y = 0; y < this.config.boardHeight; y++) {
      for (let x = 0; x < this.config.boardWidth; x++) {
        const tileType = this.getRandomTileType(x, y);
        const imageSrc = this.tileImages[tileType];
        this.adapter.createTile(x, y, tileType, imageSrc);
      }
    }
    
    console.log('Board generated successfully');
  }

  private getRandomTileType(x: number, y: number): TileType {
    const bombCount = this.getBombCount();
    
    if (bombCount > 0) {
      const starTypes = [
        TileType.STAR_BLUE,
        TileType.STAR_GREEN,
        TileType.STAR_RED,
        TileType.STAR_PURPLE,
        TileType.STAR_ORANGE
      ];
      return starTypes[Math.floor(Math.random() * starTypes.length)];
    }
    
    if (Math.random() < 0.05) {
      return TileType.BOMB;
    }
    
    const starTypes = [
      TileType.STAR_BLUE,
      TileType.STAR_GREEN,
      TileType.STAR_RED,
      TileType.STAR_PURPLE,
      TileType.STAR_ORANGE
    ];
    return starTypes[Math.floor(Math.random() * starTypes.length)];
  }

  private getBombCount(): number {
    let count = 0;
    this.adapter.getAllTiles().forEach(tile => {
      if (tile.type === TileType.BOMB) {
        count++;
      }
    });
    return count;
  }

  private setupEventListeners(): void {
    document.addEventListener('tileClick', (event: any) => {
      this.handleTileClick(event.detail);
    });

    document.addEventListener('shuffleBoosterUsed', () => {
      this.useShuffleBooster();
    });

    document.addEventListener('bombBoosterUsed', () => {
      this.useBombBooster();
    });

    document.addEventListener('gameRestart', () => {
      this.restartGame();
    });
  }

  private handleTileClick(detail: any): void {
    if (this.gameState.isProcessing || this.gameState.isGameOver) return;

    const { x, y, type } = detail;
    const currentTime = Date.now();
    const currentCoords = { x, y };
    
    if (this.lastClickTime && 
        currentTime - this.lastClickTime < 200 &&
        this.lastClickCoords &&
        this.lastClickCoords.x === currentCoords.x &&
        this.lastClickCoords.y === currentCoords.y) {
      console.log(`Ignoring duplicate game click at (${x}, ${y})`);
      return;
    }
    
    this.lastClickTime = currentTime;
    this.lastClickCoords = currentCoords;
    
    console.log(`Tile clicked at (${x}, ${y}) with type: ${type}`);

    if (this.gameState.bombMode) {
      this.handleBombBoosterClick(x, y);
      this.gameState.bombMode = false;
      return;
    }

    if (type === TileType.BOMB) {
      this.handleBombTileClick(x, y);
      return;
    }

    const group = this.findHorizontalGroup(x, y, type);
    
    if (group.length >= 2) {
      this.processTileGroup(group);
    } else {
      console.log('No valid group to burn (need at least 2 tiles)');
    }
  }

  private findHorizontalGroup(x: number, y: number, tileType: TileType): any[] {
    const group: any[] = [];
    
    for (let i = 0; i < this.config.boardWidth; i++) {
      const tile = this.adapter.getAllTiles().get(`${i},${y}`);
      if (tile && tile.type === tileType) {
        group.push(tile);
      }
    }
    
    if (group.length < 2) {
      return [];
    }
    
    const continuousGroup: any[] = [];
    const clickedTile = this.adapter.getAllTiles().get(`${x},${y}`);
    if (!clickedTile) return [];
    
    continuousGroup.push(clickedTile);
    
    for (let i = x - 1; i >= 0; i--) {
      const tile = this.adapter.getAllTiles().get(`${i},${y}`);
      if (tile && tile.type === tileType) {
        continuousGroup.unshift(tile);
      } else {
        break;
      }
    }
    
    for (let i = x + 1; i < this.config.boardWidth; i++) {
      const tile = this.adapter.getAllTiles().get(`${i},${y}`);
      if (tile && tile.type === tileType) {
        continuousGroup.push(tile);
      } else {
        break;
      }
    }
    
    console.log(`Found continuous group of ${continuousGroup.length} tiles`);
    return continuousGroup;
  }

  private handleBombTileClick(x: number, y: number): void {
    console.log(`Bomb tile clicked at (${x}, ${y})`);
    
    const tilesToBurn: any[] = [];
    for (let i = 0; i < this.config.boardWidth; i++) {
      const tile = this.adapter.getAllTiles().get(`${i},${y}`);
      if (tile) {
        tilesToBurn.push(tile);
      }
    }
    
    this.burnTiles(tilesToBurn, true);
    this.addScore(50);
    this.updateUI();
  }

  private handleBombBoosterClick(x: number, y: number): void {
    console.log(`Bomb booster used at (${x}, ${y})`);
    
    const tilesToBurn: any[] = [];
    
    const centerTile = this.adapter.getAllTiles().get(`${x},${y}`);
    if (centerTile) {
      tilesToBurn.push(centerTile);
    }
    
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 }, 
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];
    
    directions.forEach(dir => {
      const newX = x + dir.dx;
      const newY = y + dir.dy;
      
      if (newX >= 0 && newX < this.config.boardWidth &&
          newY >= 0 && newY < this.config.boardHeight) {
        const tile = this.adapter.getAllTiles().get(`${newX},${newY}`);
        if (tile) {
          tilesToBurn.push(tile);
        }
      }
    });
    
    if (tilesToBurn.length > 0) {
      this.burnTiles(tilesToBurn, true);
      this.addScore(30);
      this.updateUI();
    }
  }

  private async processTileGroup(group: any[]): Promise<void> {
    if (this.gameState.isProcessing) return;
    
    this.gameState.isProcessing = true;
    
    try {
      this.burnTiles(group);
      
      const score = this.calculateScore(group.length);
      this.addScore(score);
      
      this.gameState.movesLeft--;
      
      this.updateUI();
      
      this.checkGameConditions();
      
    } catch (error) {
      console.error('Error processing tile group:', error);
    } finally {
      this.gameState.isProcessing = false;
    }
  }

  private burnTiles(tiles: any[], isExplosion: boolean = false): void {
    console.log(`Burning ${tiles.length} tiles`);
    
    tiles.forEach(tile => {
      if (isExplosion) {
        this.adapter.createExplosionEffect(tile.x, tile.y);
      } else {
        this.adapter.createBurnEffect(tile.x, tile.y);
      }
    });
    
    setTimeout(() => {
      tiles.forEach(tile => {
        this.adapter.removeTile(tile.x, tile.y);
      });
      
      this.applyGravity();
      
      this.fillEmptySpaces();
    }, 500);
  }

  private applyGravity(): void {
    console.log('Applying gravity...');
    
    for (let x = 0; x < this.config.boardWidth; x++) {
      const columnTiles: any[] = [];
      for (let y = this.config.boardHeight - 1; y >= 0; y--) {
        const tile = this.adapter.getAllTiles().get(`${x},${y}`);
        if (tile) {
          columnTiles.push(tile);
        }
      }
      
      for (let y = 0; y < this.config.boardHeight; y++) {
        this.adapter.removeTile(x, y);
      }
      
      columnTiles.forEach((tile, index) => {
        const newY = this.config.boardHeight - 1 - index;
        this.adapter.createTile(x, newY, tile.type, tile.imageSrc);
      });
    }
    
    console.log('Gravity applied');
  }

  private fillEmptySpaces(): void {
    console.log('Filling empty spaces...');
    
    setTimeout(() => {
      for (let x = 0; x < this.config.boardWidth; x++) {
        let topEmptyY = -1;
        for (let y = 0; y < this.config.boardHeight; y++) {
          const tile = this.adapter.getAllTiles().get(`${x},${y}`);
          if (!tile) {
            topEmptyY = y;
            break;
          }
        }
        
        if (topEmptyY !== -1) {
          for (let y = topEmptyY; y < this.config.boardHeight; y++) {
            const tile = this.adapter.getAllTiles().get(`${x},${y}`);
            if (!tile) {
              const tileType = this.getRandomTileType(x, y);
              const imageSrc = this.tileImages[tileType];
              this.adapter.createTile(x, y, tileType, imageSrc);
            }
          }
        }
      }
      
      console.log('Empty spaces filled');
    }, 300);
  }

  private calculateScore(tileCount: number): number {
    let score = tileCount * 10;
    
    if (tileCount >= 5) score += 50;
    if (tileCount >= 7) score += 100;
    
    return score;
  }

  private addScore(points: number): void {
    this.gameState.score += points;
  }

  private checkGameConditions(): void {
    if (this.gameState.score >= this.config.targetScore) {
      this.gameState.isGameOver = true;
      this.showGameOverModal(true);
      return;
    }
    
    if (this.gameState.movesLeft <= 0) {
      this.gameState.isGameOver = true;
      this.showGameOverModal(false);
      return;
    }
  }

  private updateUI(): void {
    const scoreElement = document.getElementById('scoreCount');
    if (scoreElement) {
      scoreElement.textContent = `${this.gameState.score}/${this.config.targetScore}`;
    }

    const movesElement = document.getElementById('movesCount');
    if (movesElement) {
      movesElement.textContent = this.gameState.movesLeft.toString();
    }

    const shuffleCountElement = document.getElementById('shuffleCount');
    if (shuffleCountElement) {
      shuffleCountElement.textContent = this.boosterState.shuffleCount.toString();
    }

    const bombCountElement = document.getElementById('bombCount');
    if (bombCountElement) {
      bombCountElement.textContent = this.boosterState.bombCount.toString();
    }

    const shuffleBooster = document.getElementById('shuffleBooster');
    const bombBooster = document.getElementById('bombBooster');
    
    if (shuffleBooster) {
      if (this.boosterState.shuffleCount <= 0) {
        shuffleBooster.classList.add('disabled');
      } else {
        shuffleBooster.classList.remove('disabled');
      }
    }
    
    if (bombBooster) {
      if (this.boosterState.bombCount <= 0) {
        bombBooster.classList.add('disabled');
      } else {
        bombBooster.classList.remove('disabled');
      }
    }
  }

  private showGameOverModal(won: boolean): void {
    const modal = document.getElementById('gameOverModal');
    const title = document.getElementById('modalTitle');
    const message = document.getElementById('modalMessage');

    if (modal && title && message) {
      if (won) {
        title.textContent = 'Поздравляем!';
        message.textContent = `Вы выиграли! Набрано очков: ${this.gameState.score}`;
      } else {
        title.textContent = 'Игра окончена!';
        message.textContent = `Вы набрали ${this.gameState.score} очков`;
      }
      
      modal.style.display = 'flex';
    }
  }

  private hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loadingScreen');
    const gameInterface = document.getElementById('gameInterface');
    
    if (loadingScreen && gameInterface) {
      loadingScreen.style.display = 'none';
      gameInterface.style.display = 'block';
    }
  }

  private showError(message: string): void {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="error-message">
          <div class="error-text">${message}</div>
          <button class="retry-button" onclick="location.reload()">Попробовать снова</button>
        </div>
      `;
    }
  }

  public restartGame(): void {
    this.gameState = {
      score: 0,
      movesLeft: this.config.maxMoves,
      isGameOver: false,
      isProcessing: false,
      bombMode: false
    };

    this.boosterState = {
      shuffleCount: this.config.shuffleCount,
      bombCount: this.config.bombCount
    };

    const modal = document.getElementById('gameOverModal');
    if (modal) {
      modal.style.display = 'none';
    }

    this.generateBoard();
    this.updateUI();
  }

  public destroy(): void {
    this.adapter.stop();
  }

  public useShuffleBooster(): void {
    if (this.boosterState.shuffleCount <= 0) {
      console.log('No shuffle boosters left');
      return;
    }

    console.log('Using shuffle booster');
    this.boosterState.shuffleCount--;
    this.shuffleBoard();
    this.updateUI();
  }

  public useBombBooster(): void {
    if (this.boosterState.bombCount <= 0) {
      console.log('No bomb boosters left');
      return;
    }

    console.log('Using bomb booster');
    this.boosterState.bombCount--;
    this.updateUI();
    
    this.gameState.bombMode = true;
  }

  private shuffleBoard(): void {
    console.log('Shuffling board...');
    
    const allTiles: any[] = [];
    for (let x = 0; x < this.config.boardWidth; x++) {
      for (let y = 0; y < this.config.boardHeight; y++) {
        const tile = this.adapter.getAllTiles().get(`${x},${y}`);
        if (tile) {
          allTiles.push(tile);
        }
      }
    }
    
    for (let x = 0; x < this.config.boardWidth; x++) {
      for (let y = 0; y < this.config.boardHeight; y++) {
        this.adapter.removeTile(x, y);
      }
    }
    
    for (let i = allTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
    }
    
    allTiles.forEach((tile, index) => {
      const x = index % this.config.boardWidth;
      const y = Math.floor(index / this.config.boardWidth);
      this.adapter.createTile(x, y, tile.type, tile.imageSrc);
    });
    
    console.log('Board shuffled');
  }
}