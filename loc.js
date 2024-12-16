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

export function halfwayPt(i,f){
    return new Vector3(f.x-i.x,f.y-i.y,f.z-f.i).divideScalar(2);
}

export function progress(i,f,curr){
    return 1-(dist(curr,f)/dist(i,f));
}

export function pointOnLine(i,f,prog){
    let dir = new Vector3(f.x-i.x,f.y-i.y,f.z-i.z);
    return new Vector3(i.x + dir.x*prog, i.y + dir.y*prog, i.z + dir.z*prog);
}