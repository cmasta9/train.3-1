import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Passenger} from './passenger.js';
import {dirTo, dist,pointOnLine,progress,raycast,normalize} from './loc.js';
import {moveJet,moveJetCam,jetSpd,getFore} from './jetMove.js';
import {drawHits,drawHP,setIntervals,setGo,switchSceneX} from './scripty2.js';
import * as music from './music.js';

const bgImg = './graphics/blueSky2.jpg';
const groundTex = './graphics/grass2.jpg';
const trainHead = './graphics/engine2.glb';
const trainCar = './graphics/passengercar2.glb';
const track = './graphics/tracks.glb';
const station = './graphics/station.glb';
const building = './graphics/building.glb';
const windmill = './graphics/windmill.glb';
const airship = './graphics/airship1.glb';
const powerplant = './graphics/powerplant.glb';
const sstack = './graphics/powerstack.glb';
const alien = './graphics/alienBeing.glb';
const cloud = './graphics/cloud.glb';
const ufo = './graphics/ufo2.glb';
const desk = './graphics/officeDesk2.glb';
const bern = './graphics/bernie2.glb';
const trophy = './graphics/trophy.glb';

const bgMusic = './audio/futurescapesOverture4.ogg';
const bgMusic2 = './audio/futurescapes4.ogg';
music.setTrack(bgMusic);
music.init();

let start = false;
let chase = false;

let beatBoss = false;

const spdHud = document.getElementById('speed');
const camHud = document.getElementById('cam');
const camNum = document.getElementById('camNum');
const hitHUD = document.getElementById('hitCt');
const centext = document.getElementById('centext');
const conText = document.getElementById('control');

const stageDim = 1000;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camS0 = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camS1 = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camP = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camA = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camA2 = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camCut = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camOff = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const tLoader = new THREE.TextureLoader();
const gLoader = new GLTFLoader();
const bgTex = tLoader.load(bgImg);
const gTex = tLoader.load(groundTex);
gTex.wrapS = THREE.RepeatWrapping;
gTex.wrapT = THREE.RepeatWrapping;
gTex.repeat.set(stageDim/4,stageDim/4);
bgTex.colorSpace = THREE.SRGBColorSpace;

let rend = new THREE.WebGLRenderer();
rend.setSize(window.innerWidth,window.innerHeight);
const ratio = rend.getPixelRatio();
document.body.appendChild(rend.domElement);

const xTrack = 0;

let engineSize = new THREE.Vector3();
let carSize = new THREE.Vector3();
let trackSize = new THREE.Vector3();
let pSize = new THREE.Vector3();
let powerSize = new THREE.Vector3();
let stackSize = new THREE.Vector3();
let planeSize = new THREE.Vector3();
let windSize = undefined;
const trainCars = 3;

let doorsOpen = false;

let engineOffset = -0.85;
let passOffset = -0.1;
let distOffset = 1;

let statDist = 2.5;
let stationYoff = 0.75;
let stationXoff = 3.5;
let stationXoff2= 2.5;
let stationZoff = 3;
let statY = 1.75;
let doorDist = 14;
let carOffIn = 1.5;

let mouseDown = false;
const doubleTapThresh = 0.42;
let tapCounter = undefined;
let touchX = undefined;

const maxInput = 1;
export let input = [0,0];

const tracks = [];
const train = [];
const platforms = [];
const trainMixers = [];
const peeps = [];
const peepMixers = [];
const placeHolders = [];
const buildings = [];
const scenery = [];
const smoke = [];

let engineObj = new THREE.Object3D();
let traincarObj = new THREE.Object3D();
let trackObj = new THREE.Object3D();
let platformObj = new THREE.Object3D();
let buildingObj = new THREE.Object3D();
let windmillObj = new THREE.Object3D();
let planeObj = new THREE.Object3D();
let peepObj = new THREE.Object3D();
let deskObj = new THREE.Object3D();
let doorOpenClip = undefined;
let peepClip = undefined;
let windmillClip = undefined;

let buildingSize = new THREE.Vector3();
let deskSize = new THREE.Vector3();

let plane = new THREE.Object3D();
let powerPlant = new THREE.Object3D();
let powerStack = new THREE.Object3D();

let smokeShape = new THREE.SphereGeometry(16,3,2);
let smokeMat = new THREE.MeshLambertMaterial({color: 0xeeeeee});

let decoyCloud = new THREE.Object3D();
let cloud2 = new THREE.Object3D();
let mothership = new THREE.Object3D();
let mothershipSc = 1.69;
let dYdecoy = 5;
let decoyDrift = true;

let person = undefined;
let persRot = Math.PI;
let perSize = new THREE.Vector3();

let numPeeps = 10;

let dTime = 0;
let prevTime = Date.now();
let lastZ = 0;
let lastPl = new THREE.Vector3();

let spd = 0.05;
let perSpd = 0.1;
let watcherSpd = 1;

let planeSpd = 0.42;
const planeSpdBase = planeSpd;
const planeMaxSpd = 5;
let planeAccel = 0.05;
let boosting = false;
let hover = false;
let flying = false;
let boardedPlane = false;

let planeHeight = stageDim/2*(2/5);
let decoyInitY = stageDim/2*(4/5);
let ufoInitY = (decoyInitY+stageDim/2)/2;

const maxSpd = 1.5;
let trainSpd = 0.5;
let accel = 0.016;
let driftSpd = 0.001;
let driftHei = 0.042;

let oTime = 1;

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
scene.fog = new THREE.Fog(0xffffff,0.1,stageDim-6);

let skylineVar = 16;
let buildingNum = 29;
let windmillNum = 20;

let loadingComp = false;
let loadProg = 0;

//const placeMesh = new THREE.Mesh(new THREE.BoxGeometry(10,10,10),new THREE.MeshBasicMaterial({color:0xffffff}));

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
let bernin = false;

