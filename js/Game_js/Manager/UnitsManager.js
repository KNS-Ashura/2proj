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
            )

            load.spritesheet(
                `${unit.name}_Walk.png`,
                `assets/Game_assets/units/${unit.name}_Walk.png`,
                {
                    frameWidth: unit.frameWidth,
                    frameHeight: unit.frameHeight
                }
            )

            load.spritesheet(
                `${unit.name}_Run.png`,
                `assets/Game_assets/units/${unit.name}_Run.png`,
                {
                    frameWidth: unit.frameWidth,
                    frameHeight: unit.frameHeight
                }
            )

        });
    }

    createAnimationsIdle(unit) {
        const key = `${unit.name}_Idle.png`;
        const directions = ['F', 'F_S', 'S', 'B_S', 'B'];

        let start = 0;
        let end = 7;

        directions.forEach(dir => {
            const animKey = `${unit.name}_Idle_${dir}`;

            if (this.scene.anims.exists(animKey)) return;

            this.scene.anims.create({
                key: animKey,
                frames: this.scene.anims.generateFrameNumbers(key, {
                    start: start,
                    end: end
                }),
                frameRate: 6,
                repeat: -1
            });

            start += 8;
            end += 8;
        });
    }

    createAnimationsRun(unit) {
        const key = `${unit.name}_Run.png`;
        const directions = ['F', 'F_S', 'S', 'B_S', 'B'];

        let start = 0;
        let end = 3;

        directions.forEach(dir => {
            const animKey = `${unit.name}_Run_${dir}`;

            if (this.scene.anims.exists(animKey)) return;

            this.scene.anims.create({
                key: animKey,
                frames: this.scene.anims.generateFrameNumbers(key, {
                    start: start,
                    end: end
                }),
                frameRate: 6,
                repeat: -1
            });

            start += 4;
            end += 4;
        });
    }

    spawn(tileX, tileY, unit) {
        const map = this.scene.MapManager;

        const isoX =
            (tileX - tileY) * (map.TILE_WIDTH / 2) + map.offsetX;

        const isoY =
            (tileX + tileY) * (map.TILE_HEIGHT / 2) + map.offsetY;

        this.createAnimationsIdle(unit);
        this.createAnimationsRun(unit);

        const sprite = this.scene.add.sprite(isoX, isoY, `${unit.name}_Idle.png`);

        sprite.setOrigin(1, 0.9);
        sprite.setDepth(isoY + 2);

        sprite.play(`${unit.name}_Run_B`);
        sprite.unit = unit;

        sprite.tileX = tileX;
        sprite.tileY = tileY;

        return sprite;
    }

}
