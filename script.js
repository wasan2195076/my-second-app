const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const hpElement = document.querySelector("#hp");
const statusElement = document.querySelector("#status");
const message = document.querySelector("#message");
const messageTitle = document.querySelector("#message-title");
const messageText = document.querySelector("#message-text");
const restartButton = document.querySelector("#restart");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const worldWidth = 3100;
const keys = {};
let cameraX = 0;
let gameState = "playing";
let lastTime = 0;

const player = {
  x: 100, y: 300, width: 32, height: 46, vx: 0, vy: 0,
  speed: 260, jump: 620, hp: 3, grounded: false, facing: 1,
  attackTimer: 0, invincible: 0
};

const platforms = [
  { x: 0, y: 470, width: 620, height: 70 },
  { x: 760, y: 470, width: 520, height: 70 },
  { x: 1420, y: 470, width: 460, height: 70 },
  { x: 2020, y: 470, width: 570, height: 70 },
  { x: 2730, y: 470, width: 370, height: 70 },
  { x: 300, y: 360, width: 160, height: 20 },
  { x: 850, y: 350, width: 170, height: 20 },
  { x: 1110, y: 280, width: 130, height: 20 },
  { x: 1530, y: 350, width: 180, height: 20 },
  { x: 2200, y: 340, width: 170, height: 20 },
  { x: 2450, y: 270, width: 120, height: 20 }
];

const enemies = [
  { x: 420, y: 428, width: 34, height: 42, min: 250, max: 580, vx: 65, alive: true },
  { x: 930, y: 428, width: 34, height: 42, min: 780, max: 1240, vx: -70, alive: true },
  { x: 1580, y: 428, width: 34, height: 42, min: 1440, max: 1830, vx: 75, alive: true },
  { x: 2240, y: 428, width: 34, height: 42, min: 2050, max: 2520, vx: -80, alive: true }
];

function resetGame() {
  Object.assign(player, { x: 100, y: 300, vx: 0, vy: 0, hp: 3, grounded: false, facing: 1, attackTimer: 0, invincible: 0 });
  enemies.forEach((enemy, index) => Object.assign(enemy, { alive: true, x: [420, 930, 1580, 2240][index] }));
  cameraX = 0;
  gameState = "playing";
  message.classList.add("hidden");
  statusElement.textContent = "ゴールを目指そう";
  updateHp();
}

function updateHp() {
  hpElement.textContent = "❤".repeat(player.hp) + "♡".repeat(3 - player.hp);
}

function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

function hurt() {
  if (player.invincible > 0) return;
  player.hp--;
  player.invincible = 1.2;
  player.vy = -300;
  player.vx = -player.facing * 220;
  updateHp();
  if (player.hp <= 0) endGame(false);
}

function endGame(won) {
  gameState = won ? "won" : "lost";
  messageTitle.textContent = won ? "STAGE CLEAR!" : "GAME OVER";
  messageText.textContent = won ? "月明かりのゴールに到着しました。" : "もう一度、ゴールを目指そう。";
  message.classList.remove("hidden");
  statusElement.textContent = won ? "クリア！" : "リトライしてね";
}

function update(dt) {
  if (gameState !== "playing") return;
  const direction = Number(Boolean(keys.ArrowRight || keys.d)) - Number(Boolean(keys.ArrowLeft || keys.a));
  player.vx += (direction * player.speed - player.vx) * Math.min(1, dt * 12);
  if (direction) player.facing = direction;
  player.vy += 1500 * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.grounded = false;

  platforms.forEach((platform) => {
    const wasAbove = player.y + player.height - player.vy * dt <= platform.y;
    if (intersects(player, platform) && player.vy >= 0 && wasAbove) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.grounded = true;
    }
  });

  player.x = Math.max(0, Math.min(worldWidth - player.width, player.x));
  if (player.y > HEIGHT + 100) {
    player.x = Math.max(40, player.x - 120);
    player.y = 200;
    player.vy = 0;
    hurt();
  }
  player.attackTimer = Math.max(0, player.attackTimer - dt);
  player.invincible = Math.max(0, player.invincible - dt);

  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    enemy.x += enemy.vx * dt;
    if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
    if (intersects(player, enemy)) {
      const attackBox = { x: player.facing > 0 ? player.x + player.width : player.x - 42, y: player.y + 8, width: 42, height: 30 };
      if (player.attackTimer > 0 && intersects(attackBox, enemy)) enemy.alive = false;
      else hurt();
    }
  });

  cameraX += ((player.x - WIDTH * 0.38) - cameraX) * Math.min(1, dt * 5);
  cameraX = Math.max(0, Math.min(worldWidth - WIDTH, cameraX));
  if (player.x > 2920) endGame(true);
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#182653"); gradient.addColorStop(1, "#4a3973");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#fff2b2"; ctx.beginPath(); ctx.arc(760 - cameraX * 0.15, 95, 42, 0, Math.PI * 2); ctx.fill();
  drawStars();
  ctx.save(); ctx.translate(-cameraX, 0);
  platforms.forEach((p) => { ctx.fillStyle = "#3b2f5e"; ctx.fillRect(p.x, p.y, p.width, p.height); ctx.fillStyle = "#61c0a4"; ctx.fillRect(p.x, p.y, p.width, 8); });
  enemies.forEach(drawEnemy);
  drawGoal();
  drawPlayer();
  ctx.restore();
}

function drawStars() {
  ctx.fillStyle = "#ffffff99";
  for (let i = 0; i < 55; i++) { const x = (i * 173) % WIDTH; const y = 25 + (i * 67) % 240; ctx.fillRect(x, y, 2, 2); }
}

function drawEnemy(enemy) {
  if (!enemy.alive) return;
  ctx.fillStyle = "#ef6683"; ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  ctx.fillStyle = "#251e45"; ctx.fillRect(enemy.x + 7, enemy.y + 10, 6, 6); ctx.fillRect(enemy.x + 21, enemy.y + 10, 6, 6);
}

function drawGoal() {
  ctx.fillStyle = "#ffd166"; ctx.fillRect(2960, 300, 8, 170);
  ctx.fillStyle = "#ff6b8a"; ctx.beginPath(); ctx.moveTo(2968, 300); ctx.lineTo(3050, 325); ctx.lineTo(2968, 350); ctx.fill();
}

function drawPlayer() {
  if (player.invincible > 0 && Math.floor(player.invincible * 12) % 2) return;
  ctx.fillStyle = "#7bdff2"; ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = "#25234c"; ctx.fillRect(player.x + (player.facing > 0 ? 21 : 5), player.y + 11, 6, 6);
  if (player.attackTimer > 0) {
    ctx.fillStyle = "#ffd166";
    const x = player.facing > 0 ? player.x + player.width : player.x - 42;
    ctx.fillRect(x, player.y + 14, 42, 8);
  }
}

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
  if (["ArrowUp", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  if ((event.key === " " || event.key === "ArrowUp" || event.key === "w") && player.grounded && gameState === "playing") player.vy = -player.jump;
  if ((event.key.toLowerCase() === "x" || event.key === "Enter") && gameState === "playing") player.attackTimer = 0.18;
});
window.addEventListener("keyup", (event) => { keys[event.key] = false; });
restartButton.addEventListener("click", resetGame);

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.033);
  lastTime = timestamp;
  update(dt); draw(); requestAnimationFrame(loop);
}

updateHp();
requestAnimationFrame(loop);
