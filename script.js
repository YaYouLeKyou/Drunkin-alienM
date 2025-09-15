const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// --- Images ---
const playerImg = new Image();
playerImg.src = "./media/alien.png";
const backgroundImg = new Image();
backgroundImg.src = "./media/backgroundMorty.png";
const topPipeImg = new Image();
topPipeImg.src = "./media/toppipe.png";
const bottomPipeImg = new Image();
bottomPipeImg.src = "./media/bottompipe.png";
const beerImg = new Image();
beerImg.src = "./media/beer.png";

const enemy1Img = new Image();
enemy1Img.src = "./media/insectesolo3-rbg.png";
const enemy2Img = new Image();
enemy2Img.src = "./media/insectesolo2-rbg.png";
const enemy3Img = new Image();
enemy3Img.src = "./media/insectesolo.png";
const shieldImg = new Image();
shieldImg.src = "./media/shield.png";

// --- Flags ---
let playerImgLoaded = false;
let backgroundLoaded = false;
let topPipeLoaded = false;
let bottomPipeLoaded = false;
let beerImgLoaded = false;
let enemy1ImgLoaded = false;
let enemy2ImgLoaded = false;
let enemy3ImgLoaded = false;
let shieldImgLoaded = false;

playerImg.onload = () => { playerImgLoaded = true; startGameIfReady(); };
backgroundImg.onload = () => { backgroundLoaded = true; startGameIfReady(); };
topPipeImg.onload = () => { topPipeLoaded = true; startGameIfReady(); };
bottomPipeImg.onload = () => { bottomPipeLoaded = true; startGameIfReady(); };
beerImg.onload = () => { beerImgLoaded = true; startGameIfReady(); };
enemy1Img.onload = () => { enemy1ImgLoaded = true; startGameIfReady(); };
enemy2Img.onload = () => { enemy2ImgLoaded = true; startGameIfReady(); };
enemy3Img.onload = () => { enemy3ImgLoaded = true; startGameIfReady(); };
shieldImg.onload = () => { shieldImgLoaded = true; startGameIfReady(); };


// --- General settings ---
let gamePlaying = false;
let isPaused = false; // New variable for pause state
let animationFrameId; // To store the ID returned by requestAnimationFrame
let gravity = 0.12;
let initialSpeed = 4;
let speed = initialSpeed;
let displaySpeed = speed;
const speedIncreaseAmount = 0.5;

let initialEnemySpeed = 5;
let enemySpeed = initialEnemySpeed;
const enemySpeedIncreaseAmount = 0.1;

const size = [51, 30];
let jump = -4.5;
const cTenth = canvas.width / 20;
let thrustAmount = 0.4;

let isShooting = false;
let shootInterval = 10; // frames between shots
let shootTimer = 0;

// Speed-up message
let showSpeedUpAd = false;
let speedUpAdTimer = 0;
const speedUpAdDuration = 60;

// --- Mobile adjustments ---
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
if (isMobile) {
  gravity = 0.036;
  jump = -0.8;
  initialSpeed = 2.5;
  initialEnemySpeed = 2;
  thrustAmount = 0.2;
  speed = initialSpeed;
  enemySpeed = initialEnemySpeed;
}

// --- Pipe settings ---
const pipeWidth = 150;
const pipeGap = 270;
const pipeLoc = () => Math.random() * (canvas.height - (pipeGap - pipeWidth) - pipeWidth);

// --- Item settings ---
const itemWidth = 30;
const itemHeight = 30;
const fixedHorizontalBeerSpacing = 50; // New constant for consistent spacing
const verticalBeerOffsetAmount = 24; // New constant for vertical variation within a line

// --- Game state ---
let index = 0, bestScore = 0, currentScore = 0, beerScore = 0, bestBeerScore = 0, currentKills = 0, bestKills = 0, bossMode = false, bossEntryDelay = 0, pipesEntered = 0, postBossDelayActive = false, bossDefeated = false, hasShield = false;
let onFire = false, onFireTimer = 0;
const ON_FIRE_DURATION = 300; // 5 seconds
let randomBeerSpawnTimer = 0;

let boss2Mode = false, boss2EntryDelay = 0, postBoss2DelayActive = false, boss2Defeated = false; // New
let boss3Mode = false, boss3EntryDelay = 0, postBoss3DelayActive = false, boss3Defeated = false; // New
let pipes = [], flight, flyHeight, isThrusting = false, enemies = [], shots = [], items = [], particles = [];
const shotSpeed = 10;
let boss = null;
let bossShots = [];
let boss1ShotCount = 0;
let boss2 = null; // New
let boss2Shots = []; // New
let boss2ShotCount = 0;
let boss3 = null; // New
let boss3Shots = []; // New
let boss3ShotCount = 0;
let lastAlternatingEnemyType = 'enemy1'; // New global variable
let firstClickDone = false; // New flag for first click
let messageLine1 = ''; // New variable for displaying messages - first line
let messageLine2 = ''; // New variable for displaying messages - second line
let showMessage = false; // New flag to control message display
let messageTimer = 0; // New timer for message display
let messageColor = 'black'; // New variable for message color
let fireworks = []; // New array for fireworks particles
let lastEnemyKillPosition = null;

// --- Beer spawn ---
function spawnBeerItem(x, y) {
  items.push({ x, y, type: 'beer', width: itemWidth, height: itemHeight });
}

function spawnShieldItem(x, y) {
  items.push({ x, y, type: 'shield', width: itemWidth, height: itemHeight });
}


// --- Explosion function ---
function createExplosion(x, y, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      lifespan: 30,
      size: Math.random() * 3 + 1,
    });
  }
}

// --- Message display function ---
function showMessageWithDuration(line1, line2, color, duration) {
  messageLine1 = line1;
  messageLine2 = line2;
  messageColor = color;
  showMessage = true;
  messageTimer = duration;
}

