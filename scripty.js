import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const bgImg = './graphics/blueSky2.jpg';
const groundTex = './graphics/grass.jpg';
const trainHead = './graphics/engine.glb';
const trainCar = './graphics/passengercar.glb';
const track = './graphics/tracks.glb';

const music = document.createElement("AUDIO");
music.loop = true;
music.muted = true;
//music.src = bgMusic;

let start = false;

const cenText = document.getElementById('center');
const spdHud = document.getElementById('speed');
//cenText.innerText = 'LOADING...';

const stageDim = 800;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const tLoader = new THREE.TextureLoader();
const gLoader = new GLTFLoader();
const bgTex = tLoader.load(bgImg);
const gTex = tLoader.load(groundTex);
gTex.wrapS = THREE.RepeatWrapping;
gTex.wrapT = THREE.RepeatWrapping;
gTex.repeat.set(stageDim/4,stageDim/4);
bgTex.colorSpace = THREE.SRGBColorSpace;

const rend = new THREE.WebGLRenderer();
rend.setSize(window.innerWidth,window.innerHeight);
const ratio = rend.getPixelRatio();
document.body.appendChild(rend.domElement);

const xTrack = 0;

let engineSize = new THREE.Vector3();
let carSize = new THREE.Vector3();
let trackSize = new THREE.Vector3();
let trackLoad = 0;
let trainLoad = 0;
const trainCars = 3;
let tracksLoaded = false;

let pause = false;
let mouseDown = false;
const doubleTapThresh = 0.42;
let tapCounter = undefined;
let touchX = undefined;

const maxInput = 4;
let input = [0,0];

//const scenery = [];
const tracks = [];
const train = [];
const platforms = [];

let dTime = 0;
let prevTime = Date.now();
let lastZ = 0;
let spd = 0.02;
let maxSpd = 1;
let trainSpd = 0.5;
let accel = 0.008;
let idleTime = 3;
let driftSpd = 0.001;
let driftHei = 0.042;
let skyRot = 0.001;

const planeG = new THREE.PlaneGeometry(stageDim,stageDim);
const groundMat = new THREE.MeshLambertMaterial({map: gTex});
const skyMat = new THREE.MeshBasicMaterial({map: bgTex, side: THREE.DoubleSide});

const dome = new THREE.OctahedronGeometry(stageDim/2,4);
const sky = new THREE.Mesh(dome,skyMat);
const light = new THREE.DirectionalLight(0xffffff,2);
const ground = new THREE.Mesh(planeG,groundMat);
ground.rotation.x = -Math.PI/2;
ground.position.y = 0;
scene.add(ground);
scene.add(light);
scene.add(sky);
//scene.fog = new THREE.Fog(0xaaaaaa,0.2,stageDim-6);

let camRot = Math.PI/2;
let camDist = 30;
let camHeight = 1.6;

let fore = true;
let drift = true;
let approach = false;
let stop = false;
let idle = undefined;

initSizes();
setPlatforms();
let origin = new THREE.Vector3(0,camHeight,0);
cam.position.x = origin.x + camDist;
cam.position.y = origin.y;
cam.position.z = origin.z;
const trainGp = new THREE.Object3D();

//---------------------------- GAME LOOP -----------------------------//

rend.render(scene,cam);
rend.setAnimationLoop(anim);

function anim(){
    rend.render(scene,cam);
    if(trainLoad < trainCars){
        if(trackLoad > 2 && !tracksLoaded){
            setTracks();
            setTrain(3);
            tracksLoaded = true;
            origin.z = engineSize.z/2;
            trainGp.add(cam);
            cam.rotation.y = 3*Math.PI/4;
        }
    }else{
        moveTrain();
    }
    moveCam();
    sky.rotation.y += skyRot;
    let speedOm = (trainGp.position.z - lastZ) / ((Date.now() - prevTime)/1000) * (18/5);
    prevTime = Date.now();
    lastZ = trainGp.position.z;
    spdHud.innerText = `${Math.abs(speedOm).toPrecision(3)} km/hr`;
}

function near(q,r,tol){
    if(dist(q,r) <= tol){
        return true;
    }else{
        return false;
    }
}

function dist(i,f){
    return Math.sqrt(Math.pow(f.x-i.x,2)+Math.pow(f.y-i.y,2)+Math.pow(f.z-i.z,2));
}

function dirTo(i,f){
    return new THREE.Vector3(f.x-i.x,f.y-i.y,f.z-i.z).divideScalar(dist(i,f));
}

function doubleTap(){
    console.log('logged a doubleTap');
}

