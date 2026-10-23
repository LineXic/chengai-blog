/* 金秋主题：飘落与点击散叶 */
(function () {
    'use strict';

    if (window.__autumnLeavesReady) return;
    window.__autumnLeavesReady = true;

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'autumn-leaves-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    if (!ctx) {
        canvas.parentNode.removeChild(canvas);
        return;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0;
    var H = 0;
    var leaves = [];
    var MAX_LEAVES = 120;
    var rafId = null;
    var lastTime = 0;
    var COLORS = ['#d9a441', '#c9812f', '#b5651d', '#e0b45c', '#a75a2a', '#caa05a'];

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createLeaf(x, y, opts) {
        opts = opts || {};
        return {
            x: x,
            y: y,
            vx: opts.vx !== undefined ? opts.vx : rand(-0.25, 0.25),
            vy: opts.vy !== undefined ? opts.vy : rand(0.25, 0.7),
            size: opts.size || rand(5, 10),
            rot: rand(0, Math.PI * 2),
            vr: rand(-0.02, 0.02),
            sway: rand(0, Math.PI * 2),
            swaySpeed: rand(0.012, 0.03),
            swayAmp: opts.swayAmp !== undefined ? opts.swayAmp : rand(0.25, 0.8),
            gravity: opts.gravity !== undefined ? opts.gravity : 0.01,
            alpha: 1,
            fade: opts.fade !== undefined ? opts.fade : rand(0.002, 0.006),
            color: COLORS[(Math.random() * COLORS.length) | 0],
            shape: Math.random() < 0.5 ? 'ginkgo' : 'leaf',
            burst: !!opts.burst
        };
    }

    function resetAmbient(l, initial) {
        l.x = rand(-20, W + 20);
        l.y = initial ? rand(-H * 0.2, H) : -rand(20, 120);
        l.vx = rand(-0.25, 0.25);
        l.vy = rand(0.25, 0.65);
        l.size = rand(4.5, 9.5);
        l.rot = rand(0, Math.PI * 2);
        l.vr = rand(-0.015, 0.015);
        l.sway = rand(0, Math.PI * 2);
        l.swaySpeed = rand(0.012, 0.03);
        l.swayAmp = rand(0.25, 0.8);
        l.alpha = rand(0.55, 0.9);
        l.burst = false;
    }

    function populate() {
        var target = W < 768 ? 7 : 14;
        while (leaves.length < target) {
            var l = createLeaf(0, 0, {});
            resetAmbient(l, true);
            leaves.push(l);
        }
    }

    function spawnBurst(x, y) {
        var count = (W < 768 ? 8 : 11) + ((Math.random() * 3) | 0);
        for (var i = 0; i < count && leaves.length < MAX_LEAVES; i++) {
            var angle = rand(0, Math.PI * 2);
            var speed = rand(1.6, 5);
            leaves.push(createLeaf(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.4,
                size: rand(5, 11),
                gravity: rand(0.045, 0.08),
                fade: rand(0.008, 0.016),
                swayAmp: rand(0.1, 0.35),
                burst: true
            }));
        }
        ensureLoop();
    }

    function update(dt) {
        for (var i = leaves.length - 1; i >= 0; i--) {
            var l = leaves[i];
            l.sway += l.swaySpeed * dt;
            l.rot += l.vr * dt;
            l.x += (l.vx + Math.sin(l.sway) * l.swayAmp * 0.35) * dt;
            l.y += l.vy * dt;

            if (l.burst) {
                l.vy += l.gravity * dt;
                l.vx *= Math.pow(0.985, dt);
                l.alpha -= l.fade * dt;
                if (l.alpha <= 0 || l.y > H + 60) {
                    leaves.splice(i, 1);
                }
            } else if (l.y > H + 40 || l.x < -60 || l.x > W + 60) {
                resetAmbient(l, false);
            }
        }
    }

    function drawSimpleLeaf(s) {
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.85, -s * 0.55, s * 0.72, s * 0.45, 0, s);
        ctx.bezierCurveTo(-s * 0.72, s * 0.45, -s * 0.85, -s * 0.55, 0, -s);
        ctx.fill();

        ctx.strokeStyle = 'rgba(122, 74, 28, .35)';
        ctx.lineWidth = Math.max(0.8, s * 0.09);
        ctx.beginPath();
        ctx.moveTo(0, s * 0.9);
        ctx.lineTo(0, s * 1.4);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 246, 222, .5)';
        ctx.lineWidth = Math.max(0.6, s * 0.06);
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.55);
        ctx.lineTo(0, s * 0.75);
        ctx.stroke();
    }

    function drawGinkgoLeaf(s) {
        ctx.beginPath();
        ctx.moveTo(0, s * 0.8);
        ctx.quadraticCurveTo(-s * 0.95, s * 0.1, -s * 0.55, -s * 0.65);
        ctx.quadraticCurveTo(-s * 0.25, -s * 0.95, 0, -s * 0.72);
        ctx.quadraticCurveTo(s * 0.25, -s * 0.95, s * 0.55, -s * 0.65);
        ctx.quadraticCurveTo(s * 0.95, s * 0.1, 0, s * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(122, 74, 28, .2)';
        ctx.lineWidth = Math.max(0.6, s * 0.06);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 246, 222, .4)';
        ctx.lineWidth = Math.max(0.5, s * 0.05);
        ctx.beginPath();
        ctx.moveTo(0, s * 0.75);
        ctx.lineTo(-s * 0.45, -s * 0.55);
        ctx.moveTo(0, s * 0.75);
        ctx.lineTo(-s * 0.2, -s * 0.72);
        ctx.moveTo(0, s * 0.75);
        ctx.lineTo(s * 0.2, -s * 0.72);
        ctx.moveTo(0, s * 0.75);
        ctx.lineTo(s * 0.45, -s * 0.55);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(122, 74, 28, .35)';
        ctx.lineWidth = Math.max(0.8, s * 0.09);
        ctx.beginPath();
        ctx.moveTo(0, s * 0.78);
        ctx.lineTo(0, s * 1.28);
        ctx.stroke();
    }

    function drawLeaf(l) {
        var s = l.size;
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, l.alpha));
        ctx.fillStyle = l.color;

        if (l.shape === 'ginkgo') {
            drawGinkgoLeaf(s);
        } else {
            drawSimpleLeaf(s);
        }

        ctx.restore();
    }

    function frame(now) {
        var dt = lastTime ? Math.min((now - lastTime) / 16.667, 2.5) : 1;
        lastTime = now;

        ctx.clearRect(0, 0, W, H);
        update(dt);

        for (var i = 0; i < leaves.length; i++) {
            drawLeaf(leaves[i]);
        }

        rafId = window.requestAnimationFrame(frame);
    }

    function ensureLoop() {
        if (rafId === null) {
            lastTime = 0;
            rafId = window.requestAnimationFrame(frame);
        }
    }

    window.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        spawnBurst(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('resize', function () {
        resize();
        populate();
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
        } else {
            ensureLoop();
        }
    });

    resize();
    populate();
    ensureLoop();
})();
