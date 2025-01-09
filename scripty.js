import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Passenger} from './passenger.js';
import {dirTo, dist,pointOnLine,progress} from './loc.js';
import {moveJet,moveJetCam,jetSpd} from './jetMove.js';
import {animLoop,drawHits,drawHP,setIntervals,music2} from './scripty2.js';

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

const bgMusic = './audio/futurescapesOverture4.mp3';
const music = new Audio(bgMusic);
music.loop = true;
music.muted = true;
music.volume = 0;

let start = false;

const spdHud = document.getElementById('speed');
const camHud = document.getElementById('cam');
const hitHUD = document.getElementById('hitCt');

const stageDim = 1000;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camS0 = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camS1 = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camP = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camA = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
const camA2 = new THREE.PerspectiveCamera(90,window.innerWidth/window.innerHeight,0.1,stageDim);
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
let powerSize = new THREE.Vector3();
let stackSize = new THREE.Vector3();
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
let input = [0,0];

//const scenery = [];
const tracks = [];
const train = [];
const platforms = [];
const trainMixers = [];
const peeps = [];
const peepMixers = [];
const placeHolders = [];
const scenery = [];
const smoke = [];

let engineObj = new THREE.Object3D();
let traincarObj = new THREE.Object3D();
let trackObj = new THREE.Object3D();
let buildingObj = new THREE.Object3D();
let windmillObj = new THREE.Object3D();
let peepObj = new THREE.Object3D();
let doorOpenClip = undefined;
let peepClip = undefined;
let windmillClip = undefined;

let plane = new THREE.Object3D();
let powerPlant = new THREE.Object3D();
let powerStack = new THREE.Object3D();

let smokeShape = new THREE.SphereGeometry(16,3,2);
let smokeMat = new THREE.MeshLambertMaterial({color: 0xeeeeee});

let person = undefined;
let persRot = 0;
let perSize = new THREE.Vector3();

let numPeeps = 10;

let dTime = 0;
let prevTime = Date.now();
let lastZ = 0;

let spd = 0.05;
let perSpd = 0.5;

let planeSpd = 0.42;
const planeSpdBase = planeSpd;
const planeMaxSpd = 5;
let planeAccel = 0.05;
let boosting = false;

const maxSpd = 1.5;
let trainSpd = 0.5;
let accel = 0.016;
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
scene.fog = new THREE.Fog(0xffffff,0.1,stageDim-6);

let skylineVar = 16;
let buildingNum = 29;
let windmillNum = 20;

let planeHeight = 200;

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

loadModels();
let scene2 = false;
const origin = new THREE.Vector3(0,camHeight,0);
const porigin = new THREE.Vector3(origin.x-camDist,origin.y,origin.z);
let atarget = 0;
const apos = [new THREE.Vector3(0,planeHeight,planeHeight),new THREE.Vector3(-planeHeight,planeHeight,planeHeight/2),new THREE.Vector3(-planeHeight,planeHeight,-planeHeight/2),new THREE.Vector3(0,planeHeight,-planeHeight), new THREE.Vector3(planeHeight,planeHeight,-planeHeight/2), new THREE.Vector3(planeHeight,planeHeight,planeHeight/2)];
cam.position.x = origin.x + camDist;
cam.position.y = origin.y;
cam.position.z = origin.z;
const trainGp = new THREE.Object3D();

window.addEventListener('click',initClick);

//---------------------------- GAME LOOP -----------------------------//

rend.render(scene,interestCam);
rend.setAnimationLoop(anim);

function anim(){
    rend.render(scene,interestCam);
    if(!loadingComp){
        loadLoop();
    }else{
        if(start){
            moveTrain();
            movePlane();
            if(stop){
                for(let i = 0; i < trainMixers.length; i++){
                    trainMixers[i].update((Date.now() - prevTime)/1000);
                }
            }
    
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
            let speedOm = (trainGp.position.z - lastZ) / dTime * (18/5);
            //brake.innerText = (speedOm / accel * dTime / (18/5)).toPrecision(2);
            lastZ = trainGp.position.z;
            spdHud.innerText = `${Math.abs(speedOm).toPrecision(3)} km/hr`;
        }else{
            hitHUD.innerText = 'Click to Start';
        }
        moveCam();
        dTime = (Date.now() - prevTime)/1000;
        for(let j = 0; j < peepMixers.length; j++){
            peepMixers[j].update(dTime);
        }
        prevTime = Date.now();
        sky.rotation.y += skyRot;
    }
}

function animJet(){
    animLoop(rend,input,boosting);
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

    setPlatforms();

    gLoader.load(alien,function(o){
        peepObj = o.scene;
        peepClip = o.animations[0];
        loadProg++;
    });
    gLoader.load(building,function(o){
        buildingObj = o.scene;
        loadProg++;
    });
    gLoader.load(windmill,function(o){
        windmillObj = o.scene;
        windmillClip = o.animations[0];
        loadProg++;
    });
}

