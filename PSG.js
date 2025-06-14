import { AY38910Node } from "https://ichigojam.github.io/AY38910/AY38910Node.js";

export class PSG {
  constructor() {
    this.reg_psg = new Uint8Array(14);
  }
  async startSound() {
    if (this.ay38910) return;
    const sampleRate = 48000; // mac default
    this.context = new AudioContext({ sampleRate });
    this.ay38910 = await AY38910Node.create(this.context);
    this.ay38910.connect(this.context.destination);
    console.log("startsound", this.ay38910)
  }
  async stopSound() {
    if (!this.ay38910) return;
    this.ay38910.disconnect();
    //this.ay38910.port.postMessage({ type: "terminate" }); // 任意：内部で処理しているなら
    this.ay38910 = null;
    await this.context.close();
    this.context = null;
  }
  io_write(port, value) {
    //console.log("io write", port.toString(16), value);
    if (port == 0xA0) {
      this.reg_psg_write = value;
    } else if (port == 0xA1) {
      this.reg_psg[this.reg_psg_write] = value;
      if (this.ay38910) {
        console.log("psg ", this.reg_psg, value);
        this.ay38910.writeRegs(this.reg_psg);
      }
    }
  }
}
