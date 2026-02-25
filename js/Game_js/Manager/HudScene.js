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

        // Agrandir le fond pour accueillir plus d'unités sur 2 lignes
        const bg = this.add.rectangle(0, 0, 550, 220, 0x000000, 0.8);
        this.menuContainer.add(bg);

        const units = [
            { name: "Infantry", price: 50, index: 0 },
            { name: "Support", price: 120, index: 1 },
            { name: "Heal", price: 150, index: 2 },
            { name: "Range", price: 100, index: 3 },
            { name: "Heavy", price: 200, index: 4 },
            { name: "Anti-Armor", price: 130, index: 5 },
            { name: "Mortar", price: 250, index: 6 }
        ];

        units.forEach((unit, i) => {
            // Disposition en grille (4 colonnes max)
            const col = i % 4;
            const row = Math.floor(i / 4);
            
            const xPos = -195 + (col * 130);
            const yPos = -50 + (row * 100);

            const btn = this.add.rectangle(xPos, yPos, 120, 80, 0x666666).setInteractive();
            const text = this.add.text(xPos, yPos, `${unit.name}\n${unit.price}g`, { align: 'center', fontSize: '14px' }).setOrigin(0.5);
            btn.on('pointerdown', () => {
                this.mainScene.tryBuyUnit(unit.price, unit.index, this.selectedCamp);
            });

            this.menuContainer.add([btn, text]);
        });
    }
}