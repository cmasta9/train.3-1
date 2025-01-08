import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {dirTo,dist,pointOnLine,progress} from './loc.js';
import {moveJet2,moveJetCam2,jetSpd,fore} from './jetMove.js';
import {Hostile} from './hostile.js';

const spdHUD = document.getElementById('speed');
const camHUD = document.getElementById('cam');
const hitHUD = document.getElementById('hitCt');

const bg = './graphics/galaxyJ.jpg';
const ship = './graphics/airship1.glb';
const eyeB = './graphics/alienEye.glb';

const lazarSE = './audio/se_laserShotSep.mp3';
const splodeSE = './audio/se_splodeSpace.mp3';
const hitSE = './audio/se_shipHit3.mp3';

const lazarClip = document.createElement("AUDIO");
lazarClip.src = lazarSE;
lazarClip.volume = 0.5;
lazarClip.loop = false;

const splodeClip = document.createElement("AUDIO");
splodeClip.src = splodeSE;
splodeClip.loop = false;

const hitClip = document.createElement("AUDIO");
hitClip.src = hitSE;
lazarClip.volume = 0.8;
hitClip.loop = false;

const gLoader = new GLTFLoader();
const tLoader = new THREE.TextureLoader();

const bgTex = tLoader.load(bg);
bgTex.colorSpace = THREE.SRGBColorSpace;

const explosion = [];
for (let e = 0; e < 6; e++){
    let frame = tLoader.load(`./graphics/explode/explode${e}.png`);
    frame.colorSpace = THREE.SRGBColorSpace;
    explosion.push(frame);
}

let jet = new THREE.Object3D();
let jetSize = new THREE.Vector3();
let jetload = false;
let go = false;

let drawDist = 500;

let maxHits = 3;
let hp = maxHits;
let invincible = false;
let invTime = 2

let hits = 0;

let camDist = 30;
let camHei = 8;
let stageHei = 30;
let jetSpdBase = 2;
let spd = jetSpdBase;
let climbSpd = 0.02;
let bullSpd = 11;
let turnSpd = 2;
let jetSpdMax = 8;
let accel = 0.1;

let fireCDtime = 0.2;
let fireCD = false;

let bulletRad = 1;

const rocks = [];
const enemies = [];
const mixers = [];
const bullets = [];

const initColors = [];

let enemeyeSpdInit = 0.02;
let eyenemy = new Hostile(1,enemeyeSpdInit,1);
let eyenemyClip = undefined;
let eyenemySize = new THREE.Vector3();
let eyenemyScale = 3;

let rockDensity = 300;
let enemyDensity = 50;

let rockInt = undefined;
let enemInt = undefined;

const scene = new THREE.Scene();
scene.background = bgTex;
const planeX = drawDist;
const planeZ = 10000;

let origin = new THREE.Vector3(0,stageHei/2,0);

const light = new THREE.AmbientLight({color: 0xffffff});
scene.add(light);
const cam = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,drawDist);
cam.position.copy(new THREE.Vector3(0,camHei,-camDist));
let prevTime = Date.now();

function load(){

    hitClip.muted = true;
    hitClip.play();
    lazarClip.muted = true;
    lazarClip.play();
    splodeClip.muted = true;
    splodeClip.play();

    gLoader.load(ship,function(o){
        let obj = o.scene;
        obj.position.copy(origin);
        jet.copy(obj);
        let up = new THREE.Object3D();
        up.position.copy(new THREE.Vector3(0,1,0));
        new THREE.Box3().setFromObject(jet).getSize(jetSize);

        jet.traverse((p)=>{
            if(p.isMesh){
                initColors.push(p.material.color);
            }
        });

        jet.add(up);
        scene.add(jet);

        jet.add(cam);
        console.log('loaded jet in scene2');
        go = true;
    });

    gLoader.load(eyeB,function(o){
        eyenemy = o.scene;
        new THREE.Box3().setFromObject(eyenemy).getSize(eyenemySize);
        eyenemyClip = o.animations[0];
    });

    initRocks(rockDensity);

    drawHits(hits);

    setIntervals();

    setTimeout(()=>{
        hitClip.muted = false;
        lazarClip.muted = false;
        splodeClip.muted = false;
    },2000);
}

