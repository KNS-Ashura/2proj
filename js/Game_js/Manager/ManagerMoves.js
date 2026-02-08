import Phaser from "phaser";

export default class MovesManager {
    constructor(scene) {
        this.scene = scene;
        this.selectedUnits = [];
        this.registeredUnits = [];
        this.camps = []; 
        this.isSelecting = false;
        this.isDragging = false;
        this.startPoint = new Phaser.Math.Vector2();
        this.dragThreshold = 10; 
        this.selectionBox = this.scene.add.graphics().setDepth(2000000);
        this.debugGraphics = this.scene.add.graphics().setDepth(2000000);
        this.scene.input.mouse.disableContextMenu();
        this.shiftKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        
        this.setupInput();
    }

    registerUnit(sprite) {
        if (this.registeredUnits.includes(sprite)) return;
        sprite.setInteractive(); 
        sprite.isSelected = false;
        sprite.selectionCircle = this.scene.add.circle(sprite.x, sprite.y, 30)
            .setStrokeStyle(2, 0xff0000)
            .setVisible(false)
            .setDepth(1999999); 

        this.registeredUnits.push(sprite);
        console.log("Unité enregistrée :", sprite); 
    }

    registerCamps(campsList) {
        this.camps = campsList;
    }

    setupInput() {
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                if (this.selectedUnits.length > 0) {
                    this.handleMoveCommand(pointer);
                }
                return;
            }

