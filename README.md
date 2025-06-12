# MIX

- MIX is a compact Z80 emulator with VDP (It's still a work in progress)

## dev memo

- [vdp-test](https://ichigojam.github.io/MIX/vdp-test.html) with [NO-BIOS](https://github.com/IchigoJam/no-bios)

### BIOS compatible version

- [HELLO WORLD!](test.js)
- [MIX SCREEN1 DEMO](https://ichigojam.github.io/MIX/screen1.html)
- [MIX web](https://ichigojam.github.io/MIX/)
- [IchigoJam_BASIC for CP/M](cpm.js) with [IchigoJam_BASIC.com](IchigoJam_BASIC.com) from [IchigoJam_firm](https://github.com/IchigoJam/ichigojam-firm) for console/z88dk

#### usage

set URL
- https://ichigojam.github.io/MIX/?rom=https://ichigojam.github.io/MIX/hello.rom

set as HEX (Base16)
- https://ichigojam.github.io/MIX/?rom=41421040000000000000000000000000cd2140213640cd2d4018fe3e2032aff3c9cd1b403e01cd5f00cdc300c97eb7c8cda2002318f748656c6c6f21204d53580d0a00

#### tool

### rom2url

```sh
deno -A https://ichigojam.github.io/MIX/rom2url.js hello.rom
```

#### rom3sh for Mac

```sh
deno --allow-read --allow-import https://ichigojam.github.io/MIX/rom2sh.js hello.rom | sh
```

## refernce

- [Z80.js](https://github.com/IchigoJam/Z80.js)
- [NO-BIOS](https://github.com/IchigoJam/no-bios)
