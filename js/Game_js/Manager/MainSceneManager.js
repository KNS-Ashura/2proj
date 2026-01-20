import Phaser from "phaser";
import MapManager from "./MapManager.js";
import CameraManager from "./CameraManager.js";
import Unit from "../Logic/Unit.js";
import UnitsManager from "./UnitsManager.js";

export default class MainSceneManager extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
    }

    preload() {
        // Map
        
        this.MapManager = new MapManager(this);
        this.MapManager.registerAssets(this.load);

        // Units

        const character0 = new Unit({
            name: "Character0",
            hp: 100,
            walkSpeed: 120,
            hitSpeed: 1,
            buildTime: 0,
            range: 1,
            price: 0,
            frameWidth: 460,
            frameHeight: 575
        });

        this.units = [character0];

        this.UnitsManager = new UnitsManager(this);
        this.UnitsManager.registerAssets(this.load, this.units);



    }

    

    create() {
        // Managers
        this.cameraManager = new CameraManager(this);
/*         this.UnitManager.createAnimations(); */

        // Création map
        this.MapManager.generateMap();
        //this.CampManager.generateCamp(); PIERRE
        
        // Création anims
        this.UnitsManager.createAnimations(this.units[0]);
        this.playerSprite = this.UnitsManager.spawn(0, 0, this.units[0]);

        // Gestion input
       /*  this.input.on("pointerdown", pointer => {
            this.unitManager.spawnAtPointer(pointer);
        }); */
    }

/*     update(time, delta) {
        this.unitManager.update(time, delta);
    } */
}
