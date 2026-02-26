import Phaser from "phaser";
import MapManager from "./MapManager.js";
import CameraManager from "./CameraManager.js";
import MovesManager from "./ManagerMoves.js"; 
import Unit from "../Logic/Unit.js";
import UnitsManager from "./UnitsManager.js";
import HUDScene from "./HudScene.js";
import EconomyManager from "./EconomyManager.js";
import VictoryConditions from "./VictoryConditions.js";

export default class MainSceneManager extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
        this.offsetX = 800;
        this.offsetY = 200;
    }

    preload() {
        this.MapManager = new MapManager(this);
        this.MapManager.registerAssets(this.load);
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
        this.scene.add("HUDScene", HUDScene, true);
        this.economyManager = new EconomyManager(this);
        this.cameraManager = new CameraManager(this);
        this.movesManager = new MovesManager(this);
        this.victoryConditions = new VictoryConditions(this);
        this.MapManager.generateMap();
        if (this.MapManager.camps) {
            this.movesManager.registerCamps(this.MapManager.camps);
        }
        this.UnitsManager.createAllAnimations(this.unitsList);
        const playerCamp = this.MapManager.camps.find(c => c.owner === 0);
        if (playerCamp) {
            this.cameraManager.camera.centerOn(playerCamp.x, playerCamp.y);
        }
    }

    update() {
        if (this.movesManager) {
            this.movesManager.update();
        }
        if (this.victoryConditions) {
            this.victoryConditions.update();
        }
    }

    tryBuyUnit(price, unitIndex, camp) {
        if (camp && this.economyManager.spendGold(price)) {
            const unitData = this.unitsList[unitIndex];
            const spawnX = camp.x;
            const spawnY = camp.y + 60; 
            const sprite = this.UnitsManager.spawnAt(spawnX, spawnY, unitData);
            sprite.owner = 0; // L'unite appartient au joueur
            this.physics.add.existing(sprite);
            this.movesManager.registerUnit(sprite);
            this.registry.events.emit('closeRecruitment');
            this.scene.get('HUDScene').events.emit('closeRecruitment');
        } else {
            console.log("Pas assez d'or ou pas de camp sélectionné.");
        }
    }
}