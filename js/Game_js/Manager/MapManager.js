export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.mapGroup = this.scene.add.group();
        this.obstacles = [];
    

        this.TILE_WIDTH = 512;
        this.TILE_HEIGHT = 185;

        this.offsetX = 800;
        this.offsetY = 200;

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
        load.image("tree", "assets/tree.png");
        load.image("pine", "assets/pineTree.png");
        load.image("camp", "assets/camp.png");
        load.json("level1", "js/Game_js/Logic/lvl1_data.json");
    }

    generateMap(playerCount = 2) {
        const levelData = this.scene.cache.json.get("level1"); 
        if (!levelData || !levelData.tiles) return;

        const tiles = levelData.tiles;

        const groundPositions = [];
        tiles.forEach((row, y) => {
            row.forEach((tileType, x) => {
                if (tileType === 0 || tileType === 2) groundPositions.push({ x, y });
            });
        });

        // Sélectionne exactement le nombre de positions nécessaire pour les joueurs
        const campPositions = groundPositions.sort(() => Math.random() - 0.5).slice(0, playerCount);
        const campData = new Map(campPositions.map((p, i) => [`${p.x},${p.y}`, i]));

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

                const playerIdx = campData.get(`${x},${y}`);

                if (playerIdx !== undefined) {
                    const camp = this.scene.add.image(isoX, isoY, "camp", 0);
                    
                    // Palette de couleurs pour différencier les joueurs (Rouge, Bleu, Vert, Jaune, etc.)
                    const playerColors = [0xff4d4d, 0x4d79ff, 0x4dff4d, 0xffff4d, 0xff4dff, 0x4dffff, 0xffa64d, 0xffffff];
                    camp.setTint(playerColors[playerIdx]);

                    camp.setOrigin(0.5, 0.8);
                    camp.setDepth(isoY + 1);
                    this.mapGroup.add(camp);
                    this.obstacles.push(camp);
                } else if (tileType === 0 || tileType === 2) {
                    const clusterValue = Math.sin(x * 0.5) + Math.cos(y * 0.5);
                    
                    if (clusterValue > 0.5 && Math.random() > 0.3) {
                    
                        const treeKey = clusterValue > 1.1 ? "pine" : "tree";
                        
                        const tree = this.scene.add.image(isoX, isoY, treeKey);
                        tree.setOrigin(0.5, 0.9);
                        tree.setDepth(isoY + 1);
                        this.mapGroup.add(tree);
                        this.obstacles.push(tree);
                    }
                }
            });
        });
    }
}
