let m = new Audio();
let f = undefined;

export function fadeIn(vol,t){
    let tol = 0.05;
    let init = m.volume;
    if(m.paused){
        m.play();
    }
    f = setInterval(()=>{
        if(m.volume >= vol - tol){
            clearInterval(f);
            f = undefined;
        }else{
            if(m.volume + (vol-init)/10 >= 1 - tol){
                m.volume = 1;
                clearInterval(f);
                f = undefined;
            }else{
                m.volume += (vol-init)/10;
            }
        }
    },t*100);
}

export function fadeOut(vol,t){
    let tol = 0.005
    let init = m.volume;
    f = setInterval(()=>{
        if(m.volume <= vol + tol){
            if(vol <= tol){
                m.pause();
            }
            clearInterval(f);
            f = undefined;
        }else{
            if(m.volume - (init-vol)/10 <= tol){
                m.volume = 0;
                m.pause();
                clearInterval(f);
                f = undefined;
            }else{
                m.volume -= (init-vol)/10;
            }
        }
    },t*100);
}

export function toggleMute(){
    if(!f){
        if(m.muted){
            m.muted = false;
            fadeIn(1,0.2);
        }else{
            m.muted = true;
            fadeOut(0,0.2);
        }
        updateMute();
    }
    console.log('toggle');
}

export function updateMute(e=document.getElementById('mute')){
    if(m.muted){
        e.innerHTML = '&#128263;';
    }else{
        e.innerHTML = '&#128264;';
    }
}

export function setTrack(t){
    m.src = t;
}

export function muted(){
    return m.muted;
}

export function init(){
    m.loop = true;
    m.muted = true;
    m.volume = 0;
}

export function unmute(){
    m.muted = false;
}

export function mute(){
    m.muted = true;
}