// Fish tank script (I cheated for the math)
'use strict';

const canvas = document.getElementById('canvas'); 
const ctx = canvas.getContext('2d'); 
console.log('Fish tank script loaded'); // log to console for debugging

// Arrays must be declared before use. Arrays allow for multiple objects of the same type.
let seaweeds = [];
let bubbles = [];
let fishes = [];
let corals = [];
let rocks = [];

function drawFish(f) {
    const { x, y, size, tailPhase, vx, color } = f;
    ctx.save();
    ctx.translate(x, y);

    // flip direction horizontally when moving left
    const facingLeft = vx < 0;
    if (facingLeft) ctx.scale(-1, 1);

    // body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // tail -- animate by rotating the tail points slightly based on tailPhase
    // invert wag for left-facing so motion looks consistent
    const tailWag = Math.sin(tailPhase) * 0.6 * (facingLeft ? -1 : 1);
    ctx.save();
    ctx.translate(-size, 0);
    ctx.rotate(tailWag);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size * 0.7, -size * 0.6);
    ctx.lineTo(-size * 0.7, size * 0.6);
    ctx.closePath();
    ctx.fillStyle = color // tail matches body color
    ctx.fill();
    ctx.restore();

    // eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(size * 0.4, -size * 0.15, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(size * 0.44, -size * 0.15, size * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function generateSeaweed() {
    seaweeds = [];
    const count = Math.max(10, Math.floor(canvas.width / 50));
    for (let i = 0; i < count; i++) {
        const x = Math.random() * canvas.width;
        const height = 160 + Math.random() * 360; // taller
        const swayAmp = 14 + Math.random() * 36;
        const layer = Math.random() < 0.5 ? 0 : 1; // parallax layer
        const swaySpeed = (layer === 0 ? 0.004 : 0.01) + Math.random() * (layer === 0 ? 0.01 : 0.02);
        const baseWidth = 6 + Math.random() * 10;
        const hue = 100 + Math.random() * 50;
        const light = 20 + Math.random() * 30;
        const segments = 10 + Math.floor(Math.random() * 8);
        seaweeds.push({ x, height, swayAmp, swaySpeed, phase: Math.random() * Math.PI * 2, baseWidth, hue, light, segments, layer });
    }
}

function generateRocks() {
    rocks = [];
    const count = 3; // generate three rocks
    const margin = 60; // keep rocks away from edges
    // generate rocks with random positions and sizes
    for (let i = 0; i < count; i++) {
        const x = margin + Math.random() * (canvas.width - margin * 2);
        const width = 60 + Math.random() * 80; // wider variation
        const height = 30 + Math.random() * 30; // shorter variation
        const y = canvas.height - (height * 0.5) - 6; // slightly above bottom
        // shorter interval for more continuous bubbling; also store a small continuous chance
        const bubbleInterval = 8 + Math.floor(Math.random() * 24); // frames between bursts
        const continuousChance = 0.08 + Math.random() * 0.18; // per-frame small bubble chance
        rocks.push({ x, y, width, height, bubbleTimer: 0, bubbleInterval, continuousChance });
    }
}

function generateCoral() {
    corals = [];
    const count = Math.max(8, Math.floor(canvas.width / 80)); // more corals
    // generate corals with random positions and sizes
    for (let i = 0; i < count; i++) {
        const x = Math.random() * canvas.width; // random x position
        const y = canvas.height + 30; // start slightly below screen
        const depth = Math.random() * 0.5; // only front to mid depth (0 to 0.5)
        const height = 60 + Math.random() * 280; // much taller variation
        const width = 20 + Math.random() * 50; // wider variation
        const hue = 5 + Math.random() * 30; // orange/red hues for coral
        const rockiness = 2 + Math.floor(Math.random() * 4); // number of rockss
        const type = Math.random() < 0.5 ? 'ribbon' : 'rock'; // alternate coral types
        corals.push({ x, y, depth, height, width, hue, rockiness, type });
    }
}

