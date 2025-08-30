// ==UserScript==
// @name         3D DVD Covers
// @namespace    https://github.com/scruffynerf/rotatingdvdcovers
// @version      1.4
// @description  3D DVD covers, hover rotation, spine titles, checkboxes clickable, glow when selected
// @match        *://localhost:9999/groups*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ===============================
    // CONFIGURATION
    // ===============================
    const CONFIG = {
        AUTO_SPIN: false,           // true = spins automatically, false = spins on hover
        MAX_FONT_SIZE: 48,          // maximum font size for spine titles
        GLOW_COLOR: 'gold',         // glow color when checkbox is selected
        ROTATION_DURATION: 6,       // rotation speed in seconds (matches CSS animation duration)
        SPINE_RATIO: 0.1,           // fraction of width to use for spine thickness
        MIN_SPINE: 12               // minimum spine width in px
    };

    // ===============================
    // MODULE: Styles
    // ===============================
    function injectStyles() {
        const style = document.createElement("style");
        style.textContent = `
.dvd-wrapper {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
  pointer-events: none;
}

.dvd-container {
  position: relative;
  perspective: 1000px;
}

.dvd {
  transform-style: preserve-3d;
  transform-origin: center center;
  transform: rotateY(0deg);
  pointer-events: none;
  ${CONFIG.AUTO_SPIN ? 'animation: rotation-3d ' + (CONFIG.ROTATION_DURATION) + 's infinite linear;' : ''}
  transition: box-shadow 0.2s ease;
}

.dvd.glow {
  box-shadow: 0 0 20px 5px ${CONFIG.GLOW_COLOR};
}

@keyframes rotation-3d {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(360deg); }
}

.dvd div {
  position: absolute;
  backface-visibility: hidden;
  background-size: cover;
  background-position: center;
}

.dvd-front, .dvd-back { border-style: solid; }
.dvd-left, .dvd-right {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to right, #111 0%, #333 100%);
}
.dvd-left span, .dvd-right span {
  white-space: nowrap;
  color: white;
  font-family: sans-serif;
  text-align: center;
  display: inline-block;
}
.dvd-top, .dvd-bottom { background-color: #222; }
`;
        document.head.appendChild(style);
    }

    // ===============================
    // MODULE: Cube Creation
    // ===============================
    function createCubeElements(img, title, src, backSrc) {
        const dvdWrapper = document.createElement("div");
        dvdWrapper.className = "dvd-wrapper";

        const container = document.createElement("div");
        container.className = "dvd-container";

        const dvd = document.createElement("div");
        dvd.className = "dvd";

        const front = document.createElement("div"); front.className = "dvd-front";
        const back = document.createElement("div"); back.className = "dvd-back";
        const left = document.createElement("div"); left.className = "dvd-left";
        const right = document.createElement("div"); right.className = "dvd-right";
        const top = document.createElement("div"); top.className = "dvd-top";
        const bottom = document.createElement("div"); bottom.className = "dvd-bottom";

        // Add title to left side
        const leftTitle = document.createElement("span");
        leftTitle.textContent = title;
        left.appendChild(leftTitle);

        // Assemble cube
        dvd.append(front, back, left, right, top, bottom);
        container.appendChild(dvd);
        dvdWrapper.appendChild(container);

        return { dvdWrapper, dvd, front, back, left, right, top, bottom, leftTitle };
    }

    // ===============================
    // MODULE: Resizing and Layout
    // ===============================
    function setupResize(img, elements, title, src, backSrc) {
        const { dvd, front, back, left, right, top, bottom, leftTitle } = elements;

        function resizeCube() {
            const width = img.clientWidth;
            const height = img.clientHeight;
            if (width === 0 || height === 0) return;

            const spine = Math.max(CONFIG.MIN_SPINE, Math.round(width * CONFIG.SPINE_RATIO));
            const halfSpine = spine / 2;

            // DVD container size
            dvd.style.width = width + "px";
            dvd.style.height = height + "px";

            // Front/back
            front.style.width = back.style.width = width + "px";
            front.style.height = back.style.height = height + "px";
            front.style.backgroundImage = `url('${src}')`;
            back.style.backgroundImage = `url('${backSrc}')`;
            front.style.transform = `rotateY(0deg) translateZ(${halfSpine}px)`;
            back.style.transform = `rotateY(180deg) translateZ(${halfSpine}px)`;
            front.style.borderTop = front.style.borderRight = front.style.borderBottom = "2px solid #000";
            back.style.borderTop = back.style.borderLeft = back.style.borderBottom = "2px solid #000";

            // Left/right
            left.style.width = right.style.width = spine + "px";
            left.style.height = right.style.height = height + "px";
            left.style.transform = `rotateY(-90deg) translateZ(${halfSpine}px)`;
            right.style.transform = `rotateY(90deg) translateZ(${width - halfSpine}px)`;
            left.style.borderTop = left.style.borderBottom = "2px solid #000";
            right.style.background = "#000";

            // Spine titles
            let fontSize = CONFIG.MAX_FONT_SIZE;
            leftTitle.style.fontSize = fontSize + "px";
            leftTitle.style.whiteSpace = "nowrap";
            leftTitle.style.transform = "none";
            while ((leftTitle.offsetHeight > spine || leftTitle.scrollWidth > height) && fontSize > 1) {
                fontSize--;
                leftTitle.style.fontSize = fontSize + "px";
            }
            leftTitle.style.transform = "rotate(90deg)";

            if (!right.querySelector('span')) {
                const rightTitle = document.createElement("span");
                rightTitle.textContent = title;
                right.appendChild(rightTitle);
            }
            const rightTitle = right.querySelector('span');
            rightTitle.style.fontSize = leftTitle.style.fontSize;
            rightTitle.style.transform = "rotate(90deg)";
            rightTitle.style.whiteSpace = "nowrap";

            // Top/bottom
            top.style.width = bottom.style.width = width + "px";
            top.style.height = bottom.style.height = spine + "px";
            top.style.transform = `rotateX(90deg) translateZ(${halfSpine}px)`;
            bottom.style.transform = `rotateX(-90deg) translateZ(${height - halfSpine}px)`;
        }

        const roImg = new ResizeObserver(resizeCube);
        roImg.observe(img);
        window.addEventListener("resize", resizeCube);
        resizeCube();
    }

    // ===============================
    // MODULE: Rotation Behavior
    // ===============================
    function setupRotation(thumbnail, dvd) {
        if (!CONFIG.AUTO_SPIN) {
            let startTime = 0;
            thumbnail.addEventListener('mouseenter', () => {
                startTime = performance.now();
                dvd.style.animation = 'rotation-3d ' + (CONFIG.ROTATION_DURATION) + 's infinite linear';
            });
            thumbnail.addEventListener('mouseleave', () => {
                const elapsed = performance.now() - startTime;
                const deg = (elapsed / (CONFIG.ROTATION_DURATION * 1000)) * 360;
                dvd.style.animation = '';
                dvd.style.transform = `rotateY(${deg % 360}deg)`;
            });
        } else {
            thumbnail.addEventListener('mouseenter', () => dvd.style.animationPlayState = 'paused');
            thumbnail.addEventListener('mouseleave', () => dvd.style.animationPlayState = 'running');
        }
    }

    // ===============================
    // MODULE: Checkbox Glow
    // ===============================
    function setupGlow(card, checkbox, dvd) {
        function updateGlow() {
            if (checkbox.checked) dvd.classList.add('glow');
            else dvd.classList.remove('glow');
        }

        updateGlow();

        const observer = new MutationObserver(muts => {
            muts.forEach(m => {
                if (m.attributeName === 'checked') updateGlow();
            });
        });
        observer.observe(checkbox, { attributes: true, attributeFilter: ['checked'] });

        card.addEventListener('click', () => setTimeout(updateGlow, 0));
    }

    // ===============================
    // NEW MODULE: Bulk Select Sync
    // - Delegated click listener (capture phase) so dynamically-inserted
    //   dropdown items are caught even when menu is created on demand.
    // - On detecting "Select All" or "Select None", perform a full sync
    //   of all card checkbox states -> dvd glow classes.
    // ===============================
    function syncAllGlows() {
        // iterate all group cards and sync glow to checkbox state
        document.querySelectorAll('.group-card').forEach(card => {
            const checkbox = card.querySelector('.card-check');
            const dvd = card.querySelector('.dvd');
            if (!checkbox || !dvd) return;

            // Be robust: check both the property and attribute
            const isChecked = !!checkbox.checked || checkbox.hasAttribute('checked');
            if (isChecked) dvd.classList.add('glow');
            else dvd.classList.remove('glow');
        });
    }

    function setupBulkSelectSync() {
        // Capture-phase delegated click listener so clicks on newly-created
        // menu items are caught even if they are inserted after init.
        document.addEventListener('click', function (ev) {
            // use closest in case inner element was clicked
            const target = ev.target && ev.target.closest ? ev.target.closest('.dropdown-item') : null;
            if (!target) return;

            const label = (target.textContent || '').trim();
            if (/^select\s+all$/i.test(label) || /^select\s+none$/i.test(label)) {
                // Give the site a short moment to finish whatever it's doing, then sync.
                // If necessary we can increase this delay, but start small to avoid UI lag.
                setTimeout(syncAllGlows, 50);
            }
        }, true); // true => use capture phase
    }

    // ===============================
    // MAIN: Create DVD from Image
    // ===============================
    function createDVD(img) {
        if (!img.src) return;

        const src = img.src;
        const backSrc = src.replace("frontimage", "backimage");
        const title = img.alt || "";

        img.style.opacity = "0";

        const thumbnail = img.closest('.thumbnail-section');
        if (!thumbnail) return;
        thumbnail.style.position = "relative";

        // Build cube
        const elements = createCubeElements(img, title, src, backSrc);
        thumbnail.appendChild(elements.dvdWrapper);

        // Setup behaviors
        setupResize(img, elements, title, src, backSrc);
        setupRotation(thumbnail, elements.dvd);

        const card = img.closest('.group-card');
        if (card) {
            const checkbox = card.querySelector('.card-check');
            if (checkbox) setupGlow(card, checkbox, elements.dvd);
        }
    }

    // ===============================
    // PROCESS NEW IMAGES
    // ===============================
    function process() {
        document.querySelectorAll("img.group-card-image").forEach(img => {
            if (!img.dataset.dvdified) {
                img.dataset.dvdified = "true";
                createDVD(img);
            }
        });
    }

    // ===============================
    // INIT
    // ===============================
    injectStyles();
    process();
    setupBulkSelectSync(); // <<-- only new call added, safe & modular

    new MutationObserver(process).observe(document.body, { childList: true, subtree: true });

})();

