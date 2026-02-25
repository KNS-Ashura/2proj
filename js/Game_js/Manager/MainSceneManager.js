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
        
        const definitions = [
            { role: "Infantry", hp: 100, damage: 10, range: 1, walkSpeed: 120, hitSpeed: 1, price: 50, buildTime: 5000 },
            { role: "Support", hp: 80, damage: 5, range: 3, walkSpeed: 110, hitSpeed: 1, price: 120, buildTime: 8000, ability: "buff", abilityCooldown: 15000 },
            { role: "Heal", hp: 70, damage: 5, range: 3, walkSpeed: 100, hitSpeed: 1, price: 150, buildTime: 10000, ability: "heal", abilityCooldown: 10000 },
            { role: "Range", hp: 80, damage: 15, range: 4, walkSpeed: 120, hitSpeed: 1, price: 100, buildTime: 7000 },
            { role: "Heavy", hp: 250, damage: 25, range: 1, walkSpeed: 80, hitSpeed: 1.5, price: 200, buildTime: 12000 },
            { role: "AntiArmor", hp: 90, damage: 10, range: 3, walkSpeed: 110, hitSpeed: 1.2, price: 130, buildTime: 9000 },
            { role: "Mortar", hp: 60, damage: 40, range: 6, walkSpeed: 60, hitSpeed: 3, price: 250, buildTime: 15000 }
        ];

        this.unitsList = definitions.map(def => {
            const u = new Unit({
                name: "Character0", 
                role: def.role,
                hp: def.hp,
                walkSpeed: def.walkSpeed,
                hitSpeed: def.hitSpeed,
                buildTime: def.buildTime,
                range: def.range,
                price: def.price,
                frameWidth: 460, 
                frameHeight: 460
            });
            u.damage = def.damage;
            u.ability = def.ability;
            u.abilityCooldown = def.abilityCooldown;
            return u;
        });

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
        this.input.keyboard.on('keydown-SPACE', () => {
            this.activateSelectedUnitsAbilities();
        });
    }

    update() {
        if (this.movesManager) {
            this.movesManager.update();
        }
        this.updateHealthBars();
        this.handleCombat();
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
        sprite.owner = camp.owner; 
        sprite.hp = unitData.hp;
        sprite.maxHp = unitData.hp;
        sprite.damage = unitData.damage || 10;
        sprite.role = unitData.role;
        sprite.ability = unitData.ability;
        sprite.abilityCooldown = unitData.abilityCooldown || 0;
        sprite.lastAbilityTime = -99999; 

        sprite.healthBar = this.add.graphics();
        sprite.healthBar.setDepth(100001);
        this.activeUnits.push(sprite);
        
        this.restoreUnitTint(sprite);

        this.physics.add.existing(sprite);
        sprite.body.setSize(180, 340);
        sprite.body.setOffset(140, 90);

        this.movesManager.registerUnit(sprite);
        
        this.registry.events.emit('closeRecruitment');
        this.scene.get('HUDScene').events.emit('closeRecruitment');
    }

    restoreUnitTint(sprite) {
        switch (sprite.role) {
            case "Heavy": sprite.setTint(0x555555); break;     
            case "Range": sprite.setTint(0x0000ff); break;     
            case "Support": sprite.setTint(0x00ffff); break;   
            case "Heal": sprite.setTint(0x00ff00); break;      
            case "AntiArmor": sprite.setTint(0xffa500); break; 
            case "Mortar": sprite.setTint(0x800080); break;    
            default: sprite.setTint(0xff0000); break;          
        }
        if (sprite.owner !== 0) {
            sprite.setTint(0x000000); 
        }
    }

    handleCombat() {
        if (!this.MapManager || !this.MapManager.camps) return;
        
        const time = this.time.now;
        
        this.activeUnits.forEach(unit => {
            if (!unit.active) return;
            if (unit.lastAttackTime && time < unit.lastAttackTime + (unit.unit.hitSpeed * 1000)) {
                return;
            }
            const zoneRadius = unit.unit.range * 150; 
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

            this.activeUnits.forEach(enemy => {
                if (enemy.active && enemy.owner !== unit.owner) {
                    const dist = Phaser.Math.Distance.Between(unit.x, unit.y, enemy.x, enemy.y);
                    if (dist < minDist) {
                        minDist = dist;
                        target = enemy;
                    }
                }
            });

            if (target) {
                this.fireProjectile(unit, target);
                unit.lastAttackTime = time;
            }
        });
    }

    fireProjectile(unit, target) {
        const bullet = this.add.circle(unit.x, unit.y, 10, 0xffff00);
        bullet.setDepth(100002);
        this.tweens.add({
            targets: bullet,
            x: target.x,
            y: target.y,
            duration: 300,
            onComplete: () => {
                bullet.destroy();
                
                if (unit.role === "Mortar") {
                    this.dealAreaDamage(target.x, target.y, 250, unit.damage, unit);
                    const explosion = this.add.circle(target.x, target.y, 100, 0xffaa00, 0.5);
                    this.tweens.add({ targets: explosion, alpha: 0, scale: 2, duration: 500, onComplete: () => explosion.destroy() });
                } else {
                    const damage = this.calculateDamage(unit, target);
                    this.applyDamage(target, damage);
                }
            }
        });
    }

    calculateDamage(attacker, target) {
        let damage = attacker.damage || 10;
        if (attacker.role === "AntiArmor" && target.role === "Heavy") {
            damage *= 3;
        }
        if (attacker.isBuffed) {
            damage *= 1.5; 
        }

        return damage;
    }

    applyDamage(target, damage) {
        if (target.takeDamage) {
            target.takeDamage(damage);
        } else if (target.hp !== undefined) {
            target.hp -= damage;
            if (target.hp <= 0) {
                target.active = false;
                target.setVisible(false);
                if (target.healthBar) target.healthBar.destroy();
                target.destroy();
            }
        }
    }

    dealAreaDamage(x, y, radius, maxDamage, attacker) {
        this.MapManager.camps.forEach(camp => {
            if (camp.active && camp.owner !== attacker.owner) {
                const dist = Phaser.Math.Distance.Between(x, y, camp.x, camp.y);
                if (dist <= radius) {
                    const damage = Math.floor(maxDamage * (1 - (dist / radius) * 0.5));
                    camp.takeDamage(damage);
                }
            }
        });
        this.activeUnits.forEach(u => {
            if (u.active && u.owner !== attacker.owner) {
                const dist = Phaser.Math.Distance.Between(x, y, u.x, u.y);
                if (dist <= radius) {
                    const damage = Math.floor(maxDamage * (1 - (dist / radius) * 0.5));
                    this.applyDamage(u, damage);
                }
            }
        });
    }

    activateSelectedUnitsAbilities() {
        const time = this.time.now;
        if (!this.movesManager || !this.movesManager.selectedUnits) return;

        this.movesManager.selectedUnits.forEach(unit => {
            if (unit.ability && time > unit.lastAbilityTime + unit.abilityCooldown) {
                this.castAbility(unit);
                unit.lastAbilityTime = time;
            }
        });
    }

    castAbility(unit) {
        const range = 400;
        const allies = this.activeUnits.filter(u => u.active && u.owner === unit.owner && Phaser.Math.Distance.Between(unit.x, unit.y, u.x, u.y) <= range);

        if (unit.role === "Support") {
            allies.forEach(ally => {
                ally.isBuffed = true;
                ally.setTint(0xffffff); 
                this.time.delayedCall(200, () => this.restoreUnitTint(ally));
                this.time.delayedCall(5000, () => { ally.isBuffed = false; }); 
            });
        } else if (unit.role === "Heal") {
            allies.forEach(ally => {
                ally.hp = Math.min(ally.hp + 50, ally.maxHp);
                const healText = this.add.text(ally.x, ally.y - 50, "+50", { fontSize: '24px', color: '#00ff00' }).setOrigin(0.5);
                this.tweens.add({ targets: healText, y: ally.y - 100, alpha: 0, duration: 1000, onComplete: () => healText.destroy() });
            });
        }
    }
}