window.addEventListener('keydown', (k)=>{
    //console.log(`${k.key} down`);
    if((k.key == 'ArrowRight' || k.key == 'd') && Math.abs(input[0]) < maxInput){
        input[0] += 1;
    }
    if((k.key == 'ArrowLeft' || k.key == 'a') && Math.abs(input[0]) < maxInput){
        input[0] -= 1;
    }
    if((k.key == 'ArrowUp' || k.key == 'w') && Math.abs(input[1]) < maxInput){
        input[1] += 1;
    }
    if((k.key == 'ArrowDown' || k.key == 's') && Math.abs(input[1]) < maxInput){
        input[1] -= 1;
    }
});

window.addEventListener('keyup',(k)=>{
    console.log(`${k.key} up`);
    if(k.key == 'ArrowLeft' || k.key == 'ArrowRight' || k.key == 'a' || k.key == 'd'){
        input[0] = 0;
    }
    if(k.key == 'ArrowUp' || k.key == 'ArrowDown' || k.key == 'w' || k.key == 's'){
        input[1] = 0;
    }
});

window.addEventListener('mousedown',(e)=>{
    e.preventDefault();
    mouseDown = true;
});

window.addEventListener('touchstart',(e)=>{
    e.preventDefault();
    mouseDown = true;
    touchX = e.touches[0].clientX;
});

window.addEventListener('mouseup',()=>{
    mouseDown = false;
});

window.addEventListener('touchend',(e)=>{
    e.preventDefault();
    mouseDown = false;
});

window.addEventListener('click',(e)=>{
    e.preventDefault();
    if(tapCounter){
        doubleTap();
        clearTimeout(tapCounter);
        tapCounter = undefined;
    }else{
        tapCounter = setTimeout(()=>{
            clearTimeout(tapCounter);
            tapCounter = undefined;
        },doubleTapThresh*1000);
    }
});

window.addEventListener('touchstart',(e)=>{
    e.preventDefault();
    if(tapCounter){
        doubleTap();
        clearTimeout(tapCounter);
        tapCounter = undefined;
    }else{
        tapCounter = setTimeout(()=>{
            clearTimeout(tapCounter);
            tapCounter = undefined;
        },doubleTapThresh*1000);
    }
});

window.addEventListener('mousemove',(e)=>{
    if(mouseDown){
        //cam.rotation.y += e.movementX * spd;
        camRot += e.movementX*spd;
        moveCam2();
    }
});

window.addEventListener('touchmove',(e)=>{
    e.preventDefault();
    if(mouseDown){
        //cenText.innerText = `${e.touches[0].clientX},${touchX-e.touches[0].clientX}`;
        cam.rotation.y += (touchX-Number(e.touches[0].clientX)) * spd;
        touchX = e.touches[0].clientX;
    }
});

function moveTrain(){
    if(!stop){
        if(approach){
            if(trainSpd > 0){
                trainSpd -= accel;
            }else if(trainSpd < 0){
                trainSpd = 0;
            }else{
                approach = false;
                stop = true;
                idle = window.setTimeout(()=>{
                    switchDir();
                    stop = false;
                    clearTimeout(idle);
                },idleTime*1000);
            }
        }else{
            checkApproach();
        }
        if(!approach && trainSpd < maxSpd){
            trainSpd += accel;
        }
        
        if(fore){
            trainGp.position.z += trainSpd;
        }else{
            trainGp.position.z -= trainSpd;
        }
    }
    //cenText.innerText = trainGp.position.z;
    if(drift){
        if(trainGp.position.y < driftHei){
            trainGp.position.y += driftSpd;
        }else{
            drift = false;
        }
    }else{
        if(trainGp.position.y > ground.position.y){
            trainGp.position.y -= driftSpd;
        }else{
            drift = true;
        }
    }
}

function checkApproach(){
    if(!approach){
        let dis = 0;
        if(fore){
            dis = trainGp.position.z + trainCars * carSize.z + engineSize.z - platforms[0].position.z;
        }else{
            dis = trainGp.position.z - platforms[1].position.z;
        }
        //cenText.innerText = dis;
        if(Math.abs(dis) < 40){
            approach = true;
            console.log('approach');
        }
    }
}

function switchDir(){
    if(fore){
        fore = false;
    }else{
        fore = true;
    }
}

function moveCam(){
    if(input[1] != 0){
        camDist += spd * input[1];
        moveCam2();
    }
    if(input[0] != 0){
        origin.z += spd * input[0];
        moveCam2();
        //console.log(Math.cos(new THREE.Vector3(1,0,0).angleTo(dirF)),new THREE.Vector3(0,0,1).angleTo(dirF));
    }
}

function moveCam2(){
    cam.position.z = origin.z + camDist * Math.cos(camRot);
    cam.position.x = origin.x + camDist * Math.sin(camRot);
    cam.lookAt(new THREE.Vector3().addVectors(trainGp.position,origin));
    //console.log(origin);
}

function initSizes(){
    gLoader.load(track,function(o){
        new THREE.Box3().setFromObject(o.scene).getSize(trackSize);
        trackLoad++;
    });
    gLoader.load(trainHead,function(o){
        new THREE.Box3().setFromObject(o.scene).getSize(engineSize);
        trackLoad++;
    });
    gLoader.load(trainCar,function(o){
        new THREE.Box3().setFromObject(o.scene).getSize(carSize);
        trackLoad++;
    });
}

