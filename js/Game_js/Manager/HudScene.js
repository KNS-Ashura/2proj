import Phaser from "phaser";

export default class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: "HUDScene" });
    }

    create() {
        this.goldText = this.add.text(20, 20, "Gold: 0", {
            fontSize: "32px",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        });

        this.createRecruitmentMenu();
        this.mainScene = this.scene.get('MainScene');

        this.registry.events.on('updateGold', (gold) => {
            this.goldText.setText(`Gold: ${gold}`);
        });

        this.registry.events.on('openRecruitment', (camp) => {
            this.selectedCamp = camp;
            this.menuContainer.setVisible(true);
        });

        this.registry.events.on('closeRecruitment', () => {
            this.menuContainer.setVisible(false);
            this.selectedCamp = null;
        });
    }

    createRecruitmentMenu() {
        this.menuContainer = this.add.container(400, 500);
        this.menuContainer.setVisible(false);

        const bg = this.add.rectangle(0, 0, 400, 100, 0x000000, 0.8);
        this.menuContainer.add(bg);

        const units = [
            { name: "Infantry", price: 50, index: 0 },
            { name: "Range", price: 100, index: 0 }, 
            { name: "Heavy", price: 150, index: 0 }
        ];

        units.forEach((unit, i) => {
            const xPos = -120 + (i * 120);
            const btn = this.add.rectangle(xPos, 0, 100, 80, 0x666666).setInteractive();
            const text = this.add.text(xPos, -10, `${unit.name}\n${unit.price}g`, { align: 'center', fontSize: '14px' }).setOrigin(0.5);
            btn.on('pointerdown', () => {
                this.mainScene.tryBuyUnit(unit.price, unit.index, this.selectedCamp);
            });

            this.menuContainer.add([btn, text]);
        });
    }
}