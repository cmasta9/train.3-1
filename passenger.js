export class Passenger{
    constructor(name='anon',destiny=undefined,board=-1,money=100,boarded=false,offset=undefined){
        this.name = name;
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
}