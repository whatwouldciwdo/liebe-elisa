import * as THREE from 'three';

export const CrtShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // Exact pseudo-random noise generator from Ausify (module 6023)
    float crtRand(float s) {
      return fract(sin(s) * 123400.0);
    }

    vec4 crtEffect(vec2 uv, sampler2D tex, vec2 resolution) {
      vec2 distortedUV = uv;

      // Horizontal micro-jitter scan
      distortedUV = vec2(distortedUV.x + crtRand(uTime + distortedUV.y) * 0.00065, distortedUV.y);

      vec4 color = texture2D(tex, distortedUV);

      // Chromatic aberration (RGB shift split)
      float caAmount = 0.0018;
      vec2 caDir = normalize(distortedUV - 0.5);
      vec2 caOff = caDir * caAmount;
      color.r = texture2D(tex, distortedUV + caOff).r;
      color.b = texture2D(tex, distortedUV - caOff).b;

      // Phosphor RGB subpixel striping
      vec3 rgb = vec3(0.2, 0.2, 0.2);
      float pp = mod(floor(uv.x * resolution.x), 3.0);
      if (pp < 0.5) {
        rgb.r = 1.0;
      } else if (pp < 1.5) {
        rgb.g = 1.0;
      } else {
        rgb.b = 1.0;
      }
      color.rgb = mix(mix(color.rgb, color.rgb * rgb * 1.3, 0.3), color.rgb, 0.7);

      // Clean CRT scanline mask (without darkening top header)
      vec3 mask = vec3(int(clamp(mod(gl_FragCoord.y, 4.0), 0.0, 1.0)));
      color.rgb = mix(color.rgb * mask, color.rgb, 0.90);

      return color;
    }

    void main() {
      vec2 uv = vec2(vUv.x + crtRand(uTime + vUv.y) * 0.0004, vUv.y);
      vec4 color = crtEffect(uv, tDiffuse, uResolution);
      gl_FragColor = color;
    }
  `,
};
