import Phaser from "phaser";

export class CampManager extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, owner) {
        super(scene, x, y, texture);
        this.owner = owner;
        this.captureBy = null;      // qui est en train de capturer (null = personne)
        this.captureProgress = 0;   // progression du timer en ms

        this.setInteractive();
        this.setDepth(y);      
    }
}