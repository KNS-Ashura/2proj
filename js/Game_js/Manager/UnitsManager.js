import AnimationsManager from "./AnimationsManager";

export default class UnitsManager {
    constructor(scene,anim) {
        this.scene = scene;
        this.anim = anim
        this.registeredUnits = new Set();
        this.offsetX = 800;
        this.offsetY = 200;

        this.animationsManager = new AnimationsManager(scene);
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

            load.spritesheet(
                `${unit.name}_Walk.png`,
                `assets/Game_assets/units/${unit.name}_Walk.png`,
                {
                    frameWidth: unit.frameWidth,
                    frameHeight: unit.frameHeight
                }
            );

            load.spritesheet(
                `${unit.name}_Die.png`,
                `assets/Game_assets/units/${unit.name}_Die.png`,
                {
                    frameWidth: unit.frameWidth,
                    frameHeight: unit.frameHeight
                }
            );
        });
    }

    createAllAnimations(unit) {
        this.animationsManager.createAnimations()
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
