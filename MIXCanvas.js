import { MIXScreen1 } from "./MIXScreen1.js";
import { Z80 } from "https://ichigojam.github.io/Z80.js/Z80.js";
import { Base16 } from "https://code4fukui.github.io/Base16/Base16.js";

const readUint16 = (mem, ad) => {
  return mem[ad] | (mem[ad + 1] << 8);
};

const waitVSync = async () => {
  return new Promise(resolve => {
    requestAnimationFrame(resolve);
  });
};

export class MIXCanvas extends HTMLElement {
  constructor() {
    super();

    const scr1 = new MIXScreen1();
    this.appendChild(scr1);
    this.scr1 = scr1;

    const mem = new Uint8Array(64 * 1024);
    this.mem = mem;

    const z80 = new Z80({
      mem_read: (address) => {
        if (address < 0x100) {
          //console.log("call", address.toString(16));
          return 0xC9;
        }
        //console.log("mem_read", address.toString(16));
        return mem[address];
      },
      mem_write: (address, value) => {
        //console.log("mem_write", address.toString(16), value);
        mem[address] = value;
      },
      io_read: (port) => {
        console.log("io read", port);
        return 0;
      },
      io_write: (port, value) => {
        console.log("io write", port, value);
      },
    });
    this.z80 = z80;

    let keystates = {};
    document.body.onkeydown = (e) => {
      //console.log(e.key);
      keystates[e.key] = true;
    };
    document.body.onkeyup = (e) => {
      keystates[e.key] = false;
    };
    this.keystates = keystates;
    this.cursor = 0;
  }
  bios(st) {
    const scr1 = this.scr1;
    /*
    BIOS emulate
    0x005F CHGMOD - スクリーンモード切替
    0x00C3 CLS - 画面全体をクリア
    0x00A2 BIOSの CHPUT
    0x00D5 INKEY ; ret a: 1=up, 2=right up, 3=right, 4=right down, 5=down, 6=left down, 7=left, 8=left up
    0x00C6 POSIT locate: ; H: x, L: y
    0x004A RDVRM HL - Address read, ret a
    */
    if (st.pc == 0x5f) {
      console.log("CHGMOD", st.a);
    } else if (st.pc == 0xc3) {
      console.log("clear");
      for (let i = 0; i < scr1.textVRAM.length; i++) {
        scr1.textVRAM[i] = 0x20;
      }
    } else if (st.pc == 0xc6) { // POSIT
      this.cursor = (st.h - 1) + (st.l - 1) * 32;
    } else if (st.pc == 0xA2) { // CHPUT
      //console.log("CHPUT", String.fromCharCode(st.a), st.a);
      const c = st.a;
      if (c == 10) {
      } else if (c == 13) {
        const y = Math.floor(this.cursor / 32);
        if (y == 23) {
          for (let i = 0; i < 768 - 32; i++) {
            scr1.textVRAM[i] = scr1.textVRAM[i + 32];
          }
          for (let i = 0; i < 32; i++) {
            scr1.textVRAM[768 - 32 + i] = 0x20;
          }
          this.cursor = y * 32;
        } else {
          this.cursor = (y + 1) * 32;
        }
      } else {
        scr1.textVRAM[this.cursor++] = st.a;
        if (this.cursor >= 768) this.cursor = 0;
      }
    } else if (st.pc == 0xD5) { // INKEY
      st.a = this.inkey();
      //console.log("inkey", st.a);
      return true;
    } else if (st.pc == 0x4A) { // RDVRM HL - Address read, ret a
      const ad = (st.h << 8) | st.l;
      if (ad >= 0x1800 && ad < 0x1800 + 768) {
        st.a = scr1.textVRAM[ad - 0x1800];
        return true;
      }
    }
    return false;
  }
  set value(rom) { // Uint8Array or HEX
    if (typeof rom == "string") {
      rom = Base16.decode(rom);
    }
    this.mem.set(rom, 0x4000);
    if (readUint16(this.mem, 0x4000) != 0x4241) {
      throw new Error("not MSX ROM id 'AB'");
    }
    const entry = readUint16(this.mem, 0x4002);
    this.z80.reset();
    const st = this.z80.getState();
    st.pc = entry;
    this.z80.setState(st);
  }
  async run() {
    const z80 = this.z80;
    const scr1 = this.scr1;
    let sumclk = 0;
    const clkperframe = 35000;
    for (let i = 0;; i++) {
      const clk = z80.run_instruction();
      sumclk += clk;
      if (sumclk > clkperframe) {
        scr1.draw();
        //await sleep(1);
        await waitVSync();
        sumclk -= clkperframe;
      }
      const st = z80.getState();
      if (this.bios(st)) {
        z80.setState(st);
      }
      //console.log(st.pc)
    }
  }
  //   0x00D5 INKEY ; ret a: 1=up, 2=right up, 3=right, 4=right down, 5=down, 6=left down, 7=left, 8=left up
  inkey() {
    const keystates = this.keystates;
    const up = keystates["ArrowUp"] ? 1 : 0;
    const down = keystates["ArrowDown"] ? 1 : 0;
    const right = keystates["ArrowRight"] ? 1 : 0;
    const left = keystates["ArrowLeft"] ? 1 : 0;
    const x = right - left;
    const y = down - up;
    if (y == -1) {
      if (x == 0) return 5;
      if (x == 1) return 6;
      return 4;
    } else if (y == 1) {
      if (x == 0) return 1;
      if (x == 1) return 8;
      return 2;
    }
    if (x == 0) return 0;
    if (x == 1) return 3;
    return 7;
  }
}

customElements.define("mix-canvas", MIXCanvas);
