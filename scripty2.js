import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {dirTo,dist} from './loc.js';
import {moveJet2,moveJetCam2,jetSpd,getFore} from './jetMove.js';
import {Hostile,Bullet} from './hostile.js';
import {sceneSwitch,input,getBoost,setBossBeat} from './scripty.js';
import * as music from './music.js';

const spdHUD = document.getElementById('speed');
const camHUD = document.getElementById('cam');
const hitHUD = document.getElementById('hitCt');
const camNum = document.getElementById('camNum');
const hpHUD = document.getElementById('hp');
let bossHUD = undefined;
let bossHP = undefined;

let rend = new THREE.WebGLRenderer();

const bg = './graphics/galaxyJ.jpg';
const ship = './graphics/airship1.glb';
const eyeB = './graphics/alienEye.glb';
const ufo = './graphics/ufo2.glb';
const boss = './graphics/bossShip1l2.glb';
const shot = './graphics/shot.glb';
const merkaba = './graphics/energy.glb';
const alien = './graphics/alienBeingO.glb';

const lazarSE = './audio/se_laserShotSep.mp3';
const splodeSE = './audio/se_splodeSpace.mp3';
const hitSE = './audio/se_shipHit3.mp3';
const breakSE = './audio/se_ufoBreak.mp3';
const recoverSE = './audio/se_recover1.mp3';
const chargeSE = './audio/se_chargeLazar.mp3';
const bigLazarSE = './audio/se_bigLazar.mp3';
const boostSE = './audio/boostSE2.mp3';

const bgMusic2 = './audio/futurescapes4.ogg';
const bgMusic3 = './audio/fatefulEncounter2.ogg';

const lazarClip = new Audio(lazarSE);
lazarClip.volume = 0.5;

const splodeClip = new Audio(splodeSE);

const hitClip = new Audio(hitSE);
lazarClip.volume = 0.8;

const ufoClip = new Audio(breakSE);
ufoClip.volume = 0.69;

const chargeClip = new Audio(chargeSE);
chargeClip.volume = 0.69;

const boomClip = new Audio(bigLazarSE);

const recoverClip = new Audio(recoverSE);
recoverClip.volume = 0.8;

const booSE = new Audio(boostSE);

const gLoader = new GLTFLoader();
const tLoader = new THREE.TextureLoader();

let loaded = 0;

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
let jetColor = [];
let jetload = false;
let ready = false;
let go = false;

let person = new THREE.Object3D();
let perSize = new THREE.Vector3();
let perClip = undefined;
let camHeight = 1.6;

let mothership = new THREE.Object3D();
let maxBossHp = 2000;
let bossShip = new Hostile(maxBossHp,2,1,200);
let bossScale = 1.69;
let bossSize = new THREE.Vector3();
let bossColor = [];
let bossClip = undefined;
let bossShots = 0;
let bossMaxShots = 10;
let bossCyc = 0;
let bossAct = undefined;
let charginLazar = false;
let lazarCharged = false;
let lazarDone = false;

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

//let spdUpdate = 0;
//let updF = 5;
//let int = 0;

let lastPos = new THREE.Vector3();

let fireCDtime = 0.2;
let fireCD = false;

let lazar = new THREE.Object3D();
let lazarSize = new THREE.Vector3();

let bulletRad = 30;
let particleRad = 20;
let bulletObj = new Bullet();
let particleObj = new THREE.Object3D();
let partSpd = turnSpd+1;
let merkObj = new THREE.Object3D();
let eRotSpd = 0.03;
let merkSize = new THREE.Vector3();
//bulletObj = new THREE.Mesh(new THREE.SphereGeometry(bulletRad,3,2),new THREE.MeshBasicMaterial({color: 0xffff00}));

const rocks = [];
const enemies = [];
const mixers = [];
const bullets = [];
const particles = [];
const powerups = [];

let showBarrier = false;

let enemeyeSpdInit = 0.02;
let eyenemy = new Hostile(1,enemeyeSpdInit,1);
let eyenemyClip = undefined;
let eyenemySize = new THREE.Vector3();
let eyenemyScale = 3;

let rockDensity = 300;
let enemyDensityBase = 50;
let enemyDensity = enemyDensityBase;

let rockInt = undefined;
let enemInt = undefined;
let preBossInt = undefined;
let bossSpawnerInt = undefined;
let rotter = undefined;
let firin = undefined;
let boomBoom = undefined;

let bossAppear = false;
let bossInv = false;
let battleStart = false;
let bossBeat = false;

const scene = new THREE.Scene();
scene.background = bgTex;
const planeX = drawDist;
const planeZ = 10000;

