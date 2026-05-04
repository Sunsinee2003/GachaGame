// ── Friends Data ──
const friends = [
  { name: "Am",    img: "asset/Friends/Am.png",    msg: "โดนจับได้ซะแล้ว💦💦" },
  { name: "Koy",   img: "asset/Friends/Koy.png",   msg: "อยากอมหัวแมว" },
  { name: "Mee",   img: "asset/Friends/Mee.png",   msg: "มี่โจ้ยใหญ่" },
  { name: "Pam",   img: "asset/Friends/Pam.png",   msg: "คนอ่านเป็นเอ๋" },
  { name: "Pin",   img: "asset/Friends/Pin.png",   msg: "ขอซัก 80 คับ" },
  { name: "P'Mook", img: "asset/Friends/Pmook.png", msg: "ไม่อยากอ่านญี่ปุ่นจ้า" },
  { name: "P'Nine", img: "asset/Friends/Pnine.png", msg: "โตไปไม่เอ๋นะ" },
  { name: "P'Win",  img: "asset/Friends/Pwin.png",  msg: "คนนั้นบินเมื่อไรเดี๋ยวเลี้ยงเหล้า" },
  { name: "Rin",   img: "asset/Friends/Rin.png",   msg: "ม่องลูกแมร๊" },
  { name: "Ferm",   img: "asset/Friends/Ferm.png",   msg: "อยากได้อดปจังเลยยย" },

];

// ── DOM refs ──
const ballsContainer = document.getElementById("balls");
const popup          = document.getElementById("popup");
const clawWrap       = document.getElementById("clawWrap");
const stringEl       = document.getElementById("string");
const clawImg        = document.getElementById("clawImg");
const scoreEl        = document.getElementById("score");
const joystick       = document.getElementById("joystickHandle");
const stopBtn        = document.getElementById("stopBtn");
const pickupBtn      = document.getElementById("pickupBtn");

// ── Glass area bounds (relative to .glass) ──
// glass: left:60 top:40 width:380 height:420 in stage coords
// claw moves within glass x: 0..380, string hangs from top
const GLASS_W = 380;
const GLASS_H = 420;
const BALL_R  = 30; // ball radius px

let score    = 0;
let canPlay  = true;
let clawX    = GLASS_W / 2;   // px, center of glass
let clawY    = 0;              // string top offset (0 = retracted)
let isMoving = false;
let moveInterval = null;
let dropping = false;

// joystick state
let joyActive  = false;
let joyDir     = { x: 0, y: 0 };

// ── Spawn balls ──
function spawnBalls() {
  friends.forEach((f, i) => {
    const div = document.createElement("div");
    div.className = "ball";
    div.dataset.index = i;
    randomizeBall(div);
    const img = document.createElement("img");
    img.src = f.img;
    div.appendChild(img);
    ballsContainer.appendChild(div);
    animateBall(div);
  });
}

function randomizeBall(div) {
  const margin = 10;
  const x = margin + Math.random() * (GLASS_W - BALL_R * 2 - margin * 2);
  const y = 60 + Math.random() * (GLASS_H - BALL_R * 2 - 100);
  div.style.left = x + "px";
  div.style.top  = y + "px";
}

function animateBall(div) {
  let vx = (Math.random() - 0.5) * 0.6;
  let vy = (Math.random() - 0.5) * 0.4;
  let bx = parseFloat(div.style.left);
  let by = parseFloat(div.style.top);

  function step() {
    if (!div.parentNode) return;
    bx += vx;
    by += vy;
    const maxX = GLASS_W - BALL_R * 2;
    const maxY = GLASS_H - BALL_R * 2;
    if (bx < 0)    { bx = 0;    vx *= -1; }
    if (bx > maxX) { bx = maxX; vx *= -1; }
    if (by < 40)   { by = 40;   vy *= -1; }
    if (by > maxY) { by = maxY; vy *= -1; }
    div.style.left = bx + "px";
    div.style.top  = by + "px";
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Claw position update ──
function updateClaw() {
  const pct = clawX / GLASS_W * 100;
  clawWrap.style.left = pct + "%";
  stringEl.style.height = clawY + "px";
}

function drop() {
  if (!canPlay || dropping) return;
  dropping = true;
  canPlay  = false;
  stopJoystick();

  const speed = 2;
  function descend() {
    clawY += speed;
    updateClaw();
    if (checkHitEarly()) {
      retract();
    } else if (clawY < GLASS_H - 60) {
      requestAnimationFrame(descend);
    } else {
      clawY = GLASS_H - 60;
      updateClaw();
      retract();
    }
  }
  requestAnimationFrame(descend);
}

function checkHitEarly() {
  const clawCX = 60 + clawX;
  const clawCY = 40 + clawY;

  const balls = document.querySelectorAll(".ball");
  let hit = null;
  let minDist = 9999;

  balls.forEach(ball => {
    const bx = parseFloat(ball.style.left) + 60 + BALL_R;
    const by = parseFloat(ball.style.top)  + 40 + BALL_R;
    const dx = bx - clawCX;
    const dy = by - clawCY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 55 && dist < minDist) {
      minDist = dist;
      hit = ball;
    }
  });

  if (hit) {
    const data = friends[hit.dataset.index];
    hit.remove();
    score++;
    scoreEl.textContent = score;
    setTimeout(() => showPopup(data), 400);
    return true;
  }
  return false;
}

function retract() {
  const speed = 8;
  function ascend() {
    clawY -= speed;
    if (clawY < 0) clawY = 0;
    updateClaw();
    if (clawY > 0) {
      requestAnimationFrame(ascend);
    } else {
      dropping = false;
      canPlay  = true;
      checkGameOver();  // ← เพิ่มบรรทัดนี้
    }
  }
  requestAnimationFrame(ascend);
}

function checkHit() {
  const clawCX = 60 + clawX; // stage coords
  const clawCY = 40 + clawY; // stage coords

  const balls = document.querySelectorAll(".ball");
  let hit = null;
  let minDist = 9999;

  balls.forEach(ball => {
    const bx = parseFloat(ball.style.left) + 60 + BALL_R; // stage x center
    const by = parseFloat(ball.style.top)  + 40 + BALL_R; // stage y center
    const dx = bx - clawCX;
    const dy = by - clawCY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 55 && dist < minDist) {
      minDist = dist;
      hit = ball;
    }
  });

  if (hit) {
    const data = friends[hit.dataset.index];
    hit.remove();
    score++;
    scoreEl.textContent = score;
    setTimeout(() => showPopup(data), 400);
  }
}

