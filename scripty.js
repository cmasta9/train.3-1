import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const bgImg = './graphics/blueSky2.jpg';
const groundTex = './graphics/grass.jpg';
const trainHead = './graphics/engine2.glb';
const trainCar = './graphics/passengercar2.glb';
const track = './graphics/tracks.glb';
const station = './graphics/station.glb';
const alien = './graphics/alienBeing.glb';

const music = document.createElement("AUDIO");
music.loop = true;
music.muted = true;
//music.src = bgMusic;

let start = false;

const cenText = document.getElementById('center');
const spdHud = document.getElementById('speed');
const brake = document.getElementById('brake');
//cenText.innerText = 'LOADING...';

const stageDim = 1000;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camS0 = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camS1 = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
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
let pSize = new THREE.Vector3();
let trackLoad = 0;
let trainLoad = 0;
const trainCars = 3;
let tracksLoaded = false;

let doorOpenClip = undefined;

let engineOffset = -0.85;
let passOffset = -0.1;
let distOffset = 1;

let stationYoff = 0.75;
let stationXoff = 3.3;
let stationXoff2= 2.5;
let stationZoff = 3;
let statY = 1.75;

let mouseDown = false;
const doubleTapThresh = 0.42;
let tapCounter = undefined;
let touchX = undefined;

let doorsOpen = false;

const maxInput = 10;
let input = [0,0];

//const scenery = [];
const tracks = [];
const train = [];
const platforms = [];
const trainMixers = [];
const peeps = [];
const peepMixers = [];

let numPeeps = 10;
let peepClip = undefined;

let dTime = 0;
let prevTime = Date.now();
let lastZ = 0;
let spd = 0.02;
let maxSpd = 1.5;
let trainSpd = 0.5;
let accel = 0.016;
let idleTime = 3;
let driftSpd = 0.001;
let driftHei = 0.042;
let skyRot = 0.001;

const planeG = new THREE.PlaneGeometry(stageDim,stageDim);
const groundMat = new THREE.MeshLambertMaterial({map: gTex});
const skyMat = new THREE.MeshBasicMaterial({map: bgTex, side: THREE.DoubleSide});

const dome = new THREE.OctahedronGeometry(stageDim/2,4);
const sky = new THREE.Mesh(dome,skyMat);
const light = new THREE.DirectionalLight(0xffffff,1);
const ambLight = new THREE.AmbientLight(0xffffff);
const ground = new THREE.Mesh(planeG,groundMat);
ground.rotation.x = -Math.PI/2;
ground.position.y = 0;
scene.add(ground);
scene.add(light);
scene.add(ambLight);
scene.add(sky);
//scene.fog = new THREE.Fog(0xaaaaaa,0.2,stageDim-6);

let camRot = Math.PI/2;
let camDist = 30;
let camHeight = 1.6;

let interestCam = cam;

let fore = true;
let drift = true;
let approach = false;
let stop = false;
let idle = undefined;
let ready = false;

initSizes();
setPlatforms();
let origin = new THREE.Vector3(0,camHeight,0);
cam.position.x = origin.x + camDist;
cam.position.y = origin.y;
cam.position.z = origin.z;
const trainGp = new THREE.Object3D();

//---------------------------- GAME LOOP -----------------------------//

rend.render(scene,interestCam);
rend.setAnimationLoop(anim);

function anim(){
    rend.render(scene,interestCam);
    if(trainLoad < trainCars){
        if(trackLoad > 2 && !tracksLoaded){
            setTracks();
            setPeeps(numPeeps);
            initCams();
            setTrain(3);
            tracksLoaded = true;
            origin.z = 10;
            trainGp.add(cam);
            camRot = 3/2 * Math.PI;
            moveCam2();
        }
    }else{
        moveTrain();
        if(stop){
            for(let i = 0; i < trainMixers.length; i++){
                trainMixers[i].update((Date.now() - prevTime)/1000);
            }
        }
    }

    for(let j = 0; j < peepMixers.length; j++){
        peepMixers[j].update((Date.now() - prevTime)/1000);
    }

    moveCam();
    sky.rotation.y += skyRot;
    dTime = (Date.now() - prevTime)/1000;
    let speedOm = (trainGp.position.z - lastZ) / dTime * (18/5);
    //brake.innerText = (speedOm / accel * dTime / (18/5)).toPrecision(2);
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
    if(k.key == '0'){
        interestCam = camS0;
    }
    if(k.key == '1'){
        interestCam = camS1;
    }
    if(k.key == '2'){
        interestCam = cam;
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
        camRot += e.movementX*spd;
        if(interestCam == cam){
            moveCam2();
        }else{
            moveCam3();
        }
    }
});