loadModels();
let scene2 = false;
const origin = new THREE.Vector3(0,camHeight,0);
const porigin = new THREE.Vector3(origin.x-camDist,origin.y,origin.z);
const planeOrigin = new THREE.Vector3(-69,1,0);
const trophyOrigin = new THREE.Vector3(69,0,0);
let atarget = 0;
const apos = [new THREE.Vector3(0,planeHeight,planeHeight),new THREE.Vector3(-planeHeight,planeHeight,planeHeight/2),new THREE.Vector3(-planeHeight,planeHeight,-planeHeight/2),new THREE.Vector3(0,planeHeight,-planeHeight), new THREE.Vector3(planeHeight,planeHeight,-planeHeight/2), new THREE.Vector3(planeHeight,planeHeight,planeHeight/2)];
cam.position.x = origin.x + camDist;
cam.position.y = origin.y;
cam.position.z = origin.z;
const trainGp = new THREE.Object3D();

let focusPos = new THREE.Vector3();
let focusPts = [];
let camSpdInit = 0.005;
let thetaRot = 0;
let focPt = 0;

interestCam = camOff;

hitHUD.addEventListener('click',initClick);
document.getElementById('mute').addEventListener('click',()=>{
    music.toggleMute();
});

//---------------------------- GAME LOOP -----------------------------//

//rend.render(scene,interestCam);
rend.setAnimationLoop(animPre);
let spUpdate = 0;
let speedOm = 0;
hitHUD.innerText = 'Click Here\nto Start';

function animPre(){
    if(!loadingComp){
        loadLoop();
    }else{
        if(focPt != 2){
            rotCam(focusPos,2,perSize.y/2,thetaRot);
            thetaRot += camSpdInit;
            if(thetaRot > Math.PI*2){
                focPt++;
                if(focPt >= focusPts.length){
                    focPt = 0;
                }
                focusPos.copy(focusPts[focPt]);
                thetaRot -= Math.PI*2;
            }
        }else{
            if(focusPos.y < decoyCloud.position.y - 20){
                interestCam.position.x = trainGp.position.x;
                interestCam.position.z = trainGp.position.z;
                interestCam.position.y = engineSize.y*2;
                focusPos.y += 0.5;
                interestCam.lookAt(focusPos);
            }else{
                focPt++;
                if(focPt >= focusPts.length){
                    focPt = 0;
                }
                focusPos.copy(focusPts[focPt]);
            }
        }
        trainLoop();
        dTime = (Date.now() - prevTime)/1000;
        prevTime = Date.now();
        if(stop){
            for(let i = 0; i < trainMixers.length; i++){
                trainMixers[i].update(dTime);
            }
        }
        for(let j = 0; j < peepMixers.length; j++){
            peepMixers[j].update(dTime);
        }
        drifting();
        sky.rotation.y += skyRot;
        rend.render(scene,interestCam);
    }
}

function rotCam(p,dxz,dy,t){
    interestCam.position.x = p.x + dxz*Math.sin(t);
    interestCam.position.z = p.z + dxz*Math.cos(t);
    interestCam.position.y = p.y + dy;
    interestCam.lookAt(p);
}

function anim(){
    trainLoop();
    if(flying && !hover && boardedPlane){
        if(interestCam == camA2 || interestCam == camP){
            if(dist(plane.position,mothership.position) < 100){
                switchCutsceneInit();
            }
            movePlane(planeOrigin);
        }else{
            movePlane();
        }
    }else if(!flying && interestCam == camP){
        watcherConts();
    }else if(flying && !boardedPlane){
        if(dist(plane.position,planeOrigin) > planeSpd){
            movePlane(planeOrigin);
        }else{
            flying = false;
            plane.rotation.x = 0;
            plane.rotation.z = 0;
        }
    }
    updateSpdOm();
    moveCam();
    dTime = (Date.now() - prevTime)/1000;
    prevTime = Date.now();
    if(stop){
        for(let i = 0; i < trainMixers.length; i++){
            trainMixers[i].update(dTime);
        }
    }
    for(let j = 0; j < peepMixers.length; j++){
        peepMixers[j].update(dTime);
    }
    drifting();
    sky.rotation.y += skyRot;
    rend.render(scene,interestCam);
}

function animJet(){
    animLoop(rend,input,boosting);
}

function switchCutscene(){
    rend.render(scene,camCut);
    planeSpd = planeSpdBase;
    movePlane(mothership.position);
    mothership.position.y += (planeSpd+0.05);
    camCut.lookAt(mothership.position);
    if(dist(mothership.position,ground.position) > stageDim/2 + 135){
        sceneSwitch();
        chase = false;
        plane.position.copy(new THREE.Vector3(0,planeHeight,0));
        plane.rotation.x = 0;
        plane.rotation.y = 0;
        plane.rotation.z = 0;
        mothership.position.copy(new THREE.Vector3(0,ufoInitY,0));
    }
}

function loadModels(){
    
    gLoader.load(trainHead,function(o){
        engineObj = o.scene;
        new THREE.Box3().setFromObject(engineObj).getSize(engineSize);
        loadProg++;
    });
    gLoader.load(trainCar,function(o){
        traincarObj = o.scene;
        doorOpenClip = o.animations[0];
        new THREE.Box3().setFromObject(traincarObj).getSize(carSize);
        loadProg++;
    });
    gLoader.load(track,function(o){
        trackObj = o.scene;
        new THREE.Box3().setFromObject(trackObj).getSize(trackSize);
        loadProg++;
    });
    gLoader.load(station,(o)=>{
        platformObj = o.scene;
        new THREE.Box3().setFromObject(platformObj).getSize(pSize);
        loadProg++;
    });
    gLoader.load(airship,function(o){
        planeObj = o.scene;
        new THREE.Box3().setFromObject(planeObj).getSize(planeSize);
        loadProg++;
    });
    gLoader.load(alien,function(o){
        peepObj = o.scene;
        peepClip = o.animations[0];
        new THREE.Box3().setFromObject(peepObj).getSize(perSize);
        loadProg++;
    });
    gLoader.load(building,function(o){
        buildingObj = o.scene;
        new THREE.Box3().setFromObject(buildingObj).getSize(buildingSize);
        loadProg++;
    });
    gLoader.load(desk,function(o){
        deskObj = o.scene;
        new THREE.Box3().setFromObject(deskObj).getSize(deskSize);
        loadProg++;
    });
    gLoader.load(windmill,function(o){
        windmillObj = o.scene;
        windmillClip = o.animations[0];
        loadProg++;
    });
    gLoader.load(ufo,function(o){
        mothership.copy(o.scene);
        loadProg++;
    });
    gLoader.load(cloud,function(o){
        decoyCloud.copy(o.scene);
        loadProg++;
    });
}