const barrier = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({color:0x2288ff,opacity:0.42,transparent:true,side:THREE.DoubleSide}));
barrier.rotation.y = Math.PI/2;

let origin = new THREE.Vector3(0,stageHei/2,0);

const light = new THREE.AmbientLight({color: 0xffffff});
scene.add(light);
const cam = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,drawDist);
const camP = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,drawDist);
const bossCam = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,drawDist);
let interestCam = cam;
let camBuff = interestCam;
let camOrigin = new THREE.Vector3(0,camHei,-camDist);
cam.position.copy(camOrigin);
let prevTime = Date.now();

function load(){

    hitClip.muted = true;
    hitClip.play();
    lazarClip.muted = true;
    lazarClip.play();
    splodeClip.muted = true;
    splodeClip.play();
    recoverClip.muted = true;
    recoverClip.play();
    chargeClip.muted = true;
    chargeClip.play();
    boomClip.muted = true;
    boomClip.play();

    gLoader.load(ship,function(o){
        jet.copy(o.scene);
        jet.position.copy(origin);
        let up = new THREE.Object3D();
        up.position.copy(new THREE.Vector3(0,1,0));
        new THREE.Box3().setFromObject(jet).getSize(jetSize);

        jet.traverse((p)=>{
            if(p.isMesh){
                jetColor.push(p.material.color);
            }
        });

        jet.add(up);
        scene.add(jet);

        jet.add(cam);
        loaded++;
        console.log('loaded jet in scene2');
    });

    gLoader.load(ufo,function(o){
        mothership.copy(o.scene);
        mothership.scale.copy(new THREE.Vector3(bossScale,bossScale,bossScale));
        loaded++;
    });

    gLoader.load(alien,function(o){
        person.copy(o.scene);
        new THREE.Box3().setFromObject(person).getSize(perSize);
        perClip = o.animations[0];
        let mixer = new THREE.AnimationMixer(person);
        let action = mixer.clipAction(perClip);
        action.play();
        mixers.push(mixer);
        loaded++;
    });

    gLoader.load(boss,function(o){
        bossShip.copy(o.scene);
        bossClip = o.animations[0];
        bossShip.scale.copy(new THREE.Vector3(bossScale,bossScale,bossScale));
        new THREE.Box3().setFromObject(bossShip).getSize(bossSize);
        bossShip.traverse((p)=>{
            if(p.isMesh){
                bossColor.push(p.material.color);
            }
        });
        let mixer = new THREE.AnimationMixer(bossShip);
        let action = mixer.clipAction(bossClip);
        action.play();
        mixers.push(mixer);
        loaded++;
    });

    gLoader.load(eyeB,function(o){
        eyenemy = o.scene;
        new THREE.Box3().setFromObject(eyenemy).getSize(eyenemySize);
        eyenemyClip = o.animations[0];
        loaded++;
    });

    gLoader.load(shot,function(o){
        bulletObj = o.scene;
        bulletObj.scale.copy(new THREE.Vector3(bulletRad,bulletRad,bulletRad*2));
        particleObj = o.scene;
        particleObj.scale.copy(new THREE.Vector3(particleRad,particleRad,particleRad));
        loaded++;
    });

    gLoader.load(merkaba,function(o){
        merkObj = o.scene;
        new THREE.Box3().setFromObject(merkObj).getSize(merkSize);
        loaded++;
    });

    initRocks(rockDensity);

    drawHits(hits);

    setIntervals();

    setTimeout(()=>{
        hitClip.muted = false;
        lazarClip.muted = false;
        splodeClip.muted = false;
        ufoClip.muted = false;
        recoverClip.muted = false;
        chargeClip.muted = false;
        boomClip.muted = false;
    },2000);
}

export function animLoop(){
    if(!jetload){
        load();
        jetload = true;

    }else{
        if(loaded >= 7){
            if(!ready){
                spd = jetSpdBase;
                person.position.copy(new THREE.Vector3(0,perSize.y/2,jetSize.z/4));
                person.rotation.y = -Math.PI/2;
                camP.position.copy(new THREE.Vector3(0,camHeight,0));
                camP.rotation.y = -Math.PI/2;
                person.add(camP);
                scene.add(person);
                jet.add(person);
                mothership.children[0].position.x = 0;
                mothership.children[1].position.x = 0;
                mothership.position.x = jet.position.x;
                mothership.position.y = jet.position.y;
                mothership.position.z = jet.position.z + drawDist*0.25;
                scene.add(mothership);
                rend.render(scene,interestCam);
                rend.setAnimationLoop(cutLoop1);
                spdHUD.innerText = '';
                console.log('cut start');
            }
            setCamText();
        }
    }
}

