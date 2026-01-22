import Phaser from "phaser";
//importing classes 

import MainScene from "./Manager/MainSceneManager.js";


window.addEventListener('gameStart', () => {
    const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        scene: MainScene,
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
    }
    };
    new Phaser.Game(config);
});
