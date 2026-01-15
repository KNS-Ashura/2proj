export class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.mapGroup = this.scene.add.group();
        this.obstacles = [];
    }


    generateMap() {
        for (let y = 0; y < this.MAP_SIZE; y++) {
            for (let x = 0; x < this.MAP_SIZE; x++) {
                const isRiver = Math.abs(x - 20) < 2 + Math.random();
                const texture = isRiver ? "water" : "grass";
                const isoX = (x - y) * (this.TILE_WIDTH / 2);
                const isoY = (x + y) * (this.TILE_HEIGHT / 2);

                const tile = this.scene.add.image(isoX, isoY, texture);
                tile.scaleY = 0.5;
                tile.setDepth(isoY);
                this.mapGroup.add(tile);

                if (isRiver) this.obstacles.push({ x, y });
            }
        }
    }
}
