const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySub = document.getElementById('overlaySub');
const overlayBtn = document.getElementById('overlayBtn');
const homeBtn = document.getElementById('homeBtn');
const controls = document.getElementById('controls');

const LEVELS = [
  ["############", "#..........#", "#..........#", "#..........#", "#....##....#", "#....##....#", "#....##....#", "#....##....#", "#..........#", "#..........#", "#..........#", "############"],
  ["############", "#..........#", "#..#....#..#", "#..........#", "#..........#", "#..........#", "#..........#", "#..........#", "#..........#", "#..#....#..#", "#..........#", "############"],
  ["############", "#....##....#", "#....##....#", "#....##....#", "#..........#", "#..........#", "#..........#", "#..........#", "#....##....#", "#....##....#", "#....##....#", "############"],
  ["############", "#....#.....#", "#....#.....#", "#....#.....#", "#..........#", "#..........#", "#..........#", "#..........#", "#....#.....#", "#....#.....#", "#....#.....#", "############"],
  ["############", "#..........#", "#.########.#", "#..........#", "#.########.#", "#..........#", "#.########.#", "#..........#", "#.########.#", "#..........#", "#..........#", "############"],
  ["############", "#..........#", "#.#.#.#.#..#", "#..........#", "#.#.#.#.#..#", "#..........#", "#.#.#.#.#..#", "#..........#", "#.#.#.#.#..#", "#..........#", "#..........#", "############"],
  ["############", "#..........#", "#..######..#", "#..#....#..#", "#..#....#..#", "#..#....#..#", "#..#....#..#", "#..#....#..#", "#..##.##...#", "#..........#", "#..........#", "############"],
  ["############", "#..........#", "#..........#", "#..##..##..#", "#..........#", "#..........#", "#..##..##..#", "#..........#", "#..........#", "#..##..##..#", "#..........#", "############"],
  ["############", "#..........#", "#.##....##.#", "#.#......#.#", "#.#.#.##.#.#", "#.#.#..#.#.#", "#.#.#..#.#.#", "#.#.####.#.#", "#.#......#.#", "#.########.#", "#..........#", "############"],
  ["############", "#....#.....#", "#.##.#.###.#", "#.#........#", "#.#.####.#.#", "#...#..#...#", "#.###.##.#.#", "#.#......#.#", "#.#.####.#.#", "#........#.#", "#.########.#", "############"]
];

const PLAYER_SIZE = 26;
const APPLE = 20;
const TARGET_APPLES = 30;

let level = 1;
let score = 0;
let totalScore = 0;
let col = 1, row = 1;
let px = 0, py = 0, targetPX = 0, targetPY = 0;
let apple = { x: 0, y: 0 };
let running = false;

function getTileSize() { return canvas.width / 12; }
function currentMap() { return LEVELS[level - 1]; }

function spawnApple() {
  const map = currentMap();
  const ROWS = map.length, COLS = map[0].length;
  const all = [], nearby = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (map[r][c] !== '.') continue;
      all.push({ r, c });
      if (Math.abs(r - row) + Math.abs(c - col) >= 3) nearby.push({ r, c });
    }
  }
  const pool = nearby.length ? nearby : all;
  if (!pool.length) return { x: 5, y: 5 };
  const t = pool[Math.floor(Math.random() * pool.length)];
  const ts = getTileSize();
  return { x: t.c * ts + (ts - APPLE) / 2, y: t.r * ts + (ts - APPLE) / 2 };
}

function tryMove(dx, dy) {
  if (!running) return;
  const map = currentMap();
  const nc = col + dx, nr = row + dy;
  if (!map[nr] || map[nr][nc] !== '.') return;
  col = nc; row = nr;
  const ts = getTileSize();
  targetPX = col * ts + (ts - PLAYER_SIZE) / 2;
  targetPY = row * ts + (ts - PLAYER_SIZE) / 2;

  if (targetPX < apple.x + APPLE && targetPX + PLAYER_SIZE > apple.x &&
      targetPY < apple.y + APPLE && targetPY + PLAYER_SIZE > apple.y) {
    score++;
    totalScore++;
    if (score >= TARGET_APPLES) {
      levelComplete();
    } else {
      apple = spawnApple();
    }
  }
}

