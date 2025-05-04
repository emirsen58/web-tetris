const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');

const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const highScoreDisplay = document.getElementById('high-score');
const finalScoreDisplay = document.getElementById('final-score');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

let gameInterval;
let dropInterval = 1000;
let dropCounter = 0;
let lastTime = 0;

let score = 0;
let timeElapsed = 0;
let timerInterval;

let gameActive = false;

// Initialize canvas size
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// Draw the grid on the canvas
function drawGrid() {
  ctx.strokeStyle = '#333';
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK_SIZE, 0);
    ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK_SIZE);
    ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
    ctx.stroke();
  }
}

// Tetromino shapes (4x4 matrices)
const TETROMINOS = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ]
};

// Colors for each Tetromino type
const COLORS = {
  I: '#00f0f0',
  J: '#0000f0',
  L: '#f0a000',
  O: '#f0f000',
  S: '#00f000',
  T: '#a000f0',
  Z: '#f00000'
};

// Draw a Tetromino on the canvas at (x, y) grid position
function drawTetromino(tetromino, x, y) {
  const shape = tetromino.shape ? tetromino.shape : TETROMINOS[tetromino];
  const color = tetromino.tetromino ? COLORS[tetromino.tetromino] : COLORS[tetromino];
  ctx.fillStyle = color;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        ctx.fillRect(
          (x + col) * BLOCK_SIZE,
          (y + row) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
        ctx.strokeStyle = '#222';
        ctx.strokeRect(
          (x + col) * BLOCK_SIZE,
          (y + row) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
      }
    }
  }
}

function gameLoop(time = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawBoard();

  // Automatic drop
  if (!lastTime) lastTime = time;
  dropCounter += time - lastTime;
  lastTime = time;

  if (dropCounter > dropInterval) {
    if (!movePiece(0, 1)) {
      // Piece reached bottom or blocked - handled in movePiece
    }
    dropCounter = 0;
  }

  // Draw current piece
  drawTetromino(currentPiece, currentPiece.x, currentPiece.y);

  if (gameActive) {
    requestAnimationFrame(gameLoop);
  }
}

function startGame() {
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');

  // Reset board
  for (let r = 0; r < ROWS; r++) {
    board[r].fill(0);
  }

  score = 0;
  timeElapsed = 0;
  scoreDisplay.textContent = 'Score: ' + score;
  timerDisplay.textContent = 'Time: ' + timeElapsed + 's';

  spawnPiece();

  gameActive = true;

  // Start timer
  timerInterval = setInterval(() => {
    timeElapsed++;
    timerDisplay.textContent = 'Time: ' + timeElapsed + 's';
  }, 1000);

  // Start game loop
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameActive = false;
  clearInterval(timerInterval);

  gameScreen.classList.add('hidden');
  gameOverScreen.classList.remove('hidden');
  finalScoreDisplay.textContent = 'Your Score: ' + score;

  // TODO: Save high score to localStorage and update display
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Current piece state
// Game board: 2D array to track placed blocks (0 = empty, color index otherwise)
let board = [];
for (let r = 0; r < ROWS; r++) {
  board[r] = new Array(COLS).fill(0);
}

// Current piece state
let currentPiece = {
  tetromino: null,
  shape: null,
  x: 0,
  y: 0
};

// Generate a random Tetromino type and shape
function randomTetromino() {
  const types = Object.keys(TETROMINOS);
  const tetromino = types[Math.floor(Math.random() * types.length)];
  return {
    tetromino,
    shape: TETROMINOS[tetromino]
  };
}

// Spawn a new piece at the top
function spawnPiece() {
  const piece = randomTetromino();
  currentPiece.tetromino = piece.tetromino;
  currentPiece.shape = piece.shape;
  currentPiece.x = Math.floor(COLS / 2) - Math.ceil(currentPiece.shape[0].length / 2);
  currentPiece.y = 0;
  if (!isValidPosition(currentPiece.x, currentPiece.y, currentPiece.shape)) {
    // Game over condition
    endGame();
  }
}

// Rotate a matrix clockwise
function rotateMatrix(matrix) {
  const N = matrix.length;
  let result = [];
  for (let i = 0; i < N; i++) {
    result[i] = [];
    for (let j = 0; j < N; j++) {
      result[i][j] = matrix[N - j - 1][i];
    }
  }
  return result;
}

// Rotate piece clockwise
function rotatePiece() {
  const rotated = rotateMatrix(currentPiece.shape);
  if (isValidPosition(currentPiece.x, currentPiece.y, rotated)) {
    currentPiece.shape = rotated;
  }
}

// Generate a random Tetromino type
// Removed duplicate function to avoid conflicts

// Merge current piece into the board
function mergePiece() {
  const shape = currentPiece.shape;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        let boardX = currentPiece.x + col;
        let boardY = currentPiece.y + row;
        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
          board[boardY][boardX] = currentPiece.tetromino;
        }
      }
    }
  }
  clearLines();
}

