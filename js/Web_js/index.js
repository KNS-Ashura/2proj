// coucou

import Phaser from "phaser";

console.log("coucou")

// Configuration du jeu
const config = {
    type: Phaser.AUTO,       // Phaser choisit WebGL si disponible, sinon Canvas
    width: 800,
    height: 600,
    backgroundColor: '#87ceeb', // ciel bleu
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Créer le jeu
const game = new Phaser.Game(config);

// Charger les assets
function preload() {
    this.load.image('player', 'assets/player.png'); // ton image de joueur
}

// Créer les objets du jeu
function create() {
    this.player = this.add.sprite(400, 300, 'player'); // placer le joueur au centre
}

// Boucle de jeu
function update() {
    // Déplacement du joueur avec les touches
    const cursors = this.input.keyboard.createCursorKeys();

    if (cursors.left.isDown) this.player.x -= 5;
    if (cursors.right.isDown) this.player.x += 5;
    if (cursors.up.isDown) this.player.y -= 5;
    if (cursors.down.isDown) this.player.y += 5;
}


