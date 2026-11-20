const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const messageEl = document.getElementById("message");

// 1. Load Background Image (1600 x 1203)
const bgImg = new Image();
bgImg.src = "background.png?v=" + Date.now();
let bgLoaded = false;
bgImg.onload = () => (bgLoaded = true);

const bgWidth = 851;
let bgX = 0;
const CROP_LEFT_RIGHT = 180;
const CROP_TOP_BOTTOM = 140;

// 2. Load Bird Image (bird.png)
const birdImg = new Image();
birdImg.src = "bird.png?v=" + Date.now();
let birdImgLoaded = false;
birdImg.onload = () => (birdImgLoaded = true);

// 3. Load Pipe Image (pipe.png)
const pipeImg = new Image();
pipeImg.src = "pipe.png?v=" + Date.now();
let pipeImgLoaded = false;
pipeImg.onload = () => (pipeImgLoaded = true);

// Game Variables
let bird = { x: 50, y: 240, width: 60, height: 60, velocity: 0, rotation: 0 };
const gravity = 0.45;
const jumpStrength = -7.5;

let pipes = [];
const pipeWidth = 44;
const pipeGap = 200;
let frame = 0;
let score = 0;
let highScore = Number(localStorage.getItem("flappyHighScore")) || 0; // Saved best score
let flapAnim = 0; // Controls the flap bounce/squash animation
let gameStarted = false;
let gameOver = false;

function flap() {
  if (gameOver) {
    resetGame();
    return;
  }
  if (!gameStarted) {
    gameStarted = true;
    messageEl.style.display = "none";
  }
  bird.velocity = jumpStrength;
  flapAnim = 1; // Starts the flap animation pulse
}


document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") flap();
});
canvas.addEventListener("mousedown", flap);
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  flap();
});

function resetGame() {
  bird = { x: 50, y: 240, width: 60, height: 60, velocity: 0, rotation: 0, scale: 1 };
  pipes = [];
  frame = 0;
  score = 0;
  gameOver = false;
  gameStarted = false;
  messageEl.textContent = "Press SPACE or Click to Flap!";
  messageEl.style.display = "block";
}


function drawBackground() {
  if (!bgLoaded) return;

  if (!gameOver) {
    bgX -= 1.2;
    if (bgX <= -bgWidth) bgX += bgWidth;
  }

  const x = Math.floor(bgX);
  const srcW = bgImg.width - CROP_LEFT_RIGHT * 2;
  const srcH = bgImg.height - CROP_TOP_BOTTOM * 2;

  ctx.drawImage(bgImg, CROP_LEFT_RIGHT, CROP_TOP_BOTTOM, srcW, srcH, x, 0, bgWidth + 3, canvas.height);
  ctx.drawImage(bgImg, CROP_LEFT_RIGHT, CROP_TOP_BOTTOM, srcW, srcH, x + bgWidth, 0, bgWidth + 3, canvas.height);
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);

  // Smooth tilt up when rising, down when falling
  bird.rotation = Math.min(Math.max(bird.velocity * 0.08, -0.45), 1.2);
  ctx.rotate(bird.rotation);

  // Flapping animation: quick squash-and-stretch pulse on flap + subtle hover wave
  let scaleX = 1;
  let scaleY = 1;
  if (flapAnim > 0) {
    scaleX = 1 + Math.sin(flapAnim * Math.PI) * 0.18;
    scaleY = 1 - Math.sin(flapAnim * Math.PI) * 0.18;
    flapAnim = Math.max(0, flapAnim - 0.09);
  } else if (!gameOver) {
    // Gentle rhythmic wing pulse while flying/hovering
    const pulse = Math.sin(frame * 0.25) * 0.05;
    scaleX = 1 + pulse;
    scaleY = 1 - pulse;
  }
  ctx.scale(scaleX, scaleY);

  if (birdImgLoaded) {
    ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
  } else {
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
  }

  ctx.restore();
}


