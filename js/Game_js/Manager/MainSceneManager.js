import Phaser from "phaser";
import MapManager from "./MapManager.js";
import CameraManager from "./CameraManager.js";
import MovesManager from "./ManagerMoves.js"; 
import Unit from "../Logic/Unit.js";
import UnitsManager from "./UnitsManager.js";
import HUDScene from "./HudScene.js";
import EconomyManager from "./EconomyManager.js";

export default class MainSceneManager extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
        this.offsetX = 800;
        this.offsetY = 200;
    }

    preload() {
        this.MapManager = new MapManager(this);
        this.MapManager.registerAssets(this.load);
        
        const infantry = new Unit({
            name: "Character0",
            role: "Infantry",
            hp: 100,
            walkSpeed: 120,
            hitSpeed: 1,
            buildTime: 0,
            range: 1,
            price: 50,
            frameWidth: 460, 
            frameHeight: 460
        });
        infantry.role = "Infantry";

        const range = new Unit({
            name: "Character0", 
            role: "Range",
            hp: 80,
            walkSpeed: 120,
            hitSpeed: 1,
            buildTime: 0,
            range: 3,
            price: 100,
            frameWidth: 460, 
            frameHeight: 460
        });
        range.role = "Range";

        const heavy = new Unit({
            name: "Character0", 
            role: "Heavy",
            hp: 150,
            walkSpeed: 100,
            hitSpeed: 1,
            buildTime: 0,
            range: 1,
            price: 150,
            frameWidth: 460, 
            frameHeight: 460
        });
        heavy.role = "Heavy";

        this.unitsList = [infantry, range, heavy];
        this.UnitsManager = new UnitsManager(this);
        this.UnitsManager.registerAssets(this.load, this.unitsList);
    }

    create() {
        this.activeUnits = [];
        this.scene.add("HUDScene", HUDScene, true);
        this.economyManager = new EconomyManager(this);
        this.cameraManager = new CameraManager(this);
        this.movesManager = new MovesManager(this);
        this.MapManager.generateMap();
        if (this.MapManager.camps) {
            this.movesManager.registerCamps(this.MapManager.camps);
        }
        this.UnitsManager.createAllAnimations(this.unitsList);
        const playerCamp = this.MapManager.camps.find(c => c.owner === 0);
        if (playerCamp) {
            this.cameraManager.camera.centerOn(playerCamp.x, playerCamp.y);
        }
    }

    update() {
        if (this.movesManager) {
            this.movesManager.update();
        }
        this.updateHealthBars();
        this.handleCombat();
        this.handleCampCombat();
    }

    updateHealthBars() {
        for (let i = this.activeUnits.length - 1; i >= 0; i--) {
            const sprite = this.activeUnits[i];
            if (!sprite.active) {
                if (sprite.healthBar) sprite.healthBar.destroy();
                this.activeUnits.splice(i, 1);
                continue;
            }
            if (sprite.healthBar) {
                const bar = sprite.healthBar;
                const width = 40;
                const height = 5;
                
                let x, y;
                x = sprite.x - width / 2;
                y = sprite.y - (sprite.displayHeight || 460) * 0.9 - 10;

                bar.clear();
                bar.fillStyle(0x000000);
                bar.fillRect(x, y, width, height);
                const hpPercent = Phaser.Math.Clamp(sprite.hp / sprite.maxHp, 0, 1);
                bar.fillStyle(0x00ff00);
                bar.fillRect(x, y, width * hpPercent, height);
            }
        }
    }

    tryBuyUnit(price, unitIndex, camp) {
        if (camp && this.economyManager.spendGold(price)) {
            const unitData = this.unitsList[unitIndex];
            if (!camp.productionQueue) {
                camp.productionQueue = [];
                camp.isProducing = false;
            }

            camp.productionQueue.push(unitData);

            if (!camp.isProducing) {
                this.processCampQueue(camp);
            }
        } else {
            console.log("Pas assez d'or ou pas de camp sélectionné.");
        }
    }

    processCampQueue(camp) {
        if (camp.productionQueue.length === 0) {
            camp.isProducing = false;
            return;
        }

        camp.isProducing = true;
        const unitData = camp.productionQueue[0];
        const buildTime = unitData.buildTime || 0;

        this.time.delayedCall(buildTime, () => {
            this.spawnUnit(camp, unitData);
            camp.productionQueue.shift(); 
            this.processCampQueue(camp); 
        });
    }

    spawnUnit(camp, unitData) {
        const spawnX = camp.x;
        const spawnY = camp.y + 60;
        const sprite = this.UnitsManager.spawnAt(spawnX, spawnY, unitData);
        sprite.hp = unitData.hp;
        sprite.maxHp = unitData.hp;
        sprite.healthBar = this.add.graphics();
        sprite.healthBar.setDepth(100001);
        sprite.owner = camp.owner;
        this.activeUnits.push(sprite);
        if (unitData.role === "Heavy") {
            sprite.setTint(0x555555); 
        } else if (unitData.role === "Range") {
            sprite.setTint(0x0000ff); 
        } else {
            sprite.setTint(0xff0000);
        }

        this.physics.add.existing(sprite);
        sprite.body.setSize(180, 340);
        sprite.body.setOffset(140, 90);

        this.movesManager.registerUnit(sprite);
        
        this.registry.events.emit('closeRecruitment');
        this.scene.get('HUDScene').events.emit('closeRecruitment');
    }

    handleCombat() {
        if (!this.MapManager || !this.MapManager.camps) return;
        
        const time = this.time.now;
        
        this.activeUnits.forEach(unit => {
            if (!unit.active) return;
            if (unit.lastAttackTime && time < unit.lastAttackTime + (unit.unit.hitSpeed * 1000)) {
                return;
            }
            const zoneRadius = 1500;
            let target = null;
            let minDist = zoneRadius;
            this.MapManager.camps.forEach(camp => {
                if (camp.owner !== unit.owner && camp.active) { 
                    const dist = Phaser.Math.Distance.Between(unit.x, unit.y, camp.x, camp.y);
                    if (dist < minDist) {
                        minDist = dist;
                        target = camp;
                    }
                }
            });

            if (target) {
                this.fireProjectile(unit, target);
                unit.lastAttackTime = time;
            }
        });
    }

    handleCampCombat() {
        const time = this.time.now;

        this.MapManager.camps.forEach(camp => {
            if (!camp.active) return;

            if (time < camp.lastAttackTime + (camp.attackSpeed * 1000)) {
                return;
            }

            let target = null;
            let minDist = camp.attackRange;

            this.activeUnits.forEach(unit => {
                if (!unit.active) return;
                if (unit.owner === camp.owner) return;

                const dist = Phaser.Math.Distance.Between(
                    camp.x, camp.y,
                    unit.x, unit.y
                );

                if (dist < minDist) {
                    minDist = dist;
                    target = unit;
                }
            });

            if (target) {
                this.fireCampProjectile(camp, target);
                camp.lastAttackTime = time;
            }
        });
    }

        fireCampProjectile(camp, target) {
        const bullet = this.add.circle(camp.x, camp.y - 50, 10, 0xffaa00);
        bullet.setDepth(100002);

        this.tweens.add({
            targets: bullet,
            x: target.x,
            y: target.y,
            duration: 400,
            onComplete: () => {
                bullet.destroy();

                if (target.active) {
                    target.hp -= camp.attackDamage;
                    if (target.hp <= 0) {
                        target.setActive(false);
                        target.setVisible(false);

                        if (this.movesManager) {
                            this.movesManager.unregisterUnit(target);
                        }

                        target.destroy();
                    }
                }
            }
        });
    }

    fireProjectile(unit, target) {
        const bullet = this.add.circle(unit.x, unit.y, 20, 0xffff00);
        bullet.setDepth(100002);
        this.tweens.add({
            targets: bullet,
            x: target.x,
            y: target.y,
            duration: 300,
            onComplete: () => {
                bullet.destroy();
                if (target.takeDamage) {
                    target.takeDamage(10, unit.owner);
                }
            }
        });
    }
}