import { Object3D } from "three";

export class Hostile extends Object3D{
    constructor(hp=1,spd=0.02,power=1,sight=120){
        super();
        this.hp = hp;
        this.spd = spd;
        this.power = power;
        this.sight = sight;
    }
}