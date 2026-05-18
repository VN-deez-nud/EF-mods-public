// ==UserScript==
// @name         Narrow.One aim crosshair
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  nothing
// @author       deine mutter
// @match        *://narrow.one/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Verfügbare Fadenkreuz-Stile
    const stile = ["punkt", "plus", "x"];
    let aktuellerStil = 0;

    // Haupt-Element für Fadenkreuz
    const fadenkreuz = document.createElement("div");
    fadenkreuz.id = "fadenkreuz";
    document.body.appendChild(fadenkreuz);

    const aktualisiereFadenkreuz = () => {
        fadenkreuz.innerHTML = ""; // Alte Form entfernen
        fadenkreuz.style.position = "fixed";
        fadenkreuz.style.top = "50%";
        fadenkreuz.style.left = "50%";
        fadenkreuz.style.transform = "translate(-50%, -50%)";
        fadenkreuz.style.pointerEvents = "none";
        fadenkreuz.style.zIndex = "9999";

        if (stile[aktuellerStil] === "punkt") {
            const punkt = document.createElement("div");
            punkt.style.width = "8px";
            punkt.style.height = "8px";
            punkt.style.borderRadius = "50%";
            punkt.style.background = "red";
            punkt.style.position = "absolute";
            punkt.style.top = "50%";
            punkt.style.left = "50%";
            punkt.style.transform = "translate(-50%, -50%)";
            fadenkreuz.appendChild(punkt);
        }
        else if (stile[aktuellerStil] === "plus") {
            fadenkreuz.style.width = "20px";
            fadenkreuz.style.height = "20px";

            fadenkreuz.innerHTML = `
                <div style="position:absolute;top:50%;left:0;width:100%;height:2px;background:red;transform:translateY(-50%);"></div>
                <div style="position:absolute;left:50%;top:0;width:2px;height:100%;background:red;transform:translateX(-50%);"></div>
            `;
        }
        else if (stile[aktuellerStil] === "x") {
            fadenkreuz.style.width = "20px";
            fadenkreuz.style.height = "20px";

            fadenkreuz.innerHTML = `
                <div style="position:absolute;top:50%;left:50%;width:2px;height:20px;background:red;transform:translate(-50%, -50%) rotate(45deg);"></div>
                <div style="position:absolute;top:50%;left:50%;width:2px;height:20px;background:red;transform:translate(-50%, -50%) rotate(-45deg);"></div>
            `;
        }
    };

    // Fadenkreuz am Anfang zeichnen
    aktualisiereFadenkreuz();

    // Taste "P" zum Wechseln der Form
    window.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "p") {
            aktuellerStil = (aktuellerStil + 1) % stile.length;
            aktualisiereFadenkreuz();
        }
    });
})();
