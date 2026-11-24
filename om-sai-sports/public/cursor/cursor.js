(() => {
    "use strict";

    const root = document.getElementById("cursor");
    const shirt = document.getElementById("cursor-shirt");
    const float = document.getElementById("cursor-float");
    const dot = document.getElementById("cursor-dot");
    const label = document.getElementById("cursor-label");
    const image = document.getElementById("cursor-image");
    const leftSleeve = document.getElementById("cursor-sleeve-left");
    const rightSleeve = document.getElementById("cursor-sleeve-right");
    const threadCanvas = document.getElementById("cursor-thread");
    const threadCtx = threadCanvas ? threadCanvas.getContext("2d") : null;
    const crest = document.getElementById("cursor-crest");
    const burst = document.getElementById("cursor-burst");

    if (
        !root ||
        !shirt ||
        !float ||
        !dot ||
        !label ||
        !image ||
        !leftSleeve ||
        !rightSleeve
    ) {
        return;
    }

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const supportsDifference =
        typeof CSS !== "undefined" &&
        typeof CSS.supports === "function" &&
        CSS.supports("mix-blend-mode", "difference");

    const CONFIG = {
        gap: 22,
        hoverGap: 16,
        edge: 18,
        stiffness: 120,
        damping: 18,
        tiltFactor: 0.006,
        maxTilt: 14,
        bankFactor: 0.004,
        maxBank: 8,
        sleeveFactorX: 0.006,
        sleeveFactorY: 0.003,
        maxSleeveTilt: 8,
        sleeveStretch: 0.005,
        hoverScale: 1.045,
        pressScale: 0.94,
        dotScale: 2.2,
        maxDt: 1 / 30,
        minDt: 1 / 240,
        snapDistance: 320,
        spawnX: 34,
        spawnY: 26,
        threadFade: 680,
        threadFadeIn: 140,
        threadHistory: 1200,
        threadLengthRatio: 1.85,
        threadMinLength: 60,
        threadWidthRatio: 0.044,
        threadMinWidth: 1.6,
        threadMaxWidth: 4.2,
        threadStepRatio: 0.03,
        threadMaxPoints: 56,
        burstMs: 620,
    };

    const state = {
        ready: false,
        active: false,
        pointerInside: false,
        moved: false,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        tilt: 0,
        bank: 0,
        leftAngle: 0,
        rightAngle: 0,
        scale: 1,
        dotScale: 1,
        hovered: false,
        labelText: "",
        pressed: false,
        overText: false,
        shirtW: 0,
        shirtH: 0,
        lastTime: 0,
        raf: 0,
        running: false,
        lastHoverTarget: null,
        trail: [],
        threadPresence: 0,
        threadIdle: 0,
        suppressed: false,
        burstTimer: 0,
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const damp = (current, target, lambda, dt) =>
        target + (current - target) * Math.exp(-lambda * dt);
    const easeInOutCubic = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const canUse = () =>
        finePointer.matches && !reducedMotion.matches && !state.suppressed;

    function sizeThreadCanvas() {
        if (!threadCanvas || !threadCtx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.round(window.innerWidth * dpr);
        const height = Math.round(window.innerHeight * dpr);

        if (threadCanvas.width !== width || threadCanvas.height !== height) {
            threadCanvas.width = width;
            threadCanvas.height = height;
        }

        threadCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function clearThread() {
        state.trail.length = 0;
        state.threadPresence = 0;
        state.threadIdle = 0;

        if (threadCtx) {
            threadCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }

    function paintThread(anchorX, anchorY, now, dt) {
        if (!threadCtx) return;

        if (state.overText) {
            clearThread();
            return;
        }

        state.trail = state.trail.filter(
            (point) => now - point.t < CONFIG.threadHistory,
        );

        const minStep = Math.max(1.2, state.shirtW * CONFIG.threadStepRatio);
        const minSpeed = Math.max(24, state.shirtW * 0.5);
        const shirtSpeed = Math.hypot(state.vx, state.vy);
        const moving = shirtSpeed > minSpeed;
        const last = state.trail[state.trail.length - 1];

        if (moving) {
            state.threadIdle = 0;
            state.threadPresence = Math.min(
                1,
                state.threadPresence + dt / (CONFIG.threadFadeIn / 1000),
            );

            if (
                !last ||
                Math.hypot(anchorX - last.x, anchorY - last.y) >= minStep
            ) {
                state.trail.push({ x: anchorX, y: anchorY, t: now });

                if (state.trail.length > CONFIG.threadMaxPoints) {
                    state.trail.shift();
                }
            }
        } else {
            state.threadIdle += dt;

            const fade = clamp(
                state.threadIdle / (CONFIG.threadFade / 1000),
                0,
                1,
            );

            state.threadPresence = 1 - easeInOutCubic(fade);

            // Once fully faded, drop the old path so the next movement starts clean.
            if (fade >= 1) {
                state.trail.length = 0;
            }
        }

        if (state.trail.length < 2) {
            threadCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            return;
        }

        // Add the live anchor so the thread stays attached while it fades.
        const points = state.trail.slice();
        const storedHead = points[points.length - 1];

        if (Math.hypot(anchorX - storedHead.x, anchorY - storedHead.y) > 0.5) {
            points.push({ x: anchorX, y: anchorY, t: now });
        }

        // Keep only the newest stretch of trail.
        const maxLength = Math.max(
            CONFIG.threadMinLength,
            state.shirtW * CONFIG.threadLengthRatio,
        );
        let total = 0;
        let start = 0;

        for (let i = points.length - 1; i > 0; i -= 1) {
            total += Math.hypot(
                points[i].x - points[i - 1].x,
                points[i].y - points[i - 1].y,
            );

            if (total > maxLength) {
                start = i;
                break;
            }
        }

        const visible = points.slice(start);

        threadCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        if (visible.length < 2 || state.threadPresence <= 0.002) return;

        let pathLength = 0;
        for (let i = visible.length - 1; i > 0; i -= 1) {
            pathLength += Math.hypot(
                visible[i].x - visible[i - 1].x,
                visible[i].y - visible[i - 1].y,
            );
        }

        // Let gravity bow the thread so it reads as loose cotton, not a laser.
        const sagAmount = Math.min(7, pathLength * 0.18);
        const pointsOut = visible.map((point, index) => {
            const u = index / (visible.length - 1);
            return {
                x: point.x,
                y: point.y + sagAmount * Math.sin(Math.PI * u),
            };
        });

        const headWidth = clamp(
            state.shirtW * CONFIG.threadWidthRatio,
            CONFIG.threadMinWidth,
            CONFIG.threadMaxWidth,
        );
        const count = pointsOut.length;
        const left = [];
        const right = [];

        for (let i = 0; i < count; i += 1) {
            const prev = pointsOut[Math.max(0, i - 1)];
            const next = pointsOut[Math.min(count - 1, i + 1)];

            let tx = next.x - prev.x;
            let ty = next.y - prev.y;
            const length = Math.hypot(tx, ty) || 1;
            tx /= length;
            ty /= length;

            const u = count === 1 ? 1 : i / (count - 1);
            const half = (headWidth * Math.pow(u, 0.85)) / 2;

            left.push({
                x: pointsOut[i].x - ty * half,
                y: pointsOut[i].y + tx * half,
            });
            right.push({
                x: pointsOut[i].x + ty * half,
                y: pointsOut[i].y - tx * half,
            });
        }

        threadCtx.fillStyle = supportsDifference ? "#ffffff" : "#161616";

        // A bundle of loose hem threads: five companions plus the main strand.
        const strands = [
            { width: 0.42, alpha: 0.42, spread: -4.6, sag: 2.2, trim: 1 },
            { width: 0.34, alpha: 0.36, spread: -2.7, sag: 3.6, trim: 3 },
            { width: 0.3, alpha: 0.32, spread: -0.7, sag: 1.2, trim: 0 },
            { width: 0.4, alpha: 0.4, spread: 1.5, sag: 3, trim: 2 },
            { width: 0.32, alpha: 0.34, spread: 3.6, sag: 1.8, trim: 0 },
        ];

        for (const strand of strands) {
            const sLeft = [];
            const sRight = [];
            const first = Math.min(strand.trim, count - 2);

            for (let i = first; i < count; i += 1) {
                const prev = pointsOut[Math.max(0, i - 1)];
                const next = pointsOut[Math.min(count - 1, i + 1)];

                let tx = next.x - prev.x;
                let ty = next.y - prev.y;
                const length = Math.hypot(tx, ty) || 1;
                tx /= length;
                ty /= length;

                const u = i / (count - 1);
                const su = (i - first) / (count - 1 - first);
                const drift = strand.spread * Math.pow(1 - u, 0.7);
                const cx = pointsOut[i].x - ty * drift;
                const cy = pointsOut[i].y + tx * drift + strand.sag * (1 - u);
                const half = (headWidth * strand.width * Math.pow(su, 0.9)) / 2;

                sLeft.push({ x: cx - ty * half, y: cy + tx * half });
                sRight.push({ x: cx + ty * half, y: cy - tx * half });
            }

            threadCtx.globalAlpha = strand.alpha * state.threadPresence;
            threadCtx.beginPath();
            threadCtx.moveTo(sLeft[0].x, sLeft[0].y);

            for (let i = 1; i < sLeft.length; i += 1) {
                threadCtx.lineTo(sLeft[i].x, sLeft[i].y);
            }

            for (let i = sRight.length - 1; i >= 0; i -= 1) {
                threadCtx.lineTo(sRight[i].x, sRight[i].y);
            }

            threadCtx.closePath();
            threadCtx.fill();
        }

        threadCtx.globalAlpha = 0.9 * state.threadPresence;

        threadCtx.beginPath();
        threadCtx.moveTo(left[0].x, left[0].y);

        for (let i = 1; i < count; i += 1) {
            threadCtx.lineTo(left[i].x, left[i].y);
        }

        for (let i = count - 1; i >= 0; i -= 1) {
            threadCtx.lineTo(right[i].x, right[i].y);
        }

        threadCtx.closePath();
        threadCtx.fill();

        // Rounded head, hidden under the hem.
        threadCtx.beginPath();
        threadCtx.arc(
            pointsOut[count - 1].x,
            pointsOut[count - 1].y,
            headWidth / 2,
            0,
            Math.PI * 2,
        );
        threadCtx.fill();

        // A few short frayed fibres at the tail.
        const tail = pointsOut[0];
        const nextPoint = pointsOut[1];

        let dx = tail.x - nextPoint.x;
        let dy = tail.y - nextPoint.y;
        const tailLength = Math.hypot(dx, dy);

        if (tailLength > 0.01) {
            dx /= tailLength;
            dy /= tailLength;

            const fibreLength = Math.min(8, state.shirtW * 0.13);
            threadCtx.globalAlpha = 0.45 * state.threadPresence;
            threadCtx.lineWidth = Math.max(0.45, headWidth * 0.24);
            threadCtx.lineCap = "round";

            for (const spread of [-0.34, -0.05, 0.26]) {
                const cos = Math.cos(spread);
                const sin = Math.sin(spread);

                threadCtx.beginPath();
                threadCtx.moveTo(tail.x, tail.y);
                threadCtx.lineTo(
                    tail.x + (dx * cos - dy * sin) * fibreLength,
                    tail.y + (dx * sin + dy * cos) * fibreLength,
                );
                threadCtx.strokeStyle = threadCtx.fillStyle;
                threadCtx.stroke();
            }
        }

        threadCtx.globalAlpha = 1;
    }

    function setSuppressed(suppressed) {
        state.suppressed = suppressed;
        document.documentElement.classList.toggle("cursor-suppressed", suppressed);

        if (suppressed) {
            deactivate();
        }
    }

    function syncDialogState() {
        const dialogOpen =
            Boolean(document.querySelector("dialog[open]")) ||
            document.documentElement.classList.contains("menu-open");

        if (dialogOpen !== state.suppressed) {
            setSuppressed(dialogOpen);
        }
    }

    function triggerBurst(x, y) {
        if (!burst) return;

        burst.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        burst.classList.remove("is-active");

        // Restart the CSS animation even on rapid clicks.
        void burst.offsetWidth;
        burst.classList.add("is-active");

        window.clearTimeout(state.burstTimer);
        state.burstTimer = window.setTimeout(() => {
            burst.classList.remove("is-active");
        }, CONFIG.burstMs);
    }

    function measure() {
        const rect = shirt.getBoundingClientRect();
        const cssWidth = Number.parseFloat(getComputedStyle(shirt).width);

        state.shirtW = rect.width || cssWidth || 120;
        state.shirtH = rect.height || state.shirtW * (375 / 400);

        sizeThreadCanvas();
    }

    function getAnchor() {
        const gap = state.hovered ? CONFIG.hoverGap : CONFIG.gap;
        const edge = CONFIG.edge;

        const x = clamp(
            state.targetX + gap,
            edge,
            Math.max(edge, window.innerWidth - edge - state.shirtW),
        );
        const y = clamp(
            state.targetY + gap,
            edge,
            Math.max(edge, window.innerHeight - edge - state.shirtH),
        );

        return { x, y };
    }

    function paintInitial() {
        shirt.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
        float.style.transform =
            "translate3d(0px, 0px, 0) rotate(0deg) rotateY(0deg) scale(1)";
        leftSleeve.style.transform = "rotate(0deg) scale(1)";
        rightSleeve.style.transform = "rotate(0deg) scale(1)";
        dot.style.transform =
            `translate3d(${state.targetX}px, ${state.targetY}px, 0) ` +
            `translate(-50%, -50%) scale(${state.dotScale})`;
    }

    function render(dt) {
        const now = performance.now();
        const time = now * 0.001;
        const calm = state.hovered ? 0.35 : 1;

        const wantedTilt = state.hovered
            ? 0
            : clamp(state.vx * CONFIG.tiltFactor, -CONFIG.maxTilt, CONFIG.maxTilt);
        const wantedBank = state.hovered
            ? 0
            : clamp(state.vx * CONFIG.bankFactor, -CONFIG.maxBank, CONFIG.maxBank);

        state.tilt = damp(state.tilt, wantedTilt, state.hovered ? 14 : 8, dt);
        state.bank = damp(state.bank, wantedBank, 8, dt);

        const wantedLeft = state.hovered
            ? 0
            : clamp(
                state.vx * CONFIG.sleeveFactorX + state.vy * CONFIG.sleeveFactorY,
                -CONFIG.maxSleeveTilt,
                CONFIG.maxSleeveTilt,
            );
        const wantedRight = state.hovered
            ? 0
            : clamp(
                state.vx * CONFIG.sleeveFactorX - state.vy * CONFIG.sleeveFactorY,
                -CONFIG.maxSleeveTilt,
                CONFIG.maxSleeveTilt,
            );
        const sleeveEase = state.hovered ? 14 : 7;

        state.leftAngle = damp(state.leftAngle, wantedLeft, sleeveEase, dt);
        state.rightAngle = damp(state.rightAngle, wantedRight, sleeveEase, dt);

        const wantedScale = state.pressed
            ? CONFIG.pressScale
            : state.hovered
                ? CONFIG.hoverScale
                : 1;
        state.scale = damp(state.scale, wantedScale, 14, dt);

        const wantedDot = state.hovered ? CONFIG.dotScale : 1;
        state.dotScale = damp(state.dotScale, wantedDot, 16, dt);

        const bobX = Math.cos(time * 0.9) * 2.2 * calm;
        const bobY = Math.sin(time * 1.25) * 3.4 * calm;
        const idleTilt = Math.sin(time * 0.8) * 1.1 * calm;
        const idleBank = Math.sin(time * 1.05) * 2.6 * calm;
        const idleSleeve = Math.sin(time * 1.05) * 0.7 * calm;
        const leftAngle = state.leftAngle + idleSleeve;
        const rightAngle = state.rightAngle - idleSleeve;

        shirt.style.transform =
            `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0)`;

        float.style.transform =
            `translate3d(${bobX.toFixed(2)}px, ${bobY.toFixed(2)}px, 0) ` +
            `rotate(${(state.tilt + idleTilt).toFixed(2)}deg) ` +
            `rotateY(${(state.bank + idleBank).toFixed(2)}deg) ` +
            `scale(${state.scale.toFixed(3)})`;

        leftSleeve.style.transform =
            `rotate(${leftAngle.toFixed(2)}deg) ` +
            `scale(${(1 + Math.abs(state.leftAngle) * CONFIG.sleeveStretch).toFixed(3)})`;

        rightSleeve.style.transform =
            `rotate(${rightAngle.toFixed(2)}deg) ` +
            `scale(${(1 + Math.abs(state.rightAngle) * CONFIG.sleeveStretch).toFixed(3)})`;

        dot.style.transform =
            `translate3d(${state.targetX}px, ${state.targetY}px, 0) ` +
            `translate(-50%, -50%) scale(${state.dotScale.toFixed(3)})`;

        if (state.labelText) {
            const flipX = state.targetX + 106 > window.innerWidth;
            const flipY = state.targetY + 46 > window.innerHeight;
            const labelX = flipX ? state.targetX - 16 : state.targetX + 16;
            const labelY = flipY ? state.targetY - 16 : state.targetY + 16;

            label.style.transform =
                `translate3d(${labelX}px, ${labelY}px, 0) ` +
                `translate(${flipX ? "-100%" : "0"}, ${flipY ? "-100%" : "0"})`;
        }

        // The threads leave the centre of the hem, so follow the same tilt and
        // bob that the float uses above.
        const originX = state.shirtW * 0.52;
        const originY = state.shirtH * 0.46;
        const hemLocalX = (state.shirtW * 0.5 - originX) * state.scale;
        const hemLocalY = (state.shirtH * 0.88 - originY) * state.scale;
        const threadRotation = ((state.tilt + idleTilt) * Math.PI) / 180;
        const threadBank = ((state.bank + idleBank) * Math.PI) / 180;
        const hemX = hemLocalX * Math.cos(threadBank);
        const anchorX =
            state.x +
            bobX +
            originX +
            hemX * Math.cos(threadRotation) -
            hemLocalY * Math.sin(threadRotation);
        const anchorY =
            state.y +
            bobY +
            originY +
            hemX * Math.sin(threadRotation) +
            hemLocalY * Math.cos(threadRotation);

        paintThread(anchorX, anchorY, now, dt);
    }

    function tick(now) {
        if (!state.running) return;

        const dt = clamp(
            (now - state.lastTime) / 1000,
            CONFIG.minDt,
            CONFIG.maxDt,
        );
        state.lastTime = now;

        const anchor = getAnchor();
        const ax = (anchor.x - state.x) * CONFIG.stiffness;
        const ay = (anchor.y - state.y) * CONFIG.stiffness;

        state.vx += ax * dt;
        state.vy += ay * dt;

        const decay = Math.exp(-CONFIG.damping * dt);
        state.vx *= decay;
        state.vy *= decay;

        state.x += state.vx * dt;
        state.y += state.vy * dt;

        render(dt);
        state.raf = requestAnimationFrame(tick);
    }

    function startLoop() {
        if (state.running || !state.active) return;

        state.running = true;
        state.lastTime = performance.now();
        state.raf = requestAnimationFrame(tick);
    }

    function stopLoop() {
        state.running = false;

        if (state.raf) {
            cancelAnimationFrame(state.raf);
            state.raf = 0;
        }
    }

    function setHover(hovered, text) {
        if (hovered === state.hovered && text === state.labelText) return;

        state.hovered = hovered;
        state.labelText = text;
        root.classList.toggle("is-hovering", hovered);

        if (text) {
            label.textContent = text;
            label.classList.add("is-visible");
        } else {
            label.textContent = "";
            label.classList.remove("is-visible");
        }
    }

    function updateHover(target) {
        if (!(target instanceof Element)) {
            state.overText = false;
            root.classList.remove("is-text");
            setHover(false, "");
            return;
        }

        const field = target.closest(
            "input, textarea, select, [contenteditable='true']",
        );

        if (field) {
            state.overText = true;
            root.classList.add("is-text");
            setHover(false, "");
            return;
        }

        state.overText = false;
        root.classList.remove("is-text");

        const interactive = target.closest(
            "a, button, [role='button'], [data-cursor]",
        );

        if (!interactive) {
            setHover(false, "");
            return;
        }

        setHover(true, interactive.getAttribute("data-cursor") || "");
    }

    function activate() {
        if (!state.ready || state.active || !canUse()) return;

        measure();

        state.active = true;
        state.pressed = false;
        state.x = state.targetX + CONFIG.gap + CONFIG.spawnX;
        state.y = state.targetY + CONFIG.gap + CONFIG.spawnY;
        state.vx = 0;
        state.vy = 0;
        state.tilt = 0;
        state.bank = 0;
        state.leftAngle = 0;
        state.rightAngle = 0;
        state.scale = 1;
        state.dotScale = state.hovered ? CONFIG.dotScale : 1;

        document.documentElement.classList.add("has-shirt-body");
        root.classList.add("is-visible");
        clearThread();

        if (threadCanvas) {
            threadCanvas.classList.add("is-visible");
        }

        paintInitial();

        const target = document.elementFromPoint(state.targetX, state.targetY);
        if (target) {
            state.lastHoverTarget = target;
            updateHover(target);
        }

        startLoop();
    }

    function deactivate() {
        state.active = false;
        state.pressed = false;
        state.overText = false;
        state.lastHoverTarget = null;

        setHover(false, "");
        document.documentElement.classList.remove("has-shirt-body");
        root.classList.remove("is-visible", "is-text", "is-hovering", "is-pressed");
        clearThread();

        if (threadCanvas) {
            threadCanvas.classList.remove("is-visible");
        }

        label.classList.remove("is-visible");
        label.textContent = "";

        stopLoop();
    }

    function onPointerMove(event) {
        if (state.suppressed) return;
        if (event.pointerType && event.pointerType !== "mouse") return;

        state.targetX = event.clientX;
        state.targetY = event.clientY;
        state.pointerInside = true;
        state.moved = true;

        if (!state.active) {
            if (state.ready) activate();

            if (state.active && event.target !== state.lastHoverTarget) {
                state.lastHoverTarget = event.target;
                updateHover(event.target);
            }

            return;
        }

        if (event.target !== state.lastHoverTarget) {
            state.lastHoverTarget = event.target;
            updateHover(event.target);
        }
    }

    function onPointerDown(event) {
        if (state.suppressed) return;
        if (event.pointerType && event.pointerType !== "mouse") return;
        if (event.button !== 0 || !state.active) return;

        state.pressed = true;
        root.classList.add("is-pressed");
        triggerBurst(event.clientX, event.clientY);
    }

    function onPointerUp() {
        state.pressed = false;
        root.classList.remove("is-pressed");
    }

    function onPointerLeave() {
        state.pointerInside = false;
        deactivate();
    }

    function onWindowBlur() {
        state.pointerInside = false;
        deactivate();
    }

    function onVisibilityChange() {
        if (document.hidden) {
            stopLoop();
        } else if (state.active) {
            clearThread();
            startLoop();
        }
    }

    function onResize() {
        measure();
        clearThread();
    }

    function onModeChange() {
        syncDialogState();

        if (!canUse()) {
            deactivate();
            return;
        }

        if (state.ready && state.moved && state.pointerInside) {
            activate();
        }
    }

    function markReady() {
        if (state.ready) return;

        state.ready = true;
        measure();

        if (state.moved && state.pointerInside && canUse()) {
            activate();
        }
    }

    function markFailed() {
        state.ready = false;
        deactivate();
    }

    const images = [image, leftSleeve, rightSleeve];

    function checkLoaded() {
        if (images.every((img) => img.complete && img.naturalWidth > 0)) {
            markReady();
            return;
        }

        if (images.some((img) => img.complete && img.naturalWidth === 0)) {
            markFailed();
        }
    }

    function initImages() {
        images.forEach((img) => {
            if (img.complete) return;

            img.addEventListener("load", checkLoaded, { once: true });
            img.addEventListener("error", checkLoaded, { once: true });
        });

        checkLoaded();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", measure, { once: true });

    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);

    finePointer.addEventListener("change", onModeChange);
    reducedMotion.addEventListener("change", onModeChange);

    // Native <dialog> menus render in the top layer above any z-index, so the
    // custom cursor steps aside and lets the browser cursor take over.
    document.addEventListener(
        "toggle",
        (event) => {
            if (event.target instanceof HTMLDialogElement) {
                syncDialogState();
            }
        },
        true,
    );

    if (typeof MutationObserver !== "undefined") {
        const dialogObserver = new MutationObserver(syncDialogState);
        dialogObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
    }

    if (crest) {
        crest.querySelector("img")?.addEventListener("error", () => {
            crest.style.display = "none";
        });
    }

    syncDialogState();
    initImages();
})();