function loadLoop(){
    if(loadProg > 5){
        loadingComp = true;
        setTracks();
        setTrain(3);
        loadPower();
        loadWindmills();
        loadBuildings();
        loadAirship();
        setPeeps(numPeeps);
        setPers(porigin);
        initCams();
        camHud.innerText = 'Camera: Train';
        origin.z = 10;
        trainGp.add(cam);
        camRot = 3/2 * Math.PI;
        moveCam2();
    }else{
        camHud.innerText = 'Loading...';
    }
}

function doubleTap(){
    console.log('logged a doubleTap');
}

let cooldown = undefined;

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
        camHud.innerText = setCamText();
    }
    if(k.key == '1'){
        interestCam = camS1;
        camHud.innerText = setCamText();
    }
    if(k.key == '2'){
        interestCam = cam;
        camHud.innerText = setCamText();
    }
    if(k.key == '3'){
        interestCam = camP;
        camHud.innerText = setCamText();
    }
    if(k.key == '4'){
        interestCam = camA;
        camHud.innerText = setCamText();
    }
    if(k.key == '5'){
        interestCam = camA2;
        resetCam();
        interestCam.lookAt(plane.position);
    }
    if(k.key == 'r'){
        resetCam();
    }
    if(k.key == 'b'){
        boosting = true;
    }
    if(k.key == 'p'){
        if(!cooldown){
            cooldown = setTimeout(()=>{
                cooldown = undefined;  
            },5000);
            sceneSwitch();
            camHud.innerText = setCamText();
        }
    }
});

