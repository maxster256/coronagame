import {DataService, DialogService, SoundService} from '../services';
import { COLLISION_BLOCKS, TILE_SIZE } from '../consts';
import { Player, Character, GameObject } from '../core';
import { NPC_DATA, GAME_OBJECTS_DATA } from '../data';
import { tryToProvideAction } from '../utils';

export class Main extends Phaser.Scene {
    private _collisionLayer: Phaser.Tilemaps.StaticTilemapLayer;
    private _gameMap: Phaser.Tilemaps.Tilemap;

    private _dataService = DataService.getInstance();

    constructor() {
        super('main');
    }

    public create(): void {
        this._loadEntitiesAndWorldData();
        this._actionHookes();
    }

    public update(): void {
        this._dataService.player.move();
        this._dataService.player.tryToProvideActions()
        this._moveNpcs();
        this._dataService.npcs.forEach(npc => npc.update());
    }

    private _loadEntitiesAndWorldData(): void {
        this._gameMap = this.make.tilemap({ key: 'map' });
        const beachTiles = this._gameMap.addTilesetImage('beach_tileset', 'beach_tiles');
        const gameTiles = this._gameMap.addTilesetImage('tilemap2x', 'tiles');
        const beachMaps = ['collision_sea', 'underfloating', 'background_sea', 'shadows_sea'];
        const cityMaps = ['background', 'shadows', 'collision'];

        this._collisionLayer = this._gameMap.createStaticLayer('main_collisions', gameTiles, 0, TILE_SIZE);

        beachMaps.forEach(element => {
            this._gameMap.createStaticLayer(element, beachTiles, 0, TILE_SIZE);
        });
        cityMaps.forEach(element => {
            this._gameMap.createStaticLayer(element, gameTiles, 0, TILE_SIZE);
        });

        this._createNpcsAndObjects();
        this._createPlayer();

        this._gameMap.createStaticLayer('floating', gameTiles, 0, TILE_SIZE);
        this._gameMap.createStaticLayer('overfloating', gameTiles, 0, TILE_SIZE);
    
        this._collisionLayer.setCollisionBetween(COLLISION_BLOCKS.start, COLLISION_BLOCKS.stop);
        this.impact.world.setCollisionMapFromTilemapLayer(this._collisionLayer);

        this.cameras.main.setBounds(0, TILE_SIZE, this._gameMap.widthInPixels, this._gameMap.heightInPixels);
        this._setBackgroundMusic();
    }

    private _setBackgroundMusic(): void {
        SoundService.init(this.game);
        SoundService.getInstance().setBackgroundMusic('background_music');
        SoundService.getInstance().playBackgroundMusic();
    }

    private _createNpcsAndObjects(): void {
        NPC_DATA.forEach((npcData) => {
            this._dataService.npcs.push(new Character(this.impact, this.anims, npcData));
        });
        GAME_OBJECTS_DATA.forEach(objectData => {
            this._dataService.objects.push(new GameObject(objectData));
        });
    }

    private _createPlayer(): void {
        this._dataService.player = new Player(this.impact, this.anims, this.input,);
        this.cameras.main.startFollow(this._dataService.player.instance);
    }

    private _moveNpcs(): void {
        this._dataService.npcs.forEach(npc => npc.move());
    }

    private _actionHookes() {
        DialogService.init(this.scene);
        this.input.keyboard.on('keydown', (key: Phaser.Input.Keyboard.Key) => {
            switch (key.keyCode) {
                case 32 /* Space */:
                    tryToProvideAction(this._dataService.player, this._dataService.npcs, this._dataService.objects);
                    break;
                case 27 /* Esc */:
                    DialogService.getInstance().closeAllModals();
                    break;
            }
        });
    }
}
