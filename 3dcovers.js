// ==UserScript==
// @name         3D DVD Covers Centered & Responsive
// @namespace    https://github.com/scruffynerf/rotatingdvdcovers
// @version      1.1
// @description  3D DVD covers with both spine titles, fully responsive, dynamically scaled
// @match        *://localhost:9999/groups*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const AUTO_SPIN = true; // true or false
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
  pointer-events: none;
  z-index: 2;
}

.dvd-container {
  position: relative;
  perspective: 1000px;
  filter: drop-shadow(5px 5px 5px rgba(0,0,0,.3));
  pointer-events: auto;
}

.dvd {
  transform-style: preserve-3d;
  transform-origin: center center;
  transform: rotateY(0deg);
}

${AUTO_SPIN ? `
.dvd {
  animation: rotation-3d 8s infinite linear;
}
.dvd-container:hover .dvd {
  animation-play-state: paused;
}
` : ''}

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

.dvd div.front::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
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
        const src = img.src;
        if (!src) return;
        const backSrc = src.replace("frontimage", "backimage");
        const title = img.alt || "";

        img.style.opacity = "0";
        const parent = img.parentNode;
        parent.style.position = "relative";

        let dvdRightTitle = null;

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
        parent.appendChild(dvdWrapper);

        function resizeCube() {
            const rect = img.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
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

            let targetSize = MAX_FONT_SIZE;
            leftTitle.style.whiteSpace = "nowrap";
            leftTitle.style.transform = "none";
            leftTitle.style.fontSize = targetSize + "px";

            const maxHeight = spine;
            const maxWidth = height;

            while ((leftTitle.offsetHeight > maxHeight || leftTitle.scrollWidth > maxWidth) && targetSize > 1) {
                targetSize -= 1;
                leftTitle.style.fontSize = targetSize + "px";
            }

            leftTitle.style.transform = "rotate(90deg)";

            if (!dvdRightTitle) {
                dvdRightTitle = document.createElement("span");
                dvdRightTitle.textContent = title;
                right.appendChild(dvdRightTitle);
            }
            dvdRightTitle.style.fontSize = leftTitle.style.fontSize;
            dvdRightTitle.style.transform = "rotate(90deg)";
            dvdRightTitle.style.whiteSpace = "nowrap";

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
        const roParent = new ResizeObserver(resizeCube);
        roParent.observe(parent);
        window.addEventListener("resize", resizeCube);
        resizeCube();

        // Hover animation for AUTO_SPIN false with persistent rotation
        if (!AUTO_SPIN) {
            let startTime = 0;

            container.addEventListener('mouseenter', () => {
                startTime = performance.now();
                dvd.style.animation = 'rotation-3d 8s infinite linear';
            });

            container.addEventListener('mouseleave', () => {
                const elapsed = performance.now() - startTime;
                const deg = (elapsed / 8000) * 360;
                dvd.style.animation = '';
                dvd.style.transform = `rotateY(${deg % 360}deg)`;
            });
        }
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