function initClick(){
    if(!start){
        start = true;
        hitHUD.innerText = '';
        musicFadeIn(music,1,0);
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
        camHud.innerText = setCamText();
}

function setCamText(){
    if(interestCam == camS0){
        return 'Camera: Station 1';
    }else if(interestCam == camS1){
        return 'Camera: Station 2';
    }else if(interestCam == cam){
        return 'Camera: Train';
    }else if(interestCam == camP){
        return 'Camera: Watcher';
    }else if(interestCam == camA){
        return 'Camera: Air';
    }else if(interestCam == camA2){
        return 'Camera: Jet';
    }else{
        if(scene2){
            return 'Camera: Space';
        }
        return '';
    }
}

window.addEventListener('mousedown',(e)=>{
    e.preventDefault();
    mouseDown = true;
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
});

window.addEventListener('mousemove',(e)=>{
    if(mouseDown){
        if(interestCam == cam){
            camRot += e.movementX*spd;
            moveCam2();
        }else if (interestCam == camP){
            persRot += e.movementX*spd;
            moveCamP();
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
            moveCamP();
        }else if (interestCam == camA2){

        }else{
            camRot += dx*spd;
            moveCam3();
        }
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
        if(interestCam == camP){
            moveCamP();
        }else if(interestCam == camA){
            moveCamA();
        }else if(interestCam == camA2){
            moveJetCam(plane,camA2,spd,input);
        }else{
            camDist += spd * input[1];
            moveCam2();
        }
    }
    if(input[0] != 0){
        if(interestCam == camP){
            moveCamP();
        }else if(interestCam == camA2){
            moveJetCam(plane,camA2,spd,input);
        }else{
            origin.z += spd * input[0];
            moveCam2();
        }
        //console.log(Math.cos(new THREE.Vector3(1,0,0).angleTo(dirF)),new THREE.Vector3(0,0,1).angleTo(dirF));
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

    if(input[1] != 0){
        person.position.x += input[1]*perSpd*Math.cos(person.rotation.y);
        person.position.z -= input[1]*perSpd*Math.sin(person.rotation.y);
    }
    if(input[0] != 0){
        person.position.x += input[0]*perSpd*Math.sin(person.rotation.y);
        person.position.z += input[0]*perSpd*Math.cos(person.rotation.y);
    }
    if(person.position.y > ground.position.y + perSize.y/2){
        person.position.y -= perSpd;
    }
}

function moveCamA(){
    if(input[1] != 0){
        camA.position.y += input[1]*spd;
    }
}

function movePlane(){
    if(interestCam != camA2){
        if (dist(plane.position,apos[atarget]) >= planeSpd){
            let dir = dirTo(plane.position,apos[atarget]);
            plane.position.x += dir.x * planeSpd;
            plane.position.z += dir.z * planeSpd;
            plane.position.y += dir.y * planeSpd;
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
            atarget++;
            if(atarget >= apos.length){
                atarget = 0;
            }
        }
    }else{
        moveJet(plane,planeSpd);
    }
    planeSpd = jetSpd(planeSpd,planeMaxSpd,planeSpdBase,planeAccel,boosting);
}

function setPlatforms(){
    
    gLoader.load(station,(o)=>{
        const platform = o.scene;
        const platform2 = new THREE.Object3D().copy(platform);
        pSize = new THREE.Vector3();
        new THREE.Box3().setFromObject(platform).getSize(pSize);

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
    });
}

function stationHold(s,Xoff,Zoff){
    let p = new THREE.Object3D();

    p.position.x = s.position.x + Xoff;
    p.position.y = statY;
    p.position.z = s.position.z + Zoff;

    console.log(p.position);

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
            obj.position.y = ground.position.y - Math.round(Math.random()*skylineVar);
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
        scenery.push(obj);
        scene.add(obj);
    }
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
        if(i % 2 == 1){
            obj.rotation.y = Math.PI;
        }

        let mixer = new THREE.AnimationMixer(obj);
        let action = mixer.clipAction(windmillClip);
        action.time = Math.random();
        action.play();

        scenery.push(obj);
        scene.add(obj);
        peepMixers.push(mixer);
    }
}

function loadAirship(){
    gLoader.load(airship,function(o){
        let obj = o.scene;
        obj.position.x = apos[atarget].x;
        obj.position.y = apos[atarget].y;
        obj.position.z = apos[atarget].z;

        plane.copy(obj);

        let up = new THREE.Object3D();
        up.position.copy(new THREE.Vector3(0,1,0));
        plane.add(up);
        scene.add(plane);
    });
}

function initCams(){
    
    initStationCams()

    camP.position.copy(new THREE.Vector3(0,camHeight,0));
    person.rotation.y = persRot;
    camP.rotation.y = -Math.PI/2;

    person.add(camP);

    camA.position.copy(new THREE.Vector3(0,camDist,0));
    camA.rotation.x = -Math.PI/2;
    plane.add(camA);
    camA2.position.copy(new THREE.Vector3(0,0,-camDist));
    plane.add(camA2);
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

    new THREE.Box3().setFromObject(peepObj).getSize(perSize);

    for(let i = 0; i < n; i++){
        const obj = new THREE.Object3D();
        obj.copy(peepObj);
        peepPlace(obj);
    }
}

function peepPlace(p){
    let station = Math.round(Math.random());
    let randX = Math.random() * (pSize.x - stationXoff - stationXoff2);
    let randZ = Math.random() * (pSize.z - 2*stationZoff);
    if(station == 0){
        p.position.x = platforms[station].position.x - (pSize.x - stationXoff2)/2 + randX + stationXoff;
        p.position.z = platforms[station].position.z - pSize.z/2 + randZ + stationZoff;
        p.position.y = statY;
        p.rotation.y = Math.PI;
    }else{
        p.position.x = platforms[station].position.x + (pSize.x - stationXoff2)/2 - randX - stationXoff;
        p.position.z = platforms[station].position.z + pSize.z/2 - randZ - stationZoff;
        p.position.y = statY;
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
}

function setPers(pos){
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

function openDoors(){
    let oTime = 1;
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

function musicFadeIn(music,vol,t){
    let tol = 0.05;
    let init = music.volume;
    if(music.muted){
        music.muted = false;
    }
    if(music.paused){
        music.play();
    }
    let int = setInterval(()=>{
        if(music.volume >= vol - tol){
            clearInterval(int);
        }else{
            if(music.volume + (vol-init)/10 >= 1 - tol){
                music.volume = 1;
                clearInterval(int);
            }else{
                music.volume += (vol-init)/10;
            }
        }
    },t*100);
}

function musicFadeOut(music,vol,t){
    let tol = 0.05
    let init = music.volume;
    let int = setInterval(()=>{
        if(music.volume <= vol + tol){
            if(vol <= tol){
                music.pause();
                music.muted = true;
            }
            clearInterval(int);
        }else{
            if(music.volume - (init-vol)/10 <= tol){
                music.volume = 0;
                music.pause();
                music.muted = true;
                clearInterval(int);
            }else{
                music.volume -= (init-vol)/10;
                console.log(music.volume);
            }
        }
    },t*100);
}

function sceneSwitch(){
    if(scene2){
        musicFadeOut(music2,0,1);
        setTimeout(()=>{
            musicFadeIn(music,1,1);
        },2000);
        rend.setAnimationLoop(anim);
        hitHUD.innerText = '';
        scene2 = false;
        start = true;
    }else{
        start = false;
        musicFadeOut(music,0,1);
        setTimeout(()=>{
            musicFadeIn(music2,1,1);
        },2000);
        rend.setAnimationLoop(animJet);
        drawHits();
        drawHP();
        setIntervals();
        scene2 = true;
    }
}

window.addEventListener('resize',()=>{
    interestCam.aspect = window.innerWidth/window.innerHeight;
    interestCam.updateProjectionMatrix();
    rend.setSize(window.innerWidth,window.innerHeight);
});