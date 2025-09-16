const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// --- Images ---
function createImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const playerImg = createImage("./media/alien.png");
const backgroundImg = createImage("./media/backgroundMorty.png");
const topPipeImg = createImage("./media/toppipe.png");
const bottomPipeImg = createImage("./media/bottompipe.png");
const beerImg = createImage("./media/beer.png");
const enemy1Img = createImage("./media/insectesolo3-rbg.png");
const enemy2Img = createImage("./media/insectesolo2-rbg.png");
const enemy3Img = createImage("./media/insectesolo.png");
const shieldImg = createImage("./media/shield.png");
const weaponImg = createImage("./media/weapon.png");
const vomitImg = createImage("./media/vomit.png");

const allImages = [
  playerImg, backgroundImg, topPipeImg, bottomPipeImg, beerImg,
  enemy1Img, enemy2Img, enemy3Img, shieldImg, weaponImg, vomitImg
];

Promise.all(allImages.map(img => new Promise(resolve => img.onload = resolve))).then(() => {
  startGameIfReady();
});


// --- General settings ---
let gamePlaying = false;
let isPaused = false; // New variable for pause state
let animationFrameId; // To store the ID returned by requestAnimationFrame
let gravity = 0.12;
let initialSpeed = 4;
let speed = initialSpeed;
let displaySpeed = speed;
const speedIncreaseAmount = 0.5;

let initialEnemySpeed = 3;
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
  initialEnemySpeed = 1.5;
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
const shieldWidth = 40;
const shieldHeight = 40;
const fixedHorizontalBeerSpacing = 50; // New constant for consistent spacing
const verticalBeerOffsetAmount = 24; // New constant for vertical variation within a line

// --- Game state ---
let index = 0, bestScore = 0, currentScore = 0, beerScore = 0, bestBeerScore = 0, currentKills = 0, bestKills = 0, bossMode = false, bossEntryDelay = 0, pipesEntered = 0, postBossDelayActive = false, hasShield = false, lastWeaponCollectedScore = 0;

let burstActive = false;
let burstCount = 0;
let burstTimer = 0;
const BURST_SHOTS_PER_CLICK = 3;
const BURST_DELAY_FRAMES = 5; // frames between shots in a burst

// New helper function
function fireSingleShot(color, vx, vy, bounce = false, yOffset = 0) {
  const shotY = flyHeight + size[1] / 2 + yOffset;
  const commonShotProperties = {
    x: cTenth + size[0],
    y: shotY,
    width: 8,
    height: 10,
    trail: [],
  };
  shots.push({ ...commonShotProperties, color, vx, vy, bounce });
}

let onFire = false, onFireTimer = 0;
const ON_FIRE_DURATION = 600; // 10 seconds
let randomBeerSpawnTimer = 0;
let boss1Defeated = false, boss2Defeated = false, boss3Defeated = false;

let pipes = [], flight, flyHeight, isThrusting = false, enemies = [], shots = [], items = [], particles = [], shieldParticles = [];
const shotSpeed = 10;
let weaponLevel = 0; // 0: normal, 1: bounce, 2: double, 3: triple
const weaponItemWidth = 40;
const weaponItemHeight = 40;
const weaponColors = ["#FF00FF", "#00FFFF", "#FFFF00", "#FF4500", "#ADFF2F", "#8A2BE2"]; // Flashy colors
let activeBoss = null;
let lastAlternatingEnemyType = 'enemy1'; // New global variable
let firstClickDone = false; // New flag for first click
let messageLine1 = ''; // New variable for displaying messages - first line
let messageLine2 = ''; // New variable for displaying messages - second line
let showMessage = false; // New flag to control message display
let messageTimer = 0; // New timer for message display
let messageColor = 'black'; // New variable for message color
let fireworks = []; // New array for fireworks particles
let onFireParticles = []; // New array for on fire particles
let speedUpParticles = []; // New array for speed up particles
let itemParticles = []; // New array for particles around items
let collectionParticles = []; // New array for particles when an item is collected
let lastEnemyKillPosition = null;

// --- Item Colors ---
const itemColors = {
  'beer': '#FFD700', // Gold
  'shield': '#87CEEB', // SkyBlue
  'weapon': '#FF69B4', // HotPink
  'vomit': '#9ACD32' // YellowGreen
};

