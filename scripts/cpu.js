class CPU {
    constructor(renderer, keyboard, speaker) {
        this.renderer = renderer;
        this.keyboard = keyboard;
        this.speaker = speaker;

        // 4kb of memory
        this.memory = new Uint8Array(4096);

        // 16 8-bit registers
        this.v = new Uint8Array(16);

        // Stores memory addresses
        this.i = 0;

        // Timers
        this.delayTimer = 0;
        this.soundTimer = 0;

        // Program counter. Stores currently executing address
        this.pc = 0x200;

        // Don't init with size
        this.stack = new Array();

        // Some instructions need to pause
        this.paused = false;

        this.speed = 10;
    }

    loadSpritesIntoMemory() {
        // Array of hex values for each sprite. Each sprite is 5 bytes.
        // The technical reference provides us with each one of these values.
        const sprites = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];

        for (let i = 0; i < sprites.length; i++) {
            this.memory[i] = sprites[i];
        }
    }
    
    loadProgramIntoMemory(program) {
        for (let loc = 0; loc < program.length; loc++) {
            this.memory[0x200 + loc] = program[loc];
        }
    }

    loadRom(romName) {
        let request = new XMLHttpRequest;
        let self = this;

        request.onload = function() {
            if (request.response) { 
                let program = new Uint8Array(request.response);
                self.loadProgramIntoMemory(program);
            }
        }

        request.open('GET', 'roms/' + romName);
        request.responseType = 'arraybuffer';

        request.send();
    }

    cycle() {
        for (let i = 0; i < this.speed; i++) {
            if (!this.paused) {
                let opcode = (this.memory[this.pc] << 8 | this.memory[this.pc + 1]);
                this.executeInstruction(opcode);
            }
        }
        if (!this.paused) {
            this.updateTimers();
        }

        this.playSound();
        this.renderer.render();
    }

    updateTimers() {
        if (this.delayTimer > 0) {
            this.delayTimer -= 1;
        }
        if (this.soundTimer > 0) {
            this.soundTimer -= 1;
        }
    }

    playSound() {
        if (this.soundTimer > 0) {
            this.speaker.play(440);
        } else {
            this.speaker.stop();
        }
    }

    executeInstruction(opcode) {
        this.pc += 2;

        // We only need thye 2nd nibble, so grab the value of the 2nd nibble
        // and shift it right 8 bits to get rid of everything but the 2nd nibble
        let x = (opcode & 0x0F00) >> 8;

        // We only need the 3rd nibble, so grab the value of the 3rd nibble
        // and shift it right 4 bits to get rid of everything but the 3rd nibble
        let y = (opcode & 0x00F0) >> 4;

        switch (opcode & 0xF000) {
            case 0x0000:
                switch (opcode) {
                    // 00E0: CLS
                    // Clear the display
                    case 0x00E0: 
                        this.renderer.clear();
                        break;
                    // 00EE: RET
                    // Pop the last element in the stack array and store it in
                    // `this.pc`. This will return us from a subroutine
                    case 0x00EE:
                        this.pc = this.stack.pop();
                        break;
                }
                break;
            // 1nnn: JP addr
            // Set PC to value stored in nnn
            case 0x1000:
                this.pc = (opcode & 0xFFF);
                break;
            // 2nnn: CALL addr
            // Pushes PC to stack and stores nnn in PC
            case 0x2000:
                this.stack.push(this.pc);
                this.pc = (opcode & 0xFFF);
                break;
            // 3xkk: SE Vx, byte
            // Compares value stored in x register to the value of kk
            // If they are equal, PC increases by 2, skipping the next instruction
            case 0x3000:
                if (this.v[x] === (opcode & 0xFF)) {
                    this.pc += 2;
                }
                break;
            // 4xkk: SNE Vx, byte
            // Similar to 3xkk, but skips if they are NOT equal
            case 0x4000:
                if (this.v[x] !== (opcode & 0xFF)) {
                    this.pc += 2;
                }
                break;
            // 5xy0: SE Vx, Vy
            // If Vx = Vy, skip
            case 0x5000:
                if (this.v[x] === this.v[y]) {
                    this.pc += 2;
                }
                break;
            // 6xkk: LD Vx, byte
            // Sets value of Vx to value of kk
            case 0x6000:
                this.v[x] = (opcode & 0xFF);
                break;
            // 7xkk: ADD Vx, byte
            // Adds kk to Vx
            case 0x7000:
                this.v[x] += (opcode & 0xFF);
                break;
            case 0x8000:
                switch (opcode & 0xF) {
                    // 8xy0: LD Vx, Vy
                    // Sets Vx = Vy
                    case 0x0:
                        this.v[x] = this.v[y];
                        break;
                    // 8xy1: OR Vx, Vy
                    // Sets Vx = Vx OR Vy
                    case 0x1:
                        this.v[x] |= this.v[y];
                        break;
                    // 8xy2: AND Vx, Vy
                    // Sets Vx = Vx AND Vy
                    case 0x2:
                        this.v[x] &= this.v[y];
                        break;
                    // 8xy3: XOR Vx, Vy
                    // Sets Vx = Vx XOR Vy
                    case 0x3:
                        this.v[x] ^= this.v[y];
                        break;
                    // 8xy4: ADD Vx, Vy
                    // Sets Vx = Vx + Vy. If result is greater than 8 bits,
                    // VF is set to 1, else 0. Only lowest 8 bits are kept
                    case 0x4:
                        let sum = (this.v[x] += this.v[y]);

                        this.v[0xF] = 0;

                        if (sum > 0xFF) {
                            this.v[0xF] = 1;
                        }

                        this.v[x] = sum;
                        break;
                    // 8xy5: SUB Vx, VY
                    // Subtracts Vy from Vx
                    case 0x5:
                        this.v[0xF] = 0;

                        if (this.v[x] > this.v[y]) {
                            this.v[0xF] = 1;
                        }

                        this.v[x] -= this.v[y];
                        break;
                    // 8xy6: SHR Vx {, Vy}
                    // Right shift Vx
                    case 0x6:
                        this.v[0xF] = (this.v[x] & 0x1);

                        this.v[x] >>= 1;
                        break;
                    // 8xy7: SUBN Vx, Vy
                    // Alternative subtraction
                    case 0x7:
                        this.v[0xF] = 0;

                        if (this.v[y] > this.v[x]) {
                            this.v[0xF] = 1;
                        }

                        this.v[x] = this.v[y] - this.v[x];
                        break;
                    // 8xyE: SHL Vx {, Vy}
                    // Left shift Vx
                    case 0xE:
                        this.v[0xF] = (this.v[x] & 0x80);
                        this.v[x] <<= 1;
                        break;
                }

                break;
            // 9xy0: SNE Vx, Vy
            // Skip line if Vx != Vy
            case 0x9000:
                if (this.v[x] !== this.v[y]) {
                    this.pc += 2;
                }
                break;
            // Annn: LD I, addr
            // Set the value of register i to nnn
            case 0xA000:
                this.i = (opcode & 0xFFF);
                break;
            // Bnnn: JP V0, addr
            // Set PC to nnn plus value of register 0
            case 0xB000:
                this.pc = (opcode & 0xFFF) + this.v[0]
                break;
            // Cxkk: RND Vx, byte
            // Generates random number and ANDs taht with lowest byte of opcode
            case 0xC000:
                let rand = Math.floor(Math.random() * 0xFF);

                this.v[x] = rand & (opcode & 0xFF);
                break;
            // Dxyn: DRW Vx, Vy, nibble
            // Handles drawing and erasing pixels on screen
            case 0xD000:
                let width = 8;
                let height = (opcode & 0xF);

                this.v[0xF] = 0;

                for (let row = 0; row < height; row++) {
                    let sprite = this.memory[this.i + row];

                    for (let col = 0; col < width; col++) {
                        if ((sprite & 0x80) > 0) {
                            // If the bit (sprite) is not 0, render/erase pixel
                            if (this.renderer.setPixel(this.v[x] + col, this.v[y] + row)) { 
                                this.v[0xF] = 1;
                            }
                        }

                        // Shift the sprite left 1. This will move the next bit
                        // into the first position.
                        sprite <<= 1;
                    }
                }
                break;
            case 0xE000:
                switch (opcode & 0xFF) {
                    // Ex9E: SKP Vx
                    // Skip next instruction if key stored in Vx is pressed
                    case 0x9E:
                        if (this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                    // ExA1: SKNP Vx
                    // Does the opposite of the previous instruction
                    case 0xA1:
                        if (!this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                }

                break;
            case 0xF000:
                switch (opcode & 0xFF) {
                    // Fx07: LD Vx, DT
                    // Set Vx = delayTimer
                    case 0x07:
                        this.v[x] = this.delayTimer;
                        break;
                    // Fx0A: LD Vx, K
                    // Pauses emulation until key is pressed.
                    // Sets Vx to the pressed key
                    case 0x0A:
                        this.paused = true;

                        this.keyboard.onNextKeyPress = function(key) {
                            this.v[x] = key;
                            this.paused = false;
                        }.bind(this);
                        break;
                    // Fx15: LD DT, Vx
                    // Sets value of delay timer to value of Vx
                    case 0x15:
                        this.delayTimer = this.v[x];
                        break;
                    // Fx18: LD ST, Vx
                    // Sets value of sound timer to value of Vx
                    case 0x18:
                        this.soundTimer = this.v[x];
                        break;
                    // Fx1E: ADD I, Vx
                    // Add Vx to I
                    case 0x1E:
                        this.i += this.v[x];
                        break;
                    // Fx29: LD F, Vx
                    // Sets I to the location of the sprite at Vx
                    case 0x29:
                        this.i = this.v[x] * 5; // Each sprite is 5 bytes long
                        break;
                    // Fx33: LD B, Vx
                    // Grabs hundreds, tens, and ones digit from Vx and
                    // stores them in registers I, I+1, and I+2 respectively.
                    case 0x33:
                        this.memory[this.i] = parseInt(this.v[x] / 100);
                        this.memory[this.i+1] = parseInt((this.v[x] % 100) / 10);
                        this.memory[this.i+2] = parseInt(this.v[x] % 10);
                        break;
                    // Fx55: LD [I], Vx
                    // Loop through registers V0 and Vx, storing its value in
                    // memory starting at I
                    case 0x55:
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.memory[this.i + registerIndex] = this.v[registerIndex];
                        }
                        break;
                    // Fx65: LD Vx, [I]
                    // Reads values from memory starting at I and stores them
                    // in registers V0 through Vx
                    case 0x65:
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.v[registerIndex] = this.memory[this.i + registerIndex];
                        }
                        break;
                }

                break;

            default:
                throw new Error('Unknown opcode ' + opcode);
        }
    }
}

export default CPU;