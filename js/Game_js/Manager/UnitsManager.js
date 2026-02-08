import MapManager from "./MapManager";

export default class UnitsManager {
    constructor(scene) {
        this.scene = scene;
        this.registeredUnits = new Set();
        this.offsetX = 800;
        this.offsetY = 200;
    }

    registerAssets(load, unitsList) {
        const loadedNames = new Set();
        unitsList.forEach(unit => {
            if (loadedNames.has(unit.name)) return; 
            loadedNames.add(unit.name);

            load.spritesheet(
                `${unit.name}_Idle.png`,
                `assets/Game_assets/units/${unit.name}_Idle.png`,
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

    createAllAnimations(unitsList){
        unitsList.forEach(unit => {
            this.createAnimationsIdle(unit);
            this.createAnimationsRun(unit);
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
        const sprite = this.scene.add.sprite(isoX, isoY, `${unit.name}_Idle.png`);
        sprite.setOrigin(0.5, 0.88);
        sprite.setDepth(10000);
        sprite.play(`${unit.name}_Idle_F_S`);
        sprite.unit = unit;
        sprite.tileX = tileX;
        sprite.tileY = tileY;

        return sprite;
    }

    spawnAt(x, y, unit) {
        const sprite = this.scene.add.sprite(x, y, `${unit.name}_Idle.png`);
        sprite.setOrigin(0.5, 0.88);
        sprite.setDepth(100000); 
        sprite.play(`${unit.name}_Idle_F`); 
        sprite.unit = unit;
        return sprite;
    }

}
