import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGame } from '../../state/store';

// HÉROS VIVANTS (v1.104.0, phase 3 lot 2) — l'illustration peinte s'anime sur la carte graphique (WebGL) :
// respiration (la poitrine se soulève), vent (cape, cheveux, barbe ondulent, davantage vers le bas et sur les bords),
// parallaxe (le personnage, au centre, bouge un peu plus que le décor ; suit le doigt), reflet qui balaie les parties
// claires (métal, bijoux). Un seul quadrilatère et un shader léger : fluide sur iPhone. L'animation ne tourne que si
// la vue est à l'écran ; « Animations réduites », absence de WebGL ou erreur → l'illustration fixe reste affichée.

const VERT = `
attribute vec2 aPos; varying vec2 vUv;
void main() { vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5); gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex; uniform float uTime; uniform vec2 uCover; uniform vec2 uOff; uniform vec2 uTilt; uniform vec3 uAccent;
void main() {
  vec2 p = uOff + vUv * uCover;                                   // position dans l'image (cadrage « cover »)
  float fig = exp(-pow((p.x - 0.5) / 0.28, 2.0)) * smoothstep(1.05, 0.2, p.y); // le personnage, au centre
  float chest = exp(-pow((p.y - 0.42) / 0.17, 2.0)) * exp(-pow((p.x - 0.5) / 0.24, 2.0));
  float br = sin(uTime * 1.15);
  p.y += br * 0.0032 * chest;                                      // respiration
  p.x += (p.x - 0.5) * br * 0.006 * chest;
  float sway = smoothstep(0.45, 1.0, p.y) * (0.35 + abs(p.x - 0.5) * 1.7);
  p.x += (sin(uTime * 1.6 + p.y * 9.0) * 0.0032 + sin(uTime * 0.7 + p.y * 3.0) * 0.0018) * sway; // vent
  p += uTilt * (0.013 * fig - 0.006);                              // parallaxe : figure devant, décor derrière
  vec4 c = texture2D(uTex, clamp(p, vec2(0.001), vec2(0.999)));
  float band = (p.x + p.y * 0.6) - mod(uTime * 0.17, 2.8) + 0.4;  // reflet qui balaie
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  float glint = exp(-band * band * 80.0) * smoothstep(0.35, 0.95, lum);
  c.rgb += glint * 0.32 * mix(vec3(1.0), uAccent, 0.45);
  gl_FragColor = vec4(c.rgb, 1.0);
}`;

const hex = (h: string): [number, number, number] => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!; gl.shaderSource(sh, src); gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
  return sh;
}

/** Illustration animée. `children` = l'illustration fixe, affichée tant que (ou si) l'animation n'est pas prête. */
export function LivingArt({ src, accent = '#e2b866', anchorY = 0.12, children }: { src?: string; accent?: string; anchorY?: number; children: ReactNode }) {
  const reduced = useGame((s) => s.save?.settings.reducedMotion);
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    setLive(false);
    const cv = canvas.current, el = host.current;
    if (!src || reduced || !cv || !el) return;
    let gl: WebGLRenderingContext | null = null;
    try { gl = cv.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' }) as WebGLRenderingContext | null; } catch { gl = null; }
    if (!gl) return;
    let raf = 0, alive = true, visible = true, t0 = performance.now(), lastDraw = 0;
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    let prog: WebGLProgram, tex: WebGLTexture | null = null, img: HTMLImageElement | null = null;
    const u: Record<string, WebGLUniformLocation | null> = {};
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const n of ['uTex', 'uTime', 'uCover', 'uOff', 'uTilt', 'uAccent']) u[n] = gl.getUniformLocation(prog, n);
      gl.uniform3fv(u.uAccent, hex(accent));
    } catch { return; }

    const size = () => {
      const r = el.getBoundingClientRect(); const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
      gl!.viewport(0, 0, cv.width, cv.height);
      if (img) {
        const ca = r.width / Math.max(1, r.height), ia = img.naturalWidth / img.naturalHeight;
        const cover = ca > ia ? [1, ia / ca] : [ca / ia, 1];
        gl!.uniform2f(u.uCover, cover[0], cover[1]);
        gl!.uniform2f(u.uOff, (1 - cover[0]) * 0.5, (1 - cover[1]) * anchorY);
      }
    };
    const frame = (now: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || !tex) return;
      // 30 images/s suffisent à un mouvement aussi lent : moitié moins de travail pour la carte graphique.
      if (now - lastDraw < 31) return;
      lastDraw = now;
      const t = (now - t0) / 1000;
      // dérive lente (le tableau vit seul) + le doigt
      tilt.x += (tilt.tx + Math.sin(t * 0.31) * 0.45 - tilt.x) * 0.06;
      tilt.y += (tilt.ty + Math.cos(t * 0.23) * 0.3 - tilt.y) * 0.06;
      gl!.uniform1f(u.uTime, t); gl!.uniform2f(u.uTilt, tilt.x, tilt.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    };
    img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!alive || !gl) return;
      tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img!); } catch { return; }
      gl.uniform1i(u.uTex, 0);
      size(); t0 = performance.now();
      raf = requestAnimationFrame(frame);
      setLive(true);
    };
    img.src = src;
    const ro = new ResizeObserver(() => size()); ro.observe(el);
    const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; }); io.observe(el);
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); tilt.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; tilt.ty = ((e.clientY - r.top) / r.height - 0.5) * 2; };
    const leave = () => { tilt.tx = 0; tilt.ty = 0; };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave); el.addEventListener('pointerup', leave);
    const lost = (e: Event) => { e.preventDefault(); setLive(false); };
    cv.addEventListener('webglcontextlost', lost);
    return () => {
      alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); el.removeEventListener('pointerup', leave);
      cv.removeEventListener('webglcontextlost', lost);
      if (tex) gl.deleteTexture(tex);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [src, reduced, accent, anchorY]);

  return (
    <div className={`living-art ${live ? 'live' : ''}`} ref={host}>
      <div className="la-still">{children}</div>
      <canvas key={`${src}|${reduced}`} className="la-canvas" ref={canvas} aria-hidden />
    </div>
  );
}
