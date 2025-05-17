import { Z80 } from "https://ichigojam.github.io/Z80.js/Z80.js";

const fn = "./IchigoJam_BASIC.com";
//const fn = "kawakudari.rom";
const rom = await Deno.readFile(fn);

const mem = new Uint8Array(64 * 1024);
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

mem.set(rom, 0x100);
const entry = 0x100;
const st = z80.getState();
st.pc = entry;
z80.setState(st);

const printbuf = [];
const putc = (c) => {
  //console.log("putc" , c)
  if (c == 10) {
  } else if (c == 13) {
    console.log(printbuf.join(""));
    printbuf.length = 0;
  } else {
    printbuf.push(String.fromCharCode(c));
  }
};

const getbuf = [];
const getc = () => {
  if (getbuf.length > 0) {
    const c = getbuf.shift();
    return c;
  }
  const s = prompt("input");
  if (s) {
    for (const c of s) {
      getbuf.push(c.charCodeAt(0));
    }
    getbuf.push(13); // enter
  }
  return getc();
};

let addrDMA = 0;

const b2s = (bin) => new TextDecoder().decode(bin).trim();

const getFCB = (st) => {
/*
| オフセット | バイト数 | 内容           | 備考                       |
| ----- | ---- | ------------ | ------------------------ |
| 0     | 1    | ドライブ番号（0=A:） | 0=default, 1=A, 2=B, ... |
| 1–8   | 8    | ファイル名（ASCII） | 右側パディングはスペース（0x20）       |
| 9–11  | 3    | 拡張子（ASCII）   | 同上                       |
| 12    | 1    | 現在の拡張番号      | 通常0（複数セクション対応）           |
| 13    | 1    | 論理レコード番号     | 128バイトごとのレコード番号          |
| 14    | 1    | 読み込み用        | BDOSが使用                  |
| 15–31 | -    | 残りはBDOSが使う   | アロケーション情報、ランダムレコード番号など   |
| 32    | 1    | Current record within extent. It is usually best to set this to 0 immediately after a file has been opened and then ignore it. |
| 33    | 1    | Random access record number |
*/
  const de = (st.d << 8) | st.e;
  //console.log(de.toString(16), st.d, st.e, String.fromCharCode(mem[de + 1]), st.a);
  const drive = mem[de];
  const fn = b2s(mem.subarray(de + 1, de + 1 + 8)) + "." + b2s(mem.subarray(de + 9, de + 9 + 3));
  const nrec = mem[de + 13];
  //const rec = mem.subarray(15, 31);
  //const flg = mem[de + 14];
  //const ext = mem[de + 12];
  const currecord = mem[de + 32];
  const rndrecord = mem[de + 33];
  return { de, fn, drive, nrec, currecord, rndrecord };
};

const bios = (st) => {
  if (st.pc == 0x05) { // BDOS
    if (st.c == 2) {
      putc(st.e);
    } else if (st.c == 6) {
      if (st.e != 255) {
        putc(st.e);
      } else {
        // input
        st.a = getc();
        return true;
      }
    } else if (st.c == 25) { // stop check
      st.a = 0; // 1 if stop
      return true;
    } else if (st.c == 32) { // (F_USERNUM) - get/set user number
      const user = st.e; // 0-15
      if (user == 255) {
        st.a = 0;
        return true;
      }
      return;
    } else if (st.c == 15) { // (F_OPEN) - Open file
      const fcb = getFCB(st);
      //console.log(fcb);
      mem[fcb.de + 13] = 0;
      st.a = 0; // success
      return true;
    } else if (st.c == 26) { // BDOS function 26 (F_DMAOFF) - Set DMA address
      const de = (st.d << 8) | st.e;
      addrDMA = de;
      /*
      for (let i = 0; i < 128; i++) {
        mem[addrDMA + i] = 0;
      }
      */
    } else if (st.c == 33) { // (F_READRAND) - Random access read record
      const fcb = getFCB(st);
      //console.log(fcb);
      try {
        const data = Deno.readFileSync(fcb.fn);
        const len = 1024;
        if (data.length != len) {
          console.log("wrong length");
          return true;
        }
        for (let i = 0; i < 128; i++) {
          mem[addrDMA + i] = data[fcb.nrec * 128 + i];
        }
        mem[fcb.de + 13] = fcb.nrec + 1;
        st.a = 0;
        st.b = 0;
        st.h = 0;
        st.l = 0;
      } catch (e) {
        // no files
        st.a = 0xff;
        st.b = 0;
        st.h = 0; // not found
        st.l = 0;
      }
      return true;
    } else if (st.c == 34) { //  (F_WRITERAND) - Random access write record
      const fcb = getFCB(st);
      //console.log("writerand", fcb);
      const len = 1024;
      const data = mem.subarray(addrDMA, addrDMA + len);
      //console.log("data", data);
      mem[fcb.de + 13] = fcb.nrec + 1;
      st.a = 0;
      st.b = 0;
      st.h = 0;
      st.l = 0;
      Deno.writeFileSync(fcb.fn, data);
      return true;
    } else if (st.c == 16) { // (F_CLOSE) - Close file
      st.a = 0; // success
      return true;
    } else if (st.c == 19) { // (F_DELETE) - delete file
      const fcb = getFCB(st);
      //console.log("delete" , fcb.fn);
      //await Deno.delete(fcb.fn);
      st.a = 
      st.b = 0;
      st.h = 0;
      st.l = 0;
      return true;
    } else {
      console.log("unsupported BDOS", st.c, st.a, st.e);
    }
    // console.log("unsupported BDOS", st.c, st.a, st.e);
    return false;
  }
  return false;
};

for (let i = 0;; i++) {
  //console.log(st);
  z80.run_instruction();
  const st = z80.getState();
  if (bios(st)) {
    z80.setState(st);
  }
}
