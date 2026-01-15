import { level1 } from './js/Game_js/Logic/lvldata.js';

const TILE_WIDTH = 512;   
const TILE_HEIGHT = 185;   
const TILE_MAPPING = {
    0: 'grass',
    1: 'water',
    2: 'dirt' 
};

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('grass', 'assets/grass.png');
        this.load.image('water', 'assets/water.png');
        this.load.image('dirt', 'assets/dirt.png'); 
    }

    create() {
        this.cameras.main.centerOn(0, 0);
        this.cameras.main.setZoom(0.5);
        
        this.mapGroup = this.add.group();
        this.obstacles = []; 
        level1.forEach((row, y) => {
            row.forEach((tileType, x) => {
                if (tileType === 9) return;
                let textureKey = TILE_MAPPING[tileType];
                if (!textureKey) {
                    console.warn(`Type de tuile inconnu à [${x},${y}] : ${tileType}`);
                    return;
                }
                let isoX = (x - y) * (TILE_WIDTH / 2);
                let isoY = (x + y) * (TILE_HEIGHT / 2);
                let tile = this.add.image(isoX, isoY, textureKey);
                tile.scaleY = 0.6; 
                
                tile.setDepth(isoY);

            });
        });

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (deltaY > 0) {
                let newZoom = this.cameras.main.zoom - 0.1;
                if (newZoom > 0.1) this.cameras.main.setZoom(newZoom); 
            } else {
                let newZoom = this.cameras.main.zoom + 0.1;
                if (newZoom < 2.5 ) this.cameras.main.setZoom(newZoom);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
            this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
        });
    }
}