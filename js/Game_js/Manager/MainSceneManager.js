import Phaser from "phaser";
import MapManager from "./MapManager.js";
import CameraManager from "./CameraManager.js";
import CampManager from "./campManager.js";
//import UnitManager from "./UnitsManager.js";

export default class MainSceneManager extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
    }

    preload() {
        // Map
        this.load.image("grass", "assets/grass.png");
        this.load.image("water", "assets/water.png");
        //this.load.image("campSquare", "assets/Web_assets/flavicon.png");

        // Units
       // this.load.image("goblin_idle", "assets/goblin_idle.png");
        //this.load.image("goblin_attack", "assets/goblin_attack.png");
    }

    create() {
        // Managers
        this.mapManager = new MapManager(this);
        this.cameraManager = new CameraManager(this);
        //this.unitManager = new UnitManager(this);

        // Création map
        this.mapManager.generateMap();
        //this.CampManager.generateCamp(); PIERRE

        // Gestion input
       /*  this.input.on("pointerdown", pointer => {
            this.unitManager.spawnAtPointer(pointer);
        }); */
    }

/*     update(time, delta) {
        this.unitManager.update(time, delta);
    } */
}