// --- Beer spawn ---
function generateItemParticles(item) {
  const numParticles = 5;
  const itemCenterX = item.x + item.width / 2;
  const itemCenterY = item.y + item.height / 2;
  const particleColor = itemColors[item.type] || '#FFFFFF'; // Default to white if type not found

  for (let i = 0; i < numParticles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (item.width / 2 + 5); // Particles within/slightly outside item
    item.itemParticles.push({
      x: itemCenterX + Math.cos(angle) * radius,
      y: itemCenterY + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * 0.5, // Very subtle movement
      vy: (Math.random() - 0.5) * 0.5,
      lifespan: 60 + Math.random() * 30, // Longer lifespan
      size: Math.random() * 1.5 + 0.5, // Small particles
      color: particleColor,
      initialAngle: angle,
      orbitRadius: radius,
      orbitSpeed: (Math.random() - 0.5) * 0.02 // Slow orbit
    });
  }
}

function spawnItem(type, x, y) {
  const itemConfig = {
    'beer': { width: itemWidth, height: itemHeight },
    'shield': { width: shieldWidth, height: shieldHeight },
    'weapon': { width: weaponItemWidth, height: weaponItemHeight },
    'vomit': { width: weaponItemWidth, height: weaponItemHeight }
  };
  const config = itemConfig[type];
  const item = { x, y, initialY: y, type, width: config.width, height: config.height, color: itemColors[type], itemParticles: [], scale: 1 };
  items.push(item);
  generateItemParticles(item);
}

const spawnBeerItem = (x, y) => spawnItem('beer', x, y);
const spawnShieldItem = (x, y) => spawnItem('shield', x, y);
const spawnWeaponItem = (x, y) => spawnItem('weapon', x, y);
const spawnVomitItem = (x, y) => spawnItem('vomit', x, y);

