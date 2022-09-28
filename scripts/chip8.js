/*
    CHIP-8 Emulator
    Bailey Furrow

    TODO:
    [] Audio control (mute, change frequency, change wave type (sine, triangle), etc)
    [] Ability to change render scale and emulator speed from the UI
    [] Pause and unpause
    [] Ability to save and load a save
    [] ROM selection
*/
import Renderer from './renderer.js';
import Keyboard from './keyboard.js';
import Speaker from './speaker.js';
import CPU from './cpu.js';

let loop;

let fps = 60, fpsInterval, startTime, now, then, elapsed;

function init() {
    const renderer = new Renderer(30);
    const keyboard = new Keyboard();
    const speaker = new Speaker();
    const cpu = new CPU(renderer, keyboard, speaker);

    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;

    cpu.loadSpritesIntoMemory();
    cpu.loadRom('BLITZ');

    loop = requestAnimationFrame(step);
    
    function step() {
        now = Date.now();
        elapsed = now-then;
        if (elapsed > fpsInterval) {
            cpu.cycle();
        }

        loop = requestAnimationFrame(step);
    }
}


document.querySelector('.start-button').addEventListener("click", init);