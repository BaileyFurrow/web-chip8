/*
    CHIP-8 Emulator
    Bailey Furrow

    TODO:
    [x] Audio control (mute, change frequency, change wave type (sine, triangle), etc)
    [x] Ability to change render scale and emulator speed from the UI
    [ ] Pause and unpause
    [ ] Ability to save and load a save
    [x] ROM selection
*/
import Renderer from './renderer.js';
import Keyboard from './keyboard.js';
import Speaker from './speaker.js';
import CPU from './cpu.js';

let loop;

let fps = 60, fpsInterval, startTime, now, then, elapsed;
let loadedRom = 'BLITZ';

const keyboardLayout = 
    ['1', '2', '3', 'C',
     '4', '5', '6', 'D',
     '7', '8', '9', 'E',
     'A', '0', 'B', 'F'];

function init() {
    let renderSize = document.querySelector('#scale').value;
    let speed = document.querySelector('#speed').value;
    const renderer = new Renderer(renderSize);
    const keyboard = new Keyboard();
    const speaker = new Speaker();
    const cpu = new CPU(renderer, keyboard, speaker, speed);

    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;

    cpu.loadSpritesIntoMemory();
    cpu.loadRom(loadedRom);

    loop = requestAnimationFrame(step);

    function pause() {
        cpu.pause = !cpu.pause;
        return cpu.pause;
    }
    
    function step() {
        now = Date.now();
        elapsed = now-then;
        if (elapsed > fpsInterval) {
            cpu.cycle();
        }
        debugValues(cpu);

        loop = requestAnimationFrame(step);
    }
}

function debugValues(cpuObj) {
    let debugID = document.querySelector('#debug');
    for (const i in cpuObj) {
        debugID.querySelector(`.${i}`).innerHTML = cpuObj[i];
    }
}

// Initialize the emulator when "Start" is clicked
document.querySelector('.start-button').addEventListener("click", init);

document.querySelector('.pause').addEventListener('click', () => {
    document.querySelector('.status').innerHTML = pause() ? 'Resume' : 'Pause';
});

document.forms['sound']['volume'].onchange = () => {
    document.querySelector('.vol-num').innerHTML = document.forms['sound']['volume'].value;
};

// Insert names of ROMs into rom selection
// For now, simply place file in directory and update here
// TODO: #3 Read list of ROMs from directory
const romFiles = ['BLITZ', 'TEST_SOUND'];

romFiles.forEach((rom, i) => {
    let optRom = document.createElement('option');
    optRom.setAttribute('value', rom);
    // Set the first ROM in the list at the default
    if (i === 0)
        optRom.setAttribute('selected', '');
    optRom.textContent = rom;
    document.querySelector('#rom').appendChild(optRom);
});

// Set which ROM to load
document.querySelector('#loadRom').addEventListener('click', () => {
    let selectedRom = document.forms['romselect']['rom'].value;
    loadedRom = selectedRom;
    document.querySelector('.romname').innerHTML = loadedRom;
    document.querySelector('.loaded').style.display = 'block';
});

// TODO: #4 Debug