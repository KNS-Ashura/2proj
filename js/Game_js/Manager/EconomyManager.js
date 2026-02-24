import Phaser from "phaser";

export default class EconomyManager {
    constructor(scene) {
        this.scene = scene;
        this.gold = 0; 
        this.scene.registry.set('gold', this.gold);
        this.scene.registry.events.emit('updateGold', this.gold);
        this.startPassiveIncome();
    }

    startPassiveIncome() {
        this.scene.time.addEvent({
            delay: 1000,
            callback: this.generatePassiveIncome,
            callbackScope: this,
            loop: true
        });
    }

    generatePassiveIncome() {
        let income = 0;
        if (this.scene.MapManager && this.scene.MapManager.camps) {
            this.scene.MapManager.camps.forEach(camp => {
                if (camp.owner === 0) {
                    income += 10;
                }
            });
        }
        if (income > 0) {
            this.addGold(income);
        }
    }

    addGold(amount) {
        this.gold += amount;
        this.scene.registry.events.emit('updateGold', this.gold);
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.scene.registry.events.emit('updateGold', this.gold);
            return true;
        }
        return false;
    }
}
