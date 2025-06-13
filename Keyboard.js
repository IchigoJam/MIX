const KEY_BS = 8;
const KEY_TAB = 9;
const KEY_RETURN = 10;
const KEY_RIGHT = 28;
const KEY_LEFT = 29;
const KEY_UP = 30;
const KEY_DOWN = 31;
const KEY_SPACE = 32;
const KEY_ESC = 27;
const KEY_DEL = 128;

const KEY_SHIFT = 1;
const KEY_CTRL = 2;
const KEY_GRAPH = 3;
const KEY_CAPS = 4;
const KEY_KANA = 5;
const KEY_F1 = 6;
const KEY_F2 = 7;
const KEY_F3 = 11;
const KEY_F4 = 12;
const KEY_F5 = 14;
const KEY_STOP = 15;
const KEY_SELECT = 16;
const KEY_CLS = 17;
const KEY_INS = 18;

const KEY_TEN_ASTER = "*".charCodeAt(0);
const KEY_TEN_PLUS = "+".charCodeAt(0);
const KEY_TEN_SLASH = "/".charCodeAt(0);
const KEY_TEN_0 = "0".charCodeAt(0);
const KEY_TEN_1 = "1".charCodeAt(0);
const KEY_TEN_2 = "2".charCodeAt(0);
const KEY_TEN_3 = "3".charCodeAt(0);
const KEY_TEN_4 = "4".charCodeAt(0);
const KEY_TEN_5 = "5".charCodeAt(0);
const KEY_TEN_6 = "6".charCodeAt(0);
const KEY_TEN_7 = "7".charCodeAt(0);
const KEY_TEN_8 = "8".charCodeAt(0);
const KEY_TEN_9 = "9".charCodeAt(0);
const KEY_TEN_MINUS = "-".charCodeAt(0);
const KEY_TEN_COMMA = ",".charCodeAt(0);
const KEY_TEN_PERIOD = ".".charCodeAt(0);

const s2i = (s) => {
  const res = new Array(s.length);
  for (let i = 0; i < s.length; i++) {
    res[i] = s.charCodeAt(i);
  }
  return res;
};

const keys = [
  ... s2i("0123456789-^¥@[;:],./_abcdefghijklmnopqrstuvwxyz"),
  KEY_SHIFT, KEY_CTRL, KEY_GRAPH, KEY_CAPS, KEY_KANA,
  KEY_F1, KEY_F2, KEY_F3, KEY_F4, KEY_F5, KEY_ESC, KEY_TAB, KEY_STOP,
  KEY_BS, KEY_SELECT, KEY_RETURN, KEY_SPACE, KEY_CLS, KEY_INS, KEY_DEL,
  KEY_LEFT, KEY_UP, KEY_DOWN, KEY_RIGHT,
  KEY_TEN_ASTER, KEY_TEN_PLUS, KEY_TEN_SLASH, KEY_TEN_0, KEY_TEN_1, KEY_TEN_2, KEY_TEN_3, KEY_TEN_4,
  KEY_TEN_5, KEY_TEN_6, KEY_TEN_7, KEY_TEN_8, KEY_TEN_9, KEY_TEN_MINUS, KEY_TEN_COMMA, KEY_TEN_PERIOD,
];
//console.log("keys", keys);

const char2n = (c) => {
  const code = c.charCodeAt(0);
  const n = keys.indexOf(code);
  return n;
};

const keycodemap = {
  "Enter": KEY_RETURN,
  "Backspace": KEY_BS,
  "ArrowRight": KEY_RIGHT,
  "ArrowLeft": KEY_LEFT,
  "ArrowUp": KEY_UP,
  "ArrowDown": KEY_DOWN,
  "Escape": KEY_ESC,
  "Shift": KEY_SHIFT,
  "Tab": KEY_TAB,
  "Control": KEY_CTRL,
  "Meta": KEY_GRAPH,
};

const key2n = (e) => {
  const k = e.key;
  const m = keycodemap[k];
  if (m !== undefined) return keys.indexOf(m);
  return char2n(k);
};

export class Keyboard {
  constructor(comp) {
    this.keymap = new Uint8Array(16);
    for (let i = 0; i < this.keymap.length; i++) {
      this.keymap[i] = 0xff;
    }
    comp.addEventListener("keydown", (e) => {
      const n = key2n(e);
      if (n >= 0) {
        this.keymap[n >> 3] &= ~(1 << (n & 7));
      }
    });
    comp.addEventListener("keyup", (e) => {
      const n = key2n(e);
      if (n >= 0) {
        this.keymap[n >> 3] |= 1 << (n & 7);
      }
    });
  }
  io_write(port, value) {
    if (port == 0xAA) {
      this.selrow = value & 0xf;
    }
  }
  io_read(port) {
    if (port != 0xA9) return undefined;
    return this.keymap[this.selrow];
  }
}
