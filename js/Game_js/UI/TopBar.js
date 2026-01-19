export default class TopBar {
    constructor(scene, screenWidth) {
        this.scene = scene;


        // un groupe tout dans un container pour la top bar
        this.container = scene.add.container(0, 0);

        // il faut creer un objet graphique pour dessiner les formes qui seront des designs ensuite
        this.graphics = scene.add.graphics();
        // graphics :ca permet de dessiner des formes géométriques (rectangles, cercles) sans avoir besoin d'images .png

        this.container.add(this.graphics);


        // Créer les textes pour l'or et le chrono, on pourra les rendres dynamiques plus tard

        this.goldText = scene.add.text(0, 0, 'Or: 0', { font: '16px Arial', fill: '#ffffff' }); // 0 0 pour mettre en haut a gauche
        this.timerText = scene.add.text(0, 0, '00:00', { font: '16px Arial', fill: '#ffffff' });

        // Ajouter les textes au container
        this.container.add(this.goldText);
        this.container.add(this.timerText);

        // Appel initial pour placer les éléments en gros ca charge direct quand on lance la page
        this.resize(screenWidth);
    }

    resize(width) {
        // Nettoyer les anciens dessins
        this.graphics.clear();



        this.graphics.fillStyle(0x333333, 0.8); // Gris foncé
        this.graphics.fillRoundedRect(20, 10, 150, 40, 10); // x, y, w, h, arrondi

        // Dessiner le fond du CHRONO
        this.graphics.fillStyle(0x333333, 0.8);
        this.graphics.fillRoundedRect(width / 2 - 50, 10, 100, 40, 10); // Centré


        const centerX = width / 2;
        const positionY = 30;

        this.timerText.setPosition(centerX, positionY);
        this.timerText.setOrigin(0.5, 0.5);
    }

    update(time) {

        // Convertir le temps
        let minutes = Math.floor(time / 60000); // 60 000 ms dans une minute
        let seconds = Math.floor((time % 60000) / 1000);


        // uniquement pour du design ca
        // exemple au lieu de 5:4 on aura 05:04
        this.timerText.setText(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
}