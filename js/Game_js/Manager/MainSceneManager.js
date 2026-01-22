import Phaser from "phaser";
import MapManager from "./MapManager.js";
import CameraManager from "./CameraManager.js";
import Unit from "../Logic/Unit.js";
import UnitsManager from "./UnitsManager.js";
import MovesManager from "./ManagerMoves.js";

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
            frameHeight: 460
        });

        this.unitsList = [character0];

        this.UnitsManager = new UnitsManager(this);
        this.UnitsManager.registerAssets(this.load, this.unitsList);



    }



    create() {
        // Managers
        this.cameraManager = new CameraManager(this);
        this.movesManager = new MovesManager(this);

        // Création map
        this.MapManager.generateMap();
        //this.CampManager.generateCamp(); PIERRE


        // Spawn du joueur
        this.playerSprite = this.UnitsManager.spawn(5, 5, this.units[0]);

        // Activer la physique sur le sprite et l'enregistrer pour les mouvements
        this.physics.add.existing(this.playerSprite);
        this.movesManager.registerUnit(this.playerSprite);
        this.movesManager.setupSceneClickHandler();
    }

    update() {
        this.movesManager.update();
    }
}