// ── Popup ──
function showPopup(data) {
  document.getElementById("popupName").textContent  = data.name;
  document.getElementById("popupMsg").textContent   = data.msg;
  document.getElementById("popupAvatar").src        = data.img;
  popup.classList.add("show");
}
document.getElementById("closeBtn").onclick = () => popup.classList.remove("show");

document.getElementById("restartBtn").onclick = () => {
  document.getElementById("gameOverPopup").classList.remove("show");
  score = 0;
  scoreEl.textContent = 0;
  clawX = GLASS_W / 2;
  clawY = 0;
  updateClaw();
  document.getElementById("balls").innerHTML = "";
  spawnBalls();
};

// ── Joystick control ──
function startJoystick(dx, dy) {
  if (dropping) return;
  joyDir = { x: dx, y: dy };
  if (moveInterval) return;
  moveInterval = setInterval(() => {
    if (!canPlay) return;
    clawX += joyDir.x * 4;
    clawX  = Math.max(0, Math.min(GLASS_W, clawX));
    updateClaw();
  }, 16);
}

function stopJoystick() {
  clearInterval(moveInterval);
  moveInterval = null;
  joystick.style.transform = "translate(-50%,-50%)";
}

// ── Joystick pointer events ──
const joystickBase = document.getElementById("joystickBase");

joystickBase.addEventListener("pointerdown", e => {
  joyActive = true;
  joystickBase.setPointerCapture(e.pointerId);
  handleJoyMove(e);
});

joystickBase.addEventListener("pointermove", e => {
  if (!joyActive) return;
  handleJoyMove(e);
});

joystickBase.addEventListener("pointerup", () => {
  joyActive = false;
  stopJoystick();
});

joystickBase.addEventListener("pointercancel", () => {
  joyActive = false;
  stopJoystick();
});

function handleJoyMove(e) {
  const rect = joystickBase.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = rect.width / 2 - 10;
  const clamped = Math.min(dist, maxDist);
  const angle   = Math.atan2(dy, dx);
  const nx = Math.cos(angle) * clamped;
  const ny = Math.sin(angle) * clamped;
  joystick.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
  const normX = dx / maxDist;
  startJoystick(Math.max(-1, Math.min(1, normX)), 0);
}

// ── Keyboard ──
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft")  startJoystick(-1, 0);
  if (e.key === "ArrowRight") startJoystick( 1, 0);
  if (e.key === " " || e.key === "Enter") {
    if (popup.classList.contains("show")) {
      document.getElementById("closeBtn").click();
    } else {
      drop();
    }
  }
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") stopJoystick();
});

// ── Button events ──
stopBtn.addEventListener('click', drop);
stopBtn.addEventListener('pointerdown', () => { stopBtn.style.transform = 'scale(0.9)'; });
stopBtn.addEventListener('pointerup',   () => { stopBtn.style.transform = 'scale(1)'; });
stopBtn.addEventListener('pointerleave',() => { stopBtn.style.transform = 'scale(1)'; });

pickupBtn.addEventListener("click", drop);

function checkGameOver() {
  const remaining = document.querySelectorAll(".ball").length;
  if (remaining === 0) {
    setTimeout(() => {
      document.getElementById("gameOverPopup").classList.add("show");
    }, 600);
  }
}

// ── Init ──
updateClaw();
spawnBalls();
