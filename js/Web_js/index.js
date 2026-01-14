const TILE_WIDTH = 128;  
const TILE_HEIGHT = 32;  
const MAP_SIZE = 40;     

class MapObject extends Phaser.GameObjects.Sprite {
    constructor(scene, gridX, gridY, texture) {
        let isoX = (gridX - gridY) * (TILE_WIDTH / 2);
        let isoY = (gridX + gridY) * (TILE_HEIGHT / 2);
        super(scene, isoX, isoY, texture);
        this.gridX = gridX;
        this.gridY = gridY;
        this.setOrigin(0.5, 1);
        this.y += TILE_HEIGHT / 2;
        this.setDepth(isoY + TILE_HEIGHT);
        scene.add.existing(this);
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('grass', 'assets/grass.png');
        this.load.image('water', 'assets/water.png');
    }

    create() {
        this.cameras.main.centerOn(0, 0);
        this.cameras.main.setZoom(1); 
        this.mapGroup = this.add.group();

        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                let isRiver = Math.abs(x - 20) < 2 + Math.random(); 
                let texture = isRiver ? 'water' : 'grass';
                let isoX = (x - y) * (TILE_WIDTH / 2);
                let isoY = (x + y) * (TILE_HEIGHT / 2);
                let tile = this.add.image(isoX, isoY, texture);
                tile.scaleY = 0.5; 
                tile.setDepth(isoY);
                this.obstacles = []; 

            }}
        // partie pour zoomer a la age of
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (deltaY > 0) {
                let newZoom = this.cameras.main.zoom - 0.1;
                if (newZoom > 0.3) this.cameras.main.setZoom(newZoom);
            } else {
                let newZoom = this.cameras.main.zoom + 0.1;
                if (newZoom < 2.5) this.cameras.main.setZoom(newZoom);
            }
        });
        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
            this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
        });
        
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth, 
    height: window.innerHeight,
    scene: MainScene,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