function spawnShieldParticles() {
  shieldParticles = []; // Clear previous particles
  const shieldRadius = size[0] / 2 + 10;
  for (let i = 0; i < 20; i++) { // 20 particles
    shieldParticles.push({
      angle: (i / 20) * 2 * Math.PI,
      radius: shieldRadius,
      size: Math.random() * 3 + 2,
      color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)` // shades of blue/cyan
    });
  }
}


// --- Particle creation ---
function createParticles(array, count, propertiesFactory) {
  for (let i = 0; i < count; i++) {
    array.push(propertiesFactory(i));
  }
}

// --- Explosion function ---
function createExplosion(x, y, count = 10) {
  createParticles(particles, count, () => ({
    x,
    y,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    lifespan: 30,
    size: Math.random() * 3 + 1,
  }));
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
  createParticles(fireworks, count, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lifespan: 60,
      size: Math.random() * 4 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    };
  });
}

// --- On Fire Particles function ---
function createOnFireParticles(x, y, count = 5) {
  createParticles(onFireParticles, count, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    const colorHue = Math.random() * 60;
    return {
      x: x + Math.cos(angle) * (size[0] / 2 + 5),
      y: y + Math.sin(angle) * (size[1] / 2 + 5),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lifespan: 20 + Math.random() * 10,
      size: Math.random() * 2 + 1,
      color: `hsl(${colorHue}, 100%, 50%)`,
    };
  });
}

// --- Speed Up Particles function ---
function createSpeedUpParticles(x, y, count = 5) {
  createParticles(speedUpParticles, count, () => {
    const angle = Math.random() * (Math.PI / 2) - Math.PI / 4;
    const speed = Math.random() * 3 + 1;
    const colorHue = Math.random() * 60;
    return {
      x: x,
      y: y + (Math.random() - 0.5) * size[1],
      vx: -speed * Math.cos(angle),
      vy: speed * Math.sin(angle),
      lifespan: 25 + Math.random() * 15,
      size: Math.random() * 3 + 2,
      color: `hsl(${colorHue}, 100%, 50%)`,
    };
  });
}

// --- Collection Particles function ---
function createCollectionParticles(x, y, color, count = 15) {
  createParticles(collectionParticles, count, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lifespan: 30 + Math.random() * 15,
      size: Math.random() * 3 + 1,
      color: color,
    };
  });
}

// --- Enemy spawn timer ---
let enemySpawnTimer = 0;
const enemyBaseInterval = 120; // frames
const enemyMinInterval = 40;

// Adjust for mobile
const effectiveEnemyBaseInterval = isMobile ? enemyBaseInterval * 2 : enemyBaseInterval;
const effectiveEnemyMinInterval = isMobile ? enemyMinInterval * 2 : enemyMinInterval;

// --- Boss spawn ---
const bossConfigs = {
  1: {
    image: enemy1Img,
    hp: 50,
    shootTimer: 240,
    enemySpawnTimer: 180,
    enemyType: 'enemy1',
    vy: -1,
    x: canvas.width - 150,
    y: canvas.height,
    healthBarColor: 'green',
    shotColor: 'orange',
  },
  2: {
    image: enemy2Img,
    hp: 50,
    shootTimer: 210,
    enemySpawnTimer: 120,
    enemyType: 'enemy2',
    vx: -2,
    vy: -1,
    x: canvas.width + 150,
    y: canvas.height,
    healthBarColor: 'purple',
    shotColor: 'purple',
  },
  3: {
    image: enemy3Img,
    hp: 50,
    shootTimer: 210,
    enemySpawnTimer: 120,
    enemyType: 'enemy3',
    vx: -2,
    vy: -1,
    x: canvas.width,
    y: canvas.height,
    healthBarColor: 'cyan',
    shotColor: 'cyan',
  },
};

function spawnBoss(level) {
  const config = bossConfigs[level];
  activeBoss = {
    level,
    ...config,
    width: 150,
    height: 150,
    maxHp: config.hp,
    phase: 'entry',
    shots: [],
    shotCount: 0,
  };
  bossMode = true;
  bossEntryDelay = 60;
}

// --- Setup ---
function setup() {
  currentScore = 0;
  beerScore = 0;
  currentKills = 0;
  flight = jump;
  flyHeight = canvas.height / 2 - size[1] / 2 + 150;
  speed = initialSpeed;
  enemySpeed = initialEnemySpeed;
  pipes = Array(3).fill().map((_, i) => ({
    x: canvas.width + i * (pipeGap + pipeWidth),
    y: pipeLoc(),
    hasTop: currentScore >= 5
  }));
  enemies = [];
  shots = [];
  items = [];
  particles = [];
  shieldParticles = [];
  activeBoss = null;
  enemySpawnTimer = effectiveEnemyBaseInterval;
  randomBeerSpawnTimer = 120 + Math.random() * 120; // 2-4 seconds
  showSpeedUpAd = false;
  speedUpAdTimer = 0;
  bossMode = false;
  bossEntryDelay = 0;
  pipesEntered = 0;
  postBossDelayActive = false;
  boss1Defeated = false;
  boss2Defeated = false;
  boss3Defeated = false;
  lastAlternatingEnemyType = 'enemy1'; // Initialize for alternation
  onFire = false;
  onFireTimer = 0;
  firstClickDone = false; // Reset for new game
  showMessage = false; // Reset message display
  messageTimer = 0; // Reset message timer
  fireworks = []; // Clear fireworks
  onFireParticles = []; // Clear on fire particles
  speedUpParticles = []; // Clear speed up particles
  hasShield = false;
  lastEnemyKillPosition = null;
  weaponLevel = 0; // Reset weapon level
  lastWeaponCollectedScore = 0; // Reset for new game
  lastWeaponSpawnScore = 0; // Reset for new game
}

// --- Spawn functions ---
function spawnEnemy(type) {
  const x = canvas.width;
  let y = Math.random() * (canvas.height - size[1]);

  if (type === 'enemy1') {
    const minY = canvas.height * 0.25;
    const maxY = canvas.height * 0.75 - size[1];
    y = minY + Math.random() * (maxY - minY);
    enemies.push({ x, y, type: 'enemy1', vx: -enemySpeed, vy: 0 });
  } else if (type === 'enemy2') {
    const vx = -enemySpeed;
    const vy = (Math.random() < 0.5 ? 1 : -1) * enemySpeed * 0.5;
    enemies.push({ x, y, vx, vy, type: 'enemy2' });
  } else if (type === 'enemy3') {
    const targetX = cTenth;
    const targetY = flyHeight;
    const dx = targetX - x;
    const dy = targetY - y;
    const angle = Math.atan2(dy, dx);

    const speed = enemySpeed * 1.2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    enemies.push({ x, y, vx, vy, type: 'enemy3' });
  }
}

// --- Probabilistic enemy selection ---
function getEnemyType() {
  let r = Math.random() * 100;
  if (r < 70) { // 70%
    return 'enemy1';
  } else if (r < 90) { // 20%
    return 'enemy3';
  } else { // 10%
    return 'enemy2';
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

      // Update and draw shield particles
      const playerCenterX = cTenth + size[0] / 2;
      const playerCenterY = flyHeight + size[1] / 2;

      for (let i = shieldParticles.length - 1; i >= 0; i--) {
        const p = shieldParticles[i];
        p.angle += 0.05; // rotation speed

        const x = playerCenterX + Math.cos(p.angle) * p.radius;
        const y = playerCenterY + Math.sin(p.angle) * p.radius;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    if (onFire) {
      // Continuously spawn on-fire particles around the player
      createOnFireParticles(cTenth + size[0] / 2, flyHeight + size[1] / 2, 2); // Spawn 2 particles per frame

      // Update and draw onFireParticles
      for (let i = onFireParticles.length - 1; i >= 0; i--) {
        const p = onFireParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.lifespan--;

        if (p.lifespan <= 0) {
          onFireParticles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.lifespan / 30), 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Update and draw speedUpParticles
    for (let i = speedUpParticles.length - 1; i >= 0; i--) {
      const p = speedUpParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.lifespan--;

      if (p.lifespan <= 0) {
        speedUpParticles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.lifespan / 15), 0, 2 * Math.PI); // Adjust lifespan divisor for speedUpParticles
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

    // Handle burst fire
    if (burstActive) {
      burstTimer++;
      if (burstTimer >= BURST_DELAY_FRAMES) {
        if (burstCount > 0) {
          fireSingleShot(weaponColors[1], shotSpeed, 0); // Fire next shot in burst
          burstCount--;
          burstTimer = 0;
        } else {
          burstActive = false; // Burst finished
        }
      }
    }

    // Handle burst fire
    if (burstActive) {
      burstTimer++;
      if (burstTimer >= BURST_DELAY_FRAMES) {
        if (burstCount > 0) {
          fireSingleShot(weaponColors[1], shotSpeed, 0); // Fire next shot in burst
          burstCount--;
          burstTimer = 0;
        } else {
          burstActive = false; // Burst finished
        }
      }
    }

    // Shots
    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];

      shot.x += shot.vx;
      shot.y += shot.vy;

      // Bounce logic for weaponLevel 1
      if (shot.bounce) {
        if (shot.y <= 0 || shot.y + shot.height >= canvas.height) {
          shot.vy *= -1; // Reverse vertical direction
        }
      }

      // Add current position to trail
      shot.trail.push({ x: shot.x, y: shot.y, lifespan: 15 }); // Store position and lifespan for trail

      // Update and draw trail
      for (let j = shot.trail.length - 1; j >= 0; j--) {
        const trailPart = shot.trail[j];
        trailPart.lifespan--;
        if (trailPart.lifespan <= 0) {
          shot.trail.splice(j, 1);
          continue;
        }
        ctx.fillStyle = `${shot.color}50`; // Fading color for trail
        ctx.beginPath();
        ctx.arc(trailPart.x + shot.width / 2, trailPart.y + shot.height / 2, shot.width / 2 * (trailPart.lifespan / 15), 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = shot.color;
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
      if (activeBoss && shot.x < activeBoss.x + activeBoss.width && shot.x + shot.width > activeBoss.x && shot.y < activeBoss.y + activeBoss.height && shot.y + shot.height > activeBoss.y) {
        shots.splice(i, 1);
        activeBoss.hp--;
        activeBoss.shotCount++;
        createExplosion(shot.x, shot.y);

        if (activeBoss.shotCount % 100 === 0) {
          activeBoss.maxHp += 100;
          activeBoss.hp += 100;
        }

        if (activeBoss.hp <= 0) {
          createExplosion(activeBoss.x + activeBoss.width / 2, activeBoss.y + activeBoss.height / 2, 50);
          createFireworks(activeBoss.x + activeBoss.width / 2, activeBoss.y + activeBoss.height / 2, 100); // Fireworks!
          const currentLevel = activeBoss.level;
          if (currentLevel === 1) {
            boss1Defeated = true;
            enemySpeed += 1;
          } else if (currentLevel === 2) {
            boss2Defeated = true;
            enemySpeed += 1;
          } else if (currentLevel === 3) {
            boss3Defeated = true;
          }
          activeBoss = null;
          bossMode = false;
          postBossDelayActive = true;
          bossEntryDelay = 5 * 60;
          pipesEntered = 0;
          showMessageWithDuration("Congratulation!", "", "gold", 120); // 2 seconds
          setTimeout(() => {
            let nextMessage = currentLevel < 3 ? `Level ${currentLevel + 1}` : "You are";
            let nextMessage2 = currentLevel < 3 ? "Start!" : "the boss!";
            showMessageWithDuration(nextMessage, nextMessage2, "white", 120);
          }, 2000);
          if (currentLevel === 3) {
            setTimeout(() => {
              showMessageWithDuration("To infinity", "and beyond!", "white", 180);
            }, 4000);
          }
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
    if (activeBoss) {
      if (activeBoss.phase === 'entry') {
        if (activeBoss.vx) activeBoss.x += activeBoss.vx;
        activeBoss.y += activeBoss.vy;
        if (activeBoss.x <= canvas.width - 150) {
          activeBoss.x = canvas.width - 150;
          activeBoss.vx = 0;
        }
        if (activeBoss.y <= canvas.height / 2 - activeBoss.height / 2) {
          activeBoss.y = canvas.height / 2 - activeBoss.height / 2;
          activeBoss.vy = 2;
        }
        if ((!activeBoss.vx || activeBoss.vx === 0) && activeBoss.vy === 2) {
          activeBoss.phase = 'active';
        }
      } else if (activeBoss.phase === 'active') {
        activeBoss.y += activeBoss.vy;
        if (activeBoss.y + activeBoss.height > canvas.height || activeBoss.y < 0) {
          activeBoss.vy *= -1;
        }
      }

      ctx.drawImage(activeBoss.image, activeBoss.x, activeBoss.y, activeBoss.width, activeBoss.height);

      // Boss health bar
      ctx.fillStyle = 'red';
      ctx.fillRect(activeBoss.x, activeBoss.y - 20, activeBoss.width, 10);
      ctx.fillStyle = activeBoss.healthBarColor;
      ctx.fillRect(activeBoss.x, activeBoss.y - 20, activeBoss.width * (activeBoss.hp / activeBoss.maxHp), 10);

      activeBoss.shootTimer--;
      if (activeBoss.shootTimer <= 0) {
        const targetX = cTenth + size[0] / 2;
        const targetY = flyHeight + size[1] / 2;
        const bossShotX = activeBoss.x;
        const bossShotY = activeBoss.y + activeBoss.height / 2;
        const dx = targetX - bossShotX;
        const dy = targetY - bossShotY;
        const angle = Math.atan2(dy, dx);
        const bossShotSpeedValue = isMobile ? 1.5 : 3;
        const bossShotSpeed = bossShotSpeedValue;
        const vx = Math.cos(angle) * bossShotSpeed;
        const vy = Math.sin(angle) * bossShotSpeed;
        activeBoss.shots.push({ x: activeBoss.x, y: activeBoss.y + activeBoss.height / 2, width: 15, height: 15, vx: vx, vy: vy, color: activeBoss.shotColor });
        activeBoss.shootTimer = 120;
      }

      activeBoss.enemySpawnTimer--;
      if (activeBoss.enemySpawnTimer <= 0) {
        spawnEnemy(activeBoss.enemyType);
        activeBoss.enemySpawnTimer = 180;
      }

      // Player collision with boss
      if (cTenth < activeBoss.x + activeBoss.width && cTenth + size[0] > activeBoss.x && flyHeight < activeBoss.y + activeBoss.height && flyHeight + size[1] > activeBoss.y) {
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
    if (currentScore === 60 && !bossMode && !postBossDelayActive && !boss1Defeated) {
      spawnBoss(1);
    }

    // Handle initial boss2 spawn
    if (currentScore === 120 && !bossMode && !postBossDelayActive && !boss2Defeated) {
      spawnBoss(2);
    }

    // Handle initial boss3 spawn
    if (currentScore === 180 && !bossMode && !postBossDelayActive && !boss3Defeated) {
      spawnBoss(3);
    }

    // Handle boss entry animation
    if (bossMode && !activeBoss && bossEntryDelay > 0) {
      bossEntryDelay--;
      // Keep existing pipes and enemies moving until off-screen
      pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
      enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
    }

    // Handle post-boss delay
    if (postBossDelayActive) {
      if (bossEntryDelay > 0) {
        bossEntryDelay--;
        // Keep existing pipes and enemies moving until off-screen
        pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
        enemies = enemies.filter(enemy => enemy.x + size[0] > 0);
      } else {
        postBossDelayActive = false;
        pipesEntered = 0; // Allow pipes to start spawning again
        pipes = Array(3).fill().map((_, i) => ({
          x: canvas.width + i * (pipeGap + pipeWidth),
          y: pipeLoc(),
          hasTop: currentScore >= 5
        }));
      }
    }

    // Boss shots
    if (activeBoss) {
      for (let i = activeBoss.shots.length - 1; i >= 0; i--) {
        const shot = activeBoss.shots[i];
        shot.x += shot.vx;
        shot.y += shot.vy;

        ctx.fillStyle = shot.color;
        ctx.beginPath();
        ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'darkred';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (shot.x < 0) {
          activeBoss.shots.splice(i, 1);
          continue;
        }

        if (cTenth < shot.x + shot.width && cTenth + size[0] > shot.x && flyHeight < shot.y + shot.height && flyHeight + size[1] > shot.y) {
          if (hasShield) {
            hasShield = false;
            activeBoss.shots.splice(i, 1);
          } else {
            gamePlaying = false;
            setup();
          }
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

    // Update and draw collection particles
    for (let i = collectionParticles.length - 1; i >= 0; i--) {
      const p = collectionParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.lifespan--;

      if (p.lifespan <= 0) {
        collectionParticles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = `${p.color}80`; // Slightly transparent
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.lifespan / 30), 0, 2 * Math.PI);
      ctx.fill();
    }

    // Items
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.x -= speed;

      // Apply sine wave for vertical oscillation (fly effect)
      const oscillationAmplitude = 5; // Adjust as needed for desired up/down movement
      const oscillationSpeed = 0.05; // Adjust as needed for speed of oscillation
      const oscillatingY = item.initialY + Math.sin(index * oscillationSpeed + item.initialY / 10) * oscillationAmplitude;

      // Update and draw item particles
      const itemCenterX = item.x + item.width / 2;
      const itemCenterY = oscillatingY + item.height / 2;

      for (let j = item.itemParticles.length - 1; j >= 0; j--) {
        const p = item.itemParticles[j];
        p.lifespan--;

        if (p.lifespan <= 0) {
          item.itemParticles.splice(j, 1);
          continue;
        }

        // Update particle position relative to the item's center
        p.initialAngle += p.orbitSpeed; // Orbit
        p.x = itemCenterX + Math.cos(p.initialAngle) * p.orbitRadius + p.vx;
        p.y = itemCenterY + Math.sin(p.initialAngle) * p.orbitRadius + p.vy;

        ctx.fillStyle = `${p.color}50`; // Semi-transparent
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.lifespan / (60 + 30)), 0, 2 * Math.PI);
        ctx.fill();
      }

      // Apply sine wave for scaling (grow effect)
      const scaleAmplitude = 0.05; // Max 5% scale change
      const scaleSpeed = 0.1; // Speed of the pulsing effect
      item.scale = 1 + Math.sin(index * scaleSpeed + item.initialY / 10) * scaleAmplitude;

      const scaledWidth = item.width * item.scale;
      const scaledHeight = item.height * item.scale;
      const offsetX = (item.width - scaledWidth) / 2;
      const offsetY = (item.height - scaledHeight) / 2;

      if (item.type === 'shield') {
        ctx.drawImage(shieldImg, item.x + offsetX, oscillatingY + offsetY, scaledWidth, scaledHeight);
      } else if (item.type === 'weapon') {
        ctx.drawImage(weaponImg, item.x + offsetX, oscillatingY + offsetY, scaledWidth, scaledHeight);
      } else if (item.type === 'vomit') {
        ctx.drawImage(vomitImg, item.x + offsetX, oscillatingY + offsetY, scaledWidth, scaledHeight);
      } else { // 'beer'
        ctx.drawImage(beerImg, item.x + offsetX, oscillatingY + offsetY, scaledWidth, scaledHeight);
      }

      if (item.x + item.width < 0) {
        items.splice(i, 1);
        continue;
      }

      if (
        cTenth < item.x + scaledWidth &&
        cTenth + size[0] > item.x &&
        flyHeight < oscillatingY + scaledHeight &&
        flyHeight + size[1] > oscillatingY
      ) {
        // Trigger collection particles
        createCollectionParticles(cTenth + size[0] / 2, flyHeight + size[1] / 2, item.color);

        if (item.type === 'shield') {
          hasShield = true;
          spawnShieldParticles();
        } else if (item.type === 'weapon') {
          if (weaponLevel < 3) { // Max weaponLevel is now 3 for Triple Shot
            weaponLevel++;
            lastWeaponCollectedScore = currentScore; // Update when weapon is collected
            let message = "";
            if (weaponLevel === 1) message = "Burst Fire!";
            else if (weaponLevel === 2) message = "Double Shot!";
            else if (weaponLevel === 3) message = "Triple Shot!";
            showMessageWithDuration(message, "", "gold", 90); // Display for 1.5 seconds
          } else { // If weaponLevel is already 3, give a "Max Weapon Level" message
            showMessageWithDuration("Max Weapon", "Level!", "gold", 90);
          }
        } else if (item.type === 'vomit') {
          if (weaponLevel > 0) {
            weaponLevel = 0;
            showMessageWithDuration("Basic Shot!", "", "orange", 90);
          }
        } else { // 'beer'
          beerScore++;
          bestBeerScore = Math.max(bestBeerScore, beerScore);
          if (beerScore > 0 && beerScore % 100 === 0) {
            onFire = true;
            onFireTimer = ON_FIRE_DURATION;
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
      pipe.x -= displaySpeed;

      if (pipe.hasTop) {
        const topPipeHeight = topPipeImg.height * (pipeWidth / topPipeImg.width);
        ctx.drawImage(topPipeImg, pipe.x, pipe.y - topPipeHeight, pipeWidth, topPipeHeight);
      }

      const bottomPipeHeight = bottomPipeImg.height * (pipeWidth / bottomPipeImg.width);
      ctx.drawImage(bottomPipeImg, pipe.x, pipe.y + pipeGap, pipeWidth, bottomPipeHeight);

      // Only add new pipes if not in boss mode and less than 5 pipes have entered (or if boss is defeated)
      if (!bossMode && !postBossDelayActive && !activeBoss && (boss1Defeated || boss2Defeated || boss3Defeated || pipesEntered < 60) && pipe.x <= -pipeWidth) {
        currentScore++;
        pipesEntered++;
        bestScore = Math.max(bestScore, currentScore);

        const newPipe = {
          x: pipes[pipes.length - 1].x + pipeGap + pipeWidth,
          y: pipeLoc(),
          hasTop: currentScore >= 5
        };
        pipes = [...pipes.slice(1), newPipe];

        // Spawn beers horizontally, centered vertically within the pipe gap
        const numberOfBeers = Math.floor(Math.random() * 2) + 3; // 3 or 4 beers
        const startX = pipes[pipes.length - 2].x + pipeWidth;
        const availableHorizontalSpace = (newPipe.x - startX); // This is pipeGap + pipeWidth

        // Calculate the total width of the beers with fixed spacing
        const totalBeersWidth = (numberOfBeers * itemWidth) + ((numberOfBeers - 1) * fixedHorizontalBeerSpacing);

        // Calculate the starting X to center the group of beers
        const groupStartX = startX + (availableHorizontalSpace - totalBeersWidth) / 2;

        for (let i = 0; i < numberOfBeers; i++) { // Loop from 0 to numberOfBeers - 1
          const beerX = groupStartX + (i * (itemWidth + fixedHorizontalBeerSpacing));

          // Calculate individual beerY with vertical variation (up, middle, or down)
          let individualBeerY = newPipe.y + (pipeGap / 2) - (itemHeight / 2);
          const randomVerticalPosition = Math.floor(Math.random() * 3); // 0, 1, or 2
          if (randomVerticalPosition === 0) {
            individualBeerY -= verticalBeerOffsetAmount; // Up by 24px from center
          } else if (randomVerticalPosition === 2) {
            individualBeerY += verticalBeerOffsetAmount; // Down by 24px from center
          }
          // If randomVerticalPosition is 1, individualBeerY remains in the middle

          // Ensure individual beer stays within the pipe gap boundaries (strict clamping)
          individualBeerY = Math.max(newPipe.y, individualBeerY);
          individualBeerY = Math.min(newPipe.y + pipeGap - itemHeight, individualBeerY);

          spawnBeerItem(beerX, individualBeerY);
        }

        // Spawn weapon item every 30 points
        if (currentScore > 0 && currentScore % 30 === 0 && weaponLevel < 3) {
          const weaponX = newPipe.x + (pipeWidth / 2) - (weaponItemWidth / 2);
          const weaponY = newPipe.y + (pipeGap / 2) - (weaponItemHeight / 2);
          spawnWeaponItem(weaponX, weaponY);
          lastWeaponSpawnScore = currentScore;
        }
        // Spawn vomit item 15 points after a weapon item
        else if (lastWeaponSpawnScore > 0 && currentScore === lastWeaponSpawnScore + 15) {
          const vomitX = newPipe.x + (pipeWidth / 2) - (weaponItemWidth / 2);
          const vomitY = newPipe.y + (pipeGap / 2) - (weaponItemHeight / 2);
          spawnVomitItem(vomitX, vomitY);
        }

        // Speed increase every 20 points
        if (currentScore % 20 === 0 && currentScore !== 60 && currentScore !== 120 && currentScore !== 180) {
          speed += speedIncreaseAmount;
          showSpeedUpAd = true;
          speedUpAdTimer = speedUpAdDuration;
        }

        if (boss3Defeated && currentScore > 180 && (currentScore - 180) % 60 === 0) {
          enemySpeed += enemySpeedIncreaseAmount;
        }
      }

      const collisionWithTop = pipe.hasTop && pipe.y > flyHeight;
      const collisionWithBottom = pipe.y + pipeGap < flyHeight + size[1];

      if ([pipe.x <= cTenth + size[0], pipe.x + pipeWidth >= cTenth, collisionWithTop || collisionWithBottom].every(Boolean)) {
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
  if (gamePlaying && !bossMode && !postBossDelayActive && !activeBoss) {
    enemySpawnTimer--;
    if (enemySpawnTimer <= 0) {
      spawnEnemy(getEnemyType());
      enemySpawnTimer = Math.max(effectiveEnemyMinInterval, effectiveEnemyBaseInterval - currentScore * 0.7);
    }

  }

  // Update enemies
  if (gamePlaying) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.x += e.vx;
      e.y += e.vy;

      if (e.type === 'enemy2' || e.type === 'enemy3') {
        if (e.y <= 0 || e.y + size[1] >= canvas.height) {
          e.vy *= -1;
        }
      }

      if (e.type === 'enemy1') {
        ctx.drawImage(enemy1Img, 0, 0, enemy1Img.width, enemy1Img.height, e.x, e.y, size[0], size[0] * (enemy1Img.height / enemy1Img.width));
      } else if (e.type === 'enemy2') {
        ctx.drawImage(enemy2Img, 0, 0, enemy2Img.width, enemy2Img.height, e.x, e.y, size[0], size[0] * (enemy2Img.height / enemy2Img.width));
      } else if (e.type === 'enemy3') {
        ctx.drawImage(enemy3Img, 0, 0, enemy3Img.width, enemy3Img.height, e.x, e.y, size[0], size[0] * (enemy3Img.height / enemy3Img.width));
      }

      // Remove off-screen
      if (e.x + size[0] < 0) {
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
  ctx.font = "bold 16px courier";
  ctx.fillStyle = "black";
  ctx.fillText(`Score : ${currentScore}`, canvas.width - 10, 40);
  ctx.fillText(`Kills : ${currentKills}`, canvas.width - 10, 64);
  ctx.fillText(`Beers : ${beerScore}`, canvas.width - 10, 88);

  // Speed-up message
  if (showSpeedUpAd && speedUpAdTimer > 0) {
    speedUpAdTimer--;

    // Add flame effect behind the player during speed up
    createSpeedUpParticles(cTenth, flyHeight + size[1] / 2, 8); // Spawn 8 particles per frame behind the alien
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
  setup();
  animationFrameId = requestAnimationFrame(render);
}

function fireShot() {
  const shotSpeedValue = shotSpeed;

  if (onFire) {
    // 5-shot spread (onFire overrides weapon level)
    fireSingleShot(weaponColors[Math.floor(Math.random() * weaponColors.length)], shotSpeedValue, 0); // Center
    fireSingleShot(weaponColors[Math.floor(Math.random() * weaponColors.length)], shotSpeedValue, 0, false, -5); // Center-top
    fireSingleShot(weaponColors[Math.floor(Math.random() * weaponColors.length)], shotSpeedValue, 0, false, 5); // Center-bottom
    fireSingleShot(weaponColors[Math.floor(Math.random() * weaponColors.length)], shotSpeedValue * 0.9, -shotSpeedValue * 0.4); // Diagonal up
    fireSingleShot(weaponColors[Math.floor(Math.random() * weaponColors.length)], shotSpeedValue * 0.9, shotSpeedValue * 0.4); // Diagonal down
  } else {
    if (weaponLevel === 0) { // Basic Shot
      fireSingleShot(weaponColors[0], shotSpeedValue, 0);
    } else if (weaponLevel === 1) { // Burst Fire
      if (!burstActive) {
        burstActive = true;
        burstCount = BURST_SHOTS_PER_CLICK;
        burstTimer = 0;
        // Fire first shot of burst immediately
        fireSingleShot(weaponColors[1], shotSpeedValue, 0);
        burstCount--;
      }
    } else if (weaponLevel === 2) { // Double Shot
      fireSingleShot(weaponColors[2], shotSpeedValue, 0, false, -7); // Top shot
      fireSingleShot(weaponColors[2], shotSpeedValue, 0, false, 7); // Bottom shot
    } else if (weaponLevel >= 3) { // Triple Shot (Level 3 and above)
      fireSingleShot(weaponColors[3], shotSpeedValue, 0); // Middle shot
      fireSingleShot(weaponColors[3], shotSpeedValue, 0, false, -10); // Top shot
      fireSingleShot(weaponColors[3], shotSpeedValue, 0, false, 10); // Bottom shot
    }
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