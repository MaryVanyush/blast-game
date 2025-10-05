export declare enum TileType {
    STAR_BLUE = "star_blue",
    STAR_GREEN = "star_green",
    STAR_RED = "star_red",
    STAR_PURPLE = "star_purple",
    STAR_ORANGE = "star_orange",
    BOMB = "bomb"
}
export interface Position {
    x: number;
    y: number;
}
export interface Tile {
    type: TileType;
    position: Position;
    element: HTMLElement;
}
export interface GameConfig {
    boardWidth: number;
    boardHeight: number;
    targetScore: number;
    maxMoves: number;
    shuffleCount: number;
    bombCount: number;
}
export interface GameState {
    score: number;
    movesLeft: number;
    isGameOver: boolean;
    isProcessing: boolean;
    bombMode: boolean;
}
export interface BoosterState {
    shuffleCount: number;
    bombCount: number;
}
//# sourceMappingURL=GameTypes.d.ts.map