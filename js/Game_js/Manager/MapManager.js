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

        this.playerColors = [
            0xff0000, 0x0000ff, 0x00ff00, 0xffff00,
            0x800080, 0x00ffff, 0xffa500, 0xffc0cb
        ];
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
        const playerCount = finalConfig.playerCount || 8;
        const spawnMode = finalConfig.spawnMode || 'circle';

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

        let campPositions = [];
        
        if (spawnMode === 'sides') {
            // Mode Défini : 2 par côté (Haut, Bas, Gauche, Droite)
            const margin = 0.2; // 20% des bords
            const zones = {
                top: groundPositions.filter(p => p.y < mapHeight * margin),
                bottom: groundPositions.filter(p => p.y > mapHeight * (1 - margin)),
                left: groundPositions.filter(p => p.x < mapWidth * margin),
                right: groundPositions.filter(p => p.x > mapWidth * (1 - margin))
            };

            for (const key in zones) {
                zones[key].sort(() => Math.random() - 0.5);
            }

            const sequence = ['top', 'bottom', 'left', 'right'];
            for (let i = 0; i < playerCount; i++) {
                const zoneKey = sequence[i % 4];
                const zoneList = zones[zoneKey];
                
                // On cherche une position dans la zone qui est assez loin des autres camps déjà placés
                let found = false;
                for (let j = 0; j < zoneList.length; j++) {
                    const candidate = zoneList[j];
                    const tooClose = campPositions.some(cp => Math.hypot(cp.x - candidate.x, cp.y - candidate.y) < 6);
                    if (!tooClose) {
                        campPositions.push(zoneList.splice(j, 1)[0]);
                        found = true;
                        break;
                    }
                }
                if (!found && zoneList.length > 0) campPositions.push(zoneList.pop());
            }
        } else {
            // Mode Cercle : Aléatoire sur le cercle
            const centerX = mapWidth / 2;
            const centerY = mapHeight / 2;
            const radius = Math.min(mapWidth, mapHeight) * 0.35;
            const angleStep = (Math.PI * 2) / playerCount;
            const startAngle = Math.random() * Math.PI * 2; 

            for (let i = 0; i < playerCount; i++) {
                const angle = startAngle + (i * angleStep);
                const targetX = Math.floor(centerX + Math.cos(angle) * radius);
                const targetY = Math.floor(centerY + Math.sin(angle) * radius);
                
                let nearest = null;
                let minDist = Infinity;
                for (const pos of groundPositions) {
                    const d = (pos.x - targetX) ** 2 + (pos.y - targetY) ** 2;
                    if (d < minDist) {
                        minDist = d;
                        nearest = pos;
                    }
                }
                if (nearest) campPositions.push(nearest);
            }
        }

        const campKeys = new Set(campPositions.map(p => `${p.x},${p.y}`));
        const campOwnerMap = {};
        campPositions.forEach((pos, index) => campOwnerMap[`${pos.x},${pos.y}`] = index);

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

                const isCampPos = campKeys.has(`${x},${y}`);

                const tile = this.scene.add.image(isoX, isoY, textureKey);
                tile.scaleY = 0.6;
                tile.setDepth(isoY);
                this.mapGroup.add(tile);

                if (isCampPos) {
                    const camp = this.scene.add.image(isoX, isoY, "camp");
                    camp.setOrigin(0.5, 0.8);
                    camp.setDepth(isoY + 1);
                    const ownerIndex = campOwnerMap[`${x},${y}`];
                    if (ownerIndex !== undefined) {
                        camp.setTint(this.playerColors[ownerIndex % this.playerColors.length]);
                    }
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
