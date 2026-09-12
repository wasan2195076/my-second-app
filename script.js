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
    gradient.addColorStop(0, "#18253d"); gradient.addColorStop(0.55, "#334d63"); gradient.addColorStop(1, "#1d2930");
  } else {
    gradient.addColorStop(0, "#79c8eb"); gradient.addColorStop(0.7, "#b8e5f2"); gradient.addColorStop(1, "#75a64f");
  }
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawBackdrop();
  ctx.save(); ctx.translate(-cameraX, 0);
  platforms.forEach(drawPlatform);
  enemies.forEach(drawEnemy);
  drawGoal();
  drawPlayer();
  ctx.restore();
}

function drawBackdrop() {
  const isSecondStage = currentStage === 2;
  ctx.fillStyle = isSecondStage ? "#17232b" : "#fff3a6";
  ctx.fillRect(760 - cameraX * 0.15, 55, 54, 54);
  drawCloud(150 - cameraX * 0.08, 92, 1);
  drawCloud(560 - cameraX * 0.08, 155, 0.8);
  drawCloud(870 - cameraX * 0.08, 68, 1.2);
  if (isSecondStage) {
    ctx.fillStyle = "#18242b";
    for (let i = 0; i < 14; i++) {
      const x = i * 95 - cameraX * 0.12;
      const height = 70 + (i * 31) % 110;
      ctx.fillRect(x, 470 - height, 72, height);
      ctx.fillStyle = "#8bc34a";
      ctx.fillRect(x + 12, 470 - height - 8, 48, 8);
      ctx.fillStyle = "#263238";
    }
  } else {
    for (let i = 0; i < 9; i++) {
      const x = i * 135 - cameraX * 0.1;
      ctx.fillStyle = "#477b3d";
      ctx.fillRect(x + 30, 360, 18, 110);
      ctx.fillStyle = "#2e6b3b";
      ctx.fillRect(x, 320, 78, 55);
      ctx.fillRect(x + 15, 295, 48, 35);
    }
  }
}

function drawCloud(x, y, scale) {
  ctx.fillStyle = "#ffffffcc";
  ctx.fillRect(x, y, 120 * scale, 24 * scale);
  ctx.fillRect(x + 22 * scale, y - 16 * scale, 55 * scale, 40 * scale);
  ctx.fillRect(x + 66 * scale, y - 8 * scale, 40 * scale, 32 * scale);
}

function drawStars() {
  ctx.fillStyle = "#ffffff99";
  for (let i = 0; i < 40; i++) {
    ctx.fillRect((i * 173) % WIDTH, 25 + (i * 67) % 240, 2, 2);
  }
}

function drawPlatform(platform) {
  ctx.fillStyle = "#795548"; ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  ctx.fillStyle = "#6aa646"; ctx.fillRect(platform.x, platform.y, platform.width, 9);
  ctx.fillStyle = "#8d6e63";
  for (let x = platform.x + 15; x < platform.x + platform.width; x += 38) {
    ctx.fillRect(x, platform.y + 25, 16, 12);
    ctx.fillRect(x + 20, platform.y + 48, 12, 10);
  }
  ctx.strokeStyle = "#4e342e"; ctx.lineWidth = 2;
  ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
}

function drawEnemy(enemy) {
  if (!enemy.alive) return;
  ctx.fillStyle = "#4f8f3a"; ctx.fillRect(enemy.x, enemy.y + 8, enemy.width, enemy.height - 8);
  ctx.fillStyle = "#6eaa43"; ctx.fillRect(enemy.x, enemy.y, enemy.width, 12);
  ctx.fillStyle = "#263238";
  ctx.fillRect(enemy.x + 6, enemy.y + 15, 8, 7); ctx.fillRect(enemy.x + 20, enemy.y + 15, 8, 7);
  ctx.fillStyle = "#dce775"; ctx.fillRect(enemy.x + 8, enemy.y + 32, enemy.width - 16, 4);
  ctx.fillStyle = "#33612f";
  ctx.fillRect(enemy.x + 3, enemy.y + 38, 10, 4); ctx.fillRect(enemy.x + 21, enemy.y + 38, 10, 4);
}

function drawGoal() {
  ctx.fillStyle = "#5e35b1"; ctx.fillRect(goalX, 300, 78, 170);
  ctx.fillStyle = "#7e57c2"; ctx.fillRect(goalX + 12, 312, 54, 146);
  ctx.fillStyle = "#b39ddb"; ctx.fillRect(goalX + 24, 325, 30, 120);
  ctx.strokeStyle = "#4527a0"; ctx.lineWidth = 5; ctx.strokeRect(goalX, 300, 78, 170);
}

function drawPlayer() {
  if (player.invincible > 0 && Math.floor(player.invincible * 12) % 2) return;
  ctx.fillStyle = "#c98b5b"; ctx.fillRect(player.x + 5, player.y, 22, 16);
  ctx.fillStyle = "#4b9bd6"; ctx.fillRect(player.x + 4, player.y + 16, 24, 20);
  ctx.fillStyle = "#2f5d9b"; ctx.fillRect(player.x + 5, player.y + 36, 9, 10); ctx.fillRect(player.x + 18, player.y + 36, 9, 10);
  ctx.fillStyle = "#d7efff";
  ctx.fillRect(player.x + (player.facing > 0 ? 21 : 5), player.y + 6, 5, 5);
  ctx.fillStyle = "#c98b5b";
  ctx.fillRect(player.x + (player.facing > 0 ? -5 : player.width), player.y + 18, 5, 16);
  if (player.attackTimer > 0) {
    ctx.fillStyle = "#b0bec5";
    const x = player.facing > 0 ? player.x + player.width : player.x - 42;
    ctx.fillRect(x, player.y + 14, 42, 7);
    ctx.fillStyle = "#eceff1"; ctx.fillRect(x + 5, player.y + 14, 30, 3);
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
