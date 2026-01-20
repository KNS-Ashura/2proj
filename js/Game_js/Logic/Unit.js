export default class Unit {
    constructor({ hp, name, walkSpeed, hitSpeed, buildTime, range, price, frameWidth, frameHeight}) {
        this.hp = hp;
        this.name = name;
        this.walkSpeed = walkSpeed;
        this.hitSpeed = hitSpeed;
        this.buildTime = buildTime;
        this.range = range;
        this.price = price;
        this.state = "Idle";
        this.frameWidth = frameWidth,
        this.frameHeight = frameHeight
    }

    setState(state) {
        this.state = state;
    }
}