export function animLoop(rend,inp,b){
    if(!jetload){
        load();
        jetload = true;
    }else{
        addEnemies();
        if(go){
            moveJet2(jet,spd,[planeX,stageHei]);
            moveJetCam2(jet,cam,climbSpd,turnSpd,inp,planeX,1);
            spd = jetSpd(spd,jetSpdMax,jetSpdBase,accel,b);
            for(let m = 0; m < mixers.length; m++){
                mixers[m].update((Date.now()-prevTime)/1000);
            }
            moveEnemies(enemies,jet.position);
        }
        moveBullets();
        enemyCollision(enemies,jetSize.z/2);
        prevTime = Date.now();
        camHUD.innerText = 'Camera: Space';
        rend.render(scene,cam);
    }
}

window.addEventListener('keydown',(e)=>{
    if(camHUD.innerText == 'Camera: Space'){
        if(e.key == ' '){
            if(!fireCD){
                fireCD = true;
                fire();
                setTimeout(()=>{
                    fireCD = false;
                },fireCDtime*1000);
            }
        }
    }
});

function fire(){
    let bullet = new THREE.Mesh(new THREE.SphereGeometry(bulletRad,3,2),new THREE.MeshBasicMaterial({color: 0xffff00}));
    bullet.position.copy(jet.position);
    bullets.push(bullet);
    scene.add(bullet);
    lazarClip.currentTime = 0;
    lazarClip.play();
}

function moveBullets(){
    for(let b = 0; b < bullets.length; b++){
        if(dist(jet.position,bullets[b].position) > drawDist){
            scene.remove(bullets[b]);
            bullets.splice(b,1);
        }else{
            if(bulletCollision(bullets[b],enemies,eyenemySize.x/2*eyenemyScale) != -1){
                scene.remove(bullets[b]);
                bullets.splice(b,1);
            }else{
                bullets[b].position.x += fore.x * bullSpd;
                bullets[b].position.y += fore.y * bullSpd;
                bullets[b].position.z += fore.z * bullSpd;
            }
        }
        console.log(bullets.length);
    }
}

function bulletCollision(b,ens,r){
    for(let e = 0; e < ens.length; e++){
        if(dist(b.position,ens[e].position) <= r){
            splode(b.position,10);
            damageEnemy(1,ens,e);
            return e;
        }
    }
    return -1;
}

function enemyCollision(ens,r){
    for(let e = 0; e < ens.length; e++){
        if(dist(jet.position,ens[e].position) <= r){
            if(!invincible){
                invinc(invTime);
                hitClip.currentTime = 0;
                hitClip.play();
                hp--;
                drawHP();
                if(hp <= 0){
                    death();
                }
            }
            damageEnemy(2,ens,e);
            return e;
        }
    }
}

function damageEnemy(pow,ens,e){
    ens[e].hp -= pow;
    console.log(ens[e].hp);
    if(ens[e].hp <= 0){
        splode(ens[e].position,20);
        hits++;
        drawHits(hits);
        let splen = ens[e];
        ens.splice(e,1);
        setTimeout(()=>{
            scene.remove(splen);
        },300);
    }
}

function invinc(t){
    if(!invincible){
        invincible = true;
        flash(t,jet,new THREE.Color(0xff0000));
        setTimeout(()=>{
            invincible = false;
        },t*1000);
    }
}

function flash(t,o,c=new THREE.Color(0x000000)){
    let mat = 0;
    o.traverse((p)=>{
        if(p.isMesh){
            p.material.color = c;
        }
    });
    setTimeout(()=>{
        o.traverse((p)=>{
            if(p.isMesh){
                p.material.color = initColors[mat];
                mat++;
            }
        });
    },t*1000);
}

function death(){
    go = false;
    splode(jet.position,60);
    flash(2,jet,new THREE.Color(0x000000));
    setTimeout(()=>{
        reset();
    },2000);
}

