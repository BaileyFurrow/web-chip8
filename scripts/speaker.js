class Speaker {
    constructor(gainMax=0.2) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        this.audioCtx = new AudioContext();

        this.gain = this.audioCtx.createGain();
        this.finish = this.audioCtx.destination;
        // Lowers the gain to not be overwhelmingly loud
        // Defaults to 0.2, still loud, but not ear splitting
        this.gainMax = gainMax;

        this.gain.connect(this.finish);
    }

    play(frequency, vol=50) {
        if (this.audioCtx && !this.oscillator) {
            this.oscillator = this.audioCtx.createOscillator();

            this.oscillator.frequency.setValueAtTime(frequency || 440, this.audioCtx.currentTime);
            this.oscillator.type = document.forms['sound']['wave'].value;

            this.gain.gain.setValueAtTime(vol * (this.gainMax / 100), 0);
            this.oscillator.connect(this.gain);
            this.oscillator.start();
        }
    }

    stop() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
    }
}

export default Speaker;