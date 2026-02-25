import Phaser from "phaser";

export class CampManager extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, owner) {
        super(scene, x, y, texture);
        this.owner = owner;
        this.hp = 1000;
        this.maxHp = 1000;
        this.attackRange = 600;      // distance d'attaque
        this.attackDamage = 20;      // dégâts
        this.attackSpeed = 1.5;      // secondes entre attaques
        this.lastAttackTime = 0;
        
        this.setInteractive(); 
        this.setDepth(y);      
        
        this.healthBar = this.scene.add.graphics();
        this.healthBar.setDepth(y + 100);
        this.updateHealthBar();
    }

    takeDamage(amount, attackerOwner) {
        this.hp -= amount;

        if (this.hp <= 0) {
            this.capture(attackerOwner);
        } else {
            this.updateHealthBar();
        }
    }

    updateHealthBar() {
        if (!this.active) return;
        const width = 80;
        const height = 8;
        const x = this.x - width / 2;
        const y = this.y - this.height * 0.8 - 20;

        this.healthBar.clear();
        this.healthBar.fillStyle(0x000000);
        this.healthBar.fillRect(x, y, width, height);

        const hpPercent = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
        this.healthBar.fillStyle(0xff0000); 
        this.healthBar.fillRect(x, y, width * hpPercent, height);
    }

        capture(newOwner) {
        this.owner = newOwner;
        this.hp = this.maxHp;

        // Couleurs par joueur
        const playerColors = {
            0: 0xff0000, // rouge
            1: 0x0000ff, // bleu
            2: 0x00ff00  // vert (si futur joueur)
        };

        this.setTint(playerColors[newOwner] || 0x808080);

        this.updateHealthBar();
    }
}