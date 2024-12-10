import {Vector3} from 'three';

export function near(q,r,tol){
    if(dist(q,r) <= tol){
        return true;
    }else{
        return false;
    }
}

export function dist(i,f){
    return Math.sqrt(Math.pow(f.x-i.x,2)+Math.pow(f.y-i.y,2)+Math.pow(f.z-i.z,2));
}

export function dirTo(i,f){
    return new Vector3(f.x-i.x,f.y-i.y,f.z-i.z).divideScalar(dist(i,f));
}