import { Mesh, Program, Renderer, Triangle } from 'https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm';

const MAX_POINTS = 64;
const container = document.querySelector('[data-glow-cursor]');
const canvas = container && container.querySelector('.glow-cursor__canvas');

if (container && canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const vertex = `
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
  `;
  const fragment = `
    precision highp float;
    #define MAX_POINTS 64
    uniform vec2 uResolution;
    uniform vec2 uPoints[MAX_POINTS];
    uniform float uPointCount, uTime, uFade;
    uniform vec3 uColor, uSecondaryColor;
    uniform float uTrailWidth, uTaper, uGlowIntensity, uGlowSpread, uHotspot;
    uniform float uBrightness, uOpacity, uPulseSpeed, uNoiseStrength;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec2 pixel = vUv * uResolution;
      float denominator = max(uPointCount - 1.0, 1.0);
      float strongest = 0.0, strongestCore = 0.0, colorWeight = 0.0;
      vec3 colorSum = vec3(0.0);
      for (int i = 0; i < MAX_POINTS - 1; i++) {
        float index = float(i);
        float active = 1.0 - step(uPointCount - 1.0, index);
        vec2 start = uPoints[i], end = uPoints[i + 1];
        vec2 segment = end - start, toPixel = pixel - start;
        float along = clamp(dot(toPixel, segment) / max(dot(segment, segment), 0.0001), 0.0, 1.0);
        float progress = clamp((index + along) / denominator, 0.0, 1.0);
        float life = pow(max(1.0 - progress, 0.0), mix(0.55, 1.25, uTaper));
        float width = uTrailWidth * mix(1.0, 0.25, pow(progress, mix(0.55, 1.6, uTaper)));
        float distanceToTrail = length(toPixel - segment * along);
        float falloff = max(width * (0.8 + uGlowSpread * 1.4), 0.5);
        float beam = min(1.0, (falloff * falloff) / (distanceToTrail * distanceToTrail + falloff * falloff));
        float core = exp(-pow(distanceToTrail / max(width, 0.5), 2.0) * 2.5);
        float pulse = 1.0 + sin(uTime * uPulseSpeed * 3.0 - progress * 11.0) * 0.16;
        float intensity = (core + beam * uGlowIntensity * 0.55) * life * pulse * active;
        colorSum += mix(uColor, uSecondaryColor, progress) * intensity;
        colorWeight += intensity;
        strongest = max(strongest, intensity);
        strongestCore = max(strongestCore, core * life * active);
      }
      float grain = (hash(floor(pixel) + floor(uTime * 18.0)) * 2.0 - 1.0) * uNoiseStrength;
      float alpha = clamp(strongest * uOpacity * uFade, 0.0, 1.0);
      if (alpha < 0.0005) discard;
      vec3 color = colorSum / max(colorWeight, 0.0001);
      color = mix(color, vec3(1.0), smoothstep(0.25, 0.95, strongestCore) * uHotspot);
      float brightness = clamp(strongest * uBrightness, 0.0, 1.0) * (1.0 + grain);
      gl_FragColor = vec4(color * brightness, alpha);
    }
  `;

  const colors = (hex) => {
    const value = (hex || '').replace('#', '').trim();
    const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value;
    const parsed = Number.parseInt(full || '000000', 16);
    return [((parsed >> 16) & 255) / 255, ((parsed >> 8) & 255) / 255, (parsed & 255) / 255];
  };
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const renderer = new Renderer({ canvas, alpha: true, dpr: Math.min(window.devicePixelRatio || 1, 1.5) });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  const pointData = Array(MAX_POINTS * 2).fill(0);
  const points = Array.from({ length: MAX_POINTS }, () => ({ x: 0, y: 0 }));
  const target = { x: 0, y: 0 }, head = { x: 0, y: 0 };
  const program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      uResolution: { value: [1, 1] }, uPoints: { value: pointData }, uPointCount: { value: 40 },
      uColor: { value: colors('#f9f067') }, uSecondaryColor: { value: colors('#faa78b') },
      uTrailWidth: { value: 8 }, uTaper: { value: 0.8 }, uGlowIntensity: { value: 1.9 },
      uGlowSpread: { value: 1.2 }, uHotspot: { value: 0.65 }, uBrightness: { value: 1.05 },
      uOpacity: { value: 1 }, uPulseSpeed: { value: 1.1 }, uNoiseStrength: { value: 0.035 },
      uTime: { value: 0 }, uFade: { value: 0 }
    }, transparent: true, depthTest: false, depthWrite: false
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  let width = 1, height = 1, initialized = false, inside = false, fade = 0;
  let lastInput = performance.now(), lastFrame = performance.now(), raf;

  const resize = () => {
    width = Math.max(container.clientWidth, 1); height = Math.max(container.clientHeight, 1);
    renderer.setSize(width, height); program.uniforms.uResolution.value = [width, height];
  };
  const updatePointer = (event) => {
    const rect = container.getBoundingClientRect();
    target.x = clamp(event.clientX - rect.left, 0, rect.width);
    target.y = clamp(rect.height - (event.clientY - rect.top), 0, rect.height);
    if (!initialized) {
      head.x = target.x; head.y = target.y;
      points.forEach((point) => { point.x = target.x; point.y = target.y; });
      initialized = true; fade = 1;
    }
    inside = true; lastInput = performance.now();
  };
  const render = (now) => {
    const delta = Math.min((now - lastFrame) / 16.667, 3); lastFrame = now;
    if (initialized) {
      const ease = 1 - Math.pow(1 - 0.16, delta);
      const chain = 1 - Math.pow(1 - 0.336, delta);
      head.x += (target.x - head.x) * ease; head.y += (target.y - head.y) * ease;
      points[0].x = head.x; points[0].y = head.y;
      for (let i = 1; i < MAX_POINTS; i++) {
        points[i].x += (points[i - 1].x - points[i].x) * chain;
        points[i].y += (points[i - 1].y - points[i].y) * chain;
        pointData[i * 2] = points[i].x; pointData[i * 2 + 1] = points[i].y;
      }
      pointData[0] = points[0].x; pointData[1] = points[0].y;
    }
    const idle = now - lastInput > 700;
    const fadeTarget = initialized && inside && !idle ? 1 : 0;
    fade += (fadeTarget - fade) * Math.min(1, (16.667 * delta / 900) * 7);
    program.uniforms.uTime.value = now * 0.001; program.uniforms.uFade.value = fade;
    renderer.render({ scene: mesh }); raf = requestAnimationFrame(render);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container); container.addEventListener('pointermove', updatePointer);
  container.addEventListener('pointerenter', updatePointer);
  container.addEventListener('pointerleave', () => { inside = false; lastInput = performance.now(); });
  resize(); raf = requestAnimationFrame(render);
}