function bind(dir, dx, dy) {
  const btn = document.querySelector(`[data-dir="${dir}"]`);
  let timer = null;
  const start = (e) => { e.preventDefault(); tryMove(dx, dy); clearInterval(timer); timer = setInterval(() => tryMove(dx, dy), 100); };
  const stop = () => { clearInterval(timer); timer = null; };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointerleave', stop);
  btn.addEventListener('pointercancel', stop);
}
bind('up', 0, -1); bind('down', 0, 1); bind('left', -1, 0); bind('right', 1, 0);

function showOverlay(title, sub, btnText, action) {
  overlayTitle.textContent = title;
  overlaySub.textContent = sub;
  overlayBtn.textContent = btnText;
  overlayBtn.onclick = action;
  overlay.classList.remove('hidden');
}
function hideOverlay() { overlay.classList.add('hidden'); }

function startLevel(n) {
  level = n;
  score = 0;
  col = 1; row = 1;
  const ts = getTileSize();
  px = targetPX = col * ts + (ts - PLAYER_SIZE) / 2;
  py = targetPY = row * ts + (ts - PLAYER_SIZE) / 2;
  apple = spawnApple();
  hideOverlay();
  controls.classList.remove('hidden');
  homeBtn.classList.remove('hidden');
  running = true;
}

function levelComplete() {
  running = false;
  homeBtn.classList.add('hidden');
  controls.classList.add('hidden');
  if (level < 10) {
    const next = level + 1;
    showOverlay(`Уровень ${level} пройден! 🎉`, `Всего яблок: ${totalScore}`, 'Дальше →', () => startLevel(next));
  } else {
    showOverlay('🏆 ПОБЕДА! 🏆', `Ты собрал ${totalScore} яблок!`, 'Играть снова', () => { totalScore = 0; startLevel(1); });
  }
}

function goToMenu() {
  running = false;
  hideOverlay();
  controls.classList.add('hidden');
  homeBtn.classList.add('hidden');
  showOverlay("APPLE LESTER'S", 'Собирай яблоки, проходи лабиринты', 'Играть', () => { totalScore = 0; startLevel(1); });
}
homeBtn.addEventListener('click', goToMenu);

function draw() {
  px += (targetPX - px) * 0.3;
  py += (targetPY - py) * 0.3;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const map = currentMap();
  const ROWS = map.length, COLS = map[0].length;
  const ts = getTileSize();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (map[r][c] !== '#') continue;
      ctx.fillStyle = '#3a3a5a';
      ctx.fillRect(c * ts, r * ts, ts, ts);
      ctx.strokeStyle = '#5a5a8a';
      ctx.lineWidth = 1;
      ctx.strokeRect(c * ts + 0.5, r * ts + 0.5, ts - 1, ts - 1);
    }
  }

  if (running) {
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.arc(apple.x + APPLE / 2, apple.y + APPLE / 2, APPLE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a9d3f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(apple.x + APPLE / 2, apple.y + 4);
    ctx.lineTo(apple.x + APPLE / 2 + 4, apple.y);
    ctx.stroke();
  }

  ctx.fillStyle = '#4dabf7';
  ctx.fillRect(px, py, PLAYER_SIZE, PLAYER_SIZE);

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, canvas.width, 26);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(`Уровень ${level}/10`, 8, 13);
  ctx.textAlign = 'center';
  ctx.fillText(`🍎 ${score}/${TARGET_APPLES}`, canvas.width / 2, 13);
  ctx.textAlign = 'right';
  ctx.fillText(`Всего: ${totalScore}`, canvas.width - 8, 13);

  requestAnimationFrame(draw);
}

function resizeCanvas() {
  const size = Math.min(window.innerWidth - 20, 400);
  canvas.width = size;
  canvas.height = size;
  const ts = getTileSize();
  px = targetPX = col * ts + (ts - PLAYER_SIZE) / 2;
  py = targetPY = row * ts + (ts - PLAYER_SIZE) / 2;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

showOverlay("APPLE LESTER'S", 'Собирай яблоки, проходи лабиринты', 'Играть', () => { totalScore = 0; startLevel(1); });
draw();