function drawSeaweeds() {
    const baseY = canvas.height;
    for (let i = 0; i < seaweeds.length; i++) {
        const s = seaweeds[i]; 
        s.phase += s.swaySpeed; // update phase for animation
        const seg = s.segments || 12; // segments per seaweed
        // build center points
        const points = []; // center points for this seaweed
        // build center points for this seaweed
        for (let j = 0; j <= seg; j++) { 
            const t = j / seg;
            const y = baseY - t * s.height;
            const offset = Math.sin(s.phase + t * Math.PI * 2 * (1 + j * 0.12)) * s.swayAmp * (1 - Math.pow(t, 1.1));
            const x = s.x + offset;
            points.push({ x, y });
        }

        // create a filled ribbon by offsetting normals
        const left = [];
        const right = [];
        for (let j = 0; j < points.length; j++) {
            const p = points[j];
            // compute tangent
            const next = points[Math.min(j + 1, points.length - 1)];
            const prev = points[Math.max(j - 1, 0)];
            const dx = next.x - prev.x; 
            const dy = next.y - prev.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const half = s.baseWidth * (1 + (s.layer === 0 ? 0 : 0.4)) * (1 - j / points.length);
            left.push({ x: p.x + nx * half, y: p.y + ny * half });
            right.push({ x: p.x - nx * half, y: p.y - ny * half });
        }

        // draw filled shape
        ctx.save(); // save state
        // color slightly darker for back layer
        const lightAdj = s.layer === 0 ? Math.max(6, s.light - 8) : Math.min(60, s.light + 4);
        ctx.fillStyle = `hsl(${s.hue},60%,${lightAdj}%)`;
        ctx.beginPath();
        // left side from base upward
        ctx.moveTo(left[0].x, left[0].y);
        for (let k = 1; k < left.length; k++) ctx.lineTo(left[k].x, left[k].y);
        // back down right side
        for (let k = right.length - 1; k >= 0; k--) ctx.lineTo(right[k].x, right[k].y);
        ctx.closePath(); // close shape
        ctx.fill(); // fill shape
        ctx.restore();
    }
}

function drawCoralRock(baseX, baseY, height, width, hue, depth, rockDepth = 0) {
    const baseY_val = baseY;
    const seg = 6;

    // build center points for this Rock
    const points = [];
    for (let j = 0; j <= seg; j++) {
        const t = j / seg;
        const y = baseY_val - t * height;
        const offset = Math.sin(t * Math.PI * 2) * width * 0.15 * (1 - Math.pow(t, 1.1));
        const x = baseX + offset;
        points.push({ x, y });
    }

    // create a filled ribbon
    const left = [];
    const right = [];
    for (let j = 0; j < points.length; j++) {
        const p = points[j];
        const next = points[Math.min(j + 1, points.length - 1)];
        const prev = points[Math.max(j - 1, 0)];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const half = width * 0.5 * (1 - j / points.length) * (1 - rockDepth * 0.4);
        left.push({ x: p.x + nx * half, y: p.y + ny * half });
        right.push({ x: p.x - nx * half, y: p.y - ny * half });
    }

    // draw filled shape
    ctx.save();
    const lightness = 55 - depth * 35;
    const saturation = 80 - depth * 20;
    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let k = 1; k < left.length; k++) ctx.lineTo(left[k].x, left[k].y);
    for (let k = right.length - 1; k >= 0; k--) ctx.lineTo(right[k].x, right[k].y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // return the tip position for rocks
    return { x: points[points.length - 1].x, y: points[points.length - 1].y };
}

function drawCoral() {
    for (let i = 0; i < corals.length; i++) {
        const c = corals[i];

        if (c.type === 'rock') {
            drawRockCoral(c);
        } else {
            // draw main stem only (ribbon style)
            const tip = drawCoralRock(c.x, c.y, c.height, c.width, c.hue, c.depth, 0);
        }
    }
}

