import { Base16 } from "https://code4fukui.github.io/Base16/Base16.js";

const fn = Deno.args[0];
if (!fn) {
  console.log("rom2sh.js [rom file]");
  Deno.exit(1);
}

const bin = await Deno.readFile(fn);
const hex = Base16.encode(bin);
//const baseurl = "http://[::]:8000/MIX.html";
const baseurl = "https://ichigojam.github.io/MIX/";
const url = baseurl + "?rom=" + hex;
const sh = `open "${url}"`;
console.log(sh);
