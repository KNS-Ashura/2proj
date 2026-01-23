export default class MovesManager {
    constructor(scene, tileWidth = 512, tileHeight = 185) {
        this.scene = scene;
        this.selectedUnits = [];
        this.target = new Phaser.Math.Vector2();

        // Dimensions des tuiles pour la conversion isométrique
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;

        // Offset de la map (doit correspondre à MapManager)
        this.offsetX = 800;
        this.offsetY = 200;

        // Variables pour la box selection
        this.selectionBox = null;
        this.startPoint = { x: 0, y: 0 };
        this.isSelecting = false;
        this.isDragging = false;
        this.dragThreshold = 5;

        // Liste des unités enregistrées
        this.registeredUnits = [];
    }


    // Convertit les coordonnées monde en coordonnées de tuile isométrique

    worldToTile(worldX, worldY) {
        const x = worldX - this.offsetX;
        const y = worldY - this.offsetY;
        const tileX = (x / (this.tileWidth / 2) + y / (this.tileHeight / 2)) / 2;
        const tileY = (y / (this.tileHeight / 2) - x / (this.tileWidth / 2)) / 2;
        return { x: tileX, y: tileY };
    }

    
    // Convertit les coordonnées de tuile en coordonnées monde
     
    tileToWorld(tileX, tileY) {
        const worldX = (tileX - tileY) * (this.tileWidth / 2) + this.offsetX;
        const worldY = (tileX + tileY) * (this.tileHeight / 2) + this.offsetY;
        return { x: worldX, y: worldY };
    }

    //la fonction permet d'enregistrer une unité pour la gestion des mouvements et de la sélection
    registerUnit(sprite) {
        sprite.setInteractive();
        sprite.isSelected = false;

        // ca cree une sorte de cercle de selection au tour de l'unité (hit box un peu) mais qu'on voit jamais
        if (!sprite.selectionCircle) {
            sprite.selectionCircle = this.scene.add.circle(
                sprite.x,
                sprite.y,
                30,
                0x00ff00,
                0
            );
            sprite.selectionCircle.setStrokeStyle(2, 0x00ff00);
            sprite.selectionCircle.setVisible(false);
            sprite.selectionCircle.setDepth(sprite.depth + 1);
        }

        sprite.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this.handleUnitClick(sprite, pointer);
        });

        // Ajouter à la liste des unités
        if (!this.registeredUnits.includes(sprite)) {
            this.registeredUnits.push(sprite);
        }
    }


    // Gère le clic sur une unité

    handleUnitClick(sprite, pointer) {

        // Vérifier si Shift est enfoncé
        const shiftKey = this.scene.input.keyboard.addKey('SHIFT');
        const isShiftDown = shiftKey.isDown;

        if (!sprite.isSelected) {
            // Si Shift n'est pas enfoncé, désélectionner tout
            if (!isShiftDown) {
                this.deselectAllUnits();
            }
            this.selectUnit(sprite);
        } else {
            // Si l'unité est déjà sélectionnée et Shift est enfoncé, la désélectionner
            if (isShiftDown) {
                this.deselectUnit(sprite);
            } else {
                // Sinon, désélectionner tout sauf celle-ci
                this.deselectAllUnits();
                this.selectUnit(sprite);
            }
        }
    }

    //Sélectionne une unité
    selectUnit(sprite) {
        if (!sprite.isSelected) {
            sprite.isSelected = true;
            this.selectedUnits.push(sprite);
            sprite.setTint(0x00ff00);

            if (sprite.selectionCircle) {
                sprite.selectionCircle.setVisible(true);
            }

            console.log("Unit selected:", sprite.unit?.name);
        }
    }

    // Déslectionne une unité
    deselectUnit(sprite) {
        sprite.isSelected = false;
        sprite.clearTint();

        if (sprite.body) {
            sprite.body.setVelocity(0);
        }

        if (sprite.selectionCircle) {
            sprite.selectionCircle.setVisible(false);
        }

        // Retirer de la liste
        const index = this.selectedUnits.indexOf(sprite);
        if (index > -1) {
            this.selectedUnits.splice(index, 1);
        }

        console.log("Unit deselected:", sprite.unit?.name);
    }

    //déselectionne toutes les unités
    deselectAllUnits() {
        [...this.selectedUnits].forEach(sprite => {
            this.deselectUnit(sprite);
        });
    }

    //Initialise la gestion de la box selection et des clics
    setupSceneClickHandler() {
        // Visuel de la box selection
        this.selectionBox = this.scene.add.graphics();
        this.selectionBox.setDepth(10000);

        // Créer les touches de modification
        this.shiftKey = this.scene.input.keyboard.addKey('SHIFT');

        // Désactiver le menu contextuel sur clic droit
        this.scene.input.mouse.disableContextMenu();


        this.scene.input.on('pointerdown', (pointer, targets) => {
            // Si on clique sur une unité, ne pas démarrer la box selection
            if (targets.length > 0) {
                return;
            }

            // Clic droit = box selection
            if (pointer.rightButtonDown()) {
                this.isSelecting = true;
                this.isDragging = false;
                this.startPoint.x = pointer.worldX;
                this.startPoint.y = pointer.worldY;
            } else if (pointer.leftButtonDown()) {
                // Clic gauche = déplacement
                if (this.selectedUnits.length > 0) {
                    this.moveUnitsTo(pointer.worldX, pointer.worldY);
                }
            }
        });


        this.scene.input.on('pointermove', (pointer) => {
            if (!this.isSelecting) return;

            // Calculer la distance depuis le point de départ
            const distance = Phaser.Math.Distance.Between(
                this.startPoint.x,
                this.startPoint.y,
                pointer.worldX,
                pointer.worldY
            );

            // Si on dépasse le seuil, c'est un drag
            if (distance > this.dragThreshold) {
                this.isDragging = true;
            }

            if (this.isDragging) {
                this.drawSelectionBox(pointer);
            }
        });

        
        this.scene.input.on('pointerup', (pointer, targets) => {
            if (!this.isSelecting) return;

            if (this.isDragging) {
                // Box selection
                this.selectUnitsInBox(pointer);
                this.selectionBox.clear();
            }

            this.isSelecting = false;
            this.isDragging = false;
        });
    }

    // Dessine la box de sélection (rectangle)
    drawSelectionBox(pointer) {
        this.selectionBox.clear();

        const width = pointer.worldX - this.startPoint.x;
        const height = pointer.worldY - this.startPoint.y;

        // Rectangle de fond semi-transparent
        this.selectionBox.fillStyle(0x00ff00, 0.1);
        this.selectionBox.fillRect(this.startPoint.x, this.startPoint.y, width, height);

        // Bordure
        this.selectionBox.lineStyle(2, 0x00ff00, 1);
        this.selectionBox.strokeRect(this.startPoint.x, this.startPoint.y, width, height);
    }



    // Sélectionne les unités dans le rectangle

    selectUnitsInBox(pointer) {
        const bounds = {
            left: Math.min(this.startPoint.x, pointer.worldX),
            right: Math.max(this.startPoint.x, pointer.worldX),
            top: Math.min(this.startPoint.y, pointer.worldY),
            bottom: Math.max(this.startPoint.y, pointer.worldY)
        };

        // Vérifier si Shift est enfoncé pour ajouter à la sélection
        const isShiftDown = this.shiftKey.isDown;

        // Si Shift n'est pas enfoncé, désélectionner tout
        if (!isShiftDown) {
            this.deselectAllUnits();
        }

        // Sélectionner les unités dans le rectangle
        this.registeredUnits.forEach(sprite => {
            if (sprite.x >= bounds.left &&
                sprite.x <= bounds.right &&
                sprite.y >= bounds.top &&
                sprite.y <= bounds.bottom) {
                this.selectUnit(sprite);
            }
        });

        console.log(`${this.selectedUnits.length} unit(s) selected`);
    }


    // Déplace toutes les unités sélectionnées vers une position

    moveUnitsTo(x, y) {
        if (this.selectedUnits.length === 0) return;

        if (this.selectedUnits.length === 1) {
            // Une seule unité donc déplacement simple
            this.moveUnitTo(this.selectedUnits[0], x, y);
        } else {
            // Plusieurs unités donc formation (type armée ou groupe de soldats)
            this.moveUnitsInFormation(x, y);
        }
    }


    // Déplace une unité vers une position

    moveUnitTo(sprite, x, y) {
        this.target.x = x;
        this.target.y = y;
        const speed = (sprite.unit?.walkSpeed || 4000) * 2;

        if (sprite.body) {
            this.scene.physics.moveToObject(sprite, this.target, speed);
        }

        sprite.targetX = x;
        sprite.targetY = y;

        console.log(`Moving ${sprite.unit?.name} to (${x}, ${y})`);
    }


    // Déplace plusieurs unités en formation

    moveUnitsInFormation(centerX, centerY) {
        const spacing = 60; // Espacement entre les unités
        const columns = Math.ceil(Math.sqrt(this.selectedUnits.length));

        this.selectedUnits.forEach((sprite, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;

            // Calculer la position relative
            const offsetX = (col - columns / 2) * spacing;
            const offsetY = (row - Math.floor(this.selectedUnits.length / columns) / 2) * spacing;

            const targetX = centerX + offsetX;
            const targetY = centerY + offsetY;

            this.moveUnitTo(sprite, targetX, targetY);
        });

        console.log(`Moving ${this.selectedUnits.length} units in formation`);
    }


    // Mise à jour (arrêt des unités à destination)

    update() {
        this.selectedUnits.forEach(sprite => {
            if (sprite.body && sprite.body.speed > 0 && sprite.targetX && sprite.targetY) {
                const distance = Phaser.Math.Distance.Between(
                    sprite.x,
                    sprite.y,
                    sprite.targetX,
                    sprite.targetY
                );

                if (distance < 4) {
                    sprite.body.reset(sprite.targetX, sprite.targetY);
                    sprite.setDepth(sprite.targetY + 2);
                }
            }

            this.updateUnitAnimation(sprite);

            // Mettre à jour la position du cercle de sélection
            if (sprite.selectionCircle) {
                sprite.selectionCircle.setPosition(sprite.x, sprite.y);
                sprite.selectionCircle.setDepth(sprite.depth + 1);
            }
        });
    }

        updateUnitAnimation(sprite) {
        if (!sprite.body) return;

        const vx = sprite.body.velocity.x;
        const vy = sprite.body.velocity.y;

        const speed = Math.abs(vx) + Math.abs(vy);

        // Idle
        if (speed < 1) {
            if (!sprite.anims.isPlaying || !sprite.anims.currentAnim.key.includes('Idle')) {
                sprite.anims.play(`Character0_Idle_${sprite.lastDir}`, true);
            }
            return;
        }

        // Walk
        const dir = sprite.unit.getIsoDirection(vx, vy);
        sprite.lastDir = dir;

        // Mirror pour droite
        if (vx > 0 && dir === 'S') {
            sprite.setFlipX(true);
        } else {
            sprite.setFlipX(false);
        }

        const animKey = `Character0_Run_${dir}`;

        if (!sprite.anims.isPlaying || sprite.anims.currentAnim.key !== animKey) {
            sprite.anims.play(animKey, true);
        }
    }


    // Nettoie les ressources

    destroy() {
        if (this.selectionBox) {
            this.selectionBox.destroy();
        }
        this.registeredUnits.forEach(sprite => {
            if (sprite.selectionCircle) {
                sprite.selectionCircle.destroy();
            }
        });
    }
}