// --- Fireworks function ---
function createFireworks(x, y, count = 30) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    fireworks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lifespan: 60,
      size: Math.random() * 4 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    });
  }
}

// --- Enemy spawn timer ---
let enemySpawnTimer = 0;
const enemyBaseInterval = 120; // frames
const enemyMinInterval = 40;

// Adjust for mobile
const effectiveEnemyBaseInterval = isMobile ? enemyBaseInterval * 2 : enemyBaseInterval;
const effectiveEnemyMinInterval = isMobile ? enemyMinInterval * 2 : enemyMinInterval;

// --- Boss spawn ---
function spawnBoss() {
  boss = {
    x: canvas.width - 150, // Position on the right side
    y: canvas.height, // Start from bottom
    width: 150,
    height: 150,
    hp: 50,
    maxHp: 50,
    vy: -1, // Move upwards
    shootTimer: 240, // Shoots every 4 seconds (initial delay)
    enemySpawnTimer: 180, // Spawns enemy every 3 seconds (3 * 60 frames)
    phase: 'entry', // New phase for boss entry
  };
}

// --- Boss 2 spawn ---
function spawnBoss2() {
  boss2 = {
    x: canvas.width + 150, // Start off-screen right (added boss2.width)
    y: canvas.height, // Start from bottom
    width: 150,
    height: 150,
    hp: 50,
    maxHp: 50,
    vx: -2, // Move left during entry
    vy: -1, // Move upwards
    shootTimer: 210, // Initial delay for first shot (90 + 120 frames for 2 seconds)
    enemySpawnTimer: 120, // Spawns enemy2 more frequently
    phase: 'entry',
  };
}

// --- Boss 3 spawn ---
function spawnBoss3() {
  boss3 = {
    x: canvas.width, // Start off-screen right
    y: canvas.height, // Start from bottom
    width: 150,
    height: 150,
    hp: 50,
    maxHp: 50,
    vx: -2, // Move left during entry
    vy: -1, // Move upwards
    shootTimer: 210, // Initial delay for first shot (90 + 120 frames for 2 seconds)
    enemySpawnTimer: 120, // Spawns enemy3 more frequently
    phase: 'entry',
  };
}

// --- Setup ---
function setup() {
  currentScore = 0;
  beerScore = 0;
  currentKills = 0;
  flight = jump;
  flyHeight = canvas.height / 2 - size[1] / 2 + 100;
  speed = initialSpeed;
  enemySpeed = initialEnemySpeed;
  pipes = Array(3).fill().map((_, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]);
  enemies = [];
  shots = [];
  items = [];
  particles = [];
  boss = null;
  bossShots = [];
  boss2 = null; // New
  boss2Shots = []; // New
  boss3 = null; // New
  boss3Shots = []; // New
  enemySpawnTimer = effectiveEnemyBaseInterval;
  randomBeerSpawnTimer = 120 + Math.random() * 120; // 2-4 seconds
  showSpeedUpAd = false;
  speedUpAdTimer = 0;
  bossMode = false;
  bossEntryDelay = 0;
  pipesEntered = 0;
  postBossDelayActive = false;
  bossDefeated = false;
  boss2Mode = false; // New
  boss2EntryDelay = 0; // New
  postBoss2DelayActive = false; // New
  boss2Defeated = false; // New
  boss3Mode = false; // New
  boss3EntryDelay = 0; // New
  postBoss3DelayActive = false; // New
  boss3Defeated = false; // New
  boss1ShotCount = 0;
  boss2ShotCount = 0;
  boss3ShotCount = 0;
  lastAlternatingEnemyType = 'enemy1'; // Initialize for alternation
  onFire = false;
  onFireTimer = 0;
  firstClickDone = false; // Reset for new game
  showMessage = false; // Reset message display
  messageTimer = 0; // Reset message timer
  fireworks = []; // Clear fireworks
  hasShield = false;
  lastEnemyKillPosition = null;

}

// --- Spawn functions ---
function spawnEnemy(type) {
  if (type === 'enemy1') {
    const minY = canvas.height * 0.25;
    const maxY = canvas.height * 0.75 - size[1];
    const y = minY + Math.random() * (maxY - minY);
    const variation = (Math.random() - 0.5) * 1;
    enemies.push({ x: canvas.width, y, type: 'enemy1', speedVariation: variation });
  } else if (type === 'enemy2') {
    const startX = canvas.width + 100;
    const startY = Math.random() < 0.5 ? Math.random() * canvas.height * 0.3 : canvas.height - Math.random() * canvas.height * 0.2 - size[1];
    const vx = -enemySpeed;
    const vy = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 1 + 0.5);
    enemies.push({ x: startX, y: startY, vx, vy, rotation: 0, type: 'enemy2' });
  } else if (type === 'enemy3') {
    const vx = -enemySpeed * 0.8;
    const vy = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 1.5 + 0.8);
    enemies.push({ x: canvas.width, y: Math.random() * (canvas.height - size[1]), vx, vy, type: 'enemy3' });
  } else if (type === 'enemy4') { // New enemy4
    const vx = -enemySpeed * 0.9; // Slightly slower than enemy3, faster than enemy1
    const vy = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 0.5 + 0.2); // Small diagonal movement

    const possibleYPositions = [
      0, // Right top
      canvas.height * 0.25, // Right middle high
      canvas.height * 0.5 - size[1] / 2, // Middle right
      canvas.height * 0.75 - size[1], // Right middle down
      canvas.height - size[1] // Right down
    ];

    const y = possibleYPositions[Math.floor(Math.random() * possibleYPositions.length)];

    enemies.push({ x: canvas.width, y, type: 'enemy4', vx, vy });
  }
}

