export default class MainMenu {
    constructor(scene, screenWidth, screenHeight) {
        this.scene = scene;

        // // 1. Setup de base (Container + Graphics)
        // // this.container = scene.add.container(0, 0);
        // // this.graphics = scene.add.graphics();
        // // this.container.add(this.graphics);

        // // 2. Créer les Textes
        // // - leftText pour les stats du joueur
        // // - rightText pour la sélection
        // this.leftText = // ... À TOI DE JOUER
        //     this.rightText = // ... À TOI DE JOUER

        //     this.container.add(this.leftText);
        // this.container.add(this.rightText);

        // this.resize(screenWidth, screenHeight);
    }

    resize(width, height) {
        // this.graphics.clear();

        // // Définir la hauteur du panneau (ex: 120px)
        // const panelHeight = 120;
        // const yPos = height - panelHeight; // Position Y du haut du panneau

        // // 1. Dessiner le fond (Marron) qui prend toute la largeur
        // // Indice : fillRect(0, yPos, width, panelHeight)
        // // ... À TOI DE JOUER

        // // 2. Dessiner une bordure décorative en haut du panneau
        // // Indice : lineStyle + lineBetween (ou moveTo/lineTo)
        // // ... À TOI DE JOUER

        // // 3. Dessiner la ligne de séparation verticale au milieu
        // // ... À TOI DE JOUER

        // // 4. Repositionner les textes
        // // Le texte de gauche doit être vers x=20, y=yPos+20
        // // Le texte de droite doit être vers x=(width/2)+20
        // // ... À TOI DE JOUER
    }

    updateSelection(data) {
        // // Vérifier si 'data' est null (rien sélectionné) ou contient une unité
        // if (!data) {
        //     // Afficher "Aucune sélection"
        //     // ... À TOI DE JOUER
        // } else {
        //     // Afficher les infos de l'unité (data.type, data.hp, etc.)
        //     // ... À TOI DE JOUER
        // }
    }
}