            if (pointer.leftButtonDown()) {
                this.isSelecting = true;
                this.startPoint.set(pointer.worldX, pointer.worldY);
                
                // Utilisation de unit.body pour la détection du clic
                const clickedUnit = this.registeredUnits.find(unit => {
                    const b = unit.body || unit.getBounds();
                    return pointer.worldX >= b.x && pointer.worldX <= b.x + b.width &&
                           pointer.worldY >= b.y && pointer.worldY <= b.y + b.height;
                });

                if (clickedUnit) {
                    this.handleUnitSelection(clickedUnit);
                    this.isSelecting = false; 
                    return; 
                }
                const camps = this.scene.MapManager ? this.scene.MapManager.camps : [];
                const clickedCamp = camps.find(camp => 
                    camp.getBounds().contains(pointer.worldX, pointer.worldY)
                );

                if (clickedCamp) {
                    if (clickedCamp.owner === 0) {
                        console.log("Camp cliqué ! Ouverture du menu.");
                        this.scene.registry.events.emit('openRecruitment', clickedCamp);
                        this.isSelecting = false;
                        return;
                    }
                }
            }
        });

        this.scene.input.on('pointermove', (pointer) => {
            if (!this.isSelecting) return;

            const dist = Phaser.Math.Distance.Between(this.startPoint.x, this.startPoint.y, pointer.worldX, pointer.worldY);
            if (dist > this.dragThreshold) {
                this.isDragging = true;
                this.drawSelectionBox(pointer);
            }
        });

        this.scene.input.on('pointerup', (pointer) => {
            if (pointer.leftButtonReleased()) {
                if (this.isDragging) {
                    this.selectUnitsInBox(pointer);
                } else if (this.isSelecting) {
                    this.deselectAll();
                    this.scene.registry.events.emit('closeRecruitment');
                }
            }
            this.isSelecting = false;
            this.isDragging = false;
            this.selectionBox.clear();
        });
    }

    handleUnitSelection(unit) {
        const isShift = this.shiftKey.isDown;
        if (!isShift && !unit.isSelected) {
            this.deselectAll();
        }
        if (unit.isSelected && isShift) {
            this.deselectUnit(unit);
        } else {
            this.selectUnit(unit);
        }
    }

    selectUnit(unit) {
        if (unit.isSelected) return;
        unit.isSelected = true;
        const role = unit.unit.role;
        if (unit.selectionCircle) unit.selectionCircle.setVisible(true);
        this.selectedUnits.push(unit);
    }

    deselectUnit(unit) {
        unit.isSelected = false;
        if (unit.selectionCircle) unit.selectionCircle.setVisible(false);
        this.selectedUnits = this.selectedUnits.filter(u => u !== unit);
    }

    deselectAll() {
        this.selectedUnits.forEach(u => {
            u.isSelected = false;
            if (u.selectionCircle) u.selectionCircle.setVisible(false);
        });
        this.selectedUnits = [];
    }

    drawSelectionBox(pointer) {
        this.selectionBox.clear();
        const w = pointer.worldX - this.startPoint.x;
        const h = pointer.worldY - this.startPoint.y;
        this.selectionBox.lineStyle(2, 0x00ff00);
        this.selectionBox.strokeRect(this.startPoint.x, this.startPoint.y, w, h);
        this.selectionBox.fillStyle(0x00ff00, 0.2);
        this.selectionBox.fillRect(this.startPoint.x, this.startPoint.y, w, h);
    }

    selectUnitsInBox(pointer) {
        const selectionRect = new Phaser.Geom.Rectangle(
            Math.min(this.startPoint.x, pointer.worldX),
            Math.min(this.startPoint.y, pointer.worldY),
            Math.abs(pointer.worldX - this.startPoint.x),
            Math.abs(pointer.worldY - this.startPoint.y)
        );

        if (!this.shiftKey.isDown) this.deselectAll();
        this.registeredUnits.forEach(unit => {
            const bounds = unit.body || unit.getBounds();
            if (Phaser.Geom.Intersects.RectangleToRectangle(selectionRect, bounds)) {
                this.selectUnit(unit);
            }
        });
    }

    handleMoveCommand(pointer) {
        const spacing = 50;
        const cols = Math.ceil(Math.sqrt(this.selectedUnits.length));
        this.selectedUnits.forEach((unit, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const targetX = pointer.worldX + (col - cols/2) * spacing;
            const targetY = pointer.worldY + (row - Math.ceil(this.selectedUnits.length/cols)/2) * spacing;
        
            this.moveUnit(unit, targetX, targetY);
        });
    }

    moveUnit(unit, x, y) {
        unit.targetPos = new Phaser.Math.Vector2(x, y);
        if (unit.body) {
            this.scene.physics.moveToObject(unit, unit.targetPos, 150); 
        }
    }

    updateAnimation(unit) {
        const SPRITE_FACES_LEFT = false; 

        if (!unit.body || unit.body.speed < 10) {
            const direction = unit.lastDirection || 'F'; 
            unit.play(`${unit.unit.name}_Idle_${direction}`, true);
            return;
        }

        const angle = Phaser.Math.RadToDeg(unit.body.velocity.angle());
        let direction = 'F';
        let flipX = false;
        if (angle > -22.5 && angle <= 22.5) {
            direction = 'S'; 
            flipX = false;
        } else if (angle > 22.5 && angle <= 67.5) {
            direction = 'F_S'; 
            flipX = false;
        } else if (angle > 67.5 && angle <= 112.5) {
            direction = 'F'; 
            flipX = false;
        } else if (angle > 112.5 && angle <= 157.5) {
            direction = 'F_S'; 
            flipX = true;
        } else if (angle > 157.5 || angle <= -157.5) {
            direction = 'S'; 
            flipX = true;
        } else if (angle > -157.5 && angle <= -112.5) {
            direction = 'B_S'; 
            flipX = true;
        } else if (angle > -112.5 && angle <= -67.5) {
            direction = 'B'; 
            flipX = false;
        } else if (angle > -67.5 && angle <= -22.5) {
            direction = 'B_S'; 
            flipX = false;
        }
        unit.setFlipX(SPRITE_FACES_LEFT ? !flipX : flipX); 
        unit.lastDirection = direction;
        unit.play(`${unit.unit.name}_Run_${direction}`, true);
    }

    update() {
        this.debugGraphics.clear();
        this.debugGraphics.lineStyle(1, 0x0000ff, 0.5);
        this.registeredUnits.forEach(unit => {
            if (unit.selectionCircle) unit.selectionCircle.setPosition(unit.x, unit.y);
            const bounds = unit.body || unit.getBounds();
            this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            if (unit.targetPos && unit.body) {
                const dist = Phaser.Math.Distance.Between(unit.x, unit.y, unit.targetPos.x, unit.targetPos.y);
                if (dist < 5) {
                    unit.body.reset(unit.targetPos.x, unit.targetPos.y); 
                    unit.targetPos = null;
                }
            }
            this.updateAnimation(unit);
        });
    }
}
   