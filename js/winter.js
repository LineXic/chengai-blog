/* 寒冬主题：飘雪与点击雪雾 */
(function () {
    'use strict';

    if (window.__winterSnowReady) return;
    window.__winterSnowReady = true;

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'winter-snow-canvas';
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
    var flakes = [];
    var MAX_FLAKES = 160;
    var rafId = null;
    var lastTime = 0;
    var sprite = null;
    var COLORS = ['#ffffff', '#eaf4fc', '#d8e9f7', '#c4dcf0'];

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    /* 预渲染雪花光点，避免逐帧创建渐变 */
    function buildSprite() {
        sprite = document.createElement('canvas');
        sprite.width = 32;
        sprite.height = 32;
        var c = sprite.getContext('2d');
        var g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, 'rgba(255, 255, 255, 1)');
        g.addColorStop(0.42, 'rgba(230, 243, 253, 0.9)');
        g.addColorStop(1, 'rgba(186, 215, 238, 0)');
        c.fillStyle = g;
        c.fillRect(0, 0, 32, 32);
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

    function createFlake(x, y, opts) {
        opts = opts || {};
        return {
            x: x,
            y: y,
            vx: opts.vx !== undefined ? opts.vx : rand(-0.3, 0.3),
            vy: opts.vy !== undefined ? opts.vy : rand(0.35, 1.0),
            size: opts.size || rand(1.6, 4.2),
            rot: rand(0, Math.PI * 2),
            vr: rand(-0.012, 0.012),
            sway: rand(0, Math.PI * 2),
            swaySpeed: rand(0.01, 0.024),
            swayAmp: opts.swayAmp !== undefined ? opts.swayAmp : rand(0.2, 0.7),
            gravity: opts.gravity !== undefined ? opts.gravity : 0.004,
            alpha: 1,
            fade: opts.fade !== undefined ? opts.fade : rand(0.002, 0.005),
            color: COLORS[(Math.random() * COLORS.length) | 0],
            shape: Math.random() < 0.24 ? 'flake' : 'dot',
            burst: !!opts.burst
        };
    }

    function resetAmbient(f, initial) {
        f.x = rand(-20, W + 20);
        f.y = initial ? rand(-H * 0.25, H) : -rand(10, 90);
        f.vx = rand(-0.3, 0.3);
        f.vy = rand(0.25, 0.85);
        f.size = rand(1.4, 3.8);
        f.rot = rand(0, Math.PI * 2);
        f.vr = rand(-0.01, 0.01);
        f.sway = rand(0, Math.PI * 2);
        f.swaySpeed = rand(0.01, 0.024);
        f.swayAmp = rand(0.2, 0.7);
        f.alpha = rand(0.45, 0.85);
        f.burst = false;
        f.shape = Math.random() < 0.24 ? 'flake' : 'dot';
    }

    function populate() {
        var target = W < 768 ? 16 : 32;
        while (flakes.length < target) {
            var f = createFlake(0, 0, {});
            resetAmbient(f, true);
            flakes.push(f);
        }
    }

    function spawnBurst(x, y) {
        var count = (W < 768 ? 10 : 14) + ((Math.random() * 4) | 0);
        for (var i = 0; i < count && flakes.length < MAX_FLAKES; i++) {
            var angle = rand(0, Math.PI * 2);
            var speed = rand(1.2, 4.2);
            flakes.push(createFlake(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.9,
                size: rand(2.2, 5.5),
                gravity: rand(0.02, 0.045),
                fade: rand(0.01, 0.02),
                swayAmp: rand(0.1, 0.3),
                burst: true
            }));
        }
        ensureLoop();
    }

    function update(dt) {
        for (var i = flakes.length - 1; i >= 0; i--) {
            var f = flakes[i];
            f.sway += f.swaySpeed * dt;
            f.rot += f.vr * dt;
            f.x += (f.vx + Math.sin(f.sway) * f.swayAmp * 0.3) * dt;
            f.y += f.vy * dt;

            if (f.burst) {
                f.vy += f.gravity * dt;
                f.vx *= Math.pow(0.982, dt);
                f.alpha -= f.fade * dt;
                if (f.alpha <= 0 || f.y > H + 40) {
                    flakes.splice(i, 1);
                }
            } else if (f.y > H + 30 || f.x < -50 || f.x > W + 50) {
                resetAmbient(f, false);
            }
        }
    }

    function drawDot(f) {
        var s = f.size * 4;
        ctx.drawImage(sprite, -s / 2, -s / 2, s, s);
    }

    function drawFlake(f) {
        var s = f.size * 1.5;
        ctx.strokeStyle = 'rgba(150, 186, 216, .78)';
        ctx.lineWidth = Math.max(0.6, s * 0.14);
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (var i = 0; i < 3; i++) {
            var a = (Math.PI / 3) * i;
            var dx = Math.cos(a) * s;
            var dy = Math.sin(a) * s;
            ctx.moveTo(-dx, -dy);
            ctx.lineTo(dx, dy);
        }
        ctx.moveTo(0, -s);
        ctx.lineTo(-s * 0.28, -s * 0.7);
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.28, -s * 0.7);
        ctx.moveTo(0, s);
        ctx.lineTo(-s * 0.28, s * 0.7);
        ctx.moveTo(0, s);
        ctx.lineTo(s * 0.28, s * 0.7);
        ctx.stroke();
    }

    function drawFlakeObj(f) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, f.alpha));
        ctx.fillStyle = f.color;

        if (f.shape === 'flake') {
            drawFlake(f);
        } else {
            drawDot(f);
        }

        ctx.restore();
    }

    function frame(now) {
        var dt = lastTime ? Math.min((now - lastTime) / 16.667, 2.5) : 1;
        lastTime = now;

        ctx.clearRect(0, 0, W, H);
        update(dt);

        for (var i = 0; i < flakes.length; i++) {
            drawFlakeObj(flakes[i]);
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

    buildSprite();
    resize();
    populate();
    ensureLoop();
})();
