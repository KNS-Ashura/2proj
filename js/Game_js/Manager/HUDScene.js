import TopBar from '../UI/TopBar.js';
import MainMenu from '../UI/MainMenu.js';
import Minimap from '../UI/Minimap.js';

export default class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }

    create() {
        console.log("HUD Scene Started"); // Pour vérifier dans la console F12

        // Récupérer les dimensions de l'écran
        const { width, height } = this.scale;


        this.topBar = new TopBar(this, width);
        //this.mainMenu = new MainMenu(this, width, height);
        //this.minimap = new Minimap(this, width, height);

        // Gérer le redimensionnement de la fenêtre en gros c'est le responsive du jeu video
        this.scale.on('resize', (gameSize) => {
            this.resize(gameSize.width, gameSize.height);
        });
    }

    update(time, delta) {

        this.topBar.update(time);

        // mise a jour de la minimap mais à implémenter plus tard
        //this.minimap.update();
    }

    resize(width, height) {
        this.topBar.resize(width);
        //this.mainMenu.resize(width, height);
        //this.minimap.resize(width, height);
    }
}