function loadLoop(){
    if(loadProg > 10){
        loadingComp = true;
        setTracks();
        setTrain(3);
        loadPower();
        loadWindmills();
        loadBuildings();
        setOffice();
        setPlatforms();
        loadAirship();
        setPeeps(numPeeps);
        setPers();
        setSkyProps();
        loadTrophy();
        initCams();
        camHud.innerText = setCamText();
        origin.z = 10;
        trainGp.add(cam);
        camRot = 3/2 * Math.PI;
        focusPos.copy(focusPts[focPt]);
        //moveCam2();
    }else{
        camHud.innerText = `Loading... ${loadProg/11*100}%`;
    }
}

function doubleTap(){
    console.log('logged a doubleTap');
}

window.addEventListener('keydown', (k)=>{
    //console.log(`${k.key} down`);
    if(start || scene2){
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
    
        if(k.key == 'b'){
            boosting = true;
        }
        if(k.key == 'm'){
            music.toggleMute();
        }
    
        if(!scene2){
            if(k.key == '0'){
                interestCam = camS0;
                camHud.innerText = setCamText();
            }
            if(k.key == '1'){
                interestCam = camS1;
                camHud.innerText = setCamText();
                camNum.innerHTML = '0 <b>1</b> 2 3 4 5';
            }
            if(k.key == '2'){
                interestCam = cam;
                camHud.innerText = setCamText();
                camNum.innerHTML = '0 1 <b>2</b> 3 4 5';
            }
            if(k.key == '3'){
                interestCam = camP;
                camHud.innerText = setCamText();
                camNum.innerHTML = '0 1 2 <b>3</b> 4 5';
            }
            if(k.key == '4'){
                interestCam = camA;
                camHud.innerText = setCamText();
                camNum.innerHTML = '0 1 2 3 <b>4</b> 5';
            }
            if(k.key == '5'){
                if(flying){
                    interestCam = camA2;
                    resetCam();
                    interestCam.lookAt(plane.position);
                    camNum.innerHTML = '0 1 2 3 4 <b>5</b>';
                }
            }
            if(k.key == 'r'){
                resetCam();
            }
            if(k.key == 'p'){
                boardPlane();
            }
            if(k.key == 'h'){
                hover = true;
            }
        }
    }
});

function initClick(){
    if(!start){
        start = true;
        centext.innerText = '';
        hitHUD.innerText = '';
        conText.innerText = '';
        interestCam = camP;
        camHud.innerText = setCamText();
        music.unmute();
        music.fadeIn(1,0);
        music.updateMute();
        rend.setAnimationLoop(anim);
        window.removeEventListener('click',initClick);
    }
}

window.addEventListener('keyup',(k)=>{
    //console.log(`${k.key} up`);
    if(k.key == 'ArrowLeft' || k.key == 'ArrowRight' || k.key == 'a' || k.key == 'd'){
        input[0] = 0;
    }
    if(k.key == 'ArrowUp' || k.key == 'ArrowDown' || k.key == 'w' || k.key == 's'){
        input[1] = 0;
    }
    if(k.key == 'b'){
        boosting = false;
    }
    if(k.key == 'h'){
        hover = false;
    }
});

function resetCam(){
    origin.x = 0;
        origin.y = camHeight;
        origin.z = 0;
        camDist = 30;
        if(interestCam == camS0 || interestCam == camS1){
            initStationCams();
        }
        if(interestCam == camA){
            interestCam.position.x = 0;
            interestCam.position.y = camDist;
            interestCam.position.z = 0;
            interestCam.rotation.y = 0;
            interestCam.rotation.x = -Math.PI/2;
            interestCam.rotation.z = 0;
        }
        if(interestCam == cam){
            moveCam2();
        }
        if(interestCam == camP && !flying){
            person.position.copy(porigin);
        }
        camHud.innerText = setCamText();
}

function setCamText(){
    if(interestCam == camS0){
        camNum.innerHTML = '<b>0</b> 1 2 3 4 5';
        return 'Camera: Station 1';
    }else if(interestCam == camS1){
        camNum.innerHTML = '0 <b>1</b> 2 3 4 5';
        return 'Camera: Station 2';
    }else if(interestCam == cam){
        camNum.innerHTML = '0 1 <b>2</b> 3 4 5';
        return 'Camera: Train';
    }else if(interestCam == camP){
        camNum.innerHTML = '0 1 2 <b>3</b> 4 5';
        return 'Camera: Watcher';
    }else if(interestCam == camA){
        camNum.innerHTML = '0 1 2 3 <b>4</b> 5';
        return 'Camera: Air';
    }else if(interestCam == camA2){
        if(scene2){
            camNum.innerHTML = '';
            return 'Camera: Space';
        }else{
            camNum.innerHTML = '0 1 2 3 4 <b>5</b>';
            return 'Camera: Jet';
        }
    }else{
        return '';
    }
}

window.addEventListener('mousedown',(e)=>{
    if(start){
        e.preventDefault();
        mouseDown = true;
    }
});

window.addEventListener('mouseup',()=>{
    mouseDown = false;
});

