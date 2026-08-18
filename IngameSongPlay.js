// ==UserScript==
// @name         N1 Favorite Songs Panel (In-Game Audio)
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Adds an in-game favorite songs music player panel. To use it first download the song you like in an online mp3 converter
// @description  To use it first download the song you like in an online mp3 converter
// @description  Then use https://catbox.moe/ to convert it into a file with .mp3, after paste it into the links below
// @author       Aspect
// @match        https://narrow.one/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ==========================================================
    // EDIT THIS LIST with your direct audio links (.mp3) They look like this: https://files.catbox.moe/xxxxxx.mp3
    // ==========================================================
    const SONGS = [
        {
            title: "Song 2 (Demo MP3)",
            url: "https://files.catbox.moe/xxxxxx.mp3"
        },
        {
            title: "Song 2 (Demo MP3)",
            url: "https://files.catbox.moe/xxxxxx.mp3"
        },
        {
            title: "Song 3 (Demo MP3)",
            url: "https://files.catbox.moe/xxxxxx.mp3"
        },
    ];

    // Hotkey to show/hide panel (default: 0 or Numpad 0)
    const TOGGLE_KEY = "Digit0";

    // Global HTML5 Audio Instance
    const audioPlayer = new Audio();
    audioPlayer.volume = 0.5; // Default volume (50%)

    function isTyping() {
        const el = document.activeElement;
        if (!el) return false;
        return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.getAttribute("contenteditable") === "true";
    }

    function buildPanel() {
        if (document.getElementById("fav-songs-panel")) return;

        const panel = document.createElement("div");
        panel.id = "fav-songs-panel";
        panel.style.cssText = `
            position: fixed; top: 50%; right: 20px; transform: translateY(-50%);
            width: 300px; background: rgba(10, 10, 16, 0.96);
            border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.9), 0 0 15px rgba(0, 255, 204, 0.25);
            font-family: 'Courier New', Courier, monospace; color: #fff;
            z-index: 99999999; display: none; flex-direction: column; padding: 14px;
            backdrop-filter: blur(10px);
        `;

        // Title Header
        const title = document.createElement("div");
        title.style.cssText = `
            font-size: 13px; font-weight: bold; letter-spacing: 2px;
            text-align: center; margin-bottom: 8px; color: #00ffcc;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 8px;
        `;
        title.innerText = "IN-GAME MUSIC PLAYER";
        panel.appendChild(title);

        // Track Status Display
        const nowPlaying = document.createElement("div");
        nowPlaying.id = "audio-status";
        nowPlaying.style.cssText = `
            font-size: 11px; color: #ff0055; text-align: center;
            margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        `;
        nowPlaying.innerText = "Status: Stopped";
        panel.appendChild(nowPlaying);

        // Song Buttons Container
        const list = document.createElement("div");
        list.style.cssText = `display: flex; flex-direction: column; gap: 5px; max-height: 280px; overflow-y: auto;`;

        SONGS.forEach((song) => {
            const btn = document.createElement("button");
            btn.style.cssText = `
                background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08);
                color: #ccc; padding: 8px 12px; border-radius: 4px; font-family: inherit;
                font-size: 12px; text-align: left; cursor: pointer; transition: all 0.15s ease;
                outline: none;
            `;
            btn.innerText = song.title;
            btn.onmouseenter = () => {
                btn.style.background = "rgba(0, 255, 204, 0.15)";
                btn.style.borderColor = "#00ffcc";
                btn.style.color = "#00ffcc";
            };
            btn.onmouseleave = () => {
                btn.style.background = "rgba(255, 255, 255, 0.05)";
                btn.style.borderColor = "rgba(255, 255, 255, 0.08)";
                btn.style.color = "#ccc";
            };
            btn.onclick = () => {
                audioPlayer.src = song.url;
                audioPlayer.play().then(() => {
                    nowPlaying.innerText = `Playing: ${song.title}`;
                    nowPlaying.style.color = "#00ffcc";
                }).catch((err) => {
                    nowPlaying.innerText = "Error: Could not load audio file";
                    nowPlaying.style.color = "#ff0055";
                    console.error("Audio error:", err);
                });
            };
            list.appendChild(btn);
        });

        panel.appendChild(list);

        // Controls Section (Stop + Volume Slider)
        const controls = document.createElement("div");
        controls.style.cssText = `display: flex; flex-direction: column; gap: 8px; margin-top: 10px;`;

        const stopBtn = document.createElement("button");
        stopBtn.innerText = "■ Stop Playback";
        stopBtn.style.cssText = `
            background: rgba(255, 0, 85, 0.2); border: 1px solid #ff0055;
            color: #ff0055; padding: 6px; border-radius: 4px; font-family: inherit;
            font-size: 11px; cursor: pointer; text-align: center;
        `;
        stopBtn.onclick = () => {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            nowPlaying.innerText = "Status: Stopped";
            nowPlaying.style.color = "#ff0055";
        };

        const volumeContainer = document.createElement("div");
        volumeContainer.style.cssText = `display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #aaa;`;

        const volLabel = document.createElement("span");
        volLabel.innerText = "Volume:";

        const volSlider = document.createElement("input");
        volSlider.type = "range";
        volSlider.min = "0";
        volSlider.max = "1";
        volSlider.step = "0.05";
        volSlider.value = "0.5";
        volSlider.style.cssText = `width: 70%; cursor: pointer;`;
        volSlider.oninput = (e) => {
            audioPlayer.volume = e.target.value;
        };

        volumeContainer.appendChild(volLabel);
        volumeContainer.appendChild(volSlider);

        controls.appendChild(stopBtn);
        controls.appendChild(volumeContainer);
        panel.appendChild(controls);

        // Footer Hint
        const hint = document.createElement("div");
        hint.style.cssText = `margin-top: 8px; font-size: 10px; color: #666; text-align: center;`;
        hint.innerText = `Press ${TOGGLE_KEY.replace("Digit", "").replace("Numpad", "")} to toggle panel`;
        panel.appendChild(hint);

        document.body.appendChild(panel);
    }

    function togglePanel() {
        buildPanel();
        const panel = document.getElementById("fav-songs-panel");
        if (!panel) return;
        panel.style.display = (panel.style.display === "none" || panel.style.display === "") ? "flex" : "none";
    }

    window.addEventListener("keydown", (event) => {
        if (isTyping()) return;
        if (event.code === TOGGLE_KEY || event.code === "Numpad0") togglePanel();
    });

})();