function splode(p,s=20){
    let splosion = new THREE.Sprite(new THREE.SpriteMaterial({map: explosion[0]}));
    splosion.scale.copy(new THREE.Vector3(s,s,s));
    splosion.position.copy(p);
    scene.add(splosion);
    let frame = 1;
    let sploder = window.setInterval(()=>{
        if(frame < explosion.length){
            if(frame == 2){
                splodeClip.volume = (drawDist-dist(jet.position,splosion.position))/drawDist;
                splodeClip.currentTime = 0;
                splodeClip.play();
            }
            splosion.material = new THREE.SpriteMaterial({map: explosion[frame]});
            frame++;
        }else{
            scene.remove(splosion);
            clearInterval(sploder);
        }
    },100);
}

function addEnemies(){
    if(eyenemyClip != undefined){
        if(enemies.length < enemyDensity){
            for(let i = 0; i < enemyDensity-enemies.length; i++){
                let zPos = Math.random()*(planeZ - drawDist) + drawDist + jet.position.z;
                let yPos = Math.random()*stageHei;
                let xPos = Math.random()*planeX - planeX/2;
                
                let enemeye = new Hostile(1,enemeyeSpdInit+(Math.floor(hits/5)*0.2),1,drawDist*3/5);
                enemeye.copy(eyenemy);
                enemeye.scale.copy(new THREE.Vector3(eyenemyScale,eyenemyScale,eyenemyScale));
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

function moveEnemies(ens,t=jet.position){
    for(let e = 0; e < ens.length; e++){
        if(dist(ens[e].position,t) < ens[e].sight){
            let dis = dirTo(ens[e].position,t);
            ens[e].position.x += dis.x * ens[e].spd;
            ens[e].position.y += dis.y * ens[e].spd;
            ens[e].position.z += dis.z * ens[e].spd;
            ens[e].lookAt(t);
        }
    }
}

function removeEnemies(){
    if(camHUD.innerText == 'Camera: Space'){
        for(let e = 0; e < enemies.length; e++){
            if(enemies[e].position.z < jet.position.z - camDist){
                scene.remove(enemies[e]);
                enemies.splice(e,1);
            }
        }
        console.log('enemies: ' + enemies.length);
    }else{
        clearInterval(enemInt);
    }
}

export function drawHP(){
    let hps = '';
    for(let h = 0; h < hp; h++){
        hps = hps + '&#x2665;';
    }
    spdHUD.innerHTML = hps;
}

export function drawHits(){
    hitHUD.innerText = `Hits: ${hits}`;
}

function initRocks(d){
    for(let i = 0; i < d; i++){
        let rock = new THREE.Mesh(new THREE.SphereGeometry(Math.random()+1,3,2),new THREE.MeshBasicMaterial({color:0x222222}));
        rock.position.x = Math.random()*planeX*2 - planeX;
        rock.position.y = Math.random()*stageHei*4 - stageHei*2;
        rock.position.z = Math.random()*planeZ;
        scene.add(rock);
        rocks.push(rock);
    }
}

function loopRocks(){
    if(camHUD.innerText == 'Camera: Space'){
        for(let r = 0; r < rocks.length; r++){
            if(rocks[r].position.z < jet.position.z - camDist){
            rocks[r].position.z += planeZ;
            }
        }
    }else{
        clearInterval(rockInt);
    }
}

function removeRocks(){
    for(let r = 0; r < rocks.length; r++){
        scene.remove(rocks.pop());
    }
}

function removeAllEnemies(){
    for(let e = 0; e < enemies.length; e++){
        scene.remove(enemies.pop());
    }
}

export function setIntervals(){
    rockInt = setInterval(()=>{
        loopRocks();
    },4000);

    enemInt = setInterval(()=>{
        removeEnemies();
    },4000);
}

function reset(){
    removeRocks();
    jet.position.copy(origin);
    removeAllEnemies();
    initRocks(rockDensity);
    hits = 0;
    drawHits();
    hp = maxHits;
    drawHP();
    go = true;
}