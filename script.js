const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function createImage(src) {
    const img = new Image;
    img.src = src;
    return img
}
const playerImg = createImage("./media/alienM.png");
const playerImg2 = createImage("./media/alienM2.png");
const backgroundImg = createImage("./media/backgroundM.png");
const backgroundM0TImg = createImage("./media/backgroundM0T.png");
const backgroundM1Img = createImage("./media/backgroundM1.png");
const backgroundM1TImg = createImage("./media/backgroundM1T.png");
const backgroundM2Img = createImage("./media/backgroundM2.png");
const backgroundM2TImg = createImage("./media/backgroundM2T.png");
const backgroundM3Img = createImage("./media/backgroundM3.png");
const backgroundM3TImg = createImage("./media/backgroundM3T.png");
const backgroundM4Img = createImage("./media/backgroundM4.png");
const backgroundM4TImg = createImage("./media/backgroundM4T.png");
const backgroundM5Img = createImage("./media/backgroundM5.png");
const backgroundM5TImg = createImage("./media/backgroundM5T.png");
const backgroundM6Img = createImage("./media/backgroundM6.png");
const backgroundM7Img = createImage("./media/background M7.png");
const topPipeImg = createImage("./media/toppipe.png");
const bottomPipeImg = createImage("./media/bottompipe.png");
const beerImg = createImage("./media/beer.png");
const enemy1Frames = [createImage("./media/enemy1/1.png"), createImage("./media/enemy1/2.png"), createImage("./media/enemy1/3.png")];
const enemy2Frames = [createImage("./media/enemy2/1.png"), createImage("./media/enemy2/2.png"), createImage("./media/enemy2/3.png")];
const enemy3Img = createImage("./media/enemy3.png");
const shieldImg = createImage("./media/shield.png");
const weaponImg = createImage("./media/weapon.png");
const vomitImg = createImage("./media/vomit.png");
const bombImg = createImage("./media/bomb.png");
const allImages = [playerImg, backgroundImg, backgroundM0TImg, backgroundM1Img, backgroundM1TImg, backgroundM2Img, backgroundM2TImg, backgroundM3Img, backgroundM3TImg, backgroundM4Img, backgroundM4TImg, backgroundM5Img, backgroundM5TImg, backgroundM6Img, backgroundM7Img, topPipeImg, bottomPipeImg, beerImg, ...enemy1Frames, ...enemy2Frames, enemy3Img, shieldImg, weaponImg, vomitImg, bombImg];

function loadAllImages() {
    const imagePromises = allImages.map(img => {
        return new Promise(resolve => {
            if (img.complete) {
                resolve()
            } else {
                img.onload = resolve;
                img.onerror = () => {
                    resolve()
                }
            }
        })
    });
    return Promise.all(imagePromises)
}
const gameSettings = {
    gravity: .12,
    initialSpeed: 4,
    speedIncreaseAmount: .5,
    initialEnemySpeed: 3,
    enemySpeedIncreaseAmount: .1,
    jump: -4.5,
    thrustAmount: .4,
    shotSpeed: 10,
    ENEMY1_BASE_WIDTH: 65,
    ENEMY1_HITBOX_OFFSET_X: 10,
    ENEMY1_HITBOX_OFFSET_Y: 5,
    ENEMY1_HITBOX_WIDTH_REDUCTION: 20,
    ENEMY1_HITBOX_HEIGHT_REDUCTION: 10,
    ENEMY2_BASE_WIDTH: 65,
    ENEMY3_BASE_WIDTH: 51,
    pipeWidth: 150,
    pipeGap: 270,
    itemWidth: 30,
    itemHeight: 30,
    shieldWidth: 50,
    shieldHeight: 50,
    fixedHorizontalBeerSpacing: 50,
    verticalBeerOffsetAmount: 24,
    weaponItemWidth: 50,
    weaponItemHeight: 50,
    bombItemWidth: 50,
    bombItemHeight: 50,
    ON_FIRE_DURATION: 600,
    speedUpAdDuration: 60
};
const playerState = {
    flight: 0,
    flyHeight: 0,
    isThrusting: false,
    hasShield: false,
    weaponLevel: 0,
    isShooting: false,
    shootInterval: 10,
    shootTimer: 0,
    size: [51, 30]
};
const gameState = {
    gamePlaying: false,
    isPaused: false,
    animationFrameId: null,
    speed: 0,
    displaySpeed: 0,
    enemySpeed: 0,
    index: 0,
    bgX: 0,
    bestScore: 0,
    currentScore: 0,
    beerScore: 0,
    bestBeerScore: 0,
    currentKills: 0,
    bestKills: 0,
    bossMode: false,
    bossEntryDelay: 0,
    pipesEntered: 0,
    postBossDelayActive: false,
    lastWeaponCollectedScore: 0,
    renderCount: 0,
    isRendering: false,
    lastOnFireBeerScore: 0,
    itemSpawnCounter: 0,
    weaponCooldown: 0,
    specialWeaponCooldown: 0,
    vomitCooldown: 0,
    onFire: false,
    onFireTimer: 0,
    boss1Defeated: false,
    boss2Defeated: false,
    boss3Defeated: false,
    boss3AppearedOnce: false,
    boss3AppearedTwice: false,
    firstClickDone: false,
    lastAlternatingEnemyType: "enemy1",
    lastEnemyKillPosition: null,
    lastWeaponSpawnScore: 0,
    showSpeedUpAd: false,
    speedUpAdTimer: 0,
    cTenth: canvas.width / 20,
    bg_train: [],
    pipes: [],
    enemies: [],
    shots: [],
    items: [],
    particles: [],
    shieldParticles: [],
    activeBoss: null,
    enemySpawnTimer: 0,
    randomBeerSpawnTimer: 0,
    messageLine1: "",
    messageLine2: "",
    showMessage: false,
    messageTimer: 0,
    messageColor: "black",
    fireworks: [],
    onFireParticles: [],
    speedUpParticles: [],
    itemParticles: [],
    collectionParticles: [],
    lastItemSpawnScore: 0,
    enemyCounter: 0
};
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
if (isMobile) {
    gameSettings.gravity = .036;
    gameSettings.jump = -.8;
    gameSettings.initialSpeed = 2.5;
    gameSettings.initialEnemySpeed = 1.5;
    gameSettings.thrustAmount = .2
}
const pipeLoc = () => Math.random() * (canvas.height - (gameSettings.pipeGap - gameSettings.pipeWidth) - gameSettings.pipeWidth);
const backgrounds = [backgroundImg, backgroundM1Img, backgroundM2Img, backgroundM3Img, backgroundM4Img, backgroundM5Img, backgroundM6Img, backgroundM7Img];
const transitionBackgrounds = [backgroundM0TImg, backgroundM1TImg, backgroundM2TImg, backgroundM3TImg, backgroundM4TImg, backgroundM5TImg];
const weaponColors = ["#FF00FF", "#00FFFF", "#FFFF00", "#FF4500", "#ADFF2F", "#8A2BE2"];
const itemColors = {
    beer: "#FFD700",
    shield: "#87CEEB",
    weapon: "#FF69B4",
    vomit: "#9ACD32",
    bomb: "#FF0000"
};

