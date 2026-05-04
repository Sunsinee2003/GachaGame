// ── Friends Data ──
const friends = [
  { name: "Am",    img: "asset/Friends/Am.png",    msg: "โดนจับได้ซะแล้ว💦💦" },
  { name: "Koy",   img: "asset/Friends/Koy.png",   msg: "อยากอมหัวแมว" },
  { name: "Mee",   img: "asset/Friends/Mee.png",   msg: "พี่ชาวี พี่จะใส่สูทมาทำไม!!" },
  { name: "Pam",   img: "asset/Friends/Pam.png",   msg: "คนอ่านเป็นเอ๋" },
  { name: "Pin",   img: "asset/Friends/Pin.png",   msg: "ขอซัก 80 คับ" },
  { name: "P'Mook", img: "asset/Friends/Pmook.png", msg: "ไม่อยากอ่านญี่ปุ่นจ้า" },
  { name: "P'Nine", img: "asset/Friends/Pnine.png", msg: "โตไปไม่เอ๋นะ" },
  { name: "P'Win",  img: "asset/Friends/Pwin.png",  msg: "เดี๋ยวเลี้ยงเหล้า" },
  { name: "Rin",   img: "asset/Friends/Rin.png",   msg: "ม่องลูกแมร๊" },
  { name: "Ferm",   img: "asset/Friends/Ferm.png",   msg: "อยากได้อดอปจังเลยยย" },

  { name: "Am",    img: "asset/Friends/Am_2.png",    msg: "อะจ๊ะเอ๋ตัวเอง" },
  { name: "Koy",   img: "asset/Friends/Koy_2.png",   msg: "เกิดแต่กับกรู" },
  { name: "Mee",   img: "asset/Friends/Mee_2.png",   msg: "มี่รักน้องแอม จุ๊บม๊วฟ" },
  { name: "Pam",   img: "asset/Friends/Pam_2.png",   msg: "หนุ่มแว่นเดอะเบส" },
  { name: "Pin",   img: "asset/Friends/Pin_2.png",   msg: "จน เครียด กินปิ่นมาย" },
  { name: "P'Mook", img: "asset/Friends/Pmook_2.png", msg: "รักจันทร์จ้าวนะลูก" },
  { name: "P'Nine", img: "asset/Friends/Pnine_2.png", msg: "อ่อจ้า" },
  { name: "P'Win",  img: "asset/Friends/Pwin_2.png",  msg: "ชาบูวันไหนดี" },
  { name: "Rin",   img: "asset/Friends/Rin_2.png",   msg: "✨#ดลลี่เนย🫶🏻🩷" },
  { name: "Ferm",   img: "asset/Friends/Ferm_2.png",   msg: "ใครจับได้เลี้ยงตี๋น้อยผมด้วย" },
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

const BALL_R = 30;

let GLASS_W = 380;
let GLASS_H = 420;

let score    = 0;
let canPlay  = true;
let clawX    = GLASS_W / 2;
let clawY    = 0;
let isMoving = false;
let moveInterval = null;
let dropping = false;

let joyActive  = false;
let joyDir     = { x: 0, y: 0 };

// ── อัปเดตขนาด glass จาก DOM จริงๆ ──
function updateGlassSize() {
  const glass = document.querySelector('.glass');
  GLASS_W = glass.offsetWidth;
  GLASS_H = glass.offsetHeight;
}

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
  const glass = document.querySelector('.glass');
  const gW = glass.offsetWidth;
  const gH = glass.offsetHeight;
  const margin = 8;
  const x = margin + Math.random() * (gW - BALL_R * 2 - margin * 2);
  const y = margin + Math.random() * (gH - BALL_R * 2 - margin * 2);
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

    // ── อ่านขนาด glass จริงๆ ทุก frame เพื่อให้ responsive ถูก ──
    const glass = document.querySelector('.glass');
    const gW = glass.offsetWidth;
    const gH = glass.offsetHeight;

    bx += vx;
    by += vy;

    const maxX = gW - BALL_R * 2;
    const maxY = gH - BALL_R * 2;

    if (bx < 0)    { bx = 0;    vx *= -1; }
    if (bx > maxX) { bx = maxX; vx *= -1; }
    if (by < 0)    { by = 0;    vy *= -1; }
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

  const speed = 5;
  function descend() {
    clawY += speed;
    updateClaw();
    if (checkHitEarly()) {
      retract();
    } else if (clawY < GLASS_H - 80) {
      requestAnimationFrame(descend);
    } else {
      clawY = GLASS_H - 80;
      updateClaw();
      retract();
    }
  }
  requestAnimationFrame(descend);
}

// ── ตรวจชนโดยใช้พิกัดใน .glass โดยตรง (ไม่บวก offset) ──
function checkHitEarly() {
  // clawX, clawY คือตำแหน่งภายใน .glass แล้ว
  const clawCX = clawX;
  const clawCY = clawY;

  const balls = document.querySelectorAll(".ball");
  let hit = null;
  let minDist = 9999;

  balls.forEach(ball => {
    // ball style.left/top คือตำแหน่งภายใน #balls ซึ่งอยู่ใน .glass
    const bx = parseFloat(ball.style.left) + BALL_R;
    const by = parseFloat(ball.style.top)  + BALL_R;
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
      checkGameOver();
    }
  }
  requestAnimationFrame(ascend);
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
  updateGlassSize();
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
window.addEventListener('load', () => {
  updateGlassSize();
  clawX = GLASS_W / 2;
  updateClaw();
  spawnBalls();
});

window.addEventListener('resize', () => {
  updateGlassSize();
  // clamp clawX ให้ไม่เกิน glass ใหม่
  clawX = Math.min(clawX, GLASS_W);
  updateClaw();
});