// --- Probabilistic enemy selection ---
function getEnemyType(score) {
  let r = Math.random() * 100;
  let chosenType;

  if (score < 80) {
    // Early game: mostly enemy1
    if (r < 90) chosenType = 'enemy1';
    else chosenType = 'enemy2';
  } else {
    // Mid/high game: introduce enemy3 and enemy4 gradually
    if (r < 50) chosenType = 'enemy1';
    else if (r < 75) chosenType = 'enemy2';
    else if (r < 90) chosenType = 'enemy3';
    else chosenType = 'enemy4';
  }

  // Apply alternation if the chosen type is 'enemy1' or 'enemy4'
  if (chosenType === 'enemy1' || chosenType === 'enemy4') {
    if (lastAlternatingEnemyType === 'enemy1') {
      lastAlternatingEnemyType = 'enemy4';
      return 'enemy4';
    } else {
      lastAlternatingEnemyType = 'enemy1';
      return 'enemy1';
    }
  } else {
    return chosenType; // Return enemy2 or enemy3 as is
  }
}

// --- Main render loop ---
function render() {
  if (isPaused) {
    // If paused, don't update game state, just keep the current frame displayed
    animationFrameId = requestAnimationFrame(render); // Keep requesting animation frame to check for unpause
    return;
  }

  index++;
  displaySpeed += (speed - displaySpeed) * 0.005;

  // On Fire mode timer
  if (onFire) {
    onFireTimer--;
    if (onFireTimer <= 0) {
      onFire = false;
    }
  }

  // Background
  const bgX = -((index * displaySpeed / 4) % canvas.width);
  ctx.drawImage(backgroundImg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, bgX + canvas.width, 0, canvas.width, canvas.height);

  // Player
  if (gamePlaying) {
    ctx.drawImage(playerImg, cTenth, flyHeight, ...size);
    if (hasShield) {
      ctx.beginPath();
      ctx.arc(
        cTenth + size[0] / 2,  // player center X
        flyHeight + size[1] / 2,   // player center Y
        size[0] / 2 + 10,          // radius bigger than player
        0,
        2 * Math.PI
      );
      ctx.strokeStyle = 'rgba(173, 216, 230, 0.5)';
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    if (onFire) {
      ctx.fillStyle = "rgba(255, 165, 0, 0.3)";
      ctx.beginPath();
      ctx.arc(cTenth + size[0] / 2, flyHeight + size[1] / 2, size[0], 0, 2 * Math.PI);
      ctx.fill();
    }

    if (isThrusting) flight -= thrustAmount;
    flight += gravity;
    flyHeight = Math.min(flyHeight + flight, canvas.height - size[1]);
    if (flyHeight <= 0 || flyHeight >= canvas.height - size[1]) {
      if (hasShield) {
        hasShield = false;
        flight = 0;
        if (flyHeight <= 0) flyHeight = 1;
        if (flyHeight >= canvas.height - size[1]) flyHeight = canvas.height - size[1] - 1;
      } else {
        gamePlaying = false;
        setup();
      }
    }

    if (isShooting) {
      shootTimer--;
      if (shootTimer <= 0) {
        fireShot();
        shootTimer = shootInterval;
      }
    }

    // Shots
    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];

      shot.x += shot.vx;
      shot.y += shot.vy;

      ctx.fillStyle = "#FF4500";
      ctx.beginPath();
      ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (shot.x > canvas.width) {
        shots.splice(i, 1);
        continue;
      }

      // Shot collision with boss
      if (boss && shot.x < boss.x + boss.width && shot.x + shot.width > boss.x && shot.y < boss.y + boss.height && shot.y + shot.height > boss.y) {
        shots.splice(i, 1);
        boss.hp--;
        boss1ShotCount++;
        createExplosion(shot.x, shot.y);

        if (boss1ShotCount % 100 === 0) {
          boss.maxHp += 100;
          boss.hp += 100;
        }

        if (boss.hp <= 0) {
          createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, 50);
          createFireworks(boss.x + boss.width / 2, boss.y + boss.height / 2, 100); // Fireworks!
          boss = null;
          bossMode = false;
          postBossDelayActive = true;
          bossEntryDelay = 5 * 60;
          pipesEntered = 0;
          bossDefeated = true;
          showMessageWithDuration("Congratulation!", "", "gold", 120); // 2 seconds
          setTimeout(() => {
            showMessageWithDuration("Level 2", "Start!", "white", 120); // 2 seconds after "Congratulation!"
          }, 2000); // Delay for 2 seconds
        }
        continue;
      }

      // Shot collision with boss2
      if (boss2 && shot.x < boss2.x + boss2.width && shot.x + shot.width > boss2.x && shot.y < boss2.y + boss2.height && shot.y + shot.height > boss2.y) {
        shots.splice(i, 1);
        boss2.hp--;
        boss2ShotCount++;
        createExplosion(shot.x, shot.y);

        if (boss2ShotCount % 100 === 0) {
          boss2.maxHp += 100;
          boss2.hp += 100;
        }

        if (boss2.hp <= 0) {
          createExplosion(boss2.x + boss2.width / 2, boss2.y + boss2.height / 2, 50);
          createFireworks(boss2.x + boss2.width / 2, boss2.y + boss2.height / 2, 100); // Fireworks!
          boss2 = null;
          boss2Mode = false;
          postBoss2DelayActive = true;
          boss2EntryDelay = 5 * 60; // 5-second delay after boss2 defeat
          pipesEntered = 0; // Reset pipesEntered for next phase
          boss2Defeated = true;
          showMessageWithDuration("Congratulation!", "", "gold", 120); // 2 seconds
          setTimeout(() => {
            showMessageWithDuration("Level 3", "Start!", "white", 120); // 2 seconds after "Congratulation!"
          }, 2000); // Delay for 2 seconds
        }
        continue;
      }

      // Shot collision with boss3
      if (boss3 && shot.x < boss3.x + boss3.width && shot.x + shot.width > boss3.x && shot.y < boss3.y + boss3.height && shot.y + shot.height > boss3.y) {
        shots.splice(i, 1);
        boss3.hp--;
        boss3ShotCount++;
        createExplosion(shot.x, shot.y);

        if (boss3ShotCount % 100 === 0) {
          boss3.maxHp += 100;
          boss3.hp += 100;
        }

        if (boss3.hp <= 0) {
          createExplosion(boss3.x + boss3.width / 2, boss3.y + boss3.height / 2, 50);
          createFireworks(boss3.x + boss3.width / 2, boss3.y + boss3.height / 2, 100); // Fireworks!
          boss3 = null;
          boss3Mode = false;
          postBoss3DelayActive = true;
          boss3EntryDelay = 5 * 60; // 5-second delay after boss3 defeat
          pipesEntered = 0; // Reset pipesEntered for next phase
          boss3Defeated = true;
          showMessageWithDuration("Congratulation!", "", "gold", 120); // 2 seconds
          setTimeout(() => {
            showMessageWithDuration("You are", "the boss!", "white", 120); // 2 seconds after "Congratulation!"
          }, 2000); // Delay for 2 seconds
          setTimeout(() => {
            showMessageWithDuration("To infinity", "and beyond!", "white", 180); // 3 seconds after "You are the boss!"
          }, 4000); // Delay for 4 seconds
        }
        continue;
      }

      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (
          shot.x < enemy.x + size[0] &&
          shot.x + shot.width > enemy.x &&
          shot.y < enemy.y + size[1] &&
          shot.y + shot.height > enemy.y
        ) {
          createExplosion(enemy.x + size[0] / 2, enemy.y + size[1] / 2);

          shots.splice(i, 1);

          const enemyCenterX = enemy.x + size[0] / 2;
          const enemyCenterY = enemy.y + size[1] / 2;
          lastEnemyKillPosition = { x: enemyCenterX - itemWidth / 2, y: enemyCenterY - itemHeight / 2 };
          
          enemies.splice(j, 1);
          currentKills++;
          bestKills = Math.max(bestKills, currentKills);
          if (currentKills > 0 && currentKills % 10 === 0) {
            spawnShieldItem(lastEnemyKillPosition.x, lastEnemyKillPosition.y);
          }
          break;
        }
      }
    }

    // Boss
    if (boss) {
      if (boss.phase === 'entry') {
        boss.y += boss.vy;
        if (boss.y <= canvas.height / 2 - boss.height / 2) {
          boss.y = canvas.height / 2 - boss.height / 2;
          boss.vy = 2; // Resume normal vertical movement
          boss.phase = 'active';
        }
      } else if (boss.phase === 'active') {
        boss.y += boss.vy;
        if (boss.y + boss.height > canvas.height || boss.y < 0) {
          boss.vy *= -1;
        }
      }

      ctx.drawImage(enemy1Img, boss.x, boss.y, boss.width, boss.height);

      // Boss health bar
      ctx.fillStyle = 'red';
      ctx.fillRect(boss.x, boss.y - 20, boss.width, 10);
      ctx.fillStyle = 'green';
      ctx.fillRect(boss.x, boss.y - 20, boss.width * (boss.hp / boss.maxHp), 10);

      boss.shootTimer--;
      if (boss.shootTimer <= 0) {
        const targetX = cTenth + size[0] / 2;
        const targetY = flyHeight + size[1] / 2;
        const bossShotX = boss.x;
        const bossShotY = boss.y + boss.height / 2;
        const dx = targetX - bossShotX;
        const dy = targetY - bossShotY;
        const angle = Math.atan2(dy, dx);
        const bossShotSpeedValue = isMobile ? 1.5 : 3; // Adjust as needed for mobile
        const bossShotSpeed = bossShotSpeedValue;
        const vx = Math.cos(angle) * bossShotSpeed;
        const vy = Math.sin(angle) * bossShotSpeed;
        bossShots.push({ x: boss.x, y: boss.y + boss.height / 2, width: 15, height: 15, vx: vx, vy: vy });
        boss.shootTimer = 120;
      }

      boss.enemySpawnTimer--;
      if (boss.enemySpawnTimer <= 0) {
        spawnEnemy('enemy1');
        boss.enemySpawnTimer = 180; // Reset for 3 seconds
      }

      // Player collision with boss
      if (cTenth < boss.x + boss.width && cTenth + size[0] > boss.x && flyHeight < boss.y + boss.height && flyHeight + size[1] > boss.y) {
        if (hasShield) {
          hasShield = false;
        } else {
          gamePlaying = false;
          setup();
        }
      }
    }

    // Boss 2
    if (boss2) {
      if (boss2.phase === 'entry') {
        boss2.x += boss2.vx;
        boss2.y += boss2.vy;
        if (boss2.x <= canvas.width - boss2.width - 50) { // Check if boss has reached its target x position
          boss2.x = canvas.width - 150; // Snap to position
          boss2.vx = 0; // Stop horizontal movement
        }
        if (boss2.y <= canvas.height / 2 - boss2.height / 2) {
          boss2.y = canvas.height / 2 - boss2.height / 2;
          boss2.vy = 2; // Resume normal vertical movement
        }
        if (boss2.x === canvas.width - 150 && boss2.y === canvas.height / 2 - boss2.height / 2) {
          boss2.phase = 'active'; // Transition to active phase once both x and y are in place
        }
      } else if (boss2.phase === 'active') {
        boss2.y += boss2.vy;
        if (boss2.y + boss2.height > canvas.height || boss2.y < 0) {
          boss2.vy *= -1;
        }
      }

      ctx.drawImage(enemy2Img, boss2.x, boss2.y, boss2.width, boss2.height); // Use enemy2Img

      // Boss 2 health bar
      ctx.fillStyle = 'red';
      ctx.fillRect(boss2.x, boss2.y - 20, boss2.width, 10);
      ctx.fillStyle = 'purple'; // Different color for boss2 health bar
      ctx.fillRect(boss2.x, boss2.y - 20, boss2.width * (boss2.hp / boss2.maxHp), 10);

      boss2.shootTimer--;
      if (boss2.shootTimer <= 0) {
        const targetX = cTenth + size[0] / 2;
        const targetY = flyHeight + size[1] / 2;
        const bossShotX = boss2.x;
        const bossShotY = boss2.y + boss2.height / 2;
        const dx = targetX - bossShotX;
        const dy = targetY - bossShotY;
        const angle = Math.atan2(dy, dx);
        const bossShotSpeedValue = isMobile ? 1.5 : 3; // Slightly faster shots for boss2
        const bossShotSpeed = bossShotSpeedValue;
        const vx = Math.cos(angle) * bossShotSpeed;
        const vy = Math.sin(angle) * bossShotSpeed;
        boss2Shots.push({ x: boss2.x, y: boss2.y + boss2.height / 2, width: 15, height: 15, vx: vx, vy: vy });
        boss2.shootTimer = 90; // Reset for 1.5 seconds
      }

      boss2.enemySpawnTimer--;
      if (boss2.enemySpawnTimer <= 0) {
        spawnEnemy('enemy2'); // Spawn enemy2
        boss2.enemySpawnTimer = 120; // Reset for 2 seconds
      }

      // Player collision with boss2
      if (cTenth < boss2.x + boss2.width && cTenth + size[0] > boss2.x && flyHeight < boss2.y + boss2.height && flyHeight + size[1] > boss2.y) {
        if (hasShield) {
          hasShield = false;
        } else {
          gamePlaying = false;
          setup();
        }
      }
    }

    // Boss 3
    if (boss3) {
      if (boss3.phase === 'entry') {
        boss3.x += boss3.vx;
        boss3.y += boss3.vy;
        if (boss3.x <= canvas.width - 150) { // Check if boss has reached its target x position
          boss3.x = canvas.width - 150; // Snap to position
          boss3.vx = 0; // Stop horizontal movement
        }
        if (boss3.y <= canvas.height / 2 - boss3.height / 2) {
          boss3.y = canvas.height / 2 - boss3.height / 2;
          boss3.vy = 2; // Resume normal vertical movement
        }
        if (boss3.x === canvas.width - 150 && boss3.y === canvas.height / 2 - boss3.height / 2) {
          boss3.phase = 'active'; // Transition to active phase once both x and y are in place
        }
      } else if (boss3.phase === 'active') {
        boss3.y += boss3.vy;
        if (boss3.y + boss3.height > canvas.height || boss3.y < 0) {
          boss3.vy *= -1;
        }
      }

      ctx.drawImage(enemy3Img, boss3.x, boss3.y, boss3.width, boss3.height); // Use enemy3Img

      // Boss 3 health bar
      ctx.fillStyle = 'red';
      ctx.fillRect(boss3.x, boss3.y - 20, boss3.width, 10);
      ctx.fillStyle = 'cyan'; // Different color for boss3 health bar
      ctx.fillRect(boss3.x, boss3.y - 20, boss3.width * (boss3.hp / boss3.maxHp), 10);

      boss3.shootTimer--;
      if (boss3.shootTimer <= 0) {
        const targetX = cTenth + size[0] / 2;
        const targetY = flyHeight + size[1] / 2;
        const bossShotX = boss3.x;
        const bossShotY = boss3.y + boss3.height / 2;
        const dx = targetX - bossShotX;
        const dy = targetY - bossShotY;
        const angle = Math.atan2(dy, dx);
        const bossShotSpeedValue = isMobile ? 1.5 : 3; // Slightly faster shots for boss3
        const bossShotSpeed = bossShotSpeedValue;
        const vx = Math.cos(angle) * bossShotSpeed;
        const vy = Math.sin(angle) * bossShotSpeed;
        boss3Shots.push({ x: boss3.x, y: boss3.y + boss3.height / 2, width: 15, height: 15, vx: vx, vy: vy });
        boss3.shootTimer = 80; // Reset for faster shots
      }

      boss3.enemySpawnTimer--;
      if (boss3.enemySpawnTimer <= 0) {
        spawnEnemy('enemy3'); // Spawn enemy3
        boss3.enemySpawnTimer = 100; // Reset for faster enemy spawn
      }

      // Player collision with boss3
      if (cTenth < boss3.x + boss3.width && cTenth + size[0] > boss3.x && flyHeight < boss3.y + boss3.height && flyHeight + size[1] > boss3.y) {
        if (hasShield) {
          hasShield = false;
        } else {
          gamePlaying = false;
          setup();
        }
      }
    }

    // If bossMode is active and boss is not yet spawned, spawn it or handle post-boss delay
    // Handle initial boss spawn
    if (currentScore === 60 && !bossMode && !postBossDelayActive && !bossDefeated) {
      bossMode = true;
      bossEntryDelay = 60; // Initial boss entry delay
    }

    // Handle initial boss2 spawn
    if (currentScore === 120 && !boss2Mode && !postBoss2DelayActive && !boss2Defeated) {
      boss2Mode = true;
      boss2EntryDelay = 60; // Initial boss2 entry delay
    }

    // Handle initial boss3 spawn
    if (currentScore === 180 && !boss3Mode && !postBoss3DelayActive && !boss3Defeated) {
      boss3Mode = true;
      boss3EntryDelay = 60; // Initial boss3 entry delay
    }

    // Handle boss entry animation
    if (bossMode && !boss && bossEntryDelay > 0) {
      bossEntryDelay--;
      // Keep existing pipes and enemies moving until off-screen
      pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
      enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      if (bossEntryDelay === 0) {
        spawnBoss();
      }
    }

    // Handle boss2 entry animation
    if (boss2Mode && !boss2 && boss2EntryDelay > 0) {
      boss2EntryDelay--;
      // Keep existing pipes and enemies moving until off-screen
      pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
      enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      if (boss2EntryDelay === 0) {
        spawnBoss2();
      }
    }

    // Handle boss3 entry animation
    if (boss3Mode && !boss3 && boss3EntryDelay > 0) {
      boss3EntryDelay--;
      // Keep existing pipes and enemies moving until off-screen
      pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
      enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      if (boss3EntryDelay === 0) {
        spawnBoss3();
      }
    }

    // Handle post-boss delay
    if (postBossDelayActive) {
      if (bossEntryDelay > 0) {
        bossEntryDelay--;
        // Keep existing pipes and enemies moving until off-screen
        pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
        enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      } else {
        postBossDelayActive = false;
        pipesEntered = 0; // Allow pipes to start spawning again
        pipes = Array(3).fill().map((_, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]);
      }
    }

    // Handle post-boss2 delay
    if (postBoss2DelayActive) {
      if (boss2EntryDelay > 0) {
        boss2EntryDelay--;
        // Keep existing pipes and enemies moving until off-screen
        pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
        enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      } else {
        postBoss2DelayActive = false;
        pipesEntered = 0; // Allow pipes to start spawning again
        pipes = Array(3).fill().map((_, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]); // Re-initialize pipes
      }
    }

    // Handle post-boss3 delay
    if (postBoss3DelayActive) {
      if (boss3EntryDelay > 0) {
        boss3EntryDelay--;
        // Keep existing pipes and enemies moving until off-screen
        pipes = pipes.filter(pipe => pipe[0] + pipeWidth > 0);
        enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      } else {
        postBoss3DelayActive = false;
        pipesEntered = 0; // Allow pipes to start spawning again
        pipes = Array(3).fill().map((_, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]); // Re-initialize pipes
      }
    }

    // Boss shots
    for (let i = bossShots.length - 1; i >= 0; i--) {
      const shot = bossShots[i];
      shot.x += shot.vx;
      shot.y += shot.vy;

      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkred';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (shot.x < 0) {
        bossShots.splice(i, 1);
        continue;
      }

      if (cTenth < shot.x + shot.width && cTenth + size[0] > shot.x && flyHeight < shot.y + shot.height && flyHeight + size[1] > shot.y) {
        if (hasShield) {
          hasShield = false;
          bossShots.splice(i, 1);
        } else {
          gamePlaying = false;
          setup();
        }
      }
    }

    // Boss 2 shots
    for (let i = boss2Shots.length - 1; i >= 0; i--) {
      const shot = boss2Shots[i];
      shot.x += shot.vx;
      shot.y += shot.vy;

      ctx.fillStyle = 'purple'; // Different color for boss2 shots
      ctx.beginPath();
      ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkviolet';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (shot.x < 0) {
        boss2Shots.splice(i, 1);
        continue;
      }

      if (cTenth < shot.x + shot.width && cTenth + size[0] > shot.x && flyHeight < shot.y + shot.height && flyHeight + size[1] > shot.y) {
        if (hasShield) {
          hasShield = false;
          boss2Shots.splice(i, 1);
        } else {
          gamePlaying = false;
          setup();
        }
      }
    }

    // Boss 3 shots
    for (let i = boss3Shots.length - 1; i >= 0; i--) {
      const shot = boss3Shots[i];
      shot.x += shot.vx;
      shot.y += shot.vy;

      ctx.fillStyle = 'cyan'; // Different color for boss3 shots
      ctx.beginPath();
      ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkcyan';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (shot.x < 0) {
        boss3Shots.splice(i, 1);
        continue;
      }

      if (cTenth < shot.x + shot.width && cTenth + size[0] > shot.x && flyHeight < shot.y + shot.height && flyHeight + size[1] > shot.y) {
        if (hasShield) {
          hasShield = false;
          boss3Shots.splice(i, 1);
        } else {
          gamePlaying = false;
          setup();
        }
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.lifespan--;

      if (p.lifespan <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = `rgba(255, 0, 0, ${p.lifespan / 30})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Items
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.x -= speed;

      if (item.type === 'shield') {
        ctx.drawImage(shieldImg, item.x, item.y, item.width, item.height);
      } else {
        ctx.drawImage(beerImg, item.x, item.y, item.width, item.height);
      }

      if (item.x + item.width < 0) {
        items.splice(i, 1);
        continue;
      }

      if (
        cTenth < item.x + item.width &&
        cTenth + size[0] > item.x &&
        flyHeight < item.y + item.height &&
        flyHeight + size[1] > item.y
      ) {
        if (item.type === 'shield') {
          hasShield = true;
        } else { // 'beer'
          beerScore++;
          bestBeerScore = Math.max(bestBeerScore, beerScore);
          if (beerScore > 0 && beerScore % 10 === 0) {
            onFire = true;
            onFireTimer = ON_FIRE_DURATION;
            showMessageWithDuration("ON FIRE!", "", "red", 120);
          }
        }
        items.splice(i, 1);
      }
    }
  } else {
    ctx.drawImage(playerImg, cTenth, flyHeight, ...size);
    ctx.textAlign = "center";
    ctx.font = "bold 30px courier";
    ctx.fillStyle = "black";
    ctx.fillText(`Best score : ${bestScore}`, canvas.width / 2, canvas.height / 2 - 60);
    ctx.fillText(`Best Kills : ${bestKills}`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`Best Beers : ${bestBeerScore}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText("Click to play", canvas.width / 2, canvas.height / 2 + 90);
  }

  // Pipes
  if (gamePlaying) {
    pipes.forEach((pipe, i) => {
      pipe[0] -= displaySpeed;
      const topPipeHeight = topPipeImg.height * (pipeWidth / topPipeImg.width);
      ctx.drawImage(topPipeImg, pipe[0], pipe[1] - topPipeHeight, pipeWidth, topPipeHeight);
      const bottomPipeHeight = bottomPipeImg.height * (pipeWidth / bottomPipeImg.width);
      ctx.drawImage(bottomPipeImg, pipe[0], pipe[1] + pipeGap, pipeWidth, bottomPipeHeight);

      // Only add new pipes if not in boss mode and less than 5 pipes have entered (or if boss is defeated)
      if (!bossMode && !postBossDelayActive && !boss2Mode && !postBoss3DelayActive && (bossDefeated || boss2Defeated || pipesEntered < 60) && pipe[0] <= -pipeWidth) {
        currentScore++;
        pipesEntered++;
        bestScore = Math.max(bestScore, currentScore);

        const newPipeX = pipes[pipes.length - 1][0] + pipeGap + pipeWidth;
        const newPipeY = pipeLoc();
        pipes = [...pipes.slice(1), [newPipeX, newPipeY]];

        // Spawn beers horizontally, centered vertically within the pipe gap
        const numberOfBeers = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5 beers
        const startX = pipes[pipes.length - 2][0] + pipeWidth;
        const availableHorizontalSpace = (newPipeX - startX); // This is pipeGap + pipeWidth

        // Calculate the total width of the beers with fixed spacing
        const totalBeersWidth = (numberOfBeers * itemWidth) + ((numberOfBeers - 1) * fixedHorizontalBeerSpacing);

        // Calculate the starting X to center the group of beers
        const groupStartX = startX + (availableHorizontalSpace - totalBeersWidth) / 2;

        for (let i = 0; i < numberOfBeers; i++) { // Loop from 0 to numberOfBeers - 1
          const beerX = groupStartX + (i * (itemWidth + fixedHorizontalBeerSpacing));

          // Calculate individual beerY with vertical variation (up, middle, or down)
          let individualBeerY = newPipeY + (pipeGap / 2) - (itemHeight / 2);
          const randomVerticalPosition = Math.floor(Math.random() * 3); // 0, 1, or 2
          if (randomVerticalPosition === 0) {
            individualBeerY -= verticalBeerOffsetAmount; // Up by 24px from center
          } else if (randomVerticalPosition === 2) {
            individualBeerY += verticalBeerOffsetAmount; // Down by 24px from center
          }
          // If randomVerticalPosition is 1, individualBeerY remains in the middle

          // Ensure individual beer stays within the pipe gap boundaries (strict clamping)
          individualBeerY = Math.max(newPipeY, individualBeerY);
          individualBeerY = Math.min(newPipeY + pipeGap - itemHeight, individualBeerY);

          spawnBeerItem(beerX, individualBeerY);
        }

        // Speed increase every 20 points
        if (currentScore % 20 === 0 && currentScore !== 60 && currentScore !== 120 && currentScore !== 180) {
          speed += speedIncreaseAmount;
          if (currentScore >= 80) enemySpeed += enemySpeedIncreaseAmount;
          showSpeedUpAd = true;
          speedUpAdTimer = speedUpAdDuration;
        }
      }

      if ([pipe[0] <= cTenth + size[0], pipe[0] + pipeWidth >= cTenth, pipe[1] > flyHeight || pipe[1] + pipeGap < flyHeight + size[1]].every(Boolean)) {
        if (hasShield) {
          hasShield = false;
        } else {
          gamePlaying = false;
          setup();
        }
      }
    });
  }

  // Enemy spawn
  if (gamePlaying && !bossMode && !postBossDelayActive && !boss2Mode && !postBoss3DelayActive) {
    enemySpawnTimer--;
    if (enemySpawnTimer <= 0) {
      spawnEnemy(getEnemyType(currentScore));
      enemySpawnTimer = Math.max(effectiveEnemyMinInterval, effectiveEnemyBaseInterval - currentScore * 0.7);
    }

  }

  // Update enemies
  if (gamePlaying) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.type === 'enemy1') {
        e.x -= (enemySpeed + (e.speedVariation || 0));
        if (enemy1Img.width > 0 && enemy1Img.height > 0) {
          ctx.drawImage(enemy1Img, 0, 0, enemy1Img.width, enemy1Img.height, e.x, e.y, size[0], size[0] * (enemy1Img.height / enemy1Img.width));
        }
      } else if (e.type === 'enemy2') {
        e.x += e.vx;
        e.y += e.vy;
        if (e.y <= 0 || e.y + size[1] >= canvas.height) e.vy *= -1;
        ctx.drawImage(enemy2Img, 0, 0, enemy2Img.width, enemy2Img.height, e.x, e.y, size[0], size[0] * (enemy2Img.height / enemy2Img.width));
      } else if (e.type === 'enemy3') {
        e.x += e.vx;
        e.y += e.vy;
        if (e.y <= 0 || e.y + size[1] >= canvas.height) e.vy *= -1;
        if (enemy3ImgLoaded) {
          ctx.drawImage(enemy3Img, 0, 0, enemy3Img.width, enemy3Img.height, e.x, e.y, size[0], size[0] * (enemy3Img.height / enemy3Img.width));
        } else {
          ctx.drawImage(enemy1Img, 0, 0, enemy1Img.width, enemy1Img.height, e.x, e.y, size[0], size[0] * (enemy1Img.height / enemy1Img.width));
        }
      } else if (e.type === 'enemy4') { // New enemy4 rendering and movement
        e.x += e.vx;
        e.y += e.vy;
        if (e.y <= 0 || e.y + size[1] >= canvas.height) e.vy *= -1; // Bounce off top/bottom
        if (enemy1Img.width > 0 && enemy1Img.height > 0) { // Use enemy1Img
          ctx.drawImage(enemy1Img, 0, 0, enemy1Img.width, enemy1Img.height, e.x, e.y, size[0], size[0] * (enemy1Img.height / enemy1Img.width));
        }
      }

      // Remove off-screen
      if (e.x + size[0] < 0 || e.y + size[1] < 0 || e.y > canvas.height) {
        enemies.splice(i, 1);
        continue;
      }

      // Collision
      if (cTenth < e.x + size[0] && cTenth + size[0] > e.x && flyHeight < e.y + size[1] && flyHeight + size[1] > e.y) {
        if (hasShield) {
          hasShield = false;
          enemies.splice(i, 1);
        } else {
          gamePlaying = false;
          setup();
        }
        break;
      }
    }
  }

  // --- HUD ---
  ctx.textAlign = "right";
  ctx.font = "bold 20px courier";
  ctx.fillStyle = "black";
  ctx.fillText(`Score : ${currentScore}`, canvas.width - 10, 50);
  ctx.fillText(`Kills : ${currentKills}`, canvas.width - 10, 80);
  ctx.fillText(`Beers : ${beerScore}`, canvas.width - 10, 110);

  // Speed-up message
  if (showSpeedUpAd && speedUpAdTimer > 0) {
    ctx.textAlign = "center";
    ctx.fillStyle = "red";
    ctx.font = "bold 40px Arial";
    ctx.fillText("SPEED UP!", canvas.width / 2, canvas.height / 2);
    speedUpAdTimer--;
  }

  // Display messages
  if (showMessage && messageTimer > 0) {
    ctx.textAlign = "center";
    ctx.font = "bold 50px Arial";
    ctx.fillStyle = messageColor;
    if (messageLine2) {
      ctx.fillText(messageLine1, canvas.width / 2, canvas.height / 2 - 20); // Adjusted Y for line1
      ctx.fillText(messageLine2, canvas.width / 2, canvas.height / 2 + 40); // Adjusted Y for line2
    } else {
      ctx.fillText(messageLine1, canvas.width / 2, canvas.height / 2); // Centered if only one line
    }
    messageTimer--;
    if (messageTimer === 0) {
      showMessage = false;
    }
  }

  // Update and draw fireworks
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const p = fireworks[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // Gravity for fireworks
    p.lifespan--;

    if (p.lifespan <= 0) {
      fireworks.splice(i, 1);
      continue;
    }

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.lifespan / 60), 0, 2 * Math.PI);
    ctx.fill();
  }

  animationFrameId = requestAnimationFrame(render);
}