function fireSingleShot(color, vx, vy, bounce = false, yOffset = 0) {
    const shotY = playerState.flyHeight + playerState.size[1] / 2 + yOffset;
    const commonShotProperties = {
        x: gameState.cTenth + playerState.size[0],
        y: shotY,
        width: 8,
        height: 10,
        trail: []
    };
    gameState.shots.push({
        ...commonShotProperties,
        color: color,
        vx: vx,
        vy: vy,
        bounce: bounce
    })
}

function generateItemParticles(item) {
    const numParticles = 1;
    const itemCenterX = item.x + item.width / 2;
    const itemCenterY = item.y + item.height / 2;
    const particleColor = itemColors[item.type] || "#FFFFFF";
    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * (item.width / 2 + 5);
        item.itemParticles.push({
            x: itemCenterX + Math.cos(angle) * radius,
            y: itemCenterY + Math.sin(angle) * radius,
            vx: (Math.random() - .5) * .5,
            vy: (Math.random() - .5) * .5,
            lifespan: 60 + Math.random() * 30,
            size: Math.random() * 1.5 + .5,
            color: particleColor,
            initialAngle: angle,
            orbitRadius: radius,
            orbitSpeed: (Math.random() - .5) * .02
        })
    }
}

function spawnItem(type, x, y) {
    const itemConfig = {
        beer: {
            width: gameSettings.itemWidth,
            height: gameSettings.itemHeight
        },
        shield: {
            width: gameSettings.shieldWidth,
            height: gameSettings.shieldHeight
        },
        weapon: {
            width: gameSettings.weaponItemWidth,
            height: gameSettings.weaponItemHeight
        },
        vomit: {
            width: gameSettings.weaponItemWidth,
            height: gameSettings.weaponItemHeight
        },
        bomb: {
            width: gameSettings.bombItemWidth,
            height: gameSettings.bombItemHeight
        }
    };
    const config = itemConfig[type];
    const item = {
        x: x,
        y: y,
        initialY: y,
        type: type,
        width: config.width,
        height: config.height,
        color: itemColors[type],
        itemParticles: [],
        scale: 1
    };
    gameState.items.push(item);
    generateItemParticles(item)
}
const spawnBeerItem = (x, y) => spawnItem("beer", x, y);
const spawnShieldItem = (x, y) => spawnItem("shield", x, y);
const spawnWeaponItem = (x, y) => spawnItem("weapon", x, y);
const spawnVomitItem = (x, y) => spawnItem("vomit", x, y);
const spawnBombItem = (x, y) => spawnItem("bomb", x, y);

