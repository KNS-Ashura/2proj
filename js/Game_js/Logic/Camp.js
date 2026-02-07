export default class Camp {
    constructor(hp, damage, hitSpeed, owner = null) {
        this.hp = hp;
        this.damage = damage;
        this.hitSpeed = hitSpeed;
        this.owner = owner; 
    }
}