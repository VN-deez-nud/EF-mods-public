// ==UserScript==
// @name         Narrow.one Profile ELO Display
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fetches and displays account ELO rating in the Narrow.one profile menu.
// @author       Ghost Rider
// @match        https://narrow.one/*
// @grant        none
// @icon         https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740
// ==/UserScript==

(function () {
    'use strict';

    const DB_NAME = "keyValuesDb";
    const STORE_NAME = "keyValues";
    const KEY_NAME = "cachedProfileState";

    // Inject matching CSS grid layout
    function injectStyles() {
        if (!document.getElementById('narrow-elo-enhancer-styles')) {
            const style = document.createElement('style');
            style.id = 'narrow-elo-enhancer-styles';
            style.textContent = `
                .profile-stat.custom-elo-stat {
                    display: grid !important;
                    grid-template-columns: 48px 1fr auto !important;
                    align-items: center !important;
                    padding: 2px 10px !important;
                }
                .profile-stat.custom-elo-stat .profile-stat-icon {
                    width: 38px !important;
                    height: 38px !important;
                    margin: 0 !important;
                    filter: drop-shadow(1px 2px 2px rgba(0,0,0,0.3));
                }
                .profile-stat.custom-elo-stat .stat-label {
                    font-size: 15px !important;
                    text-align: left !important;
                    padding-left: 8px !important;
                    font-weight: 500 !important;
                }
                .profile-stat.custom-elo-stat .stat-value {
                    font-size: 16px !important;
                    text-align: right !important;
                    font-weight: bold !important;
                    color: #FFD700 !important; /* Gold highlight for ELO */
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Custom Badge for ELO
    function createEloBadge() {
        const svgPathData = "M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6L13.8,10.2L18.4,10.5L14.9,13.5L16,18L12,15.5L8,18L9.1,13.5L5.6,10.5L10.2,10.2L12,6Z";
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
            <path d="${svgPathData}" fill="#FFB300" stroke="#1a1a1a" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>`;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    // Retrieve IndexedDB Profile State
    function getProfileState() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME);
            request.onerror = () => reject("Failed to open IndexedDB");
            request.onsuccess = () => {
                const db = request.result;
                try {
                    const transaction = db.transaction(STORE_NAME, 'readonly');
                    const store = transaction.objectStore(STORE_NAME);
                    const getRequest = store.get(KEY_NAME);

                    getRequest.onsuccess = () => { resolve(getRequest.result); db.close(); };
                    getRequest.onerror = () => { reject("Failed to get data"); db.close(); };
                } catch (e) {
                    db.close();
                    resolve(null);
                }
            };
        });
    }

    // Render ELO to UI
    function renderEloStat(eloValue) {
        const profileStatsContainer = document.querySelector('.profile-stats');
        if (!profileStatsContainer) return false;

        let wrapper = profileStatsContainer.querySelector('.elo-stat-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'wrinkledPaper profile-stat custom-elo-stat elo-stat-wrapper';
            wrapper.style.setProperty('--wrinkled-paper-seed', Math.floor(Math.random() * 99999));

            const icon = document.createElement('div');
            icon.className = 'profile-stat-icon';
            icon.style.background = `url("${createEloBadge()}") no-repeat center center`;
            icon.style.backgroundSize = 'contain';
            wrapper.appendChild(icon);

            const label = document.createElement('div');
            label.className = 'stat-label';
            label.textContent = 'Account ELO';
            wrapper.appendChild(label);

            const value = document.createElement('div');
            value.className = 'stat-value';
            wrapper.appendChild(value);

            profileStatsContainer.insertBefore(wrapper, profileStatsContainer.firstChild);
        }

        const valueElement = wrapper.querySelector('.stat-value');
        if (valueElement) {
            // Format ELO
            valueElement.textContent = Number(eloValue).toFixed(1);
        }

        return true;
    }

    // Poll and update loop
    async function updateEloUI() {
        injectStyles();
        try {
            const profileData = await getProfileState();
            const profile = profileData ? (profileData.value || profileData) : null;

            if (profile && profile.stats && typeof profile.stats.elo !== 'undefined') {
                renderEloStat(profile.stats.elo);
            }
        } catch (err) {
            console.error("ELO Mod Error:", err);
        }
    }

    // Run interval to ensure continuous checking as the user opens/closes profile menus
    setInterval(updateEloUI, 1000);
})();
