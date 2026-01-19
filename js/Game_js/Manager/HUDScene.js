import TopBar from '../UI/TopBar.js';
import MainMenu from '../UI/MainMenu.js';
import Minimap from '../UI/Minimap.js';

export default class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }

    create() {
        console.log("HUD Scene Started");

        const { width, height } = this.scale;

        // Instancier la TopBar (
        this.topBar = new TopBar(this, width);


        // Instancier la Minimap
        this.minimap = new Minimap(this, width, height);


        // this.mainMenu = new MainMenu(this, width, height); pour le menu principal plus tard

        this.scale.on('resize', (gameSize) => {
            this.resize(gameSize.width, gameSize.height);
        });
    }

    update(time, delta) {
        this.topBar.update(time);


        if (this.minimap) this.minimap.update();
    }

    resize(width, height) {
        this.topBar.resize(width);


        if (this.minimap) {
            this.minimap.resize(width, height);
        }
    }
}