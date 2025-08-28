// ==UserScript==
// @name         3D DVD Covers
// @namespace    https://github.com/scruffynerf/rotatingdvdcovers
// @version      1.0
// @description  3D rotating DVD covers for Stash groups/movies
// @match        *://localhost:9999/groups*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --------------------------
    // CONFIG
    const AUTO_SPIN = true; // true = spin automatically; false = spin only on hover
    const MIN_FONT_SIZE = 6; // smallest font size for spine titles
    // --------------------------

    const style = document.createElement("style");
    style.textContent = `
.dvd-wrapper {
  display: inline-block;
  position: relative; /* reference for absolute children */
}

.dvd-container {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  perspective: 1000px;
  perspective-origin: 50% 50%;
  filter: drop-shadow(10px 10px 7px rgba(0,0,0,.3));
}

.dvd {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-style: preserve-3d;
  transform-origin: center center;
  ${AUTO_SPIN ? 'animation: rotation-3d 8s infinite linear;' : ''}
}

${AUTO_SPIN ? `
.dvd-container:hover .dvd {
  animation-play-state: paused;
}
` : `
.dvd-container:hover .dvd {
  animation: rotation-3d 8s infinite linear;
}
`}

@keyframes rotation-3d {
    from { transform: translate(-50%, -50%) rotateY(0deg); }
    to   { transform: translate(-50%, -50%) rotateY(360deg); }
}

.dvd div {
  position: absolute;
  backface-visibility: hidden;
  background-size: cover;
  background-position: center;
}

.dvd div.front::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

.dvd div.left {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to right, #111 0%, #333 100%);
}

.dvd div.left span {
  white-space: nowrap;
  color: white;
  font-family: sans-serif;
  text-align: center;
  display: inline-block;
}
`;
    document.head.appendChild(style);

    function createDVD(img) {
        const src = img.src;
        if (!src) return;

        const backSrc = src.replace("frontimage", "backimage");
        const title = img.alt || "";

        const width = img.width || 243;
        const height = img.height || 345;
        const spine = Math.max(12, Math.round(width * 0.1));

        const halfSpine = spine / 2;

        // Wrapper matching original image size
        const wrapper = document.createElement("div");
        wrapper.className = "dvd-wrapper";
        wrapper.style.width = width + "px";
        wrapper.style.height = height + "px";

        // Container for 3D perspective
        const container = document.createElement("div");
        container.className = "dvd-container";

        // DVD cube
        const dvd = document.createElement("div");
        dvd.className = "dvd";
        dvd.style.width = width + "px";
        dvd.style.height = height + "px";
        dvd.style.transform = "translate(-50%, -50%)" + (AUTO_SPIN ? " rotateY(0deg)" : "");

        // Front face
        const front = document.createElement("div");
        front.className = "front";
        front.style.width = width + "px";
        front.style.height = height + "px";
        front.style.backgroundImage = `url('${src}')`;
        front.style.transform = `rotateY(0deg) translateZ(${halfSpine}px)`;
        front.style.borderTop = "2px solid #000";
        front.style.borderRight = "2px solid #000";
        front.style.borderBottom = "2px solid #000";

        // Back face
        const back = document.createElement("div");
        back.className = "back";
        back.style.width = width + "px";
        back.style.height = height + "px";
        back.style.backgroundImage = `url('${backSrc}')`;
        back.style.transform = `rotateY(180deg) translateZ(${halfSpine}px)`;
        back.style.borderTop = "2px solid #000";
        back.style.borderLeft = "2px solid #000";
        back.style.borderBottom = "2px solid #000";

        // Left spine with title
        const left = document.createElement("div");
        left.className = "left";
        left.style.width = spine + "px";
        left.style.height = height + "px";
        left.style.transform = `rotateY(-90deg) translateZ(${halfSpine}px)`;
        left.style.borderTop = "2px solid #000";
        left.style.borderBottom = "2px solid #000";

        const leftTitle = document.createElement("span");
        leftTitle.textContent = title;

        // Initial font size based on height proportion
        let fontSize = Math.round(height * 0.05);
        fontSize = Math.min(fontSize, spine); // also limit by spine width
        leftTitle.style.fontSize = fontSize + "px";
        leftTitle.style.transform = "rotate(90deg)";
        leftTitle.style.whiteSpace = "nowrap";

        left.appendChild(leftTitle);

        // Shrink font dynamically if it overflows spine width
        const MIN_FONT_SIZE = 6;
        while (leftTitle.scrollWidth > spine && parseInt(leftTitle.style.fontSize) > MIN_FONT_SIZE) {
            let currentSize = parseInt(leftTitle.style.fontSize);
            leftTitle.style.fontSize = (currentSize - 1) + "px";
        }

        // Right face
        const right = document.createElement("div");
        right.className = "right";
        right.style.width = spine + "px";
        right.style.height = height + "px";
        right.style.transform = `rotateY(90deg) translateZ(${width - halfSpine}px)`;
        right.style.backgroundColor = "#000";

        // Top face
        const top = document.createElement("div");
        top.className = "top";
        top.style.width = width + "px";
        top.style.height = spine + "px";
        top.style.transform = `rotateX(90deg) translateZ(${halfSpine}px)`;
        top.style.backgroundColor = "#222";

        // Bottom face
        const bottom = document.createElement("div");
        bottom.className = "bottom";
        bottom.style.width = width + "px";
        bottom.style.height = spine + "px";
        bottom.style.transform = `rotateX(-90deg) translateZ(${height - halfSpine}px)`;
        bottom.style.backgroundColor = "#222";

        // Assemble cube
        dvd.appendChild(front);
        dvd.appendChild(back);
        dvd.appendChild(left);
        dvd.appendChild(right);
        dvd.appendChild(top);
        dvd.appendChild(bottom);
        container.appendChild(dvd);
        wrapper.appendChild(container);

        img.replaceWith(wrapper);
    }

    function process() {
        document.querySelectorAll("img.group-card-image").forEach(img => {
            if (!img.dataset.dvdified) {
                img.dataset.dvdified = "true";
                createDVD(img);
            }
        });
    }

    process();
    new MutationObserver(process).observe(document.body, { childList: true, subtree: true });
})();
