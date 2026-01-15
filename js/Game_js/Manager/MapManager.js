export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.mapGroup = this.scene.add.group();
        this.obstacles = [];
        this.TILE_WIDTH = 512;
        this.TILE_HEIGHT = 185;
        const TILE_MAPPING = {
            0: 'grass',
            1: 'water',
            2: 'dirt' 
        };
    }


    generateMap() {
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
    }
}
