import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {dirTo, dist,pointOnLine,progress} from './loc.js';
import {moveJet2,moveJetCam2,jetSpd} from './jetMove.js';

const spdHUD = document.getElementById('speed');
const camHUD = document.getElementById('cam');

const bg = './graphics/galaxyJ.jpg';
const ship = './graphics/airship1.glb';
const eyeB = './graphics/alienEye.glb';
let jet = new THREE.Object3D();
let jetload = false;

let drawDist = 500;

let camDist = 30;
let camHei = 3;
let stageHei = 30;
let jetSpdBase = 2;
let spd = jetSpdBase;
let climbSpd = 0.02;
let turnSpd = 1;
let jetSpdMax = 8;
let accel = 0.1;

const rocks = [];
const enemies = [];
const mixers = [];

let eyenemy = new THREE.Object3D();
let eyenemyClip = undefined;

let rockDensity = 300;
let enemyDensity = 50;

const gLoader = new GLTFLoader();
const tLoader = new THREE.TextureLoader();

const bgTex = tLoader.load(bg);

const scene = new THREE.Scene();
scene.background = bgTex;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(drawDist,10000),new THREE.MeshBasicMaterial({transparent: true,opacity: 0}));

let origin = new THREE.Vector3(0,stageHei/2,0);

ground.position.y = 0;
ground.rotation.x = -Math.PI/2;

let groundSize = new THREE.Vector3();
new THREE.Box3().setFromObject(ground).getSize(groundSize);

ground.position.z = groundSize.z/2;

const light = new THREE.AmbientLight({color: 0xffffff});
scene.add(light);
scene.add(ground);
const cam = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,drawDist);
cam.position.copy(new THREE.Vector3(0,camHei,-camDist));
let prevTime = Date.now();

function load(){
    gLoader.load(ship,function(o){
        let obj = o.scene;
        obj.position.copy(origin);
        jet.copy(obj);
        let up = new THREE.Object3D();
        up.position.copy(new THREE.Vector3(0,1,0));
        jet.add(up);
        scene.add(jet);

        jet.add(cam);
        console.log('loaded jet in scene2');
    });

    gLoader.load(eyeB,function(o){
        eyenemy = o.scene;
        eyenemyClip = o.animations[0];
    });

    for(let i = 0; i < rockDensity; i++){
        let rock = new THREE.Mesh(new THREE.SphereGeometry(Math.random()+1,3,2),new THREE.MeshBasicMaterial({color:0x222222}));
        rock.position.x = Math.random()*groundSize.x*2 - groundSize.x;
        rock.position.y = Math.random()*stageHei*4 - stageHei*2;
        rock.position.z = Math.random()*groundSize.z;
        scene.add(rock);
        rocks.push(rock);
    }

    setInterval(()=>{
        loopRocks();
    },4000);
}

export function animLoop(rend,inp,b){
    if(!jetload){
        load();
        jetload = true;
    }else{
        addEnemies();
        moveJet2(jet,spd,[groundSize.x,stageHei]);
        moveJetCam2(jet,cam,climbSpd,turnSpd,inp,groundSize.x,1);
        spd = jetSpd(spd,jetSpdMax,jetSpdBase,accel,b);
        for(let m = 0; m < mixers.length; m++){
            mixers[m].update((Date.now()-prevTime)/1000);
        }
        prevTime = Date.now();
        spdHUD.innerText = '';
        camHUD.innerText = 'Camera: Space';
        rend.render(scene,cam);
    }
}

function addEnemies(){
    if(eyenemyClip != undefined){
        //console.log(enemies.length);
        if(enemies.length < enemyDensity){
            for(let i = 0; i < enemyDensity-enemies.length; i++){
                let zPos = Math.random()*(groundSize.z - drawDist) + drawDist;
                let yPos = Math.random()*stageHei - ground.position.y;
                let xPos = Math.random()*groundSize.x - groundSize.x/2;
                
                let enemeye = new THREE.Object3D();
                enemeye.copy(eyenemy);
                enemeye.position.copy(new THREE.Vector3(xPos,yPos,zPos));
                let mixer = new THREE.AnimationMixer(enemeye);
                let action = mixer.clipAction(eyenemyClip);
                action.time = Math.random();
                action.play();
                mixers.push(mixer);
                enemies.push(enemeye);
                scene.add(enemeye);
            }
        }
    }
}

function loopRocks(){
    for(let r = 0; r < rocks.length; r++){
        if(rocks[r].position.z < jet.position.z - camDist){
            rocks[r].position.z += groundSize.z;
        }
    }
}