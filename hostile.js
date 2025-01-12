import { Object3D, Vector3 } from "three";

export class Hostile extends Object3D{
    constructor(hp=1,spd=0.02,power=1,sight=120){
        super();
        this.hp = hp;
        this.spd = spd;
        this.power = power;
        this.sight = sight;
    }
}

export class Bullet extends Object3D{
    constructor(pwr=1,spd=11,lt=1,dir=new Vector3(0,0,1)){
        super();
        this.pwr = pwr;
        this.spd = spd;
        this.lt = lt;
        this.dir = dir;
        this.init = Date.now();
    }

    move(){
        this.position.x += this.dir.x * this.spd;
        this.position.y += this.dir.y * this.spd;
        this.position.z += this.dir.z * this.spd;
    }

    fizzle(t){
        if(t > this.init + this.lt*1000){
            return true;
        }
    }
}