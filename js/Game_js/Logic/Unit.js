export default class Unit {
    constructor({ hp, name, walkSpeed, hitSpeed, buildTime, range, price, frameWidth, frameHeight }) {
        this.hp = hp;
        this.name = name;
        this.walkSpeed = walkSpeed;
        this.hitSpeed = hitSpeed;
        this.buildTime = buildTime;
        this.range = range;
        this.price = price;
        this.state = "Idle";
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
    }

    setState(state) {
        this.state = state;
    }

    getIsoDirection(dx, dy) {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;


        if (angle < -112.5 && angle >= -157.5) return 'B';
        if (angle < -67.5 && angle >= -112.5) return 'B_S';


        if (angle >= 157.5 || angle < -157.5) return 'S';


        if (angle >= 67.5 && angle < 112.5) return 'F_S';
        if (angle >= 22.5 && angle < 67.5) return 'F';

        return 'S';
    }
}
