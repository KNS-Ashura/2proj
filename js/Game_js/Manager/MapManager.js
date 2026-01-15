import { level1 } from "../Logic/lvldata.js";

export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.mapGroup = this.scene.add.group();
        this.obstacles = [];

        this.TILE_WIDTH = 512;
        this.TILE_HEIGHT = 185;

        this.TILE_MAPPING = {
            0: "grass",
            1: "water",
            2: "dirt"
        };
    }

    registerAssets(load) {
        load.image("grass", "assets/grass.png");
        load.image("water", "assets/water.png");
        load.image("dirt", "assets/dirt.png");
    }

    generateMap() {
        level1.forEach((row, y) => {
            row.forEach((tileType, x) => {
                if (tileType === 9) return;

                const textureKey = this.TILE_MAPPING[tileType];

                if (!textureKey) {
                    console.warn(`Type de tuile inconnu à [${x},${y}] : ${tileType}`);
                    return;
                }

                const isoX = (x - y) * (this.TILE_WIDTH / 2);
                const isoY = (x + y) * (this.TILE_HEIGHT / 2);

                const tile = this.scene.add.image(isoX, isoY, textureKey);
                tile.scaleY = 0.6;
                tile.setDepth(isoY);

                this.mapGroup.add(tile);
            });
        });
    }
}
