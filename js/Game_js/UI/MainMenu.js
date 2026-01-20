export default class MainMenu {
    constructor(scene, screenWidth, screenHeight) {
        this.scene = scene;

        // 1. Setup de base (Container + Graphics)
        this.container = scene.add.container(0, 0);
        this.graphics = scene.add.graphics();
        this.container.add(this.graphics);

        // 2. Créer les Textes
        const textStyle = { font: '14px Arial', fill: '#ffffff', lineSpacing: 5 };

        // Texte GAUCHE (Stats Joueur)
        // On met un texte par défaut pour voir que ça marche
        this.leftText = scene.add.text(0, 0, 'Joueur: Héros\nPV: 100/100\nOr: 500', textStyle);

        // Texte DROITE (Sélection)
        this.rightText = scene.add.text(0, 0, 'Sélection: Aucune', textStyle);

        // Ajouter les textes au container
        this.container.add(this.leftText);
        this.container.add(this.rightText);

        // 3. Dessiner le tout
        this.resize(screenWidth, screenHeight);
    }

    resize(width, height) {
        this.graphics.clear();

        // --- CONSTANTES DE TAILLE ---
        const panelHeight = 120;
        const yPos = height - panelHeight;

        const minimapSpace = 180; // 150 (taille minimap) + 20 (marge) + 10 (petit espace vide)
        const leftMargin = 20;    // Espace vide à gauche (tu peux augmenter ça si tu veux)

        // --- CALCULS DE LA BOÎTE DU MENU ---
        const menuX = leftMargin;
        // La largeur disponible est la largeur totale moins les marges de chaque côté
        const menuWidth = width - minimapSpace - leftMargin;

        // --- 1. DESSINER LE FOND ---
        this.graphics.fillStyle(0x8B4513, 1);
        // On dessine à partir de menuX et sur la largeur calculée (menuWidth)
        this.graphics.fillRect(menuX, yPos, menuWidth, panelHeight);

        // --- 2. DESSINER LA BORDURE HAUTE ---
        this.graphics.lineStyle(4, 0xD2B48C);
        this.graphics.beginPath();
        this.graphics.moveTo(menuX, yPos);              // Début du trait
        this.graphics.lineTo(menuX + menuWidth, yPos);  // Fin du trait (avant la minimap)
        this.graphics.strokePath();

        // --- 3. DESSINER LE SÉPARATEUR VERTICAL ---
        // Le milieu du MENU (pas le milieu de l'écran)
        const menuCenter = menuX + (menuWidth / 2);

        this.graphics.lineStyle(2, 0x000000, 0.5);
        this.graphics.beginPath();
        this.graphics.moveTo(menuCenter, yPos + 10);
        this.graphics.lineTo(menuCenter, height - 10);
        this.graphics.strokePath();

        // --- 4. REPOSITIONNER LES TEXTES ---

        // Texte GAUCHE : Décalé par rapport au début du menu
        this.leftText.setPosition(menuX + 20, yPos + 20);

        // Texte DROITE : Commence au milieu du menu
        this.rightText.setPosition(menuCenter + 20, yPos + 20);
    }
    updateSelection(data) {
        if (!data) {
            this.rightText.setText("Sélection: Aucune");
        } else {
            // Exemple : On affiche le type et les PV de l'unité sélectionnée
            this.rightText.setText(
                `Type: ${data.type}\n` +
                `PV: ${data.hp}/${data.maxHp}\n` +
                `Dégâts: ${data.damage}`
            );
        }
    }

    /**
     * Met à jour les stats du joueur à gauche
     */
    updatePlayerStats(stats) {
        this.leftText.setText(
            `Joueur: ${stats.name}\n` +
            `PV Base: ${stats.hp}\n` +
            `Unités: ${stats.unitCount}`
        );
    }
}