// Clear completed lines and shift above lines down
function clearLines() {
  let linesCleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== 0)) {
      board.splice(y, 1);
      board.unshift(new Array(COLS).fill(0));
      linesCleared++;
      y++; // recheck same row after shifting
    }
  }
  if (linesCleared > 0) {
    score += linesCleared * 10;
    scoreDisplay.textContent = 'Score: ' + score;
  }
}

function isValidPosition(x, y, shape) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        let newX = x + col;
        let newY = y + row;
        if (
          newX < 0 ||
          newX >= COLS ||
          newY >= ROWS ||
          (newY >= 0 && board[newY][newX] !== 0)
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

function movePiece(dx, dy) {
  const shape = currentPiece.shape;
  if (isValidPosition(currentPiece.x + dx, currentPiece.y + dy, shape)) {
    currentPiece.x += dx;
    currentPiece.y += dy;
    return true;
  } else if (dy === 1) {
    // Cannot move down, lock piece and spawn new one
    mergePiece();
    spawnPiece();
    return false;
  }
  return false;
}

function rotatePiece() {
  const rotated = rotateMatrix(currentPiece.shape);
  if (isValidPosition(currentPiece.x, currentPiece.y, rotated)) {
    currentPiece.shape = rotated;
  }
}

// Keyboard controls
document.addEventListener('keydown', event => {
  if (!gameActive) return;
  switch(event.key) {
    case 'ArrowLeft':
      movePiece(-1, 0);
      break;
    case 'ArrowRight':
      movePiece(1, 0);
      break;
    case 'ArrowDown':
      movePiece(0, 1);
      break;
    case 'ArrowUp':
      rotatePiece();
      break;
  }
});

// Touch controls for mobile devices
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

canvas.addEventListener('touchstart', (e) => {
  if (!gameActive) return;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = Date.now();
  e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
  if (!gameActive) return;
  const touch = e.changedTouches[0];
  const touchEndX = touch.clientX;
  const touchEndY = touch.clientY;
  const touchEndTime = Date.now();

  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  const dt = touchEndTime - touchStartTime;

  const swipeThreshold = 30; // Minimum distance in px for swipe
  const swipeTimeThreshold = 500; // Max time in ms for swipe

  // Detect swipe
  if (dt < swipeTimeThreshold) {
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
      // Horizontal swipe
      if (dx > 0) {
        movePiece(1, 0); // Swipe right
      } else {
        movePiece(-1, 0); // Swipe left
      }
    } else if (Math.abs(dy) > swipeThreshold) {
      // Vertical swipe
      if (dy > 0) {
        movePiece(0, 1); // Swipe down
      }
    }
  } else {
    // If not a swipe, consider it a tap for rotation
    rotatePiece();
  }
  e.preventDefault();
});

// On-screen control buttons event listeners
document.getElementById('btn-left').addEventListener('click', () => {
  if (!gameActive) return;
  movePiece(-1, 0);
});

document.getElementById('btn-right').addEventListener('click', () => {
  if (!gameActive) return;
  movePiece(1, 0);
});

document.getElementById('btn-down').addEventListener('click', () => {
  if (!gameActive) return;
  movePiece(0, 1);
});

document.getElementById('btn-rotate').addEventListener('click', () => {
  if (!gameActive) return;
  rotatePiece();
});

// Game loop with automatic drop
// Draw the board blocks
function drawBoard() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col]) {
        drawTetromino(board[row][col], col, row);
      }
    }
  }
}

function gameLoop(time = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawBoard();

  // Automatic drop
  if (!lastTime) lastTime = time;
  dropCounter += time - lastTime;
  lastTime = time;

  if (dropCounter > dropInterval) {
    if (!movePiece(0, 1)) {
      // Piece reached bottom or blocked - handled in movePiece
    }
    dropCounter = 0;
  }

  // Draw current piece
  drawTetromino(currentPiece, currentPiece.x, currentPiece.y);

  if (gameActive) {
    requestAnimationFrame(gameLoop);
  }
}