window.addEventListener('touchmove',(e)=>{
    e.preventDefault();
    if(mouseDown){
        //cenText.innerText = `${e.touches[0].clientX},${touchX-e.touches[0].clientX}`;
        touchX = e.touches[0].clientX;
        camRot += e.movementX*spd;
        moveCam2();
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
                openDoors();
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
    }else{
        if(ready){
            ready = false;
            console.log('lfg');
            switchDir();
            stop = false;
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

function moveCam3(){
    interestCam.rotation.y = camRot;
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
    
    gLoader.load(station,(o)=>{
        const platform = o.scene;
        const platform2 = new THREE.Object3D().copy(platform);
        pSize = new THREE.Vector3();
        new THREE.Box3().setFromObject(platform).getSize(pSize);

        platform.position.z = stageDim/2 - 3*pSize.z;
        platform.position.y = stationYoff;
        platform.rotation.y = Math.PI;
        platform.position.x = (pSize.x/2 + trackSize.x/2);

        platform2.position.z = -(stageDim/2 - 2.5*pSize.z);
        platform2.position.y = stationYoff;
        platform2.position.x = -(pSize.x/2 + trackSize.x/2);

        console.log(platform2.position);

        scene.add(platform);
        scene.add(platform2);
        platforms.push(platform);
        platforms.push(platform2);
    });
    //const platform = new THREE.Mesh(new THREE.BoxGeometry(10,5,20),new THREE.MeshLambertMaterial({color: 0xaaaaaa}));
    //console.log('psize: ' + pSize.z);
    //console.log(platform.position);
}

function initCams(){
    camS0.position.x = -platforms[0].position.x;
    camS0.position.y = pSize.y;
    camS0.position.z = platforms[0].position.z + pSize.z/2;
    camS0.lookAt(platforms[0].position);

    camS1.position.x = -platforms[1].position.x;
    camS1.position.y = pSize.y;
    camS1.position.z = platforms[1].position.z - pSize.z/2;
    camS1.lookAt(platforms[1].position);
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
        obj.position.y = trackSize.y/2 + engineSize.y/2 + engineOffset;
        obj.position.z = distOffset;
        trainGp.add(obj);
        train.push(obj);
        trainLoad++;
    }); 
    for(let i = 0; i < n; i++){
        gLoader.load(trainCar,function(o){
            let obj = o.scene;
            obj.position.x = xTrack;
            obj.position.y = trackSize.y/2 + carSize.y/2 + passOffset;
            obj.position.z = engineSize.z + carSize.z * i - distOffset;
            trainMixers.push(new THREE.AnimationMixer(obj));
            if(!doorOpenClip){
                doorOpenClip = o.animations[0];
            }
            trainGp.add(obj);
            train.push(obj);
            trainLoad++;
        });
    }
    gLoader.load(trainHead,function(o){
        let obj = o.scene;
        obj.position.x = xTrack;
        obj.position.y = trackSize.y/2 + engineSize.y/2 + engineOffset;
        obj.position.z = engineSize.z + carSize.z * n - 2 * distOffset;
        obj.rotation.y = Math.PI;
        trainGp.add(obj);
        train.push(obj);
        scene.add(trainGp);
        trainLoad++;
    });
}

function setPeeps(n){
    for(let i = 0; i < n; i++){
        gLoader.load(alien,function(o){
            const obj = o.scene;
            if(!peepClip){
                peepClip = o.animations[0];
            }
            peepPlace(obj);
            let mixer = new THREE.AnimationMixer(obj);
            let action = mixer.clipAction(peepClip);
            action.time = Math.random();
            action.play();
            peepMixers.push(mixer);
            peeps.push(obj);
            scene.add(obj);
        });
    }
}

function peepPlace(p){
    let station = Math.round(Math.random());
    let randX = Math.random() * (pSize.x - stationXoff - stationXoff2);
    let randZ = Math.random() * (pSize.z - stationZoff);
    if(station == 0){
        p.position.x = platforms[station].position.x - (pSize.x - stationXoff)/2 + randX + stationXoff;
        p.position.z = platforms[station].position.z - (pSize.z - stationZoff)/2 + randZ + stationZoff;
        p.position.y = statY;
        p.rotation.y = Math.PI;
    }else{
        p.position.x = platforms[station].position.x + (pSize.x - stationXoff)/2 - randX - stationXoff;
        p.position.z = platforms[station].position.z + (pSize.z - stationZoff)/2 - randZ - stationZoff;
        p.position.y = statY;
    }
}

function openDoors(){
    let oTime = 1;
    for(let d = 0; d < trainMixers.length; d++){
        let action = trainMixers[d].clipAction(doorOpenClip);
        if(!doorsOpen){
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.setDuration(oTime);
            action.paused = false;
            action.play();
        }else{
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.setDuration(-oTime);
            action.paused = false;
            action.play();
        }
    }
    if(doorsOpen){
        doorsOpen = false;
        setTimeout(()=>{
            ready = true;
            clearTimeout(idle);
        },oTime*1000);
    }else{
        doorsOpen = true;
        idle = setTimeout(()=>{
            openDoors();
            clearTimeout(idle);
        },idleTime*1000);
    }
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