function cutLoop1(){
    moveJet2(jet,jetSpdBase,[planeX,stageHei]);
    moveJetCam2(jet,cam,climbSpd,turnSpd,[0,0],planeX,1);
    mothership.position.z += (jetSpdBase + 1);
    rend.render(scene,interestCam);
    if(dist(jet.position,mothership.position) > drawDist/2 && !ready){
        document.getElementById('control').innerText = 'Press Space to shoot, B to boost';
        setTimeout(()=>{
            document.getElementById('control').innerText = '';
        },2000);
        ready = true;
        bossShip.hp = maxBossHp;
        bossShip.position.copy(mothership.position);
        bossShip.rotation.x = -Math.PI/2;
        scene.add(bossShip);
        ufoClip.play();
        let int = setInterval(()=>{
            mothership.children[0].position.x -= 2;
            mothership.children[1].position.x += 2;
            if(mothership.children[0].position.x < -drawDist/2){
                scene.remove(mothership);
                clearInterval(int);
                console.log('removed mothership');
            }
        },15);
    }else if(ready){
        let int2 = setInterval(()=>{
            if(dist(jet.position,bossShip.position) > drawDist){
                scene.remove(bossShip);
                clearInterval(int2);
                console.log('removed bossship');
            }else{
                bossShip.position.z += getFore().z * jetSpdMax;
            }
        },15);
        go = true;
        rend.setAnimationLoop(animLoopMain);
    }
    //spdOm();
}

function animLoopMain(){
    if(go){
        moveJet2(jet,spd,[planeX,stageHei]);
        moveJetCam2(jet,cam,climbSpd,turnSpd,input,planeX,1);
        if(getBoost()){
            if(booSE.currentTime > 0.8){
                booSE.currentTime = 0.55;
            }else{
                booSE.play();
            }
            spd = jetSpd(spd,jetSpdMax,jetSpdBase,accel,true);
        }else{
            spd = jetSpd(spd,jetSpdMax,jetSpdBase,accel,false);
        }
        for(let m = 0; m < mixers.length; m++){
            mixers[m].update((Date.now()-prevTime)/1000);
        }
        moveEnemies(enemies,jet.position);
    }
    moveBullets();
    enemyCollision(enemies,jetSize.z/2);
    addEnemies();
    energyHandle();
    drawBarrier();
    //spdOm();
    prevTime = Date.now();
    rend.render(scene,interestCam);
}

function spdOm(){
    if(spdUpdate > updF){
        spdHUD.innerText = `${(dist(jet.position,lastPos)/updF/(int/36000)).toPrecision(4)} km/hr`;
        lastPos.copy(jet.position);
        int = 0;
        spdUpdate = 0;
    }else{
        int += (Date.now()-prevTime);
        prevTime = Date.now();
    }
    spdUpdate++;
}

function enemyInt(){
    if(go && !bossAppear){
        if(dist(origin,jet.position) > planeZ/2 && hits >= 10){
            bossShip.position.x = origin.x;
            bossShip.position.y = origin.y;
            bossShip.position.z = jet.position.z + planeZ/4 + drawDist/2;
            bossAppear = true;
            enemyDensity = enemyDensityBase/2;
            clearInterval(preBossInt);
            preBossInt = setInterval(()=>{
                enemyInt2();
            },100);
            scene.add(bossShip);
            console.log('boss appears');
        }
    }
}

function enemyInt2(){
    if(bossAppear && bossShip.position.z - jet.position.z < drawDist*0.75){
        clearInterval(preBossInt);
        console.log('closed in');
        bossCyc = 0;
        battleStart = true;
        bossHUD = document.createElement("img");
        bossHUD.classList.add("HUD");
        bossHUD.id = 'enemyHit';
        document.body.append(bossHUD);
        bossHP = document.createElement("img");
        bossHP.id = 'bossHP';
        document.body.append(bossHP);
        drawBossHP();
        music.fadeOut(0,1);
        setTimeout(()=>{
            music.setTrack(bgMusic3);
            music.fadeIn(1,0);
            camBuff = interestCam;
            interestCam = bossCam;
            bossRotX(Math.PI,1);
            bossCyc = 1;
        },3000);
    }
}

window.addEventListener('keydown',(e)=>{
    if(go){
        if(e.key == ' '){
            if(!fireCD){
                fireCD = true;
                fire();
                setTimeout(()=>{
                    fireCD = false;
                },fireCDtime*1000);
            }
        }
        if(e.key == '3'){
            if(interestCam != bossCam){
                interestCam = camP;
            }else{
                camBuff = camP;
            }
            setCamText();
        }
        if(e.key == '5'){
            if(interestCam != bossCam){
                interestCam = cam;
            }else{
                camBuff = cam;
            }
            setCamText();
        }
    }
});