window.addEventListener('touchend',(e)=>{
    e.preventDefault();
    mouseDown = false;
});

window.addEventListener('click',(e)=>{
    if(start){
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
    }
});

window.addEventListener('touchstart',(e)=>{
    if(start){
        e.preventDefault();
        mouseDown = true;
        touchX = e.touches[0].clientX;
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
    }
});

window.addEventListener('mousemove',(e)=>{
    if(mouseDown){
        if(interestCam == cam){
            camRot += e.movementX*spd;
            moveCam2();
        }else if (interestCam == camP){
            persRot += e.movementX*spd;
        }else{
            camRot += e.movementX*spd;
            moveCam3();
        }
    }
});

window.addEventListener('touchmove',(e)=>{
    e.preventDefault();
    let dx = e.touches[0].clientX-touchX;
    if(mouseDown){
        if(interestCam == cam){
            camRot += dx*spd/5;
            moveCam2();
        }else if (interestCam == camP){
            persRot += dx*spd;
        }else if (interestCam == camA2){

        }else{
            camRot += dx*spd;
            moveCam3();
        }
    }
});

function trainLoop(){
    moveTrain();
    if(stop){
        for(let j = 0; j < peeps.length; j++){
            if(peeps[j].destiny && !peeps[j].boarded){
                if(dist(peeps[j].position,peeps[j].destiny) > perSpd){
                    let dis = dirTo(peeps[j].position,peeps[j].destiny);
                    peeps[j].position.x += dis.x * perSpd;
                    peeps[j].position.y += dis.y * perSpd;
                    peeps[j].position.z += dis.z * perSpd;
                }
            }
        }
    }else{
        for(let j = 0; j < peeps.length; j++){
            if(peeps[j].boarded){
                peeps[j].position.z = trainGp.position.z + peeps[j].offset;
            }
        }
    }
}

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
}

function drifting(){
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

    let mult = 4;

    if(decoyDrift){
        if(decoyCloud.position.y < dYdecoy + decoyInitY){
            mothership.position.y += driftSpd*mult;
            decoyCloud.position.y += driftSpd*2*mult;
            cloud2.position.y += driftSpd*1.5*mult;
        }else{
            decoyDrift = false;
        }
    }else{
        if(decoyCloud.position.y > decoyInitY){
            mothership.position.y -= driftSpd*mult;
            decoyCloud.position.y -= driftSpd*2*mult;
            cloud2.position.y -= driftSpd*1.5*mult;
        }else{
            decoyDrift = true;
        }
    }
}

