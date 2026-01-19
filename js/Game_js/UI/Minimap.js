export default class Minimap {
    constructor(scene, screenWidth, screenHeight) {
        this.scene = scene;

        
        this.graphics = scene.add.graphics();

        
        this.size = 150;    // Taille du carré
        this.margin = 20;   // Marge du bord

        // Initial resize
        this.resize(screenWidth, screenHeight);
    }

    resize(width, height) {
        // Toujours nettoyer avant de redessiner
        this.graphics.clear();

        //positionnement en bas à droite
        const x = width - this.size - this.margin;
        const y = height - this.size - this.margin;

        // valeur pour quand on en aura besoin plus tard dans update
        this.x = x;
        this.y = y;

        // fond (transparent)
        this.graphics.fillStyle(0x000000, 0.8); // Noir, opacité 80%
        this.graphics.fillRect(x, y, this.size, this.size);

        // bordure
        this.graphics.lineStyle(3, 0xffffff); // Blanc, 3px
        this.graphics.strokeRect(x, y, this.size, this.size);
    }

    update() {
        // on met rien ici en attendant d'implémenter la map dans la minimap
    }
}