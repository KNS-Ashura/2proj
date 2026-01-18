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
            2: "dirt",
            3: "camp_test"
        };
    }

    registerAssets(load) {
        load.image("grass", "assets/grass.png");
        load.image("water", "assets/water.png");
        load.image("dirt", "assets/dirt.png");

        load.image("camp_test", "assets/camp_test.png");


        load.json("level1", "js/Game_js/Logic/lvl1_data.json");
    }

    generateMap() {
        const levelData = this.scene.cache.json.get("level1"); //recup les données du json
        const tiles = levelData.tiles;

        tiles.forEach((row, y) => {
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
