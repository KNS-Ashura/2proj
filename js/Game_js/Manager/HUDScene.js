import TopBar from '../UI/TopBar.js';
import MainMenu from '../UI/MainMenu.js';
import Minimap from '../UI/Minimap.js';

export default class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }

    create() {
        console.log("HUD Scene Started");

        // 1. Récupérer les dimensions de l'écran
        const { width, height } = this.scale;

        // 2. Instancier les 3 composants visuels
        // On passe 'this' (la scène) pour qu'ils puissent dessiner dedans
        this.topBar = new TopBar(this, width);
        this.mainMenu = new MainMenu(this, width, height);
        this.minimap = new Minimap(this, width, height);

        // 3. Gérer le redimensionnement de la fenêtre (Responsive)
        this.scale.on('resize', (gameSize) => {
            this.resize(gameSize.width, gameSize.height);
        });

        // 4. (Futur) C'est ici qu'on écoutera les événements du jeu
        // this.setupEventListeners();
    }

    update(time, delta) {
        // Mise à jour du chrono dans la TopBar
        if (this.topBar) this.topBar.update(time);

        // Mise à jour de la minimap (positions des points)
        if (this.minimap) this.minimap.update();
    }

    resize(width, height) {
        // On ordonne à chaque composant de se replacer
        if (this.topBar) this.topBar.resize(width);
        if (this.mainMenu) this.mainMenu.resize(width, height);
        if (this.minimap) this.minimap.resize(width, height);
    }
}