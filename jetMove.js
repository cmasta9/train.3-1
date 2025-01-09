import {Object3D,Vector3} from 'three';
import {dirTo} from './loc.js';

let thresh = 0.02;
let maxInc = 0.9;
let maxInc2 = 0.5;
export let fore = new Vector3();
let up = new Vector3();
let rt = new Vector3();

export function moveJet(p,spd,gY=0){
    let targ = new Vector3();
    p.getWorldDirection(targ);
    p.position.x += targ.x * spd;
    if(p.position.y + (targ.y * spd) > gY){
        p.position.y += targ.y * spd;
    }
    p.position.z += targ.z * spd;
}

export function moveJet2(p,spd,bound){
    let targ = new Vector3();
    p.getWorldDirection(targ);
    if(Math.abs(p.position.x + targ.x*spd) <= bound[0]/2){
        p.position.x += targ.x * spd;
    }
    if(p.position.y + targ.y*spd <= bound[1] && p.position.y + targ.y*spd >= 0){
        p.position.y += targ.y * spd;
    }
    p.position.z += targ.z * spd;
}

export function jetSpd(spd,max,base,acc,b){
    if(b){
        if(spd < max){
            spd += acc;
        }else{
            spd = max;
        }
    }else{
        if(spd > base){
            spd -= acc;
        }else{
            spd = base;
        }
    }
    return spd;
}

export function moveJetCam(p,c,turnSpd,inp,child=0){
    p.children[child].getWorldPosition(up);
    p.getWorldDirection(fore);
    rt.crossVectors(fore,dirTo(p.position,up));
    //console.log(fore,rt);
    if(inp[1] != 0){
        if(inp[1] > 0){
            if(fore.dot(new Vector3(0,1,0)) > -maxInc){
                p.rotateOnWorldAxis(rt,-turnSpd*inp[1]);
            }
        }else{
            if(fore.dot(new Vector3(0,1,0)) < maxInc){
                p.rotateOnWorldAxis(rt,-turnSpd*inp[1]);
            }
        }
        //console.log(fore.dot(new Vector3(0,1,0)));
    }
    if(inp[0] != 0){
        p.rotateOnWorldAxis(dirTo(p.position,up),-turnSpd*inp[0]);
        //console.log(rt.dot(new Vector3(0,1,0)));
    }
    if(Math.abs(rt.dot(new Vector3(0,1,0))) > thresh){
        p.rotateOnWorldAxis(fore,rt.dot(new Vector3(0,1,0)));
    }
    c.lookAt(p.position);
}

export function moveJetCam2(p,c,climbSpd,turnSpd,inp,xBound,child=0){
    p.children[child].getWorldPosition(up);
    p.getWorldDirection(fore);
    rt.crossVectors(fore,dirTo(p.position,up));
    //console.log(fore,rt);
    if(inp[1] != 0){
        if(inp[1] > 0){
            if(fore.dot(new Vector3(0,1,0)) > -maxInc2){
                p.rotateOnWorldAxis(rt,-climbSpd*inp[1]);
            }
        }else{
            if(fore.dot(new Vector3(0,1,0)) < maxInc2){
                p.rotateOnWorldAxis(rt,-climbSpd*inp[1]);
            }
        }
        //console.log(fore.dot(new Vector3(0,1,0)));
    }
    if(inp[0] != 0){
        if(p.position.x + rt.x*turnSpd*inp[0] <= xBound/2 && p.position.x + rt.x*turnSpd*inp[0] > -xBound/2){
            p.position.x += rt.x*turnSpd*inp[0];
        }
        p.position.y += rt.y*turnSpd*inp[0];
        p.position.z += rt.z*turnSpd*inp[0];
    }
    if(Math.abs(rt.dot(new Vector3(0,1,0))) > 0){
        p.rotateOnWorldAxis(fore,rt.dot(new Vector3(0,1,0)));
    }
    c.lookAt(p.position);
}