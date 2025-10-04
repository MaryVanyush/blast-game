export declare class GameManager {
    private adapter;
    private config;
    private gameState;
    private boosterState;
    private tileImages;
    private lastClickTime;
    private lastClickCoords;
    constructor();
    initialize(): Promise<void>;
    private loadImages;
    private generateBoard;
    private getRandomTileType;
    private getBombCount;
    private setupEventListeners;
    private handleTileClick;
    private findHorizontalGroup;
    private handleBombTileClick;
    private handleBombBoosterClick;
    private processTileGroup;
    private burnTiles;
    private applyGravity;
    private fillEmptySpaces;
    private calculateScore;
    private addScore;
    private checkGameConditions;
    private updateUI;
    private showGameOverModal;
    private hideLoadingScreen;
    private showError;
    restartGame(): void;
    destroy(): void;
    useShuffleBooster(): void;
    useBombBooster(): void;
    private shuffleBoard;
}
//# sourceMappingURL=GameManager.d.ts.map