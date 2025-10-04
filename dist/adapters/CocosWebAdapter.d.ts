/**
 * Cocos Creator 2.4.x Web Adapter
 * Адаптер для работы с Cocos Creator API в веб-среде
 */
export declare class CocosWebAdapter {
    private static instance;
    private canvas;
    private ctx;
    private gameStarted;
    private animationId;
    private lastTime;
    private deltaTime;
    private tiles;
    private images;
    private lastClickTime;
    private lastClickCoords;
    private effects;
    constructor();
    static getInstance(): CocosWebAdapter;
    private setupEventListeners;
    private handleClick;
    loadImage(src: string): Promise<HTMLImageElement>;
    createTile(x: number, y: number, type: string, imageSrc: string): any;
    removeTile(x: number, y: number): void;
    updateTilePosition(x: number, y: number, newX: number, newY: number): void;
    start(): void;
    stop(): void;
    private gameLoop;
    private render;
    getCanvas(): HTMLCanvasElement;
    getContext(): CanvasRenderingContext2D;
    getDeltaTime(): number;
    getAllTiles(): Map<string, any>;
    createBurnEffect(x: number, y: number): void;
    createExplosionEffect(x: number, y: number): void;
    private updateEffects;
    private renderEffects;
}
//# sourceMappingURL=CocosWebAdapter.d.ts.map