function fire(owner=jet,dir=getFore(),spd=bullSpd,scale=1){
    let bullet = new Bullet();
    bullet.copy(bulletObj);
    bullet.spd = spd;
    bullet.dir = dir;
    bullet.sc = scale;
    bullet.owner = owner;
    bullet.position.copy(owner.position);
    //bullet.scale.copy(new THREE.Vector3(scale,scale,scale));
    bullets.push(bullet);
    scene.add(bullet);
    lazarClip.currentTime = 0;
    lazarClip.play();
}

function moveBullets(){
    let t = Date.now();
    for(let b = 0; b < bullets.length; b++){
        if(bullets[b].fizzle(t)){
            scene.remove(bullets[b]);
            bullets.splice(b,1);
        }else{
            if(battleStart){
                if(bulletCollision2(bullets[b]) != -1){
                    scene.remove(bullets[b]);
                    bullets.splice(b,1);
                }else{
                    if(bulletCollision(bullets[b],enemies,eyenemySize.x/2*eyenemyScale) != -1){
                        scene.remove(bullets[b]);
                        bullets.splice(b,1);
                    }else{
                        bullets[b].move();
                    }
                }
            }else{
                if(bulletCollision(bullets[b],enemies,eyenemySize.x/2*eyenemyScale) != -1){
                    scene.remove(bullets[b]);
                    bullets.splice(b,1);
                }else{
                    bullets[b].move();
                }
            }
        }
    }
    if(charginLazar){
        moveParticles();
    }
}

function bulletCollision(b,ens,r){
    for(let e = 0; e < ens.length; e++){
        if(dist(b.position,ens[e].position) <= r){
            splode(b.position,b.pwr*10);
            damageEnemy(b.pwr,ens,e);
            return e;
        }
    }
    return -1;
}

function bulletCollision2(b){
    let ray = new THREE.Raycaster(b.position,b.dir,0,b.spd);
    if(b.owner == jet){
        //console.log('jet');
        let ints = ray.intersectObject(bossShip);
        if(ints.length > 0){
            let ray2 = new THREE.Raycaster(ints[0].point,b.dir,0,3*bossScale);
            let ints2 = ray2.intersectObject(bossShip.children[1]);
            if(ints2.length > 0){
                /*for(let i = 0; i < ints2.length; i++){
                    //console.log(ints2[i]);
                }*/
                if(!bossInv){
                    splode(b.position,b.pwr*20);
                    bossInv = true;
                    flash(0.5,bossShip,new THREE.Color(0xffcccc),bossColor);
                    bossShip.hp -= b.pwr*100;
                    drawBossHP();
                    console.log(bossShip.hp);
                    setTimeout(()=>{
                        bossInv = false;
                    },500);
                    return b.pwr*100;
                }
            }else{
                splode(b.position,b.pwr*10);
                bossShip.hp--;
                drawBossHP();
                console.log(bossShip.hp);
                return b.pwr;
            }
        }else{
            return -1;
        }
    }else{
        if(getBoost()){
            ray.far *= 2;
        }
        let ints = ray.intersectObject(jet);
        console.log('jet: ' + ints.length);
        if(ints.length > 0){
            splode(b.position,b.pwr*50);
            tkDamage(bossShip.power);
            return bossShip.power;
        }else{
            return -1;
        }
    }
}

function enemyCollision(ens,r=jetSize.z/2,r2=bossSize.z){
    for(let e = 0; e < ens.length; e++){
        if(dist(jet.position,ens[e].position) <= r){
            tkDamage(ens[e].power);
            damageEnemy(2,ens,e);
            return e;
        }
        if(bossAppear){
            if(dist(bossShip.position,ens[e].position) <= r2){
                damageEnemy(2,ens,e,false);
                return e;
            }
        }
    }
}

function damageEnemy(pow,ens,e,hit=true){
    ens[e].hp -= pow;
    //console.log(ens[e].hp);
    if(ens[e].hp <= 0){
        splode(ens[e].position,20);
        if(hit){
            hits++;
            drawHits(hits);
        }
        let splen = ens[e];
        ens.splice(e,1);
        setTimeout(()=>{
            dropEnergy(splen.position,splen.dropProb);
            scene.remove(splen);
        },300);
    }
}

