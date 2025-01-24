import {Vector3,Raycaster} from 'three';

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

export function normalize(v){
    if(v.length() <= 0){
        return new Vector3();
    }else{
        return new Vector3(v.x,v.y,v.z).divideScalar(Math.sqrt(Math.pow(v.x,2)+Math.pow(v.y,2)+Math.pow(v.z,2)));
    }
}

export function addVec(v1,v2){
    return new Vector3(v1.x+v2.x,v1.y+v2.y,v1.z+v2.z);
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

export function raycast(s,pos,dir,f=1,n=0){
    let ray = new Raycaster(pos,dir,n,2*f);
    //console.log(dir);
    if(ray.intersectObjects(s.children).length > 0){
        return true;
    }
    return false;
}