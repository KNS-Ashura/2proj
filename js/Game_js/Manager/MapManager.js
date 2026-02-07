import { CampManager } from "./CampManager.js";

export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.mapGroup = this.scene.add.group();
        this.obstacles = [];
        this.camps = [];
    
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

    generateMap(config = {}) {
        const finalConfig = { ...(window.gameConfig || {}), ...config };
        const totalCamps = finalConfig.campCount || 12;
        const playerCount = finalConfig.playerCount || 2;

        const levelData = this.scene.cache.json.get("level1"); 
        if (!levelData || !levelData.tiles) return;

        const tiles = levelData.tiles;
        const mapHeight = tiles.length;
        const mapWidth = tiles[0].length;

        const groundPositions = [];
        tiles.forEach((row, y) => {
            row.forEach((tileType, x) => {
                if (tileType === 0 || tileType === 2) groundPositions.push({ x, y });
            });
        });

        const campPositions = [];
        const minDistance = 6;
        const shuffledGround = [...groundPositions].sort(() => Math.random() - 0.5);

        for (const pos of shuffledGround) {
            if (campPositions.length >= totalCamps) break;
            const tooClose = campPositions.some(cp => Math.hypot(cp.x - pos.x, cp.y - pos.y) < minDistance);
            if (!tooClose) campPositions.push(pos);
        }

        const campKeys = new Set(campPositions.map(p => `${p.x},${p.y}`));
        const campOwnerMap = {};
        
        const shuffledCamps = [...campPositions].sort(() => Math.random() - 0.5);
        const campsPerPlayer = Math.max(1, Math.floor(totalCamps / (playerCount + 1)));

        shuffledCamps.forEach((pos, index) => {
            const key = `${pos.x},${pos.y}`;
            const owner = Math.floor(index / campsPerPlayer);
            if (owner < playerCount) campOwnerMap[key] = owner;
            else campOwnerMap[key] = -1;
        });

        tiles.forEach((row, y) => {
            row.forEach((tileType, x) => {
                if (tileType === 9) return;

                const textureKey = this.TILE_MAPPING[tileType];

                if (!textureKey) {
                    console.warn(`Type de tuile inconnu à [${x},${y}] : ${tileType}`);
                    return;
                }

                const isoX = (x - y) * (this.TILE_WIDTH / 2) + this.offsetX;
                const isoY = (x + y) * (this.TILE_HEIGHT / 2) + this.offsetY;

                const isCampPos = campKeys.has(`${x},${y}`);

                const tile = this.scene.add.image(isoX, isoY, textureKey);
                tile.scaleY = 0.6;
                tile.setDepth(isoY);
                this.mapGroup.add(tile);

                if (isCampPos) {
                    const ownerIndex = campOwnerMap[`${x},${y}`];
                    const camp = new CampManager(this.scene, isoX, isoY, "camp", ownerIndex);
                    this.scene.add.existing(camp);
                    
                    camp.setOrigin(0.5, 0.8);
                    camp.setDepth(isoY + 1);
                    
                    if (ownerIndex === 0) {
                        camp.setTint(0xff0000); 
                    } else if (ownerIndex > 0) {
                        camp.setTint(0x0000ff); 
                    } else {
                        camp.setTint(0x808080); 
                    }
                    this.mapGroup.add(camp);
                    this.obstacles.push(camp);
                    this.camps.push(camp);
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
