import ichigojamfont from "https://ichigojam.github.io/font/ichigojam-font.bin.js";

export class MIXScreen1 extends HTMLElement {
  constructor() {
    super();

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 192;
    canvas.style.imageRendering = "pixelated";
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      alert("WebGL2 not supported");
    }
    gl.viewport(0, 0, canvas.width, canvas.height);

    const cols = 32, rows = 24;
    const cellSize = 8;

    // フォントROM: 256文字 × 8バイト = 2048バイト
    //const fn = "./ichigojam-font.bin";
    /*
    const fn = "https://ichigojam.github.io/font/ichigojam-font.bin";
    const font = await (await fetch(fn)).bytes();
    const fontROM = new Uint8Array(font);
    */
    const fontROM = ichigojamfont;

    // テキストVRAM
    const textVRAM = new Uint8Array(cols * rows);
    /*
    for (let i = 0; i < textVRAM.length; i++) {
      textVRAM[i] = i; // 0x41; // i;
    }
    */

    // フォントテクスチャ (256x8)
    const fontTexture = gl.createTexture();

    // テキストVRAMをテクスチャとして送る
    const textTexture = gl.createTexture();

    function updateTextTexture() {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fontTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 2048, 1, 0, gl.RED, gl.UNSIGNED_BYTE, fontROM);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, cols, rows, 0, gl.RED, gl.UNSIGNED_BYTE, textVRAM);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    function createShader(gl, type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, `#version 300 es
      in vec2 aPos;
      out vec2 vPos;
      void main() {
        vPos = aPos;
        gl_Position = vec4((aPos / vec2(${cols}, ${rows}) * 2.0 - 1.0) * vec2(1, -1), 0, 1);
      }
    `);

    const fs = createShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
      precision mediump float;
      in vec2 vPos;
      out vec4 outColor;
      uniform sampler2D uFontROM;
      uniform sampler2D uTextVRAM;

      float getFontPixel(float charCode, float px, float py) {
        float y = charCode * 8.0 + py;
        vec2 uv = vec2(y + 0.5, 0.5) / vec2(2048.0, 1.0);
        float byte = texture(uFontROM, uv).r * 255.0;
        float mask = pow(2.0, 7.0 - px); // MSB-left
        return step(0.5, mod(floor(byte / mask), 2.0));
      }

      void main() {
        vec2 cell = floor(vPos);
        vec2 frac = fract(vPos);
        vec2 vramUV = (cell + 0.5) / vec2(${cols}.0, ${rows}.0);
        float charCode = texture(uTextVRAM, vramUV).r * 255.0;
        float pixel = getFontPixel(charCode, floor(frac.x * 8.0), floor(frac.y * 8.0));
        outColor = vec4(vec3(pixel), 1.0);
      }
    `);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const quad = new Float32Array([
      0, 0,  cols, 0,  0, rows,
      cols, 0,  cols, rows,  0, rows
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const loc = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uFont = gl.getUniformLocation(program, "uFontROM");
    const uText = gl.getUniformLocation(program, "uTextVRAM");
    gl.uniform1i(uFont, 0);
    gl.uniform1i(uText, 1);

    canvas.draw = () => {
      updateTextTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fontTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textTexture);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    this.appendChild(canvas);
    this.canvas = canvas;
    this.fontROM = fontROM;
    this.textVRAM = textVRAM;
  }
  draw() {
    this.canvas.draw();
  }
}

customElements.define("mix-screen1", MIXScreen1);
