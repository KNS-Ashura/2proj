import Phaser from "phaser";
import MapManager from "./MapManager.js";
import CameraManager from "./CameraManager.js";
import Unit from "../Logic/Unit.js";
import UnitsManager from "./UnitsManager.js";

export default class MainSceneManager extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
        this.offsetX = 800;
        this.offsetY = 200;
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
        this.MapManager.generateMap(window.playerCount || 2);
        //this.CampManager.generateCamp(); PIERRE
        
        // Animations (optionnel ici, spawn peut le faire)
        this.UnitsManager.createAnimations(this.units[0]);

        // Spawn du joueur
        this.playerSprite = this.UnitsManager.spawn(5 ,5 ,this.units[0]);
    }

/*     update(time, delta) {
        this.unitManager.update(time, delta);
    } */
}
