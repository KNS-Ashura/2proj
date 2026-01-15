export default class UnitsManager {
    constructor(scene) {
        this.scene = scene;
    }

    registerAssets(load, unitNames) {
        unitNames.forEach(name => {
            load.spritesheet(
                `${name}_idle`,
                `assets/units/${name}/idle.png`,
                { frameWidth: 368, frameHeight: 230 }
            );
        });
    }

    createAnimations(unitNames) {
        unitNames.forEach(name => {
            this.scene.anims.create({
                key: `${name}_idle`,
                frames: this.scene.anims.generateFrameNumbers(
                    `${name}_idle`,
                    { start: 0, end: 3 }
                ),
                frameRate: 6,
                repeat: -1
            });
        });
    }

    spawn(x, y, unit) {
        const sprite = this.scene.add.sprite(x, y, `${unit.name}_idle`);
        sprite.play(`${unit.name}_idle`);
        sprite.unitData = unit;
        return sprite;
    }
}
