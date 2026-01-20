export default class UnitsManager {
    constructor(scene) {
        this.scene = scene;
        this.registeredUnits = new Set();
    }

    // À appeler UNE SEULE FOIS (dans preload)
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

    spawn(x, y, unit) {
        this.scene.add.circle(x, y, 5, 0xff0000);
         console.log("Spawn at:", x, y);
        const key = `${unit.name}_Idle.png`;

        this.createAnimations(unit);

        const sprite = this.scene.add.sprite(x, y, key);
        sprite.play(key);
        sprite.unit = unit;

        return sprite;
    }
}
