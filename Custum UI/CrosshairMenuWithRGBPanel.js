// ==UserScript==
// @name         Narrow One Custom Crosshair Selector & RGB Customizer (Neon Green UI)
// @namespace    http://tampermonkey.net/
// @version      2.2.1
// @description  Custom Crosshair Selector with dark/neon green control panel in top-right corner. RGB panel included to select the color of your crosshair with a preview of your color. Press "+" to toggle and disable
// @author       EF Aspect
// @match        https://narrow.one/
// @match        https://*.narrow.one/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ---- Load Saved Settings ----
    const savedColor = JSON.parse(localStorage.getItem("narrowone_crosshair_rgb") || '{"r":0,"g":255,"b":102,"a":1}');
    let currentCrosshair = Number(localStorage.getItem("narrowone_crosshair_index") || 0);

    // Set to false so it does not open automatically on startup
    let menuOpen = false;

    let rgbState = {
        r: savedColor.r,
        g: savedColor.g,
        b: savedColor.b,
        a: savedColor.a
    };

    function saveSettings() {
        localStorage.setItem("narrowone_crosshair_rgb", JSON.stringify(rgbState));
        localStorage.setItem("narrowone_crosshair_index", currentCrosshair);
    }

    function getRGBAString() {
        return `rgba(${rgbState.r}, ${rgbState.g}, ${rgbState.b}, ${rgbState.a})`;
    }

    // ---- Crosshair Definitions ----
    const crosshairs = [
        {
            name: "Simple Cross",
            draw: (ctx, size) => {
                const color = getRGBAString();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.lineTo(size, 0);
                ctx.moveTo(0, -size);
                ctx.lineTo(0, size);
                ctx.stroke();
            }
        },
        {
            name: "Circle",
            draw: (ctx, size) => {
                const color = getRGBAString();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, 2 * Math.PI);
                ctx.stroke();

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, 0, size / 6, 0, 2 * Math.PI);
                ctx.fill();
            }
        },
        {
            name: "Point",
            draw: (ctx, size) => {
                const color = getRGBAString();
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, 0, size / 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        },
        {
            name: "Cross + Circle",
            draw: (ctx, size) => {
                const color = getRGBAString();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.lineTo(size, 0);
                ctx.moveTo(0, -size);
                ctx.lineTo(0, size);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, 2 * Math.PI);
                ctx.stroke();
            }
        },
        {
            name: "Hollow Cross",
            draw: (ctx, size) => {
                const color = getRGBAString();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.lineTo(-size / 2, 0);
                ctx.moveTo(size / 2, 0);
                ctx.lineTo(size, 0);
                ctx.moveTo(0, -size);
                ctx.lineTo(0, -size / 2);
                ctx.moveTo(0, size / 2);
                ctx.lineTo(0, size);
                ctx.stroke();
            }
        },
        {
            name: "Square Corner",
            draw: (ctx, size) => {
                const color = getRGBAString();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                // Top-Left
                ctx.moveTo(-size, -size); ctx.lineTo(-size / 2, -size);
                ctx.moveTo(-size, -size); ctx.lineTo(-size, -size / 2);
                // Top-Right
                ctx.moveTo(size, -size); ctx.lineTo(size / 2, -size);
                ctx.moveTo(size, -size); ctx.lineTo(size, -size / 2);
                // Bottom-Left
                ctx.moveTo(-size, size); ctx.lineTo(-size / 2, size);
                ctx.moveTo(-size, size); ctx.lineTo(-size, size / 2);
                // Bottom-Right
                ctx.moveTo(size, size); ctx.lineTo(size / 2, size);
                ctx.moveTo(size, size); ctx.lineTo(size, size / 2);
                ctx.stroke();

                // Center X
                ctx.beginPath();
                ctx.moveTo(-size / 4, -size / 4); ctx.lineTo(size / 4, size / 4);
                ctx.moveTo(-size / 4, size / 4); ctx.lineTo(size / 4, -size / 4);
                ctx.stroke();
            }
        }
    ];

    // ---- Create Canvas for Crosshair ----
    const crosshairSize = 22;
    const canvas = document.createElement('canvas');
    canvas.width = crosshairSize * 2 + 8;
    canvas.height = crosshairSize * 2 + 8;
    canvas.style.position = 'fixed';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
    canvas.style.zIndex = '99999';
    canvas.style.pointerEvents = 'none';
    canvas.style.display = 'block';
    document.body.appendChild(canvas);

    function drawCrosshair() {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (crosshairs[currentCrosshair]) {
            crosshairs[currentCrosshair].draw(ctx, crosshairSize);
        }
        ctx.restore();
    }

    // ---- Dark & Neon Green Control Panel Styling ----
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.top = '10px';
    panel.style.right = '10px';
    panel.style.background = 'rgba(10, 15, 12, 0.95)';
    panel.style.padding = '14px 18px';
    panel.style.borderRadius = '10px';
    panel.style.border = '2px solid #00ff66';
    panel.style.boxShadow = '0 0 15px rgba(0, 255, 102, 0.4)';
    panel.style.zIndex = '100000';
    panel.style.color = '#e0ffe0';
    panel.style.fontFamily = 'Arial, sans-serif';
    panel.style.fontSize = '13px';
    panel.style.width = '210px';
    panel.style.userSelect = 'none';

    // Explicitly hide on initial creation
    panel.style.display = 'none';

    function buildPanelHTML() {
        let html = `
            <div style="display:flex; justify-between; align-items:center; border-bottom:1px solid #00ff6644; padding-bottom:8px; margin-bottom:10px;">
                <b style="font-size:14px; color:#00ff66; text-shadow: 0 0 5px #00ff66;">Crosshair Options</b>
                <span style="font-size:10px; color:#888;">[Press +]</span>
            </div>

            <div style="margin-bottom:12px;">
                <label style="display:block; margin-bottom:4px; font-weight:bold; color:#00ff66;">Style:</label>
                <select id="xhair-style-select" style="width:100%; padding:5px; background:#141a16; color:#00ff66; border:1px solid #00ff6688; border-radius:5px; cursor:pointer; outline:none;">
        `;

        crosshairs.forEach((c, i) => {
            html += `<option value="${i}" ${i === currentCrosshair ? 'selected' : ''}>${i + 1}. ${c.name}</option>`;
        });

        html += `
                </select>
            </div>

            <div style="margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between;">
                    <label style="color:#ff5555; font-weight:bold;">Red</label>
                    <span id="val-r">${rgbState.r}</span>
                </div>
                <input type="range" id="slider-r" min="0" max="255" value="${rgbState.r}" style="width:100%; accent-color:#ff5555; cursor:pointer;">
            </div>

            <div style="margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between;">
                    <label style="color:#00ff66; font-weight:bold;">Green</label>
                    <span id="val-g">${rgbState.g}</span>
                </div>
                <input type="range" id="slider-g" min="0" max="255" value="${rgbState.g}" style="width:100%; accent-color:#00ff66; cursor:pointer;">
            </div>

            <div style="margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between;">
                    <label style="color:#5588ff; font-weight:bold;">Blue</label>
                    <span id="val-b">${rgbState.b}</span>
                </div>
                <input type="range" id="slider-b" min="0" max="255" value="${rgbState.b}" style="width:100%; accent-color:#5588ff; cursor:pointer;">
            </div>

            <div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between;">
                    <label style="color:#cccccc; font-weight:bold;">Opacity</label>
                    <span id="val-a">${rgbState.a}</span>
                </div>
                <input type="range" id="slider-a" min="0" max="1" step="0.05" value="${rgbState.a}" style="width:100%; accent-color:#00ff66; cursor:pointer;">
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;">
                <span style="color:#00ff66;">Preview:</span>
                <div id="color-preview-box" style="width:70px; height:20px; border-radius:4px; border:1px solid #00ff66; background-color:${getRGBAString()}; box-shadow:0 0 5px ${getRGBAString()};"></div>
            </div>
        `;

        panel.innerHTML = html;
    }

    document.body.appendChild(panel);
    buildPanelHTML();

    // ---- Event Listeners for UI ----
    function attachEvents() {
        const styleSelect = panel.querySelector('#xhair-style-select');
        const sliderR = panel.querySelector('#slider-r');
        const sliderG = panel.querySelector('#slider-g');
        const sliderB = panel.querySelector('#slider-b');
        const sliderA = panel.querySelector('#slider-a');

        styleSelect.addEventListener('change', (e) => {
            currentCrosshair = Number(e.target.value);
            saveSettings();
            drawCrosshair();
        });

        const updateRGB = () => {
            rgbState.r = Number(sliderR.value);
            rgbState.g = Number(sliderG.value);
            rgbState.b = Number(sliderB.value);
            rgbState.a = Number(sliderA.value);

            panel.querySelector('#val-r').textContent = rgbState.r;
            panel.querySelector('#val-g').textContent = rgbState.g;
            panel.querySelector('#val-b').textContent = rgbState.b;
            panel.querySelector('#val-a').textContent = rgbState.a;

            const colorStr = getRGBAString();
            const previewBox = panel.querySelector('#color-preview-box');
            previewBox.style.backgroundColor = colorStr;
            previewBox.style.boxShadow = `0 0 5px ${colorStr}`;

            saveSettings();
            drawCrosshair();
        };

        sliderR.addEventListener('input', updateRGB);
        sliderG.addEventListener('input', updateRGB);
        sliderB.addEventListener('input', updateRGB);
        sliderA.addEventListener('input', updateRGB);
    }

    attachEvents();

    // ---- Hotkey Toggle (+) ----
    window.addEventListener('keydown', function(e) {
        if (
            (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') &&
            ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(document.activeElement.tagName) === -1
        ) {
            menuOpen = !menuOpen;
            panel.style.display = menuOpen ? 'block' : 'none';
            e.preventDefault();
        }
    });

    // ---- Render Loop ----
    function renderLoop() {
        drawCrosshair();
        requestAnimationFrame(renderLoop);
    }
    renderLoop();

})();
