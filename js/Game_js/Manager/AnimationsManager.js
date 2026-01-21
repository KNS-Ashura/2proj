// AnimationsManager.js
export default class AnimationsManager {
    constructor(scene) {
        this.scene = scene;
    }

    createAnimations(unit) {


        anims.forEach(unit => {
            const key = `${unit.name}_Walk.png`;
                 this.scene.anims.create({
                    key,
                    frames: this.scene.anims.generateFrameNumbers(key, { start: anim.frames[0], end: anim.frames[1] }),
                    frameRate: anim.frameRate,
                    repeat: anim.repeat
                });
        });
    }
}
