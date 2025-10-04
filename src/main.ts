import { GameManager } from './managers/GameManager';

class BlastGame {
  private gameManager: GameManager;

  constructor() {
    this.gameManager = new GameManager();
  }

  public async initialize(): Promise<void> {
    await this.gameManager.initialize();
  }

  public destroy(): void {
    this.gameManager.destroy();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const game = new BlastGame();
  
  try {
    await game.initialize();
    
    (window as any).blastGame = game;
    
    setupBoosterHandlers(game);
    
    setupRestartHandler(game);
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});

function setupBoosterHandlers(game: BlastGame): void {
  const shuffleBooster = document.getElementById('shuffleBooster');
  if (shuffleBooster) {
    shuffleBooster.addEventListener('click', () => {
      console.log('Shuffle booster clicked');
      (game as any).gameManager.useShuffleBooster();
    });
  }
  
  const bombBooster = document.getElementById('bombBooster');
  if (bombBooster) {
    bombBooster.addEventListener('click', () => {
      console.log('Bomb booster clicked');
      (game as any).gameManager.useBombBooster();
    });
  }
}

function setupRestartHandler(game: BlastGame): void {
  const restartButton = document.getElementById('restartButton');
  if (restartButton) {
    restartButton.addEventListener('click', () => {
      console.log('Restart button clicked');
      (game as any).gameManager.restartGame();
    });
  }
}

export default BlastGame;