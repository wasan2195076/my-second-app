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
let currentStage = 1;

const player = {
  x: 100, y: 300, width: 32, height: 46, vx: 0, vy: 0,
  speed: 260, jump: 620, hp: 3, grounded: false, facing: 1,
  attackTimer: 0, invincible: 0
};

const levelDefinitions = [
  {
    goalX: 2920,
    platforms: [
      { x: 0, y: 470, width: 620, height: 70 }, { x: 760, y: 470, width: 520, height: 70 },
      { x: 1420, y: 470, width: 460, height: 70 }, { x: 2020, y: 470, width: 570, height: 70 },
      { x: 2730, y: 470, width: 370, height: 70 }, { x: 300, y: 360, width: 160, height: 20 },
      { x: 850, y: 350, width: 170, height: 20 }, { x: 1110, y: 280, width: 130, height: 20 },
      { x: 1530, y: 350, width: 180, height: 20 }, { x: 2200, y: 340, width: 170, height: 20 },
      { x: 2450, y: 270, width: 120, height: 20 }
    ],
    enemies: [
      { x: 420, y: 428, min: 250, max: 580, vx: 65 }, { x: 930, y: 428, min: 780, max: 1240, vx: -70 },
      { x: 1580, y: 428, min: 1440, max: 1830, vx: 75 }, { x: 2240, y: 428, min: 2050, max: 2520, vx: -80 }
    ]
  },
  {
    goalX: 2920,
    platforms: [
      { x: 0, y: 470, width: 440, height: 70 }, { x: 600, y: 470, width: 470, height: 70 },
      { x: 1230, y: 470, width: 390, height: 70 }, { x: 1770, y: 470, width: 450, height: 70 },
      { x: 2400, y: 470, width: 700, height: 70 }, { x: 180, y: 340, width: 150, height: 20 },
      { x: 700, y: 300, width: 150, height: 20 }, { x: 1110, y: 380, width: 120, height: 20 },
      { x: 1400, y: 280, width: 160, height: 20 }, { x: 1900, y: 340, width: 170, height: 20 },
      { x: 2300, y: 260, width: 140, height: 20 }, { x: 2600, y: 350, width: 170, height: 20 }
    ],
    enemies: [
      { x: 280, y: 428, min: 80, max: 400, vx: 110 }, { x: 760, y: 428, min: 620, max: 1030, vx: -120 },
      { x: 1360, y: 428, min: 1250, max: 1570, vx: 125 }, { x: 1940, y: 428, min: 1780, max: 2160, vx: -130 },
      { x: 2520, y: 428, min: 2420, max: 2850, vx: 145 },
      { x: 2680, y: 308, min: 2600, max: 2720, vx: -75 }
    ]
  }
];
let platforms = [];
let enemies = [];
let goalX = levelDefinitions[0].goalX;

function loadLevel(stage) {
  const level = levelDefinitions[stage - 1];
  platforms = level.platforms.map((platform) => ({ ...platform }));
  enemies = level.enemies.map((enemy) => ({ ...enemy, width: 34, height: 42, alive: true }));
  goalX = level.goalX;
}

function resetGame() {
  currentStage = 1;
  loadLevel(currentStage);
  Object.assign(player, { x: 100, y: 300, vx: 0, vy: 0, hp: 3, grounded: false, facing: 1, attackTimer: 0, invincible: 0 });
  cameraX = 0;
  gameState = "playing";
  message.classList.add("hidden");
  restartButton.textContent = "もう一度プレイ";
  statusElement.textContent = "STAGE 1　ゴールを目指そう";
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
  if (won && currentStage === 1) {
    currentStage = 2;
    loadLevel(currentStage);
    Object.assign(player, { x: 100, y: 300, vx: 0, vy: 0, grounded: false, facing: 1, attackTimer: 0, invincible: 0 });
    cameraX = 0;
    gameState = "stage-clear";
    messageTitle.textContent = "STAGE 1 CLEAR!";
    messageText.textContent = "次のステージへ進もう。";
    restartButton.textContent = "ステージ2へ";
    statusElement.textContent = "ステージ1クリア！";
    message.classList.remove("hidden");
    return;
  }
  gameState = won ? "won" : "lost";
  messageTitle.textContent = won ? "STAGE 2 CLEAR!" : "ゲームオーバー";
  messageText.textContent = won ? "月明かりのゴールに到着しました。" : "もう一度、ゴールを目指そう。";
  message.classList.remove("hidden");
  statusElement.textContent = won ? "全ステージクリア！" : "リトライしてね";
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
  if (player.x > goalX) endGame(true);
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  if (currentStage === 2) {
    gradient.addColorStop(0, "#210d2d"); gradient.addColorStop(0.55, "#3a1745"); gradient.addColorStop(1, "#702c4d");
  } else {
    gradient.addColorStop(0, "#090f2d"); gradient.addColorStop(0.55, "#182052"); gradient.addColorStop(1, "#422d62");
  }
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawBackdrop();
  drawStars();
  ctx.save(); ctx.translate(-cameraX, 0);
  platforms.forEach(drawPlatform);
  enemies.forEach(drawEnemy);
  drawGoal();
  drawPlayer();
  ctx.restore();
}

