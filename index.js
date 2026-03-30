// script.js
// - live countdown (1s tick)
// - interactive particle background: click/touch to spawn particles
// Edit TARGET_ISO to change the target date/time.

const TARGET_ISO = "2028-07-14T16:00:00"; // local time format YYYY-MM-DDTHH:MM:SS

/* ---------------- Countdown logic ---------------- */
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const noteEl = document.getElementById('note');
const targetDisplayEl = document.getElementById('targetDisplay');

function pad(n){ return String(n).padStart(2,'0'); }
function parseTarget(iso){ const d = new Date(iso); return (d instanceof Date && !isNaN(d.getTime())) ? d : null; }
const TARGET_DATE = parseTarget(TARGET_ISO);

if(!TARGET_DATE){
  noteEl.textContent = 'Invalid target date — edit script.js TARGET_ISO.';
  targetDisplayEl.textContent = '';
} else {
  targetDisplayEl.textContent = `Target: ${TARGET_DATE.toLocaleString()}`;
  function tick(){
    const now = new Date();
    const diff = TARGET_DATE - now;
    if(diff <= 0){
      daysEl.textContent = '0';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      noteEl.textContent = 'Event started!';
      clearInterval(timerId);
      return;
    }
    const totalSec = Math.floor(diff/1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    daysEl.textContent = String(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }
  tick();
  const timerId = setInterval(tick, 1000);
}

/* ---------------- Particle background ---------------- */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext && canvas.getContext('2d');
if(!ctx){
  console.warn('Canvas not supported — interactive background disabled.');
} else {
  let W = canvas.width = innerWidth;
  let H = canvas.height = innerHeight;
  const particles = [];
  const maxParticleLife = 80; // frames

  function resize(){
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
  }
  window.addEventListener('resize', resize);

  // background subtle moving gradient (to feel alive)
  let gradShift = 0;
  function drawBackground(){
    gradShift += 0.002;
    const g = ctx.createLinearGradient(0,0,W,H);
    const r1 = 10 + Math.sin(gradShift)*6;
    const r2 = 30 + Math.cos(gradShift*1.2)*10;
    g.addColorStop(0, `rgba(${r1}, ${r1+20}, ${r2+30}, 0.12)`);
    g.addColorStop(1, `rgba(6, 28, 45, 0.12)`);
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);
  }

  function random(min,max){ return Math.random()*(max-min)+min; }

  function spawnParticles(x,y,count = 28){
    for(let i=0;i<count;i++){
      const speed = random(1.6,6.5);
      const angle = random(0, Math.PI*2);
      particles.push({
        x, y,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        size: random(2,9),
        life: Math.floor(random(maxParticleLife*0.4, maxParticleLife)),
        age: 0,
        color: `hsl(${Math.floor(random(0,360))} , 75% , ${Math.floor(random(50,65))}%)`,
        spin: random(-0.15,0.15),
        rot: random(0,Math.PI*2)
      });
    }
    // cap particle count
    if(particles.length > 1200) particles.splice(0, particles.length - 1200);
  }

  // also spawn a few drifting particles occasionally
  function ambientSpawn(){
    if(Math.random() < 0.02){
      spawnParticles(random(0,W), random(0,H), Math.floor(random(1,4)));
    }
  }

  function updateParticles(){
    for(let i = particles.length -1; i>=0; i--){
      const p = particles[i];
      p.age++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04; // gravity
      p.vx *= 0.996;
      p.vy *= 0.998;
      p.rot += p.spin;
      if(p.age > p.life) particles.splice(i,1);
    }
  }

  function drawParticles(){
    for(const p of particles){
      const alpha = 1 - (p.age / p.life);
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      // draw rounded rect (as particle)
      ctx.beginPath();
      ctx.rect(-p.size/2, -p.size/2, p.size, p.size*1.4);
      ctx.fill();
      ctx.restore();
    }
  }

  // ripple on click (small expanding circle)
  const ripples = [];
  function spawnRipple(x,y){
    ripples.push({x,y,r:2,alpha:0.6});
  }
  function updateRipples(){
    for(let i = ripples.length-1; i>=0; i--){
      const r = ripples[i];
      r.r += 6;
      r.alpha *= 0.95;
      if(r.alpha < 0.02) ripples.splice(i,1);
    }
  }
  function drawRipples(){
    for(const r of ripples){
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${r.alpha*0.12})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // main animation loop
  function loop(){
    // subtle clear with alpha to create motion trails
    ctx.clearRect(0,0,W,H);
    drawBackground();
    ambientSpawn();
    updateParticles();
    updateRipples();
    drawParticles();
    drawRipples();
    requestAnimationFrame(loop);
  }
  loop();

  // pointer / touch handling: spawn particles at pointer position
  function pointerHandler(e){
    // support touch and mouse
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if(e.touches && e.touches.length){
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    spawnParticles(x, y, 36);
    spawnRipple(x,y);
  }

  // Add events (both touch and mouse)
  canvas.addEventListener('pointerdown', pointerHandler);
  canvas.addEventListener('touchstart', pointerHandler, {passive:true});
  canvas.addEventListener('mousedown', pointerHandler);
  // allow clicks anywhere on page to be forwarded to canvas (use capture on document)
  document.addEventListener('pointerdown', (e)=>{
    // ignore if pointer is over an input (none here) — otherwise spawn at event pos
    pointerHandler(e);
  }, {capture:true});
}