function checkApproach(){
    let decelDist = 40;
    if(!approach){
        let dis = 0;
        if(fore){
            dis = trainGp.position.z + trainCars * carSize.z + engineSize.z - platforms[0].position.z;
        }else{
            dis = trainGp.position.z - platforms[1].position.z;
        }
        //cenText.innerText = dis;
        if(Math.abs(dis) < decelDist){
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
        if(interestCam == camA){
            moveCamA();
        }else if(interestCam == camA2 || (interestCam == camP && boardedPlane)){
            moveJetCam(plane,camA2,spd,input);
        }else if(interestCam != camP){
            camDist += spd * input[1];
            moveCam2();
        }
    }
    if(input[0] != 0){
        if(interestCam == camA2 || (interestCam == camP && boardedPlane)){
            moveJetCam(plane,camA2,spd,input);
        }else if(interestCam != camP){
            origin.z += spd * input[0];
            moveCam2();
        }
        //console.log(Math.cos(new THREE.Vector3(1,0,0).angleTo(dirF)),new THREE.Vector3(0,0,1).angleTo(dirF));
    }
    if(interestCam == camP){
        if(!boardedPlane){
            moveCamP();
        }
    }
}

function moveCam2(){
    interestCam.position.z = origin.z + camDist * Math.cos(camRot);
    interestCam.position.x = origin.x + camDist * Math.sin(camRot);
    interestCam.lookAt(new THREE.Vector3().addVectors(trainGp.position,origin));
    //console.log(origin);
}

function moveCam3(){
    interestCam.rotation.y = camRot;
}

function moveCamP(){
    person.rotation.y = persRot;
    let dir = new THREE.Vector3();
    if(input[1] != 0){
        dir.x += input[1]*Math.cos(person.rotation.y);
        dir.z -= input[1]*Math.sin(person.rotation.y);
    }
    if(input[0] != 0){
        dir.x += input[0]*Math.sin(person.rotation.y);
        dir.z += input[0]*Math.cos(person.rotation.y);
    }
    dir = normalize(dir);
    if(input[1] != 0 || input[0] != 0){
        if(!raycast(scene,person.position,dirTo(person.position,new THREE.Vector3(person.position.x+dir.x,person.position.y,person.position.z)),Math.abs(dir.x*watcherSpd*2),perSize.x/2)){
            person.position.x += dir.x*watcherSpd;
        }
        if(!raycast(scene,person.position,dirTo(person.position,new THREE.Vector3(person.position.x,person.position.y,person.position.z+dir.z)),Math.abs(dir.z*watcherSpd*2),perSize.z/2)){
            person.position.z += dir.z*watcherSpd;
        }
    }
    if(person.position.y > ground.position.y + perSize.y/2){
        if(!raycast(scene,person.position,new THREE.Vector3(0,-1,0),watcherSpd,-perSize.y/2)){
            person.position.y -= watcherSpd;
        }else{
            if(!raycast(scene,person.position,new THREE.Vector3(0,-1,0),0.02,-perSize.y/2)){
                person.position.y -= 0.02;
            }
        }
        if(person.position.y < ground.position.y + perSize.y/2){
            person.position.y = ground.position.y + perSize.y/2;
        }
    }
}

function moveCamA(){
    if(input[1] != 0){
        camA.position.y += input[1]*spd;
    }
}

function movePlane(t=undefined){
    let targ = t;
    if(!targ){
        targ = apos[atarget];
    }
    if(interestCam != camA2 || chase){
        if(dist(plane.position,targ) >= planeSpd){
            if(interestCam == camP && boardedPlane && !chase){
                moveJet(plane,planeSpd,ground.y,stageDim/2-20);
            }else{
                let dir = dirTo(plane.position,targ);
                plane.position.x += dir.x * planeSpd;
                plane.position.z += dir.z * planeSpd;
                plane.position.y += dir.y * planeSpd;
                if(!t){
                    if(atarget >= apos.length - 1){
                        plane.lookAt(pointOnLine(apos[atarget],apos[0],progress(apos[atarget-1],apos[atarget],plane.position)));
                        //console.log(progress(apos[atarget-1],apos[atarget],plane.position));
                    }else if (atarget > 0){
                        plane.lookAt(pointOnLine(apos[atarget],apos[atarget+1],progress(apos[atarget-1],apos[atarget],plane.position)));
                        //console.log(progress(apos[atarget-1],apos[atarget],plane.position))
                    }else{
                        plane.lookAt(pointOnLine(apos[atarget],apos[atarget+1],progress(apos[apos.length-1],apos[atarget],plane.position)));
                        //console.log(progress(apos[apos.length-1],apos[atarget],plane.position));
                    }
                }else{
                    plane.lookAt(targ);
                }
            }
        }else{
            if(!t){
                atarget++;
                if(atarget >= apos.length){
                    atarget = 0;
                }
            }
        }
    }else{
        moveJet(plane,planeSpd,ground.y,stageDim/2-20);
        loadBern();
    }
    planeSpd = jetSpd(planeSpd,planeMaxSpd,planeSpdBase,planeAccel,boosting);
}

function setPlatforms(){
    let platform = new THREE.Object3D();
    let platform2 = new THREE.Object3D();
    platform.copy(platformObj);
    platform2.copy(platformObj);
    platform.position.z = stageDim/2 - statDist*pSize.z;
    platform.position.y = stationYoff;
    platform.rotation.y = Math.PI;
    platform.position.x = (pSize.x/2 + trackSize.x/2);
    stationHold(platform,-stationXoff,-doorDist);
    stationHold(platform,-stationXoff,0);
    stationHold(platform,-stationXoff,doorDist);
    platform2.position.z = -(stageDim/2 - statDist*pSize.z);
    platform2.position.y = stationYoff;
    platform2.position.x = -(pSize.x/2 + trackSize.x/2);
    stationHold(platform2,stationXoff,-doorDist);
    stationHold(platform2,stationXoff,0);
    stationHold(platform2,stationXoff,doorDist);
    //console.log(platform2.position);
    scene.add(platform);
    scene.add(platform2);
    platforms.push(platform);
    platforms.push(platform2);
}

function stationHold(s,Xoff,Zoff){
    let p = new THREE.Object3D();
    p.position.x = s.position.x + Xoff;
    p.position.y = statY;
    p.position.z = s.position.z + Zoff;
    //console.log(p.position);
    placeHolders.push(p);
    scene.add(p);
}

function loadPower(){
    let xLoc = 400;
    let stackOffz = 100;

    gLoader.load(powerplant,function(o){
        powerPlant = o.scene;
        new THREE.Box3().setFromObject(powerPlant).getSize(powerSize);
        powerPlant.position.x = xLoc;
        powerPlant.position.y = ground.position.y;
        powerPlant.rotation.y = -Math.PI/2;
        scene.add(powerPlant);
    });

    gLoader.load(sstack,function(o){
        powerStack = o.scene;
        new THREE.Box3().setFromObject(powerStack).getSize(stackSize);
        powerStack.position.x = xLoc;
        powerStack.position.y = ground.position.y;
        powerStack.position.z = stackOffz;

        scene.add(powerStack);
        window.setInterval(()=>{
            smokeStack();
        },1000);
        window.setInterval(()=>{
            smokeRise();
        },50);
    });
}

function loadBuildings(){

    let xRat = 0.3;
    let zRat = 0.9;

    let mult1 = 1.6; 
    let mult2 = 2.1;

    for(let i = 1; i <= buildingNum + buildingNum/mult1 + buildingNum/mult2; i++){
        let obj = new THREE.Object3D();
        obj.copy(buildingObj);
        if(i < buildingNum/2){
            obj.position.x = stageDim/2*xRat;
            if(i == 1){
                obj.position.y = ground.position.y;
            }else{
                obj.position.y = ground.position.y - Math.round(Math.random()*skylineVar);
            }
            obj.position.z = (stageDim/buildingNum * i * Math.pow(-1,i))*zRat;
        }else if(i < buildingNum){
            obj.position.x = -stageDim/2*xRat;
            obj.position.y = ground.position.y - Math.round(Math.random()*skylineVar);
            obj.position.z = (stageDim/buildingNum * (i-buildingNum/2) * Math.pow(-1,i))*zRat;
        }else if(i < buildingNum + buildingNum/mult1/2){
            obj.position.x = stageDim/2*xRat*mult1;
            obj.position.y = ground.position.y - Math.round(Math.random()*skylineVar);
            obj.position.z = stageDim/buildingNum/mult1 * (i-buildingNum+1) * Math.pow(-1,i);
        }else if(i < buildingNum + buildingNum/mult1){
            obj.position.x = -stageDim/2*xRat*mult1;
            obj.position.y = ground.position.y - Math.round(Math.random()*skylineVar);
            obj.position.z = stageDim/buildingNum/mult1 * (i-buildingNum-buildingNum/mult1/2) * Math.pow(-1,i);
        }else if(i < buildingNum + buildingNum/mult1 + buildingNum/mult2/2){
            obj.position.x = stageDim/2*xRat*mult2;
            obj.position.y = ground.position.y - Math.round(Math.random()*skylineVar);
            obj.position.z = stageDim/buildingNum/mult1 * (i-buildingNum-buildingNum/mult1) * Math.pow(-1,i);
        }else if(i < buildingNum + buildingNum/mult1 + buildingNum/mult2){
            obj.position.x = -stageDim/2*xRat*mult2;
            obj.position.y = ground.position.y - Math.round(Math.random()*skylineVar);
            obj.position.z = stageDim/buildingNum/mult1 * (i-buildingNum-buildingNum/mult1-buildingNum/mult2/2) * Math.pow(-1,i);
        }
        buildings.push(obj);
        scene.add(obj);
    }
}

function setOffice(b=0){
    let desk = new THREE.Object3D();
    desk.copy(deskObj);
    desk.position.x = buildings[b].position.x;
    desk.position.z = buildings[b].position.z;
    desk.position.y = buildings[b].position.y + deskSize.y/2;
    console.log(desk.position);
    let peeper = new THREE.Object3D();
    peeper.copy(peepObj);
    peeper.position.copy(desk.position);
    peeper.position.y += 0.5;

    scene.add(desk);
    scene.add(peeper);

    let mixer = new THREE.AnimationMixer(peeper);
    let clip = mixer.clipAction(peepClip);
    clip.play();
    peepMixers.push(mixer);
    focusPts.push(peeper.position);
}

function loadWindmills(){

    let xRat = 0.1;
    let zRat = 0.8;
    windSize = new THREE.Vector3();
    new THREE.Box3().setFromObject(windmillObj).getSize(windSize);

    for(let i = 0; i < windmillNum; i++){
        let obj = new THREE.Object3D();
        obj.copy(windmillObj);
        obj.position.x = stageDim/2*xRat*Math.pow(-1,i+1);
        obj.position.y = windSize.y/2;
        obj.position.z = (-stageDim/2 + stageDim*(i/windmillNum))*zRat;

        let mixer = new THREE.AnimationMixer(obj);
        let action = mixer.clipAction(windmillClip);
        action.time = Math.random();

        if(i % 2 == 1){
            obj.rotation.y = Math.PI;
            action.setDuration(-oTime*2);
        }else{
            action.setDuration(oTime*2);
        }

        action.play();

        scenery.push(obj);
        scene.add(obj);
        peepMixers.push(mixer);
    }
}

function loadAirship(){
    plane.copy(planeObj);
    /*
    plane.position.x = apos[atarget].x;
    plane.position.y = apos[atarget].y;
    plane.position.z = apos[atarget].z;
    */
    planeOrigin.y = planeSize.y/2;
    plane.position.copy(planeOrigin);
    let up = new THREE.Object3D();
    up.position.copy(new THREE.Vector3(0,1,0));
    plane.add(up);
    scene.add(plane);
}

function initCams(){
    
    initStationCams()

    initPersonCam();

    camA.position.copy(new THREE.Vector3(0,camDist,0));
    camA.rotation.x = -Math.PI/2;
    plane.add(camA);
    camA2.position.copy(new THREE.Vector3(0,0,-camDist));
    plane.add(camA2);
}

function initPersonCam(){
    camP.position.copy(new THREE.Vector3(0,camHeight,0));
    person.rotation.y = persRot;
    camP.rotation.y = -Math.PI/2;

    person.add(camP);
}

function initStationCams(){
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
    let tracksTot = Math.ceil(stageDim/trackSize.z);
    console.log('tracks: ' + tracksTot);
    for(let i = 0; i <= tracksTot; i++){
        let t = new THREE.Object3D();
        t.copy(trackObj);
        t.position.y = ground.position.y;
        t.position.x = xTrack;
        t.position.z = -(stageDim + trackSize.z)/2 + i * trackSize.z;
        scene.add(t);
        tracks.push(t);
    }
}

function setTrain(n){

    let head = new THREE.Object3D();
    head.copy(engineObj);
    head.position.x = xTrack;
    head.position.y = trackSize.y/2 + engineSize.y/2 + engineOffset;
    head.position.z = distOffset;
    trainGp.add(head);
    train.push(head);

    for(let i = 0; i < n; i++){
        let car = new THREE.Object3D();
        car.copy(traincarObj);
        car.position.x = xTrack;
        car.position.y = trackSize.y/2 + carSize.y/2 + passOffset;
        car.position.z = engineSize.z + carSize.z * i - distOffset;
        trainMixers.push(new THREE.AnimationMixer(car));
        trainGp.add(car);
        train.push(car);
    }
    let tail = new THREE.Object3D();
    tail.copy(engineObj);
    tail.position.x = xTrack;
    tail.position.y = trackSize.y/2 + engineSize.y/2 + engineOffset;
    tail.position.z = engineSize.z + carSize.z * n - 2 * distOffset;
    tail.rotation.y = Math.PI;
    trainGp.add(tail);
    train.push(tail);

    scene.add(trainGp);
}

function setPeeps(n){
    let pop = 0;
    for(let i = 0; i < n; i++){
        const obj = new THREE.Object3D();
        obj.copy(peepObj);
        pop += peepPlace(obj);
    }
    if(pop > 0){
        focusPts.push(new THREE.Vector3(platforms[1].position.x,4,platforms[1].position.z));
    }else{
        focusPts.push(new THREE.Vector3(platforms[0].position.x,4,platforms[0].position.z));
    }
}

function peepPlace(p){
    let ret = 0;
    let station = Math.round(Math.random());
    let randX = Math.random() * (pSize.x - stationXoff - stationXoff2);
    let randZ = Math.random() * (pSize.z - 2*stationZoff);
    if(station == 0){
        p.position.x = platforms[station].position.x - (pSize.x - stationXoff2)/2 + randX + stationXoff;
        p.position.z = platforms[station].position.z - pSize.z/2 + randZ + stationZoff;
        p.position.y = statY;
        p.rotation.y = Math.PI;
        ret = -1;
    }else{
        p.position.x = platforms[station].position.x + (pSize.x - stationXoff2)/2 - randX - stationXoff;
        p.position.z = platforms[station].position.z + pSize.z/2 - randZ - stationZoff;
        p.position.y = statY;
        ret = 1;
    }
    let peep = new Passenger('anon',p.position);
    peep.copy(p);
    let mixer = new THREE.AnimationMixer(peep);
    let action = mixer.clipAction(peepClip);
    action.time = Math.random();
    action.play();
    peepMixers.push(mixer);
    peeps.push(peep);
    scene.add(peep);
    return ret;
}

function setPers(p){
    let pos = p;
    if(!pos){
        pos = new THREE.Vector3(buildings[0].position.x-buildingSize.x/2,ground.position.y+perSize.y/2,buildings[0].position.z);
        porigin.copy(pos);
    }
    const obj = peepObj;
    obj.position.x = pos.x;
    obj.position.y = pos.y;
    obj.position.z = pos.z;
    obj.rotation.y = persRot;
    let mixer = new THREE.AnimationMixer(obj);
    let action = mixer.clipAction(peepClip);
    action.time = Math.random();
    action.play();
    peepMixers.push(mixer);
    person = obj;
    scene.add(obj);
}

function setSkyProps(){
    let sx = 6.9;
    decoyCloud.scale.x = sx;
    decoyCloud.scale.y = sx;
    decoyCloud.scale.z = sx;
    decoyCloud.position.y = decoyInitY;
    scene.add(decoyCloud);

    cloud2.copy(decoyCloud);
    cloud2.position.y = stageDim/2;
    cloud2.rotation.y = Math.PI/4;
    scene.add(cloud2);

    mothership.position.y = ufoInitY;
    mothership.scale.multiplyScalar(mothershipSc);
    scene.add(mothership);

    let pos = new THREE.Vector3(decoyCloud.position.x,10,decoyCloud.position.z);
    focusPts.push(pos);
}

//********************** boarding *****************************//

function openDoors(){
    for(let d = 0; d < trainMixers.length; d++){
        let action = trainMixers[d].clipAction(doorOpenClip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.setDuration(oTime);
        action.paused = false;
        action.play();
    }
    idle = setTimeout(()=>{
        doorsOpen = true;
        clearTimeout(idle);
        unboarding();
    },oTime*1000);
}

function closeDoors(){
    let oTime = 1;
    for(let d = 0; d < trainMixers.length; d++){
        let action = trainMixers[d].clipAction(doorOpenClip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.setDuration(-oTime);
        action.paused = false;
        action.play();
    }
    idle = setTimeout(()=>{
        doorsOpen = false;
        ready = true;
        clearTimeout(idle);
    },oTime*1000);
}

function unboarding(){
    let boarded = 0;
    for(let p = 0; p < peeps.length; p++){
        if(peeps[p].boarded){
            boarded++;
            let closest = getClosestHold(peeps[p].position);
            peeps[p].boarded = false;
            peeps[p].destiny = placeHolders[closest].position;
            peeps[p].board = -2;
        }
    }

    if(boarded > 0){
        let unboardReady = setInterval(()=>{
            if(readyPass() == 0){
                clearInterval(unboardReady);
                unboarding2();
            }else{
                console.log(`${readyPass()} passengers still not unboarded.`);
            }
        },2000);
    }else{
        boarding();
    }
}

function getClosestHold(p){
    let closest = 0;
    for(let i = 1; i < placeHolders.length; i++){
        try{
            if(dist(p,placeHolders[i].position) < dist(p,placeHolders[closest].position)){
                closest = i;
            }
        }catch(e){
            console.log('placeholders OOB',e);
            return -1;
        }
    }
    return closest;
}

function getBoardCar(d){
    if(d > 2){
        d-=3;
    }
    return d;
}

function unboarding2(){
    for(let p = 0; p < peeps.length; p++){
        if(peeps[p].board == -2){
            peeps[p].destiny = toStation(peeps[p].position);
            peeps[p].board = -1;
            peeps[p].rotation.y += Math.PI;
        }
    }
    let unboardReady = setInterval(()=>{
        if(readyPass() == 0){
            clearInterval(unboardReady);
            boarding();
        }else{
            console.log(`${readyPass()} passengers still walking off platform.`);
        }
    },1000);
}

function toStation(p){
    let mult = 5;
    if(trainGp.position.x > p.x){
        return new THREE.Vector3(p.x - mult*Math.random(),p.y,p.z + 2*mult*Math.random()-mult);
    }else{
        return new THREE.Vector3(p.x + mult*Math.random(),p.y,p.z + 2*mult*Math.random()-mult);
    }
}

function boarding(){
    for(let p = 0; p < peeps.length; p++){
        if(dist(peeps[p].position, trainGp.position) < stageDim/2){
            //peeps[p].lookAt(trainGp.position);
            let dec = peeps[p].decideRand(placeHolders.length);
            if(dist(peeps[p].position,placeHolders[dec].position)<stageDim/2){
                peeps[p].destiny = placeHolders[dec].position;
                peeps[p].board = getBoardCar(dec);
            }else{
                peeps[p].destiny = undefined;
                peeps[p].board = -1;
            }
        }
    }
    let getReady = setInterval(()=>{
        if(readyPass() == 0){
            clearInterval(getReady);
            boardTrain();
        }else{
            console.log(`${readyPass()} passengers still not ready.`);
        }
    },1000);
}

function boardTrain(){
    console.log('boarding...');
    for(let p = 0; p < peeps.length; p++){
        if(peeps[p].board > -1){
            peeps[p].destiny = new THREE.Vector3(trainGp.position.x,carSize.y/2-carOffIn,trainGp.position.z + engineSize.z + carSize.z*peeps[p].board);
            //console.log(passengers[p].board,passengers[p].destiny);
        }
    }
    let boarder = setInterval(()=>{
        if(readyPass() == 0){
            for(let p = 0; p < peeps.length; p++){
                if(peeps[p].board > -1 && !peeps[p].boarded){
                    //peeps[p].position.z = engineSize.z + carSize.z*passengers[p].board;
                    peeps[p].boarded = true;
                    peeps[p].offset = peeps[p].position.z - trainGp.position.z;
                    //trainGp.add(peeps[p]);
                }
            }
            clearInterval(boarder);
            closeDoors();
        }else{
            console.log(`${readyPass()} passengers still not ready.`);
        }
    },3000);
}

function readyPass(){
    let unready = 0;
    for(let i = 0; i < peeps.length; i++){
        if(!peeps[i].boarded && peeps[i].destiny && dist(peeps[i].position,peeps[i].destiny) > perSpd){
            unready++;
        }
    }
    return unready;
}

//***********************************************************************//

function smokeStack(){
    let xzVar = 4;
    if(loadingComp){
        let part = new THREE.Mesh(smokeShape,smokeMat);
        part.position.x = powerStack.position.x - xzVar + 2*Math.random()*xzVar;
        part.position.z = powerStack.position.z - xzVar + 2*Math.random()*xzVar;
        part.position.y = 10;
        scene.add(part);
        smoke.push(part);
    }
}

function smokeRise(){
    let smokeSpd = 0.96;
    let maxHeight = 300;
    for(let p = 0; p < smoke.length; p++){
        smoke[p].position.y += smokeSpd;
        if(smoke[p].position.y > maxHeight){
            scene.remove(smoke[p]);
            smoke.splice(p,1);
        }
    }
}

export function sceneSwitch(r){
    if(scene2){
        if(!music.muted()){
            music.fadeOut(0,1);
            setTimeout(()=>{
                music.setTrack(bgMusic);
                music.fadeIn(1,0);
            },2000);
        }else{
            music.setTrack(bgMusic);
        }
        rend = r;
        rend.setAnimationLoop(anim);
        camA2.lookAt(plane.position);
        hitHUD.innerText = '';
        
        scene2 = false;
        start = true;
    }else{
        start = false;
        if(!music.muted()){
            music.fadeOut(0,1);
            setTimeout(()=>{
                music.setTrack(bgMusic2);
                music.fadeIn(1,0);
            },1500);
        }else{
            music.setTrack(bgMusic2);
        }
        switchSceneX(rend);
        drawHits();
        drawHP();
        setIntervals();
        scene2 = true;
    }
    camHud.innerText = setCamText();
}

function switchCutsceneInit(){
    start = false;
    chase = true;
    camCut.position.copy(new THREE.Vector3(50,ufoInitY,50));
    camCut.position.x += 50;
    camCut.lookAt(mothership.position);
    rend.setAnimationLoop(switchCutscene);
}

export function getBoost(){
    if(boosting){
        return true;
    }else{
        return false;
    }
}

export function setBossBeat(b){
    if(b){
        localStorage.setItem('beat','true');
        loadTrophy();
    }
}

function loadTrophy(){
    console.log('beat' + localStorage.getItem('beat'));
    if(localStorage.getItem('beat') == 'true'){
        if(!beatBoss){
            beatBoss = true;
            gLoader.load(trophy,function(o){
                let obj = o.scene;
                obj.position.copy(trophyOrigin);
                scene.add(obj);
            });
        }
    }
}

function updateSpdOm(){
    if(spUpdate >= 5){
        if(interestCam != camA && interestCam != camA2 && !(interestCam == camP && boardedPlane)){
            speedOm = (trainGp.position.z - lastZ) / dTime * (18/5)/5;
            //brake.innerText = (speedOm / accel * dTime / (18/5)).toPrecision(2);
            lastZ = trainGp.position.z;
            spdHud.innerText = `${Math.abs(speedOm).toPrecision(3)} km/hr`;
            spUpdate = 0;
        }else{
            speedOm = dist(plane.position,lastPl) / dTime * (18/5)/5;
            lastPl.copy(plane.position);
            spUpdate = 0;
        }
    }else{
        spdHud.innerText = `${Math.abs(speedOm).toPrecision(3)} km/hr`;
    }
    spUpdate++;
}

function watcherConts(){
    if(!flying && dist(person.position,plane.position) < planeSize.z/2){
        conText.innerText = 'Press P to pilot.';
    }else{
        conText.innerText = '';
    }
}

function loadBern(p=undefined){
    if(!bernin){
        let pos = p;
        if(!pos){
            pos = new THREE.Vector3();
            pos.copy(buildings[8].position);
            pos.y = buildings[8].position.y + buildingSize.y + 0.2;
        }
        if(dist(plane.position,pos) < 42){
            bernin = true;
            gLoader.load(bern,function(o){
                let b = o.scene;
                b.scale.copy(new THREE.Vector3(1.2,1.2,1.2));
                b.position.copy(pos);
                b.rotation.y = Math.PI;
                scene.add(b);
            });
        }
    }
}

function boardPlane(){
    if(!flying && dist(person.position,plane.position) < planeSize.z/2){
        flying = true;
        boardedPlane = true;
        person.position.copy(new THREE.Vector3(0,perSize.y/2,planeSize.z/4));
        plane.add(person);
        person.rotation.y = -Math.PI/2;
        interestCam = camA2;
        resetCam();
        interestCam.lookAt(plane.position);
        conText.innerText = 'Use the arrow keys to move and B to boost.';
        setTimeout(()=>{
            conText.innerText = '';
        },2000);
    }else if(flying && boardedPlane){
        plane.remove(person);
        person.position.copy(plane.position);
        scene.add(person);
        //initPersonCam();
        interestCam = camP;
        resetCam();
        boardedPlane = false;
    }
}

window.addEventListener('resize',()=>{
    interestCam.aspect = window.innerWidth/window.innerHeight;
    interestCam.updateProjectionMatrix();
    rend.setSize(window.innerWidth,window.innerHeight);
});