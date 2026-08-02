// ==UserScript==
// @name         Narrow One - Custom Nebula Sky Mod
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Replaces the Narrow One skybox with a planar projected nebula image
// @description  For the fairness of the game please do not use this mod in any official tournaments hosted by Pelican Party or N1-Esports
// @author       You & Gemini
// @match        *://narrow.one/*
// @match        *://www.narrow.one/*
// @match        *://*.narrow.one/*
// @match        *://game-cdn.poki.com/*
// @match        *://poki.com/*
// @exclude
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // -------------------------------------------------------------
    // CONFIGURATION
    // -------------------------------------------------------------
    const NEBULA_IMAGE_URL = 'https://media.discordapp.net/attachments/1483786249012777162/1533154010217840760/image_2026-08-01_184441085.png?ex=6a6f7470&is=6a6e22f0&hm=2495ffeb580df9feaca85688891b1f4fc8a96b52b34fb739d7829ed37306b7eb&=&format=webp&quality=lossless';

    // Adjust these to position and scale the texture across the sky:
    const SKY_SCALE = 0.85;       // Zoom level (lower = bigger nebula, higher = repeated/smaller)
    const OFFSET_X = 0.5;         // Horizontal position shift
    const OFFSET_Y = 0.5;         // Vertical position shift
    // -------------------------------------------------------------

    let skyMaterial = null;
    let skyTextureClass = null;

    const vertexShader = `
        varying vec3 vWorldDirection;
        void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldDirection = normalize(worldPos.xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position.z = gl_Position.w;
        }
    `;

    // Planar projection fragment shader to eliminate polar swirling
    const fragmentShader = `
        uniform sampler2D skyTex;
        uniform float scale;
        uniform float offsetX;
        uniform float offsetY;
        varying vec3 vWorldDirection;

        void main() {
            vec3 dir = normalize(vWorldDirection);

            // Planar perspective projection prevents polar vertex swirling
            float denom = dir.y + 1.25;
            vec2 uv = (dir.xz / denom) * scale;

            uv.x += offsetX;
            uv.y += offsetY;

            // Clamp UV coordinates so edges don't repeat endlessly
            uv = clamp(uv, 0.0, 1.0);

            vec4 texColor = texture2D(skyTex, uv);
            vec3 linearColor = pow(texColor.rgb, vec3(2.2)); // Gamma correction

            gl_FragColor = vec4(linearColor, 1.0);
        }
    `;

    function applyNebulaSky(mo, skydome) {
        if (skydome._nebulaApplied) return;
        skydome._nebulaApplied = true;

        const ShaderMaterial = skydome.material.constructor;

        mo.scene.traverse(obj => {
            if (skyTextureClass) return;
            const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
            if (mat?.uniforms) {
                Object.values(mat.uniforms).forEach(u => {
                    if (u?.value?.isTexture) skyTextureClass = u.value.constructor;
                });
            }
        });

        skyMaterial = new ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                skyTex:  { value: null },
                scale:   { value: SKY_SCALE },
                offsetX: { value: OFFSET_X },
                offsetY: { value: OFFSET_Y }
            },
            side: 1,
            depthWrite: false,
        });

        skydome.material = skyMaterial;
        skydome.scale.setScalar(450000);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            if (skyTextureClass) {
                const texture = new skyTextureClass(canvas);
                texture.needsUpdate = true;
                skyMaterial.uniforms.skyTex.value = texture;
            }
        };
        img.src = NEBULA_IMAGE_URL;
    }

    const NativeWebSocket = window.WebSocket;
    window.WebSocket = class extends NativeWebSocket {
        constructor(...args) {
            super(...args);
            this.addEventListener('open', () => {
                setTimeout(() => {
                    if (window.capturedMo) return;
                    try {
                        const codeToInject = "window.capturedMo = main;";
                        const payload = JSON.stringify({ id: "cap", c: codeToInject });
                        const encoder = new TextEncoder();
                        const stringBytes = encoder.encode(payload);
                        const buffer = new ArrayBuffer(8 + stringBytes.length);
                        const view32 = new Uint32Array(buffer, 0, 2);
                        view32[0] = 55;
                        view32[1] = stringBytes.length;
                        new Uint8Array(buffer).set(stringBytes, 8);
                        this.dispatchEvent(new MessageEvent('message', { data: buffer }));
                    } catch (e) {}
                }, 500);
            });
        }
    };

    function hookSceneAdd(mo) {
        if (!mo || !mo.scene || mo.scene.__nebulaHooked) return;
        mo.scene.__nebulaHooked = true;

        mo.scene.traverse(obj => {
            if (obj.name === 'skydome') applyNebulaSky(mo, obj);
        });

        const originalAdd = mo.scene.add.bind(mo.scene);
        mo.scene.add = function (...args) {
            originalAdd(...args);
            for (const obj of args) {
                if (obj && obj.name === 'skydome') {
                    applyNebulaSky(mo, obj);
                    break;
                }
            }
        };
    }

    let moInstance = null;
    Object.defineProperty(window, 'capturedMo', {
        get: () => moInstance,
        set: (val) => {
            moInstance = val;
            if (val) hookSceneAdd(val);
        },
        configurable: true
    });

    setInterval(() => {
        if (window.capturedMo && window.capturedMo.scene) {
            hookSceneAdd(window.capturedMo);
        }
    }, 1000);

})();