// --- Start game if images loaded ---
function startGameIfReady() {
  if (playerImgLoaded && backgroundLoaded && topPipeLoaded && bottomPipeLoaded && beerImgLoaded && enemy1ImgLoaded && enemy2ImgLoaded && enemy3ImgLoaded && shieldImgLoaded) {
    setup();
    animationFrameId = requestAnimationFrame(render);
  }
}

function fireShot() {
  const shotSpeedValue = shotSpeed;
  const baseShot = {
    x: cTenth + size[0],
    y: flyHeight + size[1] / 2,
    width: 8,
    height: 10,
  };

  if (onFire) {
    // 5-shot spread
    shots.push({ ...baseShot, vx: shotSpeedValue, vy: 0 }); // Center
    shots.push({ ...baseShot, y: baseShot.y - 5, vx: shotSpeedValue, vy: 0 }); // Center-top
    shots.push({ ...baseShot, y: baseShot.y + 5, vx: shotSpeedValue, vy: 0 }); // Center-bottom
    shots.push({ ...baseShot, vx: shotSpeedValue * 0.9, vy: -shotSpeedValue * 0.4 }); // Diagonal up
    shots.push({ ...baseShot, vx: shotSpeedValue * 0.9, vy: shotSpeedValue * 0.4 }); // Diagonal down
  } else {
    // Default single shot
    shots.push({ ...baseShot, vx: shotSpeedValue, vy: 0 });
  }
}


