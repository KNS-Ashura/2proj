import Phaser from "phaser";
import MainScene from "./Manager/MainSceneManager.js";

window.addEventListener('gameStart', () => {
    const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        scene: MainScene,
        physics: {
            default: 'arcade',
            arcade: {
                debug: true,
                gravity: { y: 0 } 
            }
        },
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };
    new Phaser.Game(config);
});