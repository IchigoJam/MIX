import { Z80 } from "https://ichigojam.github.io/Z80.js/Z80.js";

const fn = "hello.rom";
//const fn = "kawakudari.rom";
const rom = await Deno.readFile(fn);

const mem = new Array(64 * 1024);
const readUint16 = (ad) => {
  return mem[ad] | (mem[ad + 1] << 8);
};

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

for (let i = 0; i < rom.length; i++) {
  mem[0x4000 + i] = rom[i];
}
if (readUint16(0x4000) != 0x4241) {
  throw new Error("not MSX ROM id 'AB'");
}
const entry = readUint16(0x4002);
const st = z80.getState();
st.pc = entry;
z80.setState(st);
console.log("entry", entry.toString(16));

const bios = (st) => {
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
  } else if (st.pc == 0xA2) { // CHPUT
    console.log("CHPUT", String.fromCharCode(st.a), st.a);
  }
  return false;
};

for (let i = 0;; i++) {
  const st = z80.getState();
  //console.log(st);
  z80.run_instruction();
  if (bios(st)) {
    z80.setState(st);
  }
}
