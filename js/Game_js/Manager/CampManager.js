import Phaser from "phaser";

export class CampManager extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, owner) {
        super(scene, x, y, texture);
        this.owner = owner;
        
        this.setInteractive(); 
        this.setDepth(y);      
    }
}