import Phaser from "phaser";
//importing classes 

import MainScene from "./Manager/MainSceneManager.js";
import HUDScene from './Manager/HUDScene.js';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [MainScene, HUDScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MainScene, HUDScene]
};

new Phaser.Game(config);