function spawnShieldParticles() {
    gameState.shieldParticles = [];
    const shieldRadius = playerState.size[0] / 2 + 10;
    for (let i = 0; i < 20; i++) {
        gameState.shieldParticles.push({
            angle: i / 20 * 2 * Math.PI,
            radius: shieldRadius,
            size: Math.random() * 3 + 2,
            color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)`
        })
    }
}

function createParticles(array, count, propertiesFactory) {
    for (let i = 0; i < count; i++) {
        array.push(propertiesFactory(i))
    }
}

function createExplosion(x, y, count = 10) {
    createParticles(gameState.particles, count, () => ({
        x: x,
        y: y,
        vx: (Math.random() - .5) * 4,
        vy: (Math.random() - .5) * 4,
        lifespan: 30,
        size: Math.random() * 3 + 1
    }))
}

function showMessageWithDuration(line1, line2, color, duration) {
    gameState.messageLine1 = line1;
    gameState.messageLine2 = line2;
    gameState.messageColor = color;
    gameState.showMessage = true;
    gameState.messageTimer = duration
}

function createFireworks(x, y, count = 30) {
    createParticles(gameState.fireworks, count, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        return {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            lifespan: 60,
            size: Math.random() * 4 + 2,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        }
    })
}

function createOnFireParticles(x, y, count = 5) {
    createParticles(gameState.onFireParticles, count, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + .5;
        const colorHue = Math.random() * 60;
        return {
            x: x + Math.cos(angle) * (playerState.size[0] / 2 + 5),
            y: y + Math.sin(angle) * (playerState.size[1] / 2 + 5),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            lifespan: 20 + Math.random() * 10,
            size: Math.random() * 2 + 1,
            color: `hsl(${colorHue}, 100%, 50%)`
        }
    })
}

function createSpeedUpParticles(x, y, count = 5) {
    createParticles(gameState.speedUpParticles, count, () => {
        const angle = Math.random() * (Math.PI / 2) - Math.PI / 4;
        const speed = Math.random() * 3 + 1;
        const colorHue = Math.random() * 60;
        return {
            x: x,
            y: y + (Math.random() - .5) * playerState.size[1],
            vx: -speed * Math.cos(angle),
            vy: speed * Math.sin(angle),
            lifespan: 25 + Math.random() * 15,
            size: Math.random() * 3 + 2,
            color: `hsl(${colorHue}, 100%, 50%)`
        }
    })
}

function createCollectionParticles(x, y, color, count = 15) {
    createParticles(gameState.collectionParticles, count, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        return {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            lifespan: 30 + Math.random() * 15,
            size: Math.random() * 3 + 1,
            color: color
        }
    })
}
const enemyBaseInterval = 120;
const enemyMinInterval = 40;
const effectiveEnemyBaseInterval = isMobile ? enemyBaseInterval * 2 : enemyBaseInterval;
let effectiveEnemyMinInterval = isMobile ? enemyMinInterval * 2 : enemyMinInterval;
const bossConfigs = {
    1: {
        image: enemy1Frames[0],
        hp: 50,
        shootTimer: 240,
        enemySpawnTimer: 180,
        enemyType: "enemy1",
        vy: -1,
        x: canvas.width - 150,
        y: canvas.height,
        healthBarColor: "green",
        shotColor: "orange"
    },
    2: {
        image: enemy2Frames[0],
        hp: 100,
        shootTimer: 210,
        enemySpawnTimer: 120,
        enemyType: "enemy2",
        vx: -2,
        vy: -1,
        x: canvas.width + 150,
        y: canvas.height,
        healthBarColor: "purple",
        shotColor: "purple"
    },
    3: {
        image: enemy3Img,
        hp: 150,
        shootTimer: 210,
        enemySpawnTimer: 120,
        enemyType: "enemy3",
        vx: -2,
        vy: -1,
        x: canvas.width,
        y: canvas.height,
        healthBarColor: "cyan",
        shotColor: "cyan"
    }
};

function spawnBoss(level) {
    let config = {
        ...bossConfigs[level]
    };
    if (level === 3 && gameState.boss3AppearedOnce) {
        config.hp = 300
    }
    gameState.activeBoss = {
        level: level,
        ...config,
        width: 150,
        height: 150,
        maxHp: config.hp,
        phase: "entry",
        shots: [],
        shotCount: 0
    };
    gameState.bossMode = true;
    gameState.bossEntryDelay = 60
}

function setup() {
    gameState.currentScore = 0;
    gameState.beerScore = 0;
    gameState.currentKills = 0;
    playerState.flight = gameSettings.jump;
    playerState.flyHeight = canvas.height / 2 - playerState.size[1] / 2 + 150;
    gameState.speed = gameSettings.initialSpeed;
    gameState.displaySpeed = gameSettings.initialSpeed;
    gameState.enemySpeed = gameSettings.initialEnemySpeed;
    gameState.enemies = [];
    gameState.shots = [];
    gameState.items = [];
    gameState.particles = [];
    gameState.shieldParticles = [];
    gameState.activeBoss = null;
    gameState.enemySpawnTimer = effectiveEnemyBaseInterval;
    gameState.randomBeerSpawnTimer = 120 + Math.random() * 120;
    gameState.showSpeedUpAd = false;
    gameState.speedUpAdTimer = 0;
    gameState.bossMode = false;
    gameState.bossEntryDelay = 0;
    gameState.pipesEntered = 0;
    gameState.postBossDelayActive = false;
    gameState.boss1Defeated = false;
    gameState.boss2Defeated = false;
    gameState.boss3Defeated = false;
    gameState.boss3AppearedOnce = false;
    gameState.boss3AppearedTwice = false;
    effectiveEnemyMinInterval = isMobile ? enemyMinInterval * 2 : enemyMinInterval;
    gameState.lastAlternatingEnemyType = "enemy1";
    gameState.onFire = false;
    gameState.onFireTimer = 0;
    gameState.lastOnFireBeerScore = 0;
    gameState.showMessage = false;
    gameState.messageTimer = 0;
    gameState.fireworks = [];
    gameState.onFireParticles = [];
    gameState.speedUpParticles = [];
    playerState.hasShield = false;
    gameState.lastEnemyKillPosition = null;
    playerState.weaponLevel = 0;
    gameState.lastWeaponCollectedScore = 0;
    gameState.itemSpawnCounter = 0;
    gameState.weaponCooldown = 0;
    gameState.specialWeaponCooldown = 0;
    gameState.vomitCooldown = 0;
    gameState.isRendering = false;
    gameState.bgX = 0;
    gameState.bg_train = [backgroundImg, backgroundImg];
    gameState.pipes = [];
    gameState.lastItemSpawnScore = 0;
    gameState.enemyCounter = 0;
}

function spawnEnemy(type) {
    const x = canvas.width;
    let enemyWidth, enemyHeight;
    let y;
    gameState.enemyCounter++;
    if (type === "enemy1") {
        enemyWidth = gameSettings.ENEMY1_BASE_WIDTH;
        enemyHeight = gameSettings.ENEMY1_BASE_WIDTH * (enemy1Frames[0].height / enemy1Frames[0].width);
        const minY = canvas.height * .25;
        const maxY = canvas.height * .75 - enemyHeight;
        y = minY + Math.random() * (maxY - minY);
        gameState.enemies.push({
            id: gameState.enemyCounter,
            x: x,
            y: y,
            type: "enemy1",
            vx: -gameState.enemySpeed,
            vy: 0,
            width: enemyWidth,
            height: enemyHeight,
            frameIndex: 0,
            frameTimer: 0,
            frameDuration: 1,
            frameDirection: 1,
            hitboxOffsetX: 0,
            hitboxOffsetY: 0,
            hitboxWidth: enemyWidth,
            hitboxHeight: enemyHeight
        })
    } else if (type === "enemy2") {
        enemyWidth = gameSettings.ENEMY2_BASE_WIDTH;
        enemyHeight = gameSettings.ENEMY2_BASE_WIDTH * (enemy2Frames[0].height / enemy2Frames[0].width);
        const vx = -gameState.enemySpeed;
        const vy = (Math.random() < .5 ? 1 : -1) * gameState.enemySpeed * .5;
        y = Math.random() * (canvas.height - enemyHeight);
        gameState.enemies.push({
            id: gameState.enemyCounter,
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            type: "enemy2",
            width: enemyWidth,
            height: enemyHeight,
            frameIndex: 0,
            frameTimer: 0,
            frameDirection: 1,
            frameDuration: 5
        })
    } else if (type === "enemy3") {
        enemyWidth = gameSettings.ENEMY3_BASE_WIDTH;
        enemyHeight = gameSettings.ENEMY3_BASE_WIDTH * (enemy3Img.height / enemy3Img.width);
        y = Math.random() * (canvas.height - enemyHeight);
        const targetX = gameState.cTenth;
        const targetY = playerState.flyHeight;
        const dx = targetX - x;
        const dy = targetY - y;
        const angle = Math.atan2(dy, dx);
        const speed = gameState.enemySpeed * 1.2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        gameState.enemies.push({
            id: gameState.enemyCounter,
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            type: "enemy3",
            width: enemyWidth,
            height: enemyHeight
        })
    }
}

function getEnemyType() {
    let r = Math.random() * 100;
    if (r < 70) {
        return "enemy1"
    } else if (r < 90) {
        return "enemy3"
    } else {
        return "enemy2"
    }
}

function update() {
    gameState.index++;
    gameState.renderCount++;
    if (gameState.gamePlaying) {
        gameState.displaySpeed += (gameState.speed - gameState.displaySpeed) * .005;
        gameState.bgX -= gameState.displaySpeed / 4
    } else {
        gameState.bgX -= gameSettings.initialSpeed / 4
    }
    if (gameState.currentScore < 5 && gameState.gamePlaying) {
        if (gameState.index > 0 && gameState.index % 100 === 0) {
            gameState.currentScore++;
            gameState.bestScore = Math.max(gameState.bestScore, gameState.currentScore);
        }
    }
    if (gameState.weaponCooldown > 0) gameState.weaponCooldown--;
    if (gameState.specialWeaponCooldown > 0) gameState.specialWeaponCooldown--;
    if (gameState.vomitCooldown > 0) gameState.vomitCooldown--;
    if (gameState.onFire) {
        gameState.onFireTimer--;
        if (gameState.onFireTimer <= 0) {
            gameState.onFire = false
        }
    }
    
    if (gameState.gamePlaying) {
        if (playerState.isThrusting) playerState.flight -= gameSettings.thrustAmount;
        playerState.flight += gameSettings.gravity;
        playerState.flyHeight = Math.min(playerState.flyHeight + playerState.flight, canvas.height - playerState.size[1]);
        if (playerState.flyHeight <= 0 || playerState.flyHeight >= canvas.height - playerState.size[1]) {
            if (playerState.hasShield) {
                playerState.hasShield = false;
            }
            playerState.flight *= -0.2; // Reverse and dampen the flight
            if (playerState.flyHeight <= 0) {
                playerState.flyHeight = 1;
            }
            if (playerState.flyHeight >= canvas.height - playerState.size[1]) {
                playerState.flyHeight = canvas.height - playerState.size[1] - 1;
            }
        }
        if (playerState.isShooting) {
            playerState.shootTimer--;
            if (playerState.shootTimer <= 0) {
                fireShot();
                playerState.shootTimer = playerState.shootInterval
            }
        }
        for (let i = gameState.shots.length - 1; i >= 0; i--) {
            const shot = gameState.shots[i];
            
            shot.x += shot.vx;
            shot.y += shot.vy;
            if (shot.bounce) {
                if (shot.y <= 0 || shot.y + shot.height >= canvas.height) {
                    shot.vy *= -1
                }
            }
            shot.trail.push({
                x: shot.x,
                y: shot.y,
                lifespan: 15
            });
            for (let j = shot.trail.length - 1; j >= 0; j--) {
                const trailPart = shot.trail[j];
                trailPart.lifespan--;
                if (trailPart.lifespan <= 0) {
                    shot.trail.splice(j, 1)
                }
            }
            if (shot.x > canvas.width) {
                gameState.shots.splice(i, 1);
                continue
            }
            if (gameState.activeBoss && shot.x < gameState.activeBoss.x + gameState.activeBoss.width && shot.x + shot.width > gameState.activeBoss.x && shot.y < gameState.activeBoss.y + gameState.activeBoss.height && shot.y + shot.height > gameState.activeBoss.y) {
                gameState.shots.splice(i, 1);
                gameState.activeBoss.hp--;
                gameState.activeBoss.shotCount++;
                createExplosion(shot.x, shot.y);
                if (gameState.activeBoss.hp <= 0) {
                    createExplosion(gameState.activeBoss.x + gameState.activeBoss.width / 2, gameState.activeBoss.y + gameState.activeBoss.height / 2, 50);
                    createFireworks(gameState.activeBoss.x + gameState.activeBoss.width / 2, gameState.activeBoss.y + gameState.activeBoss.height / 2, 100);
                    const currentLevel = gameState.activeBoss.level;
                    if (currentLevel === 1) {
                        gameState.boss1Defeated = true;
                        gameState.enemySpeed += 1
                    } else if (currentLevel === 2) {
                        gameState.boss2Defeated = true;
                        gameState.enemySpeed += 1
                    } else if (currentLevel === 3) {
                        gameState.boss3Defeated = true
                    }
                    gameState.activeBoss = null;
                    gameState.bossMode = false;
                    gameState.postBossDelayActive = true;
                    gameState.bossEntryDelay = 5 * 60;
                    gameState.pipesEntered = 0;
                    showMessageWithDuration("Congratulation!", "", "gold", 120);
                    setTimeout(() => {
                        let nextMessage = currentLevel < 3 ? `Level ${currentLevel + 1}` : "You are";
                        let nextMessage2 = currentLevel < 3 ? "Start!" : "the boss!";
                        showMessageWithDuration(nextMessage, nextMessage2, "white", 120)
                    }, 2e3);
                    if (currentLevel === 3) {
                        setTimeout(() => {
                            showMessageWithDuration("To infinity", "and beyond!", "white", 180)
                        }, 4e3)
                    }
                }
                continue
            }
            for (let j = gameState.enemies.length - 1; j >= 0; j--) {
                const enemy = gameState.enemies[j];
                if (shot.x < enemy.x + enemy.width && shot.x + shot.width > enemy.x && shot.y < enemy.y + enemy.height && shot.y + shot.height > enemy.y) {
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    gameState.shots.splice(i, 1);
                    const enemyCenterX = enemy.x + enemy.width / 2;
                    const enemyCenterY = enemy.y + enemy.height / 2;
                    gameState.lastEnemyKillPosition = {
                        x: enemyCenterX - gameSettings.itemWidth / 2,
                        y: enemyCenterY - gameSettings.itemHeight / 2
                    };
                    gameState.enemies.splice(j, 1);
                    gameState.currentKills++;
                    gameState.bestKills = Math.max(gameState.bestKills, gameState.currentKills);
                    if (gameState.currentKills > 0 && gameState.currentKills % 10 === 0) {
                        spawnShieldItem(gameState.lastEnemyKillPosition.x, gameState.lastEnemyKillPosition.y)
                    }
                    break
                }
            }
        }
        if (gameState.activeBoss) {
            if (gameState.activeBoss.phase === "entry") {
                if (gameState.activeBoss.vx) gameState.activeBoss.x += gameState.activeBoss.vx;
                gameState.activeBoss.y += gameState.activeBoss.vy;
                if (gameState.activeBoss.x <= canvas.width - 150) {
                    gameState.activeBoss.x = canvas.width - 150;
                    gameState.activeBoss.vx = 0
                }
                if (gameState.activeBoss.y <= canvas.height / 2 - gameState.activeBoss.height / 2) {
                    gameState.activeBoss.y = canvas.height / 2 - gameState.activeBoss.height / 2;
                    gameState.activeBoss.vy = 2
                }
                if ((!gameState.activeBoss.vx || gameState.activeBoss.vx === 0) && gameState.activeBoss.vy === 2) {
                    gameState.activeBoss.phase = "active"
                }
            } else if (gameState.activeBoss.phase === "active") {
                gameState.activeBoss.y += gameState.activeBoss.vy;
                if (gameState.activeBoss.y + gameState.activeBoss.height > canvas.height || gameState.activeBoss.y < 0) {
                    gameState.activeBoss.vy *= -1
                }
            }
            gameState.activeBoss.shootTimer--;
            if (gameState.activeBoss.shootTimer <= 0) {
                const targetX = gameState.cTenth + playerState.size[0] / 2;
                const targetY = playerState.flyHeight + playerState.size[1] / 2;
                const bossShotX = gameState.activeBoss.x;
                const bossShotY = gameState.activeBoss.y + gameState.activeBoss.height / 2;
                const dx = targetX - bossShotX;
                const dy = targetY - bossShotY;
                const angle = Math.atan2(dy, dx);
                const bossShotSpeedValue = isMobile ? 1.5 : 3;
                const bossShotSpeed = bossShotSpeedValue;
                const vx = Math.cos(angle) * bossShotSpeed;
                const vy = Math.sin(angle) * bossShotSpeed;
                gameState.activeBoss.shots.push({
                    x: gameState.activeBoss.x,
                    y: gameState.activeBoss.y + gameState.activeBoss.height / 2,
                    width: 15,
                    height: 15,
                    vx: vx,
                    vy: vy,
                    color: gameState.activeBoss.shotColor
                });
                gameState.activeBoss.shootTimer = 120
            }
            gameState.activeBoss.enemySpawnTimer--;
            if (gameState.activeBoss.enemySpawnTimer <= 0) {
                spawnEnemy(gameState.activeBoss.enemyType);
                gameState.activeBoss.enemySpawnTimer = 180
            }
            if (gameState.cTenth < gameState.activeBoss.x + gameState.activeBoss.width && gameState.cTenth + playerState.size[0] > gameState.activeBoss.x && playerState.flyHeight < gameState.activeBoss.y + gameState.activeBoss.height && playerState.flyHeight + playerState.size[1] > gameState.activeBoss.y) {
                if (playerState.hasShield) {
                    playerState.hasShield = false
                } else {
                    gameState.gamePlaying = false;
                    setup()
                }
            }
        }

        if (gameState.currentScore === 60 && !gameState.bossMode && !gameState.postBossDelayActive && !gameState.boss1Defeated) {
            spawnBoss(1)
        }
        if (gameState.currentScore === 120 && !gameState.bossMode && !gameState.postBossDelayActive && !gameState.boss2Defeated) {
            spawnBoss(2)
        }
        if (gameState.currentScore === 180 && !gameState.bossMode && !gameState.postBossDelayActive && !gameState.boss3AppearedOnce) {
            spawnBoss(3);
            gameState.boss3AppearedOnce = true
        }
        if (gameState.currentScore === 500 && !gameState.bossMode && !gameState.postBossDelayActive && gameState.boss3Defeated && !gameState.boss3AppearedTwice) {
            spawnBoss(3);
            gameState.boss3AppearedTwice = true
        }
        if (gameState.bossMode && !gameState.activeBoss && gameState.bossEntryDelay > 0) {
            gameState.bossEntryDelay--;
            gameState.pipes = gameState.pipes.filter(pipe => pipe.x + gameSettings.pipeWidth > 0);
            gameState.enemies = gameState.enemies.filter(enemy => enemy.x + enemy.width > 0)
        }
        if (gameState.postBossDelayActive) {
            if (gameState.bossEntryDelay > 0) {
                gameState.bossEntryDelay--;
                gameState.pipes = gameState.pipes.filter(pipe => pipe.x + gameSettings.pipeWidth > 0);
                gameState.enemies = gameState.enemies.filter(enemy => enemy.x + enemy.width > 0)
            } else {
                gameState.postBossDelayActive = false;
                gameState.pipesEntered = 0;
                gameState.pipes = Array(3).fill().map((_, i) => ({
                    x: canvas.width + i * (gameSettings.pipeGap + gameSettings.pipeWidth),
                    y: pipeLoc(),
                    hasTop: gameState.currentScore < 5 || gameState.currentScore > 10
                }))
            }
        }
        if (gameState.activeBoss) {
            for (let i = gameState.activeBoss.shots.length - 1; i >= 0; i--) {
                const shot = gameState.activeBoss.shots[i];
                shot.x += shot.vx;
                shot.y += shot.vy;
                if (shot.x < 0) {
                    gameState.activeBoss.shots.splice(i, 1);
                    continue
                }
                if (gameState.cTenth < shot.x + shot.width && gameState.cTenth + playerState.size[0] > shot.x && playerState.flyHeight < shot.y + shot.height && playerState.flyHeight + playerState.size[1] > shot.y) {
                    if (playerState.hasShield) {
                        playerState.hasShield = false;
                        gameState.activeBoss.shots.splice(i, 1)
                    } else {
                        gameState.gamePlaying = false;
                        setup()
                    }
                }
            }
        }
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const p = gameState.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.lifespan--;
            if (p.lifespan <= 0) {
                gameState.particles.splice(i, 1)
            }
        }
        for (let i = gameState.collectionParticles.length - 1; i >= 0; i--) {
            const p = gameState.collectionParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.lifespan--;
            if (p.lifespan <= 0) {
                gameState.collectionParticles.splice(i, 1)
            }
        }
        for (let i = gameState.items.length - 1; i >= 0; i--) {
            const item = gameState.items[i];
            item.x -= gameState.speed;
            const oscillationAmplitude = 5;
            const oscillationSpeed = .05;
            const oscillatingY = item.initialY + Math.sin(gameState.index * oscillationSpeed + item.initialY / 10) * oscillationAmplitude;
            const itemCenterX = item.x + item.width / 2;
            const itemCenterY = oscillatingY + item.height / 2;
            for (let j = item.itemParticles.length - 1; j >= 0; j--) {
                const p = item.itemParticles[j];
                p.lifespan--;
                if (p.lifespan <= 0) {
                    item.itemParticles.splice(j, 1);
                    continue
                }
                p.initialAngle += p.orbitSpeed;
                p.x = itemCenterX + Math.cos(p.initialAngle) * p.orbitRadius + p.vx;
                p.y = itemCenterY + Math.sin(p.initialAngle) * p.orbitRadius + p.vy
            }
            const scaleAmplitude = .05;
            const scaleSpeed = .1;
            item.scale = 1 + Math.sin(gameState.index * scaleSpeed + item.initialY / 10) * scaleAmplitude;
            const scaledWidth = item.width * item.scale;
            const scaledHeight = item.height * item.scale;
            if (item.x + item.width < 0) {
                gameState.items.splice(i, 1);
                continue
            }
            if (gameState.cTenth < item.x + scaledWidth && gameState.cTenth + playerState.size[0] > item.x && playerState.flyHeight < oscillatingY + scaledHeight && playerState.flyHeight + playerState.size[1] > oscillatingY) {
                createCollectionParticles(gameState.cTenth + playerState.size[0] / 2, playerState.flyHeight + playerState.size[1] / 2, item.color, item.type === "beer" ? (isMobile ? 5 : 15) : 15);
                if (item.type === "shield") {
                    playerState.hasShield = true;
                    spawnShieldParticles()
                } else if (item.type === "weapon") {
                    if (playerState.weaponLevel < 3) {
                        playerState.weaponLevel++;
                        gameState.lastWeaponCollectedScore = gameState.currentScore;
                        let message = "";
                        if (playerState.weaponLevel === 1) message = "Double Shot!";
                        else if (playerState.weaponLevel === 2) message = "Triple Shot!";
                        else if (playerState.weaponLevel === 3) message = "Max Weapon!";
                        showMessageWithDuration(message, "", "gold", 90)
                    } else {
                        showMessageWithDuration("Max Weapon", "Level!", "gold", 90)
                    }
                } else if (item.type === "bomb") {
                    clearScreen();
                } else if (item.type === "vomit") {
                    if (playerState.weaponLevel > 0) {
                        playerState.weaponLevel = 0;
                        showMessageWithDuration("Basic Shot!", "", "orange", 90)
                    }
                } else if (item.type === "beer") {
                    gameState.beerScore++;
                    gameState.bestBeerScore = Math.max(gameState.bestBeerScore, gameState.beerScore)
                }
                gameState.items.splice(i, 1)
            }
        }
        if (gameState.gamePlaying && gameState.currentScore >= 5 && gameState.pipes.length === 0) {
            gameState.pipes = Array(3).fill().map((_, i) => ({
                x: canvas.width + i * (gameSettings.pipeGap + gameSettings.pipeWidth),
                y: pipeLoc(),
                hasTop: gameState.currentScore < 5 || gameState.currentScore > 10
            }));
        }
        gameState.pipes.forEach((pipe, i) => {
            pipe.x -= gameState.displaySpeed;
            if (!gameState.bossMode && !gameState.postBossDelayActive && !gameState.activeBoss && (gameState.boss1Defeated || gameState.boss2Defeated || gameState.boss3Defeated || gameState.pipesEntered < 60) && pipe.x <= -gameSettings.pipeWidth) {
                gameState.currentScore++;
                gameState.itemSpawnCounter++;
                gameState.pipesEntered++;
                gameState.bestScore = Math.max(gameState.bestScore, gameState.currentScore);
                const newPipe = {
                    x: gameState.pipes[gameState.pipes.length - 1].x + gameSettings.pipeGap + gameSettings.pipeWidth,
                    y: pipeLoc(),
                    hasTop: gameState.currentScore < 5 || gameState.currentScore > 10
                };
                gameState.pipes = [...gameState.pipes.slice(1), newPipe];
                const numberOfBeers = Math.floor(Math.random() * 2) + 3;
                const startX = gameState.pipes[gameState.pipes.length - 2].x + gameSettings.pipeWidth;
                const availableHorizontalSpace = newPipe.x - startX;
                const totalBeersWidth = numberOfBeers * gameSettings.itemWidth + (numberOfBeers - 1) * gameSettings.fixedHorizontalBeerSpacing;
                const groupStartX = startX + (availableHorizontalSpace - totalBeersWidth) / 2;
                for (let i = 0; i < numberOfBeers; i++) {
                    const beerX = groupStartX + i * (gameSettings.itemWidth + gameSettings.fixedHorizontalBeerSpacing);
                    let individualBeerY = newPipe.y + gameSettings.pipeGap / 2 - gameSettings.itemHeight / 2;
                    const randomVerticalPosition = Math.floor(Math.random() * 3);
                    if (randomVerticalPosition === 0) {
                        individualBeerY -= gameSettings.verticalBeerOffsetAmount
                    } else if (randomVerticalPosition === 2) {
                        individualBeerY += gameSettings.verticalBeerOffsetAmount
                    }
                    individualBeerY = Math.max(newPipe.y, individualBeerY);
                    individualBeerY = Math.min(newPipe.y + gameSettings.pipeGap - gameSettings.itemHeight, individualBeerY);
                    spawnBeerItem(beerX, individualBeerY)
                }
                if (gameState.currentScore > 0 && gameState.currentScore % 10 === 0) {
                    const itemX = Math.round(newPipe.x + gameSettings.pipeWidth / 2 - gameSettings.weaponItemWidth / 2);
                    const itemY = Math.round(newPipe.y + gameSettings.pipeGap / 2 - gameSettings.weaponItemHeight / 2);
                    const rand = Math.random();
                    if (rand < 0.33) {
                        spawnWeaponItem(itemX, itemY);
                    } else if (rand < 0.66) {
                        spawnVomitItem(itemX, itemY);
                    } else {
                        spawnBombItem(itemX, itemY);
                    }
                }
                if (gameState.currentScore % 20 === 0 && gameState.currentScore !== 60 && gameState.currentScore !== 120 && gameState.currentScore !== 180) {
                    gameState.speed += gameSettings.speedIncreaseAmount;
                    gameState.showSpeedUpAd = true;
                    gameState.speedUpAdTimer = gameSettings.speedUpAdDuration
                }
                if (gameState.boss3Defeated && gameState.currentScore > 180 && (gameState.currentScore - 180) % 60 === 0) {
                    gameState.enemySpeed += gameSettings.enemySpeedIncreaseAmount
                }
                if (gameState.currentScore > 300 && (gameState.currentScore - 300) % 60 === 0) {
                    effectiveEnemyMinInterval = Math.max(10, effectiveEnemyMinInterval - 5)
                }
                if (gameState.beerScore > 0 && gameState.beerScore % 10 === 0 && gameState.beerScore !== gameState.lastOnFireBeerScore) {
                    gameState.onFire = true;
                    gameState.onFireTimer = gameSettings.ON_FIRE_DURATION;
                    showMessageWithDuration("ON FIRE!", "", "red", 120);
                    gameState.lastOnFireBeerScore = gameState.beerScore
                }
            }
            const playerHitbox = {
                x: gameState.cTenth + 5,
                y: playerState.flyHeight + 5,
                width: playerState.size[0] - 10,
                height: playerState.size[1] - 10
            };
            const pipeHitbox = {
                x: pipe.x + 25,
                y: pipe.y,
                width: gameSettings.pipeWidth - 50,
                gap: gameSettings.pipeGap
            };
            const collisionWithTop = pipe.hasTop && pipeHitbox.y > playerHitbox.y;
            const collisionWithBottom = pipeHitbox.y + pipeHitbox.gap < playerHitbox.y + playerHitbox.height;
            if (pipeHitbox.x < playerHitbox.x + playerHitbox.width && pipeHitbox.x + pipeHitbox.width > playerHitbox.x && (collisionWithTop || collisionWithBottom)) {
                if (playerState.hasShield) {
                    playerState.hasShield = false
                } else {
                    gameState.gamePlaying = false;
                    setup()
                }
            }
        });
        if (gameState.gamePlaying && !gameState.bossMode && !gameState.postBossDelayActive && !gameState.activeBoss) {
            gameState.enemySpawnTimer--;
            if (gameState.enemySpawnTimer <= 0) {
                spawnEnemy(getEnemyType());
                gameState.enemySpawnTimer = Math.max(effectiveEnemyMinInterval, effectiveEnemyBaseInterval - gameState.currentScore * .7)
            }
        }
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const e = gameState.enemies[i];
            e.x += e.vx;
            e.y += e.vy;
            if (e.type === "enemy1" || e.type === "enemy2") {
                e.frameTimer++;
                if (e.frameTimer >= e.frameDuration) {
                    e.frameTimer = 0;
                    const framesArray = e.type === "enemy1" ? enemy1Frames : enemy2Frames;
                    if (e.frameIndex + e.frameDirection >= framesArray.length || e.frameIndex + e.frameDirection < 0) {
                        e.frameDirection *= -1
                    }
                    e.frameIndex += e.frameDirection;
                    e.frameIndex = Math.max(0, Math.min(e.frameIndex, framesArray.length - 1))
                }
            }
            if (e.type === "enemy2" || e.type === "enemy3") {
                if (e.y <= 0 || e.y + e.height >= canvas.height) {
                    e.vy *= -1
                }
            }
            if (e.x + e.width < 0) {
                gameState.enemies.splice(i, 1);
                continue
            }
            if (e.type === "enemy1" && gameState.cTenth < e.x + e.hitboxOffsetX + e.hitboxWidth && gameState.cTenth + playerState.size[0] > e.x + e.hitboxOffsetX && playerState.flyHeight < e.y + e.hitboxOffsetY + e.hitboxHeight && playerState.flyHeight + playerState.size[1] > e.y + e.hitboxOffsetY || e.type !== "enemy1" && gameState.cTenth < e.x + e.width && gameState.cTenth + playerState.size[0] > e.x && playerState.flyHeight < e.y + e.height && playerState.flyHeight + playerState.size[1] > e.y) {
                if (playerState.hasShield) {
                    playerState.hasShield = false;
                    gameState.enemies.splice(i, 1)
                } else {
                    gameState.gamePlaying = false;
                    setup()
                }
                break
            }
        }
        if (gameState.showSpeedUpAd && gameState.speedUpAdTimer > 0) {
            gameState.speedUpAdTimer--;
            createSpeedUpParticles(gameState.cTenth, playerState.flyHeight + playerState.size[1] / 2, 8)
        }
        if (gameState.showMessage && gameState.messageTimer > 0) {
            gameState.messageTimer--;
            if (gameState.messageTimer === 0) {
                gameState.showMessage = false
            }
        }
        for (let i = gameState.fireworks.length - 1; i >= 0; i--) {
            const p = gameState.fireworks[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += .1;
            p.lifespan--;
            if (p.lifespan <= 0) {
                gameState.fireworks.splice(i, 1)
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderBackground();
    if (gameState.gamePlaying) {
        ctx.drawImage(playerState.isThrusting ? playerImg2 : playerImg, gameState.cTenth, playerState.flyHeight, ...playerState.size);
        if (playerState.hasShield) {
            ctx.beginPath();
            ctx.arc(gameState.cTenth + playerState.size[0] / 2, playerState.flyHeight + playerState.size[1] / 2, playerState.size[0] / 2 + 10, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgba(173, 216, 230, 0.5)";
            ctx.lineWidth = 5;
            ctx.stroke();
            const playerCenterX = gameState.cTenth + playerState.size[0] / 2;
            const playerCenterY = playerState.flyHeight + playerState.size[1] / 2;
            for (let i = gameState.shieldParticles.length - 1; i >= 0; i--) {
                const p = gameState.shieldParticles[i];
                p.angle += .05;
                const x = playerCenterX + Math.cos(p.angle) * p.radius;
                const y = playerCenterY + Math.sin(p.angle) * p.radius;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(x, y, p.size, 0, 2 * Math.PI);
                ctx.fill()
            }
        }
        if (gameState.onFire) {
            createOnFireParticles(gameState.cTenth + playerState.size[0] / 2, playerState.flyHeight + playerState.size[1] / 2, isMobile ? 3 : 8);
            for (let i = gameState.onFireParticles.length - 1; i >= 0; i--) {
                const p = gameState.onFireParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.lifespan--;
                if (p.lifespan <= 0) {
                    gameState.onFireParticles.splice(i, 1);
                    continue
                }
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (p.lifespan / 30), 0, 2 * Math.PI);
                ctx.fill()
            }
        }
        for (let i = gameState.speedUpParticles.length - 1; i >= 0; i--) {
            const p = gameState.speedUpParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.lifespan--;
            if (p.lifespan <= 0) {
                gameState.speedUpParticles.splice(i, 1);
                continue
            }
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.lifespan / 15), 0, 2 * Math.PI);
            ctx.fill()
        }
        for (let i = gameState.shots.length - 1; i >= 0; i--) {
            const shot = gameState.shots[i];
            for (let j = shot.trail.length - 1; j >= 0; j--) {
                const trailPart = shot.trail[j];
                ctx.fillStyle = `${shot.color}50`;
                ctx.beginPath();
                ctx.arc(trailPart.x + shot.width / 2, trailPart.y + shot.height / 2, shot.width / 2 * (trailPart.lifespan / 15), 0, 2 * Math.PI);
                ctx.fill()
            }
            ctx.fillStyle = shot.color;
            ctx.beginPath();
            ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke()
        }
        if (gameState.activeBoss) {
            ctx.drawImage(gameState.activeBoss.image, gameState.activeBoss.x, gameState.activeBoss.y, gameState.activeBoss.width, gameState.activeBoss.height);
            ctx.fillStyle = "red";
            ctx.fillRect(gameState.activeBoss.x, gameState.activeBoss.y - 20, gameState.activeBoss.width, 10);
            ctx.fillStyle = gameState.activeBoss.healthBarColor;
            ctx.fillRect(gameState.activeBoss.x, gameState.activeBoss.y - 20, gameState.activeBoss.width * (gameState.activeBoss.hp / gameState.activeBoss.maxHp), 10);
            for (let i = gameState.activeBoss.shots.length - 1; i >= 0; i--) {
                const shot = gameState.activeBoss.shots[i];
                ctx.fillStyle = shot.color;
                ctx.beginPath();
                ctx.arc(shot.x + shot.width / 2, shot.y + shot.height / 2, shot.width / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = "darkred";
                ctx.lineWidth = 2;
                ctx.stroke()
            }
        }
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const p = gameState.particles[i];
            if (p.isFlash) {
                p.size += (p.maxSize - p.size) * .1;
                ctx.fillStyle = `rgba(255, 255, 255, ${p.lifespan / 60})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
                ctx.fill()
            } else {
                ctx.fillStyle = `rgba(255, 0, 0, ${p.lifespan / 30})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
                ctx.fill()
            }
        }
        for (let i = gameState.collectionParticles.length - 1; i >= 0; i--) {
            const p = gameState.collectionParticles[i];
            ctx.fillStyle = `${p.color}80`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.lifespan / 30), 0, 2 * Math.PI);
            ctx.fill()
        }
        for (let i = gameState.items.length - 1; i >= 0; i--) {
            const item = gameState.items[i];
            const oscillatingY = item.initialY + Math.sin(gameState.index * .05 + item.initialY / 10) * 5;
            for (let j = item.itemParticles.length - 1; j >= 0; j--) {
                const p = item.itemParticles[j];
                ctx.fillStyle = `${p.color}50`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (p.lifespan / (60 + 30)), 0, 2 * Math.PI);
                ctx.fill()
            }
            const scaledWidth = item.width * item.scale;
            const scaledHeight = item.height * item.scale;
            const offsetX = (item.width - scaledWidth) / 2;
            const offsetY = (item.height - scaledHeight) / 2;
            let itemImg;
            if (item.type === "shield") itemImg = shieldImg;
            else if (item.type === "weapon") itemImg = weaponImg;
            else if (item.type === "vomit") itemImg = vomitImg;
            else if (item.type === "bomb") itemImg = bombImg;
            else itemImg = beerImg;
            ctx.drawImage(itemImg, item.x + offsetX, oscillatingY + offsetY, scaledWidth, scaledHeight)
        }
        gameState.pipes.forEach(pipe => {
            if (pipe.hasTop) {
                const topPipeHeight = topPipeImg.height * (gameSettings.pipeWidth / topPipeImg.width);
                ctx.drawImage(topPipeImg, pipe.x, pipe.y - topPipeHeight, gameSettings.pipeWidth, topPipeHeight)
            }
            const bottomPipeHeight = bottomPipeImg.height * (gameSettings.pipeWidth / bottomPipeImg.width);
            ctx.drawImage(bottomPipeImg, pipe.x, pipe.y + gameSettings.pipeGap, gameSettings.pipeWidth, bottomPipeHeight)
        });
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const e = gameState.enemies[i];
            let currentEnemyImage;
            if (e.type === "enemy1") currentEnemyImage = enemy1Frames[e.frameIndex];
            else if (e.type === "enemy2") currentEnemyImage = enemy2Frames[e.frameIndex];
            else if (e.type === "enemy3") currentEnemyImage = enemy3Img;
            if (currentEnemyImage) {
                ctx.drawImage(currentEnemyImage, 0, 0, currentEnemyImage.width, currentEnemyImage.height, e.x, e.y, e.width, e.height)
            }
        }
        ctx.textAlign = "right";
        ctx.font = "bold 16px courier";
        ctx.fillStyle = "black";
        ctx.fillText(`Score : ${gameState.currentScore}`, canvas.width - 10, 40);
        ctx.fillText(`Kills : ${gameState.currentKills}`, canvas.width - 10, 64);
        ctx.fillText(`Beers : ${gameState.beerScore}`, canvas.width - 10, 88);
        if (playerState.specialWeaponActive) {
            ctx.textAlign = "center";
            ctx.font = "bold 20px courier";
            ctx.fillStyle = "gold";
            ctx.fillText(`Missiles: ${Math.ceil(playerState.specialWeaponTimer / 60)}s`, canvas.width / 2, 30)
        }
        if (gameState.showMessage && gameState.messageTimer > 0) {
            ctx.textAlign = "center";
            ctx.font = "bold 50px Arial";
            ctx.fillStyle = gameState.messageColor;
            if (gameState.messageLine2) {
                ctx.fillText(gameState.messageLine1, canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillText(gameState.messageLine2, canvas.width / 2, canvas.height / 2 + 40)
            } else {
                ctx.fillText(gameState.messageLine1, canvas.width / 2, canvas.height / 2)
            }
        }
        for (let i = gameState.fireworks.length - 1; i >= 0; i--) {
            const p = gameState.fireworks[i];
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.lifespan / 60), 0, 2 * Math.PI);
            ctx.fill()
        }
    } else {
        ctx.drawImage(playerImg, gameState.cTenth, playerState.flyHeight, ...playerState.size);
        ctx.textAlign = "center";
        ctx.font = "bold 30px courier";
        ctx.fillStyle = "black";
        ctx.fillText(`Best score : ${gameState.bestScore}`, canvas.width / 2, canvas.height / 2 - 60);
        ctx.fillText(`Best Kills : ${gameState.bestKills}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText(`Best Beers : ${gameState.bestBeerScore}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText("Click to play", canvas.width / 2, canvas.height / 2 + 90)
    }
}

function render() {
    if (gameState.isRendering) return;
    gameState.isRendering = true;
    if (gameState.isPaused) {
        gameState.animationFrameId = requestAnimationFrame(render);
        gameState.isRendering = false;
        return
    }
    update();
    draw();
    gameState.isRendering = false;
    gameState.animationFrameId = requestAnimationFrame(render)
}

function renderBackground() {
    let currentBackgroundIndex;
    if (gameState.currentScore >= 240) {
        currentBackgroundIndex = 7
    } else if (gameState.currentScore >= 180) {
        currentBackgroundIndex = 6
    } else {
        currentBackgroundIndex = Math.floor(gameState.currentScore / 30)
    }
    let currentMainBackground = backgrounds[currentBackgroundIndex] || backgrounds[backgrounds.length - 1];
    if (gameState.bg_train.length === 0) {
        gameState.bg_train.push(currentMainBackground, currentMainBackground)
    }
    for (let i = 0; i < gameState.bg_train.length; i++) {
        const img = gameState.bg_train[i];
        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, gameState.bgX + i * canvas.width, 0, canvas.width, canvas.height)
        } else {
            ctx.fillStyle = "red";
            ctx.fillRect(Math.round(gameState.bgX + i * canvas.width), 0, canvas.width, canvas.height)
        }
    }
    if (gameState.bgX <= -canvas.width) {
        gameState.bgX += canvas.width;
        gameState.bg_train.shift();
        const lastImageInTrain = gameState.bg_train[gameState.bg_train.length - 1] || currentMainBackground;
        const lastImageIsTransition = transitionBackgrounds.includes(lastImageInTrain);
        if (lastImageIsTransition) {
            const transitionIndex = transitionBackgrounds.indexOf(lastImageInTrain);
            gameState.bg_train.push(backgrounds[transitionIndex + 1])
        } else {
            const lastImageIndex = backgrounds.indexOf(lastImageInTrain);
            if (currentBackgroundIndex > lastImageIndex && lastImageIndex > -1) {
                const transition = transitionBackgrounds[lastImageIndex];
                if (transition) {
                    gameState.bg_train.push(transition)
                } else {
                    gameState.bg_train.push(currentMainBackground)
                }
            } else {
                gameState.bg_train.push(currentMainBackground)
            }
        }
    }
}

function startGameIfReady() {
    loadAllImages().then(() => {
        setup();
        gameState.index = 0;
        gameState.animationFrameId = requestAnimationFrame(render)
    })
}

function fireShot() {
    const shotSpeedValue = gameSettings.shotSpeed;
    if (gameState.onFire) {
        fireSingleShot(weaponColors[Math.floor(Math.random() * weaponColors.length)], shotSpeedValue, 0);
        fireSingleShot(weaponColors[Math.floor(Math.random() * weaponColors.length)], shotSpeedValue, 0, false, -5);
        fireSingleShot(weaponColors[Math.floor(Math.random() * weaponColors.length)], shotSpeedValue, 0, false, 5);
        fireSingleShot(weaponColors[Math.floor(Math.random() * weaponColors.length)], shotSpeedValue * .9, -shotSpeedValue * .4);
        fireSingleShot(weaponColors[Math.floor(Math.random() * weaponColors.length)], shotSpeedValue * .9, shotSpeedValue * .4)
    } else {
        if (playerState.weaponLevel === 0) {
            fireSingleShot(weaponColors[0], shotSpeedValue, 0)
        } else if (playerState.weaponLevel === 1) {
            fireSingleShot(weaponColors[1], shotSpeedValue, 0, false, -7);
            fireSingleShot(weaponColors[1], shotSpeedValue, 0, false, 7)
        } else if (playerState.weaponLevel === 2) {
            fireSingleShot(weaponColors[2], shotSpeedValue, 0);
            fireSingleShot(weaponColors[2], shotSpeedValue, 0, false, -10);
            fireSingleShot(weaponColors[2], shotSpeedValue, 0, false, 10)
        } else if (playerState.weaponLevel >= 3) {
            fireSingleShot(weaponColors[3], shotSpeedValue, 0);
            fireSingleShot(weaponColors[3], shotSpeedValue, 0, false, -10);
            fireSingleShot(weaponColors[3], shotSpeedValue, 0, false, 10)
        }
    }
}

function clearScreen() {
    gameState.particles.push({
        x: gameState.cTenth + playerState.size[0] / 2,
        y: playerState.flyHeight + playerState.size[1] / 2,
        vx: 0,
        vy: 0,
        lifespan: 60,
        size: 10,
        isFlash: true,
        maxSize: canvas.width,
        color: "white"
    });
    gameState.enemies.forEach(enemy => {
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 30);
        gameState.currentKills++;
        gameState.bestKills = Math.max(gameState.bestKills, gameState.currentKills)
    });
    gameState.enemies = []
}

function handleInteractionStart() {
    if (!gameState.gamePlaying && !gameState.isPaused) {
        gameState.gamePlaying = true;
        playerState.isThrusting = true;
        gameState.firstClickDone = true;
        showMessageWithDuration("Level 1", "Start!", "white", 120)
    } else if (gameState.gamePlaying && !gameState.isPaused) {
        playerState.isThrusting = true;
        playerState.isShooting = true;
        fireShot()
    }
}

function handleInteractionEnd() {
    playerState.isShooting = false;
    playerState.isThrusting = false
}
document.addEventListener("mousedown", handleInteractionStart);
document.addEventListener("mouseup", handleInteractionEnd);
document.addEventListener("touchstart", handleInteractionStart);
document.addEventListener("touchend", handleInteractionEnd);
const pauseButton = document.getElementById("pauseButton");
pauseButton.addEventListener("click", togglePause);

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        cancelAnimationFrame(gameState.animationFrameId);
        pauseButton.textContent = "Resume";
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = "center";
        ctx.font = "bold 50px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2)
    } else {
        gameState.animationFrameId = requestAnimationFrame(render);
        pauseButton.textContent = "Pause"
    }
}
startGameIfReady();