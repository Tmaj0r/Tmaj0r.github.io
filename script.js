// Jumping Fish script (moved from main.html)
'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
console.log('jumping_fish script loaded');

// seaweed array must be declared before generateSeaweed() is called
let seaweeds = [];

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

window.addEventListener('error', (ev) => {
    console.error('Unhandled error', ev.error || ev.message);
    showErrorOnCanvas((ev.error && ev.error.message) || ev.message || 'Unknown error');
});

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

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateSeaweed();
}
resize();
window.addEventListener('resize', resize);

// allow multiple fish
let fishes = [];

canvas.addEventListener('click', (e) => {
    // spawn a new fish at the click position
    const size = 16 + Math.random() * 36; // 16..52
    const speed = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 1.8);
    // pick a random hue for variety, use HSL so we can vary lightness/saturation if desired
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue},70%,55%)`;
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

function drawFish(f) {
    const { x, y, size, tailPhase, vx, color } = f;
    ctx.save();
    ctx.translate(x, y);

    // flip horizontally when moving left
    const facingLeft = vx < 0;
    if (facingLeft) ctx.scale(-1, 1);

    // body
    ctx.fillStyle = color || 'orange';
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
    // tail uses same color (could be darkened later)
    ctx.fillStyle = color || 'orange';
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

function drawSeaweeds() {
    const baseY = canvas.height;
    for (let i = 0; i < seaweeds.length; i++) {
        const s = seaweeds[i];
        s.phase += s.swaySpeed;
        const seg = s.segments || 12;
        // build center points
        const points = [];
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
            const half = s.baseWidth * (1 + (s.layer === 0 ? 0 : 0.4)) * (1 - j / points.length) ;
            left.push({ x: p.x + nx * half, y: p.y + ny * half });
            right.push({ x: p.x - nx * half, y: p.y - ny * half });
        }

        // draw filled shape
        ctx.save();
        // color slightly darker for back layer
        const lightAdj = s.layer === 0 ? Math.max(6, s.light - 8) : Math.min(60, s.light + 4);
        ctx.fillStyle = `hsl(${s.hue},60%,${lightAdj}%)`;
        ctx.beginPath();
        // left side from base upward
        ctx.moveTo(left[0].x, left[0].y);
        for (let k = 1; k < left.length; k++) ctx.lineTo(left[k].x, left[k].y);
        // back down right side
        for (let k = right.length - 1; k >= 0; k--) ctx.lineTo(right[k].x, right[k].y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function update() {
    // paint a vertical blue gradient background each frame
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, '#9fe3ff'); // light sky
    grd.addColorStop(0.6, '#4aa3ff'); // mid
    grd.addColorStop(1, '#0b4ea6'); // deep
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw background seaweed
    drawSeaweeds();

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