function drawPipes() {
  pipes.forEach((pipe) => {
    const bottomPipeHeight = canvas.height - pipe.bottom;
    const capHeight = 26;
    const capOverhang = 5;

    // Helper function to draw a shaded 3D arcade pipe body
    function drawPipeBody(x, y, w, h) {
      if (h <= 0) return;
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, "#1e7e34");    // Dark shadow edge
      grad.addColorStop(0.25, "#5cd65c"); // Bright glossy highlight
      grad.addColorStop(0.55, "#2ecc71"); // Main vibrant green
      grad.addColorStop(1, "#145a32");    // Deep right shadow

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Crisp dark outline
      ctx.strokeStyle = "#0b3d1e";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }

    // Helper function to draw the 3D pipe rim/cap
    function drawPipeCap(x, y, w, h) {
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, "#196f3d");
      grad.addColorStop(0.25, "#82e0aa"); // Brighter rim shine
      grad.addColorStop(0.55, "#28b463");
      grad.addColorStop(1, "#0e4b27");

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Glossy white highlight strip on the cap
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillRect(x + 8, y + 3, 6, h - 6);

      // Crisp dark outline
      ctx.strokeStyle = "#0b3d1e";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }

    // 1. Draw Top Pipe (Shaft + Bottom Rim)
    drawPipeBody(pipe.x, 0, pipeWidth, pipe.top - capHeight);
    drawPipeCap(pipe.x - capOverhang, pipe.top - capHeight, pipeWidth + capOverhang * 2, capHeight);

    // 2. Draw Bottom Pipe (Shaft + Top Rim)
    drawPipeBody(pipe.x, pipe.bottom + capHeight, pipeWidth, bottomPipeHeight - capHeight);
    drawPipeCap(pipe.x - capOverhang, pipe.bottom, pipeWidth + capOverhang * 2, capHeight);
  });
}



function drawScore() {
  ctx.save();
  ctx.textAlign = "center";

  // Current Score
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.font = "bold 48px Arial";
  ctx.strokeText(score, canvas.width / 2, 62);
  ctx.fillText(score, canvas.width / 2, 62);

  // High Score Badge
  ctx.font = "bold 18px Arial";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#FFD700";
  ctx.strokeText(`BEST: ${highScore}`, canvas.width / 2, 92);
  ctx.fillText(`BEST: ${highScore}`, canvas.width / 2, 92);

  ctx.restore();
}


function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  if (gameStarted && !gameOver) {
    frame++;
    bird.velocity += gravity;
    bird.y += bird.velocity;

    if (frame % 100 === 0) {
      const topHeight = Math.floor(Math.random() * 260) + 60;
      pipes.push({
        x: canvas.width,
        top: topHeight,
        bottom: topHeight + pipeGap,
        passed: false,
      });
        } else if (!gameStarted) {
    frame++;
    bird.y = 240 + Math.sin(frame * 0.08) * 8;
  }

    pipes.forEach((pipe) => {
      pipe.x -= 2.5;

      // Score increases when bird passes pipe
      if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
        score++;
        pipe.passed = true;
      }

      // Collision check (with 4px forgiveness so transparent edges don't feel unfair)
            const pad = 8; // Gives 8px forgiveness around the 46x46 bird sprite
      if (
        bird.x + pad < pipe.x + pipeWidth &&
        bird.x + bird.width - pad > pipe.x &&
        (bird.y + pad < pipe.top || bird.y + bird.height - pad > pipe.bottom)
      ) {
        endGame();
      }
    });

    pipes = pipes.filter((pipe) => pipe.x + pipeWidth > 0);

    if (bird.y + bird.height > canvas.height || bird.y < 0) {
      endGame();
    }
  } else if (!gameStarted) {
    // Smooth idle hover animation before starting
    frame++;
    bird.y = 250 + Math.sin(frame * 0.08) * 8;
  }

  drawPipes();
  drawBird();
  drawScore();
  requestAnimationFrame(update);
}

function endGame() {
  gameOver = true;
  let isNewBest = false;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("flappyHighScore", highScore);
    isNewBest = true;
  }

  messageEl.textContent = isNewBest
    ? `NEW BEST: ${highScore}! — Click to Restart`
    : `Game Over! Score: ${score} (Best: ${highScore}) — Click to Restart`;
  messageEl.style.display = "block";
}


update();