function setPlatforms(){
    
    const platform = new THREE.Mesh(new THREE.BoxGeometry(10,5,20),new THREE.MeshLambertMaterial({color: 0xaaaaaa}));
    let pSize = new THREE.Vector3();
    new THREE.Box3().setFromObject(platform).getSize(pSize);
    const platform2 = new THREE.Mesh(new THREE.BoxGeometry(10,5,20),new THREE.MeshLambertMaterial({color: 0xaaaaaa}));

    //console.log('psize: ' + pSize.z);
    platform.position.z = stageDim/2 - 3*pSize.z;
    platform.position.y = pSize.y/2;
    platform.position.x = pSize.x;

    //console.log(platform.position);

    platform2.position.z = -(stageDim/2 - 2.5*pSize.z);
    platform2.position.y = pSize.y/2;
    platform2.position.x = -pSize.x;

    console.log(platform2.position);

    scene.add(platform);
    scene.add(platform2);
    platforms.push(platform);
    platforms.push(platform2);
}

function setTracks(){
    let tracksTot = Math.ceil(stageDim*2/trackSize.z);
    console.log('tracks: ' + tracksTot);
    for(let i = 0; i < tracksTot; i++){
        gLoader.load(track,function(o){
            let t = o.scene;
            t.position.y = ground.position.y;
            t.position.x = xTrack;
            t.position.z = -(stageDim + trackSize.z/2) + i * trackSize.z;
            scene.add(t);
            tracks.push(t);
        });
    }
}

function setTrain(n){
    gLoader.load(trainHead,function(o){
        let obj = o.scene;
        obj.position.x = xTrack;
        obj.position.z = 0;
        trainGp.add(obj);
        train.push(obj);
        trainLoad++;
    });
    for(let i = 0; i < n; i++){
        gLoader.load(trainCar,function(o){
            let obj = o.scene;
            obj.position.x = xTrack;
            obj.position.z = engineSize.z + carSize.z * i;
            trainGp.add(obj);
            train.push(obj);
            trainLoad++;
        });
    }
    gLoader.load(trainHead,function(o){
        let obj = o.scene;
        obj.position.x = xTrack;
        obj.position.z = engineSize.z + carSize.z * n;
        obj.rotation.y = Math.PI;
        trainGp.add(obj);
        train.push(obj);
        scene.add(trainGp);
        trainLoad++;
    });
}

function setDecoration(ob,n,scale,yOff=0.5){
    for(let i = 0; i < n; i++){
        gLoader.load(ob,function(o){
            const obj = o.scene;
            obj.scale.x = scale[0];
            obj.scale.y = scale[1];
            obj.scale.z = scale[2];
            obj.rotation.y = Math.random() * 2 * Math.PI;
            obj.position.x = Math.random() * (stageDim/2-1) + 0.5;
            if(Math.round(Math.random()) < 1){
                obj.position.x = -obj.position.x;
            }
            obj.position.z = Math.random() * (stageDim/2-1) + 0.5;
            if(Math.round(Math.random()) < 1){
                obj.position.z = -obj.position.z;
            }
            const size = new THREE.Vector3();
            new THREE.Box3().setFromObject(obj).getSize(size);
            obj.position.y = ground.position.y + size.y*yOff;
            if(!sceneryCollide(obj,size.x/2)){
                scene.add(obj);
                scenery.push(obj);
            }
            loadProg++;
        },undefined,(e)=>{console.error(e);});
    }
}

function sceneryCollide(o,t){
    for(let i = 0; i < scenery.length; i++){
        if(dist(o,scenery[i]) < t){
            return true;
        }
    }
    return false;
}

function fadeIn(a,t,v){
    a.volume = 0;
    a.play();
    a.muted = false;
    const fade = setInterval(()=>{
        if(a.volume >= v){
            clearInterval(fade);
        }else{
            try{
                a.volume += v/10;
            }catch{
                a.volume = 1;
            }
        }
    },t/10*1000);
}

function fadeOut(a,t,v){
    const diff = a.volume - v;
    const fade = setInterval(()=>{
        if(a.volume <= v || start){
            clearInterval(fade);
        }else{
            try{
                a.volume -= diff/10;
            }catch{
                a.volume = 0;
            }
        }
    },t/10*1000);
}

window.addEventListener('resize',()=>{
    if(window.innerHeight > window.innerWidth/ratio){
        rend.setSize(window.innerHeight*ratio,window.innerHeight);
    }
    else if(window.innerWidth < window.innerHeight*ratio){
        rend.setSize(window.innerWidth,window.innerWidth/ratio);
    }else{
        rend.setSize(window.innerWidth,window.innerHeight);
    }
});