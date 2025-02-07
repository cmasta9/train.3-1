import { Object3D } from "three";

export class Passenger extends Object3D{
    constructor(name='anon',health=3,destiny=undefined,board=-1,money=100,boarded=false,offset=undefined){
        super();
        this.name = name;
        this.health = health;
        this.destiny = destiny;
        this.board = board;
        this.money = money;
        this.boarded = boarded;
        this.offset = offset;
    }

    decideRand(n){
        return Math.floor(Math.random()*n);
    }

    has(n){
        if(n >= this.money){
            return true;
        }else{
            return false;
        }
    }

    earn(n){
        this.money += n;
        return this.money;
    }

    spend(n){
        if(this.money >= n){
            this.money -= n;
            return this.money;
        }else{
            return this.money - n;
        }
    }

    damage(n){
        this.health -= n;
        return this.health;
    }

    heal(n){
        this.health += n;
        return this.health;
    }
}