function tkDamage(p){
    if(!invincible){
        invinc(invTime);
        hitClip.currentTime = 0;
        hitClip.play();
        hp -= p;
        drawHP();
        if(hp <= 0){
            death();
        }
    }
}

function invinc(t){
    if(!invincible){
        invincible = true;
        flash(t,jet,new THREE.Color(0xff0000),jetColor);
        setTimeout(()=>{
            invincible = false;
        },t*1000);
    }
}

function flash(t,o,c=new THREE.Color(0x000000),init){
    let mat = 0;
    o.traverse((p)=>{
        if(p.isMesh){
            p.material.color = c;
        }
    });
    setTimeout(()=>{
        o.traverse((p)=>{
            if(p.isMesh){
                p.material.color = init[mat];
                mat++;
            }
        });
    },t*1000);
}

function death(){
    go = false;
    splode(jet.position,60);
    flash(2,jet,new THREE.Color(0x000000),jetColor);
    setTimeout(()=>{
        reset(true);
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
                let vol = drawDist-dist(jet.position,splosion.position)/drawDist;
                if(vol < 0){
                    vol = 0;
                }else if(vol > 1){
                    vol = 1;
                }
                splodeClip.volume = vol;
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

function hugeSplode(p,s){
    let splosion = new THREE.Mesh(new THREE.SphereGeometry(s),new THREE.MeshBasicMaterial({color:0xeeeeee,side:THREE.DoubleSide,transparent:true,opacity:1}));
    splosion.position.copy(p);
    scene.add(splosion);
    let sboom = setInterval(()=>{
        splosion.scale.addScalar(5);
        if(splosion.scale.x > 800 && splosion.material.opacity >= 0.05){
            splosion.material.opacity -= 0.05;
        }else if(splosion.material.opacity <= 0.01){
            scene.remove(splosion);
            clearInterval(sboom);
        }
    },42);
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
        if(bossAppear){
            if(dist(ens[e].position,bossShip.position) < drawDist){
                let disB = dirTo(ens[e].position,bossShip.position);
                ens[e].position.x -= disB.x * ens[e].spd;
                ens[e].position.y -= disB.y * ens[e].spd;
                ens[e].position.z -= disB.z * ens[e].spd;
            }
        }
        if(dist(ens[e].position,t) < ens[e].sight){
            let dis = dirTo(ens[e].position,t);
            ens[e].position.x += dis.x * ens[e].spd;
            ens[e].position.y += dis.y * ens[e].spd;
            ens[e].position.z += dis.z * ens[e].spd;
            ens[e].lookAt(t);

        }
    }
    if(battleStart){
        moveBoss();
    }
}

function moveBoss(){
    if(bossShip.position.z - jet.position.z < drawDist*0.42){
        bossShip.position.z += spd;
    }else{
        bossShip.position.z += spd - 1;
    }

    if(bossShip.position.x - jet.position.x > turnSpd/2){
        bossShip.position.x -= turnSpd/2;
    }else if(bossShip.position.x - jet.position.x < -turnSpd/2){
        bossShip.position.x += turnSpd/2;
    }
    if(!bossAct){
        bossAction();
    }
    if(interestCam == bossCam){
        if(bossCyc >= 0){
            bossCam.position.copy(new THREE.Vector3(bossShip.position.x,bossShip.position.y,bossShip.position.z-(bossShip.position.z-jet.position.z)/2));
            bossCam.lookAt(bossShip.position);
        }else{
            //bossCam.position.copy(bossShip.position);
            bossCam.lookAt(jet.position);
        }
    }
}

function bossAction(){
    if(!bossBeat && bossShip.hp <= 0){
        bossCyc = -1;
        bossBeat = true;
    }else if(!bossBeat){
        if(bossCyc == 1){
            bossAct = setTimeout(()=>{
                if(!rotter){
                    if(bossCyc > 0){
                        bossCyc++;
                    }
                    interestCam = camBuff;
                    setCamText();
                    console.log('cycles begin');
                }else{
                    console.log(rotter,bossCyc);
                }
                bossAct = null;
            },2000);
        }else if(bossCyc == 2){
            bossAct = setTimeout(()=>{
                if(!rotter){
                    if(!bossSpawnerInt){
                        bossSpawnerInt = setInterval(()=>{
                            spawnEyes();
                        },5000);
                        console.log('spawner set');
                    }
                    if(bossCyc > 0){
                        bossCyc++;
                    }
                }
                bossAct = null;
            },2000);
        }else if(bossCyc == 3){
            bossAct = setTimeout(()=>{
                if(!rotter){
                    bossRotX(Math.PI/2);
                    bossShots = 0;
                    if(bossCyc > 0){
                        bossCyc++;
                    }
                }
                bossAct = null;
            },1000);
        }else if (bossCyc == 4){
            bossAct = setTimeout(()=>{
                if(!rotter && bossShots <= bossMaxShots){
                    fire(bossShip,dirTo(bossShip.position,jet.position),2,bossScale);
                    bossShots++;
                }else if(bossShots > bossMaxShots){
                    if(bossCyc > 0){
                        bossCyc++;
                    }
                    bossShots = 0;
                    bossRotX(Math.PI);         
                }
                bossAct = null;
            },1000);
        }else if (bossCyc == 5){
            bossAct = setTimeout(()=>{
                if(!rotter){
                    if(bossShots < bossMaxShots/2){
                        fire(bossShip,dirTo(bossShip.position,jet.position),3,bossScale);
                        bossShots++;
                    }else{
                        if(bossCyc > 0){
                            bossCyc++;
                        }
                        bossShots = 0;
                        bossRotX(0,-1);
                    }
                }
                bossAct = null;
            },1000);
        }else if (bossCyc == 6){
            bossAct = setTimeout(()=>{
                if(!rotter){
                    lazarCharged = false;
                    chargeLazar();
                    if(bossCyc > 0){
                        bossCyc++;
                    }
                }
                bossAct = null;
            },1000);
        }else if(bossCyc == 7){
            bossAct = setTimeout(()=>{
                if(!rotter && lazarCharged){
                    fireLazar(2000);
                    if(bossCyc > 0){
                        bossCyc++;
                    }
                }
                bossAct = null;
            },2000);
        }else if(bossCyc == 8){
            bossAct = setTimeout(()=>{
                if(lazarDone){
                    lazarDone = false;
                    if(bossCyc > 0){
                        bossCyc = 3;
                    }
                    //console.log('back to the sign');
                    bossAct = null;
                }
            },2000);
        }
    }else{
        if(bossCyc == -1){
            bossAct = setTimeout(()=>{
                if(!rotter){
                    bossRotX(Math.PI/2);
                    clearInterval(spawnEyes);
                    music.fadeOut(0,2);
                    bossCyc = -2;
                }
                bossAct = null;
            },1000);
        }else if(bossCyc == -2){
            bossAct = setTimeout(()=>{
                if(!rotter){
                    if(!boomBoom){
                        let booms = 0;
                        boomBoom = setInterval(()=>{
                            if(booms < 20){
                                let pos = new THREE.Vector3();
                                pos.copy(bossShip.position);
                                pos.x += Math.random()*bossSize.x - bossSize.x/2;
                                pos.y += Math.random()*bossSize.y - bossSize.y/2;
                                pos.z += Math.random()*bossSize.z - bossSize.z/2;
                                splode(pos,Math.random()*20+10);
                                booms++;
                                console.log(booms);
                            }else{
                                clearInterval(boomBoom);
                                removeAllEnemies(false);
                                hugeSplode(bossShip.position,4);
                                bossCyc = -3;
                            }
                        },200);
                    }
                }
                bossAct = null;
            },500);
        }else if(bossCyc == -3){
            bossAct = setTimeout(()=>{
                boomBoom = null;
                bossCam.position.copy(bossShip.position);
                interestCam = bossCam;
                scene.remove(bossShip);
                hits += 10;
                bossCyc = -4;
                bossAct = null;
            },200);
        }else if(bossCyc == -4){
            bossAct = setTimeout(()=>{
                battleStart = false;
                interestCam = camBuff;
                setCamText();
                enemyDensity = enemyDensityBase;
                music.setTrack(bgMusic2);
                music.fadeIn(1,0);
                bossAct = null;
            },4000);
        }
    }
}

function bossRotX(a,dir=1,s=0.01){
    let targ = normAng(a);
    console.log('inrot: ' + bossShip.rotation.x);
    if(!rotter){
        rotter = setInterval(()=>{
            if(normAng(bossShip.rotation.x) <= targ+2*s && normAng(bossShip.rotation.x) >= targ-2*s){
                bossShip.rotation.x = a;
                console.log('finished rotting');
                clearInterval(rotter);
                rotter = null;
            }else{
                bossShip.rotation.x += s*dir;
            }
        },10);
    }else{
        console.log('still rotting');
    }
}

function normAng(a){
    if(a < 0){
        return a += Math.PI*2;
    }else if(a >= Math.PI*2){
        return a -= Math.PI*2;
    }else{
        return a;
    }
}

function spawnEyes(){
    let initScale = 16;
    let enem = new Hostile(1,enemeyeSpdInit+0.3,1,180,0.42);
    enem.copy(eyenemy);
    enem.scale.copy(new THREE.Vector3(eyenemyScale/initScale,eyenemyScale/initScale,eyenemyScale/initScale));
    enem.position.x = bossShip.position.x + bossSize.x/2;
    enem.position.y = bossShip.position.y;
    enem.position.z = bossShip.position.z;
    let enem2 = new Hostile(1,enemeyeSpdInit+0.3,1,180,0.42);
    enem2.copy(enem);
    enem2.position.x -= bossSize.x;
    let mixer = new THREE.AnimationMixer(enem);
    let mixer2 = new THREE.AnimationMixer(enem2);
    let action = mixer.clipAction(eyenemyClip);
    let action2 = mixer2.clipAction(eyenemyClip);
    action.play();
    action2.play();
    mixers.push(mixer,mixer2);
    enemies.push(enem,enem2);
    scene.add(enem,enem2);
    let scale = 0.1;
    let grow = setInterval(()=>{
        if(enem.scale.z < eyenemyScale){
            enem.scale.copy(new THREE.Vector3(scale,scale,scale));
            enem2.scale.copy(new THREE.Vector3(scale,scale,scale));
            scale += 0.1;
        }else{
            clearInterval(grow);
        }
    },20);
    console.log('spawn');
}

function chargeLazar(){
    let parts = 20;
    let maxDist = 50;
    let minDist = 20;
    for(let p = 0; p < parts; p++){
        let randX = Math.random()*(maxDist+minDist)-minDist;
        if(Math.round(Math.random()) == 0){
            randX *= -1;
        }
        let randY = Math.random()*(maxDist+minDist)-minDist;
        if(Math.round(Math.random()) == 0){
            randY *= -1;
        }
        let part = new THREE.Object3D();
        part.copy(particleObj);
        part.position.copy(new THREE.Vector3(bossShip.position.x + randX,bossShip.position.y + randY,bossShip.position.z - bossSize.z));
        particles.push(part);
        scene.add(part);
    }
    chargeClip.time = 0;
    chargeClip.play();
    charginLazar = true;
}

function fireLazar(max){
    lazarCharged = false;
    let dir = dirTo(bossShip.position,jet.position);
    lazar.copy(bulletObj);
    lazar.position.copy(bossShip.position);
    scene.add(lazar);
    boomClip.play();
    firin = setInterval(()=>{
        if(lazar.scale.x < max){
            lazar.scale.x += 50;
            lazar.scale.y += 50;
            lazar.scale.z += 80;
            new THREE.Box3().setFromObject(lazar).getSize(lazarSize);
        }
        lazar.position.x += dir.x;
        lazar.position.y += dir.y;
        lazar.position.z += dir.z;
        lazarCollision(lazarSize,lazar.position);
        if(lazar.position.z < jet.position.z - camDist*2){
            scene.remove(lazar);
            lazarDone = true;
            clearInterval(firin);
        }
        console.log(lazar.position.z);
    },42);
}

function lazarCollision(s,p,ens=enemies){
    if(jet.position.x <= p.x + s.x/2 && jet.position.x >= p.x - s.x/2){
        if(jet.position.y <= p.y + s.y/2 && jet.position.y >= p.y - s.y/2){
            if(jet.position.z <= p.z + s.z/2 && jet.position.z >= p.z - s.z/2){
                tkDamage(1);
            }
        }
    }
    for(let e = 0; e < ens.length; e++){
        if(ens[e].position.x < lazar.position.x + lazarSize.x/2 && ens[e].position.x > lazar.position.x - lazarSize.x/2){
            if(ens[e].position.y < lazar.position.y + lazarSize.y/2 && ens[e].position.y > lazar.position.y - lazarSize.y/2){
                if(ens[e].position.z < lazar.position.z + lazarSize.z/2 && ens[e].position.z > lazar.position.z - lazarSize.z/2){
                    damageEnemy(1,ens,e,false);
                }
            }
        }
    }
}

function moveParticles(){
    if(particles.length > 0){
        for(let p = 0; p < particles.length; p++){
            if(dist(new THREE.Vector3(particles[p].position.x,particles[p].position.y,0),new THREE.Vector3(bossShip.position.x,bossShip.position.y,0)) > partSpd*5){
                let d = dirTo(particles[p].position,bossShip.position);
                particles[p].position.x += d.x*partSpd;
                particles[p].position.y += d.y*partSpd;
                particles[p].position.z = bossShip.position.z - bossSize.z;
            }else{
                scene.remove(particles[p]);
                particles.splice(p,1);
            }
        }
    }else{
        lazarCharged = true;
        charginLazar = false;
    }
}

function dropEnergy(p,prob){
    if(Math.random() <= prob){
        let drop = new THREE.Object3D();
        drop.copy(merkObj);
        drop.position.copy(p);
        powerups.push(drop);
        scene.add(drop);
        console.log('dropped');
    }
}

function energyHandle(){
    for(let e = 0; e < powerups.length; e++){
        powerups[e].rotation.y += eRotSpd;
        if(dist(powerups[e].position,jet.position) < jetSize.x/2){
            if(hp < maxHits){
                hp++;
                recoverClip.play();
                scene.remove(powerups[e]);
                powerups.splice(e,1);
                drawHP();
                break;
            }
        }else if(dist(powerups[e].position,jet.position) > drawDist){
            scene.remove(powerups[e]);
            powerups.splice(e,1);
        }
    }
}

function removeEnemies(){
    if(go){
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

function drawBarrier(){
    if(Math.abs(jet.position.x) > drawDist/2-drawDist/5){
        barrier.position.z = jet.position.z;
        if(jet.position.x > 0){
            barrier.position.x = drawDist/2+1;
        }else{
            barrier.position.x = -drawDist/2-1;
        }
        if(!showBarrier){
            scene.add(barrier);
            showBarrier = true;
        }
        barrier.material.opacity = 0.42 - 0.42*((4/5*drawDist/2-(Math.abs(jet.position.x)-drawDist/5))/(drawDist/2-drawDist/5));
    }else{
        if(showBarrier){
            scene.remove(barrier);
            showBarrier = false;
        }
    }
}

export function drawHP(hp2=hp,hud=hpHUD){
    let hps = '';
    for(let h = 0; h < hp2; h++){
        hps = hps + '&#x2665;';
    }
    hud.innerHTML = hps;
}

export function drawHits(){
    hitHUD.innerText = `Hits: ${hits}`;
}

function drawBossHP(){
    if(bossShip.hp > 0){
        bossHP.style.width = `${bossShip.hp/maxBossHp*parseInt(bossHUD.offsetWidth)}px`;
    }else{
        bossHP.style.width = 0;
    }
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
    if(ready){
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

function removeAllEnemies(b=true){
    for(let e = 0; e < enemies.length; e++){
        scene.remove(enemies.pop());
    }
    if(b){
        scene.remove(bossShip);
    }
}

export function setIntervals(){
    rockInt = setInterval(()=>{
        loopRocks();
    },4000);

    enemInt = setInterval(()=>{
        removeEnemies();
    },4000);

    preBossInt = setInterval(()=>{
        enemyInt();
    },2000);
}

function clearIntervals(){
    clearInterval(preBossInt);
    clearInterval(bossSpawnerInt);
    clearInterval(bossAct);
    clearInterval(rotter);
    clearInterval(firin);
    clearInterval(boomBoom);
    preBossInt = undefined;
    bossSpawnerInt = undefined;
    bossAct = undefined;
    rotter = undefined;
    firin = undefined;
    boomBoom = undefined;
}

function reset(s=false){
    let highS = localStorage.getItem('highScore');
    if(!highS){
        localStorage.setItem('highScore',hits);
        alert(`You got a new high score: ${hits}!`);
    }else{
        if(hits > Number(localStorage.getItem('highScore'))){
            localStorage.setItem('highScore',hits);
            alert(`You got a new high score: ${hits}!`);
        }
    }
    removeRocks();
    jet.position.copy(origin);
    jet.rotation.x = 0;
    jet.rotation.y = 0;
    jet.rotation.z = 0;

    scene.remove(lazar);
    if(bossHUD){
        bossHUD.remove();
    }
    if(bossHP){
        bossHP.remove();
    }
    setBossBeat(bossBeat);
    bossAppear = false;
    battleStart = false;
    bossBeat = false;
    initRocks(rockDensity);
    hits = 0;
    drawHits();
    hp = maxHits;
    drawHP();
    ready = false;
    clearIntervals();
    removeAllEnemies();
    interestCam = camBuff;
    enemyDensity = enemyDensityBase;
    if(s){
        sceneSwitch(rend);
    }
}

function setCamText(){
    if(interestCam == cam){
        camHUD.innerText = 'Camera: Space';
        camNum.innerHTML = '3 <b>5</b>';
    }else if(interestCam == camP){
        camHUD.innerText = 'Camera: Cockpit';
        camNum.innerHTML = '<b>3</b> 5';
    }
}

export function setGo(){
    if(jetload){
        go = true;
    }
}

export function switchSceneX(r){
    rend = r;
    rend.setAnimationLoop(animLoop);
}