// --- Controls ---
document.addEventListener("mousedown", () => {
  if (!firstClickDone) {
    firstClickDone = true;
    showMessageWithDuration("Level 1", "Start!", "white", 120); // Display for 2 seconds
  }
  if (gamePlaying && !isPaused) { // Only allow shooting if not paused
    isShooting = true;
    fireShot(); // Fire immediately on click
  }
  if (!isPaused) { // Only start game if not paused
    gamePlaying = true;
    isThrusting = true;
  }
});
document.addEventListener("mouseup", () => {
  isShooting = false;
  isThrusting = false;
});
document.addEventListener("touchstart", () => {
  if (!firstClickDone) {
    firstClickDone = true;
    showMessageWithDuration("Level 1", "Start!", "white", 120); // Display for 2 seconds
  }
  if (gamePlaying && !isPaused) { // Only allow shooting if not paused
    isShooting = true;
    fireShot(); // Fire immediately on touch
  }
  if (!isPaused) { // Only start game if not paused
    gamePlaying = true;
    isThrusting = true;
  }
});
document.addEventListener("touchend", () => {
  isShooting = false;
  isThrusting = false;
});

// Pause button functionality
const pauseButton = document.getElementById("pauseButton");
pauseButton.addEventListener("click", togglePause);

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    cancelAnimationFrame(animationFrameId); // Stop the game loop
    pauseButton.textContent = "Resume";
    // Optionally draw a "PAUSED" overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.font = "bold 50px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
  } else {
    animationFrameId = requestAnimationFrame(render); // Resume the game loop
    pauseButton.textContent = "Pause";
  }
}