export default class CameraManager {
    constructor(scene) {
        this.scene = scene;
        this.camera = this.scene.cameras.main;

        this.camera.centerOn(0, 0);
        this.camera.setZoom(1);

        this.setupInput();
    }

    setupInput() {
        // Zoom
        this.scene.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
            if (deltaY > 0) {
                const newZoom = this.camera.zoom - 0.1;
                if (newZoom > 0.3) this.camera.setZoom(newZoom);
            } else {
                const newZoom = this.camera.zoom + 0.1;
                if (newZoom < 2.5) this.camera.setZoom(newZoom);
            }
        });

        // Drag
        this.scene.input.on("pointermove", pointer => {
            if (!pointer.isDown) return;
            this.camera.scrollX -= (pointer.x - pointer.prevPosition.x) / this.camera.zoom;
            this.camera.scrollY -= (pointer.y - pointer.prevPosition.y) / this.camera.zoom;
        });
    }
}
