// ==UserScript==
// @name         3D DVD Covers
// @namespace    https://github.com/scruffynerf/rotatingdvdcovers
// @version      1.3
// @description  3D DVD covers, hover rotation, spine titles, checkboxes clickable, glow when selected
// @match        *://localhost:9999/groups*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const AUTO_SPIN = false; // true = spins automatically, false = spins on hover
    const MAX_FONT_SIZE = 96;

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
  pointer-events: none; /* allow clicks to pass through */
}

.dvd-container {
  position: relative;
  perspective: 1000px;
}

.dvd {
  transform-style: preserve-3d;
  transform-origin: center center;
  transform: rotateY(0deg);
  pointer-events: none; /* cube faces don't block clicks */
  ${AUTO_SPIN ? 'animation: rotation-3d 8s infinite linear;' : ''}
  transition: box-shadow 0.2s ease;
}

.dvd.glow {
  box-shadow: 0 0 20px 5px gold;
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

.dvd div.left, .dvd div.right {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to right, #111 0%, #333 100%);
}

.dvd div.left span, .dvd div.right span {
  white-space: nowrap;
  color: white;
  font-family: sans-serif;
  text-align: center;
  display: inline-block;
}
`;
    document.head.appendChild(style);

    function createDVD(img) {
        if (!img.src) return;
        const src = img.src;
        const backSrc = src.replace("frontimage", "backimage");
        const title = img.alt || "";

        img.style.opacity = "0";

        const thumbnail = img.closest('.thumbnail-section');
        if (!thumbnail) return;
        thumbnail.style.position = "relative";

        const dvdWrapper = document.createElement("div");
        dvdWrapper.className = "dvd-wrapper";

        const container = document.createElement("div");
        container.className = "dvd-container";

        const dvd = document.createElement("div");
        dvd.className = "dvd";

        const front = document.createElement("div"); front.className = "front";
        const back = document.createElement("div"); back.className = "back";
        const left = document.createElement("div"); left.className = "left";
        const right = document.createElement("div"); right.className = "right";
        const top = document.createElement("div"); top.className = "top";
        const bottom = document.createElement("div"); bottom.className = "bottom";

        const leftTitle = document.createElement("span");
        leftTitle.textContent = title;
        left.appendChild(leftTitle);

        dvd.append(front, back, left, right, top, bottom);
        container.appendChild(dvd);
        dvdWrapper.appendChild(container);
        thumbnail.appendChild(dvdWrapper);

        function resizeCube() {
            const width = img.clientWidth;
            const height = img.clientHeight;
            if (width === 0 || height === 0) return;

            const spine = Math.max(12, Math.round(width * 0.1));
            const halfSpine = spine / 2;

            dvd.style.width = width + "px";
            dvd.style.height = height + "px";

            front.style.width = back.style.width = width + "px";
            front.style.height = back.style.height = height + "px";
            front.style.backgroundImage = `url('${src}')`;
            back.style.backgroundImage = `url('${backSrc}')`;
            front.style.transform = `rotateY(0deg) translateZ(${halfSpine}px)`;
            back.style.transform = `rotateY(180deg) translateZ(${halfSpine}px)`;
            front.style.borderTop = front.style.borderRight = front.style.borderBottom = "2px solid #000";
            back.style.borderTop = back.style.borderLeft = back.style.borderBottom = "2px solid #000";

            left.style.width = spine + "px";
            left.style.height = height + "px";
            left.style.transform = `rotateY(-90deg) translateZ(${halfSpine}px)`;
            left.style.borderTop = left.style.borderBottom = "2px solid #000";

            let fontSize = MAX_FONT_SIZE;
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

            right.style.width = spine + "px";
            right.style.height = height + "px";
            right.style.transform = `rotateY(90deg) translateZ(${width - halfSpine}px)`;
            right.style.background = "#000";

            top.style.width = width + "px";
            top.style.height = spine + "px";
            top.style.transform = `rotateX(90deg) translateZ(${halfSpine}px)`;
            top.style.backgroundColor = "#222";

            bottom.style.width = width + "px";
            bottom.style.height = spine + "px";
            bottom.style.transform = `rotateX(-90deg) translateZ(${height - halfSpine}px)`;
            bottom.style.backgroundColor = "#222";
        }

        const roImg = new ResizeObserver(resizeCube);
        roImg.observe(img);
        window.addEventListener("resize", resizeCube);
        resizeCube();

        // Hover logic for AUTO_SPIN false
        if (!AUTO_SPIN) {
            let startTime = 0;
            thumbnail.addEventListener('mouseenter', () => {
                startTime = performance.now();
                dvd.style.animation = 'rotation-3d 8s infinite linear';
            });
            thumbnail.addEventListener('mouseleave', () => {
                const elapsed = performance.now() - startTime;
                const deg = (elapsed / 8000) * 360;
                dvd.style.animation = '';
                dvd.style.transform = `rotateY(${deg % 360}deg)`;
            });
        }

        if (AUTO_SPIN) {
            thumbnail.addEventListener('mouseenter', () => {
                dvd.style.animationPlayState = 'paused';
            });
            thumbnail.addEventListener('mouseleave', () => {
                dvd.style.animationPlayState = 'running';
            });
        }

        // ------------------------------
        // Checkbox detection and glow
        // ------------------------------
        const card = img.closest('.group-card');
        if (!card) return;
        const checkbox = card.querySelector('.card-check');
        if (!checkbox) return;

        function updateGlow() {
            if (checkbox.checked) dvd.classList.add('glow');
            else dvd.classList.remove('glow');
        }

        // Initial state
        updateGlow();

        // Direct checkbox changes
        const observer = new MutationObserver(muts => {
            muts.forEach(m => {
                if (m.attributeName === 'checked') updateGlow();
            });
        });
        observer.observe(checkbox, { attributes: true, attributeFilter: ['checked'] });

        // Indirect changes via card clicks
        card.addEventListener('click', () => {
            setTimeout(updateGlow, 0); // ensure checkbox state updated
        });
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