function drawRockCoral(c) {
    ctx.save();

    const lightness = 55 - c.depth * 35;
    const saturation = 80 - c.depth * 20;
    ctx.fillStyle = `hsl(${c.hue}, ${saturation}%, ${lightness}%)`;

    // draw stacked rocks/boulders
    let currentY = c.y;
    const rockCount = 4 + Math.floor(c.height / 60);

    for (let r = 0; r < rockCount; r++) {
        const t = r / rockCount; // progress along height
        const currentHeight = c.height * t;

        // rock gets slightly narrower toward top
        const rockWidth = c.width * (1 - t * 0.4);
        const rockHeight = c.height / rockCount * 1.2;

        // slight horizontal wobble for natural look
        const wobble = Math.sin(r * 1.5) * c.width * 0.15;
        const rockX = c.x + wobble;
        const rockY = c.y - currentHeight;

        // draw bulbous rock shape using ellipse
        ctx.beginPath();
        ctx.ellipse(rockX, rockY, rockWidth * 0.6, rockHeight * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // add darker shading on bottom for depth
        ctx.fillStyle = `hsl(${c.hue}, ${saturation}%, ${Math.max(20, lightness - 15)}%)`;
        ctx.beginPath();
        ctx.ellipse(rockX, rockY + rockHeight * 0.3, rockWidth * 0.5, rockHeight * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // restore color for next rock
        ctx.fillStyle = `hsl(${c.hue}, ${saturation}%, ${lightness}%)`;
    }

    ctx.restore();
}

function spawnBubbleFromRock(r) {
    // spawn near rock top with slight horizontal jitter
    const opts = arguments[1] || {};
    const bx = r.x + (Math.random() - 0.5) * (r.width * 0.4) + (opts.dx || 0);
    const by = r.y - r.height * 0.5 - 6 + (opts.dy || 0);
    const radius = opts.radius ?? (1.5 + Math.random() * 6);
    const vx = opts.vx ?? ((Math.random() - 0.5) * (0.6 + Math.random() * 0.6));
    const vy = opts.vy ?? - (0.6 + Math.random() * 2.0);
    const life = opts.life ?? (60 + Math.random() * 160); // frames
    bubbles.push({ x: bx, y: by, vx, vy, r: radius, alpha: 0.95, life, age: 0 });
}

function updateBubbles() {
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.x += b.vx;
        b.y += b.vy;
        b.age++;
        // drift outwards slightly as they approach the top
        b.alpha = Math.max(0, 0.9 * (1 - b.age / b.life));
        if (b.y + b.r < 0 || b.age > b.life || b.alpha <= 0) {
            bubbles.splice(i, 1);
        }
    }
}

function drawRocks() {
    for (let i = 0; i < rocks.length; i++) {
        const r = rocks[i];
        // rock shadow / body
        const grd = ctx.createLinearGradient(r.x, r.y - r.height, r.x, r.y + r.height);
        grd.addColorStop(0, '#6b6b4f');
        grd.addColorStop(1, '#3d3d2b');
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.width * 0.6, r.height * 0.9, 0, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        // small lighter speckles
        ctx.fillStyle = '#ffffff0f';
        ctx.beginPath();
        ctx.ellipse(r.x - r.width * 0.15, r.y - r.height * 0.2, r.width * 0.18, r.height * 0.12, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // update rock bubble timer and spawn bursts
        r.bubbleTimer++;
        if (r.bubbleTimer >= r.bubbleInterval) {
            // spawn a small burst (2-5 bubbles)
            const toSpawn = 2 + Math.floor(Math.random() * 4);
            for (let k = 0; k < toSpawn; k++) {
                spawnBubbleFromRock(r, { radius: 2 + Math.random() * 6, vy: - (1 + Math.random() * 2) });
            }
            r.bubbleTimer = 0;
            // keep interval modest so bursts happen regularly
            r.bubbleInterval = 10 + Math.floor(Math.random() * 40);
        }

        // continuous small bubbles: per-frame small chance
        if (Math.random() < r.continuousChance) {
            spawnBubbleFromRock(r, { radius: 1 + Math.random() * 3, vy: - (0.8 + Math.random() * 1.2) });
        }
    }
}

function drawBubbles() {
    for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, b.alpha);
        // soft glow
        ctx.fillStyle = '#dcf5ffe6';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        // highlight
        ctx.fillStyle = '#ffffff99';
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, Math.max(1, b.r * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
// add a click listener to spawn new fishes
canvas.addEventListener('click', (e) => {
    // spawn a new fish at the click position
    const size = 16 + Math.random() * 36; // 16..52
    const speed = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 1.8);
    // pick a random hue for variety, use HSL so we can vary lightness/saturation if desired
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue},70%,55%)`; // HSL for variety in fish colors
    fishes.push({
        x: e.clientX,
        baseY: e.clientY,
        y: e.clientY,
        size: size,
        vx: speed,
        time: Math.random() * Math.PI * 2,
        tailPhase: Math.random() * Math.PI * 2,
        color: color
    });
});

// resize the canvas to fit the window size
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateSeaweed();
    generateRocks();
    generateCoral();
}
resize();
window.addEventListener('resize', resize);
// start the animation loop
function update() {
    // paint a vertical blue gradient background each frame
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, '#73c8edff'); // light sky
    grd.addColorStop(0.6, '#3790e8ff'); // mid
    grd.addColorStop(1, '#063777ff'); // deep
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw background seaweed
    drawSeaweeds();
    // draw coral
    drawCoral();

    // update and draw rocks + bubbles
    updateBubbles();
    drawRocks();
    drawBubbles();

    // update and draw all fishes
    for (let i = 0; i < fishes.length; i++) {
        const f = fishes[i];
        f.time += 0.03;
        f.tailPhase += 0.5;

        // horizontal motion
        f.x += f.vx;

        // vertical bob (use baseY to avoid cumulative drift)
        const bobAmplitude = Math.max(6, f.size * 0.2);
        f.y = f.baseY + Math.sin(f.time) * bobAmplitude;

        // wrap around horizontally
        if (f.x - f.size > canvas.width) f.x = -f.size;
        if (f.x + f.size < 0) f.x = canvas.width + f.size;

        drawFish(f);
    }

    requestAnimationFrame(update);
}
update();
// handle unhandled errors gracefully
window.addEventListener('error', (ev) => {
    console.error('Unhandled error', ev.error || ev.message);
    showErrorOnCanvas((ev.error && ev.error.message) || ev.message || 'Unknown error');
});

// show JS errors on the canvas so we can debug when the page is white
function showErrorOnCanvas(msg) {
    try {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.fillStyle = '#ffeeee';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.font = '18px sans-serif';
        ctx.fillText(msg, 20, 40);
    } catch (e) {
        // ignore
    }
}