function drawBackdrop() {
  const moonX = 760 - cameraX * 0.15;
  const glow = ctx.createRadialGradient(moonX, 95, 20, moonX, 95, 125);
  const isSecondStage = currentStage === 2;
  glow.addColorStop(0, isSecondStage ? "#ff9b8355" : "#d9f8ff55");
  glow.addColorStop(1, isSecondStage ? "#ff527000" : "#7b8dff00");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, WIDTH, 260);
  ctx.fillStyle = isSecondStage ? "#ffb08d" : "#e5f5ff";
  ctx.beginPath(); ctx.arc(moonX, 95, 42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = isSecondStage ? "#9c3d62" : "#b9cfff";
  ctx.beginPath(); ctx.arc(moonX - 13, 84, 8, 0, Math.PI * 2); ctx.arc(moonX + 15, 108, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = isSecondStage ? "#2b123b99" : "#10183d99";
  for (let i = 0; i < 12; i++) {
    const x = i * 110 - cameraX * 0.08;
    const height = 45 + (i * 23) % 65;
    ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x + 55, 470 - height); ctx.lineTo(x + 110, 470); ctx.fill();
  }
  if (isSecondStage) {
    ctx.strokeStyle = "#ff6b8a55";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const x = (i * 230 - cameraX * 0.2) % WIDTH;
      ctx.beginPath(); ctx.moveTo(x, 190); ctx.lineTo(x + 120, 470); ctx.stroke();
    }
  }
}

function drawStars() {
  for (let i = 0; i < 55; i++) {
    ctx.fillStyle = i % 5 === 0 ? "#8be9fdcc" : "#ffffff99";
    const x = (i * 173) % WIDTH; const y = 25 + (i * 67) % 240;
    const size = i % 5 === 0 ? 3 : 2;
    ctx.fillRect(x, y, size, size);
  }
}

function drawPlatform(platform) {
  const gradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
  gradient.addColorStop(0, "#263567"); gradient.addColorStop(1, "#151b3e");
  ctx.fillStyle = gradient; ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  ctx.fillStyle = "#69f0c1"; ctx.fillRect(platform.x, platform.y, platform.width, 6);
  ctx.fillStyle = "#34558a"; ctx.fillRect(platform.x, platform.y + 8, platform.width, 3);
  ctx.fillStyle = "#0a102b99";
  for (let x = platform.x + 18; x < platform.x + platform.width; x += 42) ctx.fillRect(x, platform.y + 25, 2, platform.height - 25);
}

function drawEnemy(enemy) {
  if (!enemy.alive) return;
  ctx.fillStyle = "#ff4f79"; ctx.fillRect(enemy.x, enemy.y + 5, enemy.width, enemy.height - 5);
  ctx.fillStyle = "#ff9b6a"; ctx.fillRect(enemy.x + 5, enemy.y, enemy.width - 10, 8);
  ctx.fillStyle = "#24163f"; ctx.fillRect(enemy.x + 7, enemy.y + 15, 6, 6); ctx.fillRect(enemy.x + 21, enemy.y + 15, 6, 6);
  ctx.fillStyle = "#ffcf70"; ctx.fillRect(enemy.x + 8, enemy.y + 31, enemy.width - 16, 4);
}

function drawGoal() {
  ctx.shadowColor = "#69f0c1"; ctx.shadowBlur = 18;
  ctx.fillStyle = "#69f0c1"; ctx.fillRect(goalX, 300, 8, 170);
  ctx.fillStyle = "#ff5c8a"; ctx.beginPath(); ctx.moveTo(goalX + 8, 300); ctx.lineTo(goalX + 90, 325); ctx.lineTo(goalX + 8, 350); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawPlayer() {
  if (player.invincible > 0 && Math.floor(player.invincible * 12) % 2) return;
  ctx.fillStyle = "#7bdff2"; ctx.fillRect(player.x, player.y + 7, player.width, player.height - 7);
  ctx.fillStyle = "#d8f7ff"; ctx.fillRect(player.x + 5, player.y, player.width - 10, 10);
  ctx.fillStyle = "#20204b"; ctx.fillRect(player.x + (player.facing > 0 ? 21 : 5), player.y + 14, 6, 6);
  ctx.fillStyle = "#ff5c8a";
  ctx.fillRect(player.x + (player.facing > 0 ? -7 : player.width), player.y + 20, 7, 18);
  if (player.attackTimer > 0) {
    ctx.shadowColor = "#fff09a"; ctx.shadowBlur = 12;
    ctx.fillStyle = "#fff09a";
    const x = player.facing > 0 ? player.x + player.width : player.x - 42;
    ctx.fillRect(x, player.y + 14, 42, 8);
    ctx.shadowBlur = 0;
  }
}

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
  if (["ArrowUp", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  if ((event.key === " " || event.key === "ArrowUp" || event.key === "w") && player.grounded && gameState === "playing") player.vy = -player.jump;
  if ((event.key.toLowerCase() === "x" || event.key === "Enter") && gameState === "playing") player.attackTimer = 0.18;
});
window.addEventListener("keyup", (event) => { keys[event.key] = false; });
restartButton.addEventListener("click", () => {
  if (gameState === "stage-clear") {
    gameState = "playing";
    message.classList.add("hidden");
    statusElement.textContent = "STAGE 2　ゴールを目指そう";
    return;
  }
  resetGame();
});

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.033);
  lastTime = timestamp;
  update(dt); draw(); requestAnimationFrame(loop);
}

loadLevel(currentStage);
updateHp();
requestAnimationFrame(loop);
