import MapManager from "./MapManager";

export default class UnitsManager {
    constructor(scene) {
        this.scene = scene;
        this.registeredUnits = new Set();
        this.offsetX = 800;
        this.offsetY = 200;
    }

    registerAssets(load, units) {
        units.forEach(unit => {

            load.spritesheet(
                `${unit.name}_Idle.png`,
                `assets/Game_assets/units/${unit.name}_Idle.png`,
                {
                    frameWidth: unit.frameWidth,
                    frameHeight: unit.frameHeight
                }
            );
        });
    }

    createAnimations(unit) {
        const key = `${unit.name}_Idle.png`;

        if (this.scene.anims.exists(key)) return;

        this.scene.anims.create({
            key,
            frames: this.scene.anims.generateFrameNumbers(key, {
                start: 0,
                end: 7
            }),
            frameRate: 6,
            repeat: -1
        });
    }

    spawn(tileX, tileY, unit) {
        const map = this.scene.MapManager;

        const isoX =
            (tileX - tileY) * (map.TILE_WIDTH / 2) + map.offsetX;

        const isoY =
            (tileX + tileY) * (map.TILE_HEIGHT / 2) + map.offsetY;

        const key = `${unit.name}_Idle.png`;

        this.createAnimations(unit);

        const sprite = this.scene.add.sprite(isoX, isoY, key);

        sprite.setOrigin(0.5, 0.9);
        sprite.setDepth(isoY + 2);

        sprite.play(key);
        sprite.unit = unit;

        sprite.tileX = tileX;
        sprite.tileY = tileY;

        return sprite;
    }

}
