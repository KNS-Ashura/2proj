import Phaser from "phaser";
import MapManager from "./MapManager.js";
import CameraManager from "./CameraManager.js";
/* import UnitsManager from "./UnitsManager.js"; */

export default class MainSceneManager extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
    }

    preload() {
        // Map
        
        this.MapManager = new MapManager(this);
        this.MapManager.registerAssets(this.load);

        // Units
/*         this.UnitManager = new UnitsManager(this);
        this.UnitManager.registerAssets(this.load); */

    }

    create() {
        // Managers
        this.cameraManager = new CameraManager(this);
/*         this.UnitManager.createAnimations(); */

        // Création map
        this.MapManager.generateMap();
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
