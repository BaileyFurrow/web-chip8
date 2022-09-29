class Keyboard {
    constructor() {
        /* Keymap is laid out as the following:
        Interpreted character/labeled character
        |---|---|---|---|
        |1/1|2/2|3/3|C/4|
        |---|---|---|---|
        |4/Q|5/W|6/E|D/E|
        |---|---|---|---|
        |7/A|8/S|9/D|E/F|
        |---|---|---|---|
        |A/Z|0/X|B/C|F/V|
        |---|---|---|---|
        */
        this.KEYMAP = {
            49: 0x1,
            50: 0x2,
            51: 0x3,
            52: 0xc,
            81: 0x4,
            87: 0x5,
            69: 0x6,
            82: 0xD,
            65: 0x7,
            83: 0x8,
            68: 0x9,
            70: 0xE,
            90: 0xA,
            88: 0x0,
            67: 0xB,
            86: 0xF
        }
        this.keysPressed = [];

        this.onNextKeyPress = null;

        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
        window.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }

    isKeyPressed(keyCode) {
        return this.keysPressed[keyCode];
    }

    onKeyDown(event) {
        let key = this.KEYMAP[event.which];
        this.keysPressed[key] = true;

        if (this.onNextKeyPress !== null && key) {
            this.onNextKeyPress(parseInt(key));
            this.onNextKeyPress = null;
        }
    }

    onKeyUp(event) {
        let key = this.KEYMAP[event.which];
        this.keysPressed[key] = false;
    }
}

export default Keyboard;