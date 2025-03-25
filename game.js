const character = document.getElementById('character');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container');
const healthContainer = document.getElementById('health-container');
const hearts = document.querySelectorAll('.heart');

// Game state variables
let isJumping = false;
let isFalling = false;
let gameOver = true;
let score = 0;
let level = 1;
let health = 3;
let obstacles = [];
let collectibles = [];
let platforms = [];
let blocks = [];
let lastTime = 0;
let gameSpeed = 200;
let obstacleTimer = 0;
let collectibleTimer = 0;
let platformTimer = 0;
let blockTimer = 0;
let obstacleInterval = 3000;
let collectibleInterval = 2000;
let platformInterval = 4000;
let blockInterval = 5000;
let jumpSound, coinSound, gameoverSound, bgMusic, hurtSound, levelUpSound, buttonClickSound, candySound;
let hasPowerup = false;
let isRunning = false;
let runTimer = 0;
let currentDirection = 'right';
let runFrame = 0;
let characterSize = 1;
let lastJumpTime = 0;
let isDoubleJump = false;
let doubleJumpReady = false;
const doubleClickThreshold = 400;
let jumpAnimationId = null;
let doubleJumpAnimationId = null;
let levelProgress = 0;
let scoreToNextLevel = 100;
let levelDisplay = null;
let levelCandyCollected = false;
let blinkIntervalId = null;
let eyesOpen = true;
let birds = [];
let birdTimer = 0;
let birdInterval = 4000;
let birdFlapInterval = 150;
let highScore = 0;
let candies = [];
let candyCount = 0;
let candyTimer = 0;
let candyInterval = 5000;

// Optimize for mobile: Reduce the number of elements created
const MAX_OBSTACLES = 5;
const MAX_COLLECTIBLES = 5;
const MAX_PLATFORMS = 3;
const MAX_BLOCKS = 3;
const MAX_BIRDS = 3;
const MAX_CANDIES = 1;

// Initialize sounds with preloading
function initSounds() {
    jumpSound = new Audio();
    jumpSound.src = 'audio/jump.mp3';
    jumpSound.preload = 'auto';

    coinSound = new Audio();
    coinSound.src = 'audio/eat.mp3';
    coinSound.preload = 'auto';

    gameoverSound = new Audio();
    gameoverSound.src = 'audio/gameover.mp3';
    gameoverSound.preload = 'auto';

    hurtSound = new Audio();
    hurtSound.src = 'audio/hurt.mp3';
    hurtSound.preload = 'auto';

    bgMusic = new Audio();
    bgMusic.src = 'audio/bgmusic.mp3';
    bgMusic.loop = true;
    bgMusic.volume = 0.3; // Lower volume to reduce resource usage
    bgMusic.preload = 'auto';

    levelUpSound = new Audio();
    levelUpSound.src = 'audio/levelup.mp3';
    levelUpSound.preload = 'auto';

    buttonClickSound = new Audio();
    buttonClickSound.src = 'audio/click.mp3';
    buttonClickSound.preload = 'auto';

    candySound = new Audio();
    candySound.src = 'audio/yummy.mp3';
    candySound.volume = 0.8;
    candySound.preload = 'auto';
}

// Jump function with optimized physics
function jump() {
    if (gameOver) return;

    const maxBottom = gameContainer.clientHeight - character.clientHeight;
    let velocityY = isJumping ? 14 : 12;
    let gravity = 0.5;

    jumpSound.currentTime = 0;
    jumpSound.playbackRate = isJumping ? 1.5 : 1.0;
    jumpSound.play().catch(() => {});

    if (isJumping) {
        character.style.animation = 'double-jump-effect 0.7s';
        character.style.filter = 'brightness(1.4) hue-rotate(20deg)';
        setTimeout(() => {
            character.style.animation = '';
            character.style.filter = '';
        }, 700);
    }

    isJumping = true;

    if (jumpAnimationId) cancelAnimationFrame(jumpAnimationId);
    if (doubleJumpAnimationId) cancelAnimationFrame(doubleJumpAnimationId);

    let bottomPos = parseFloat(character.style.bottom) || 220;

    const jumpAnimation = function animateJump(timestamp) {
        if (gameOver) {
            isJumping = false;
            return;
        }

        velocityY -= gravity;
        bottomPos += velocityY;

        if (bottomPos >= maxBottom) {
            bottomPos = maxBottom;
            velocityY = 0;
        } else if (bottomPos <= 220) {
            bottomPos = 220;
            isJumping = false;
            jumpAnimationId = null;
            character.style.bottom = '220px';
            updateShadowPosition();
            return;
        }

        character.style.transition = 'none';
        character.style.bottom = `${bottomPos}px`;
        updateShadowPosition();

        jumpAnimationId = requestAnimationFrame(animateJump);
    };

    jumpAnimationId = requestAnimationFrame(jumpAnimation);
}

// Optimized touch handling for mobile
function handleTouchStart(e) {
    e.preventDefault();
    const now = Date.now();
    if (now - lastJumpTime < 100) return;
    jump();
    lastJumpTime = now;
}

// Optimized keyboard input
function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (e.repeat) return;
        const now = Date.now();
        if (now - lastJumpTime < 100) return;
        jump();
        lastJumpTime = now;
    } else if (e.code === 'ArrowLeft') {
        currentDirection = 'left';
        isRunning = true;
        character.style.transform = 'scaleX(-1)';
    } else if (e.code === 'ArrowRight') {
        currentDirection = 'right';
        isRunning = true;
        character.style.transform = 'scaleX(1)';
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        isRunning = false;
    }
}

// Create platform with limits
function createPlatform() {
    if (platforms.length >= MAX_PLATFORMS) return;
    const platform = document.createElement('div');
    platform.classList.add('platform');
    const width = Math.floor(Math.random() * 100) + 64;
    const heightPosition = Math.floor(Math.random() * 100) + 120;
    platform.style.width = `${width}px`;
    platform.style.bottom = `${heightPosition}px`;
    platform.style.right = '-100px';
    gameContainer.appendChild(platform);
    platforms.push(platform);
}

// Create block with limits
function createBlock() {
    if (blocks.length >= MAX_BLOCKS) return;
    const isQuestionBlock = Math.random() > 0.5;
    const block = document.createElement('div');
    block.classList.add(isQuestionBlock ? 'questionBlock' : 'brick');
    const heightPosition = Math.floor(Math.random() * 100) + 160;
    block.style.bottom = `${heightPosition}px`;
    block.style.right = '-32px';
    block.dataset.hit = 'false';
    gameContainer.appendChild(block);
    blocks.push({ element: block, isQuestion: isQuestionBlock });
}

// Create obstacle with limits
function createObstacle() {
    if (obstacles.length >= MAX_OBSTACLES) return 0;
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    const shadow = document.createElement('div');
    shadow.classList.add('obstacle-shadow');
    const size = Math.floor(Math.random() * 31) + 70;
    obstacle.style.width = `${size}px`;
    obstacle.style.height = `${size}px`;
    obstacle.style.bottom = '220px';
    obstacle.style.right = '-10px';
    gameContainer.appendChild(shadow);
    gameContainer.appendChild(obstacle);
    obstacles.push({ element: obstacle, shadow: shadow });
    return Math.random() * 1500 - 750;
}

// Create collectible with limits
function createCollectible() {
    if (collectibles.length >= MAX_COLLECTIBLES) return;
    const collectible = document.createElement('div');
    collectible.classList.add('collectible');
    const carrotType = Math.random() * 100;
    let heightPosition;
    if (carrotType < 20) {
        heightPosition = Math.floor(Math.random() * 30) + 300;
        collectible.classList.add('low-carrot');
    } else if (carrotType < 60) {
        heightPosition = Math.floor(Math.random() * 60) + 290;
        collectible.classList.add('medium-carrot');
    } else if (carrotType < 90) {
        heightPosition = Math.floor(Math.random() * 70) + 360;
        collectible.classList.add('high-carrot');
        collectible.style.filter = 'brightness(1.1)';
    } else {
        heightPosition = Math.floor(Math.random() * 50) + 440;
        collectible.classList.add('super-carrot');
        collectible.style.filter = 'brightness(1.3) hue-rotate(10deg)';
        collectible.style.transform = 'scale(1.2)';
    }
    if (level > 1) {
        const levelAdjustment = Math.min(level * 5, 40);
        heightPosition += Math.floor(Math.random() * levelAdjustment);
    }
    collectible.style.bottom = `${heightPosition}px`;
    const horizontalOffset = Math.floor(Math.random() * 100);
    collectible.style.right = `${-20 - horizontalOffset}px`;
    collectible.dataset.value = heightPosition > 400 ? '20' : '10';
    gameContainer.appendChild(collectible);
    collectibles.push(collectible);
}

// Simplified character animation
function updateCharacterAnimation(deltaTime) {
    if (isRunning) {
        runTimer += deltaTime;
        if (runTimer > 100) {
            runTimer = 0;
            runFrame = (runFrame + 1) % 3;
            character.style.opacity = 0.8 + (runFrame * 0.1);
        }
    } else {
        character.style.opacity = 1;
        runFrame = 0;
    }
    if (hasPowerup) {
        character.style.filter = `brightness(1.3)`;
        character.style.transform = `${currentDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)'} scale(${characterSize})`;
    } else {
        character.style.filter = 'none';
        character.style.transform = currentDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
    }
}

// Create powerup
function createPowerup(x, y) {
    const powerup = document.createElement('div');
    powerup.classList.add('collectible');
    powerup.style.width = '40px';
    powerup.style.height = '40px';
    powerup.style.filter = 'hue-rotate(260deg) brightness(1.3)';
    powerup.style.position = 'absolute';
    powerup.style.bottom = `${y}px`;
    powerup.style.right = `${x}px`;
    powerup.dataset.powerup = 'true';
    gameContainer.appendChild(powerup);
    collectibles.push(powerup);
    powerup.style.transition = 'bottom 0.5s ease-out';
    setTimeout(() => {
        powerup.style.bottom = `${y + 40}px`;
    }, 10);
}

// Collision detection
function getBoundingBox(element) {
    const rect = element.getBoundingClientRect();
    return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
    };
}

function isColliding(box1, box2) {
    const margin = 10;
    return box1.left + margin < box2.right - margin &&
           box1.right - margin > box2.left + margin &&
           box1.top + margin < box2.bottom - margin &&
           box1.bottom - margin > box2.top + margin;
}

// Check platform collisions
function checkPlatformCollisions() {
    const characterBox = getBoundingBox(character);
    const characterBottom = parseInt(character.style.bottom);
    if (!isJumping && characterBottom > 500) {
        isFalling = true;
        for (let i = 0; i < platforms.length; i++) {
            const platformBox = getBoundingBox(platforms[i]);
            if (characterBox.left < platformBox.right && 
                characterBox.right > platformBox.left) {
                const platformTop = platformBox.top;
                const characterBottom = characterBox.bottom;
                if (Math.abs(characterBottom - platformTop) < 10) {
                    const platformBottomPosition = parseInt(platforms[i].style.bottom);
                    character.style.bottom = `${platformBottomPosition + platformBox.height}px`;
                    isFalling = false;
                    return true;
                }
            }
        }
        if (isFalling) {
            const newBottom = Math.max(500, characterBottom - 5);
            character.style.bottom = `${newBottom}px`;
            if (newBottom <= 500) {
                isFalling = false;
            }
        }
    }
    return false;
}

// Check block collisions
function checkBlockCollisions() {
    if (!isJumping) return;
    const characterBox = getBoundingBox(character);
    for (let i = 0; i < blocks.length; i++) {
        const blockBox = getBoundingBox(blocks[i].element);
        if (characterBox.top < blockBox.bottom &&
            characterBox.right > blockBox.left &&
            characterBox.left < blockBox.right &&
            characterBox.top > blockBox.top) {
            blocks[i].element.style.animation = 'hit 0.2s ease-in-out';
            if (blocks[i].isQuestion && blocks[i].element.dataset.hit === 'false') {
                blocks[i].element.dataset.hit = 'true';
                if (Math.random() > 0.7) {
                    createPowerup(
                        window.innerWidth - blockBox.left, 
                        parseInt(blocks[i].element.style.bottom) + 32
                    );
                } else {
                    updateScore(10);
                    coinSound.currentTime = 0;
                    coinSound.play().catch(() => {});
                }
                blocks[i].element.style.filter = 'brightness(0.7)';
            }
            setTimeout(() => {
                if (isJumping && window.jumpInterval) {
                    clearInterval(window.jumpInterval);
                    window.jumpInterval = null;
                    isJumping = false;
                    const currentBottom = parseInt(character.style.bottom);
                    character.style.bottom = `${currentBottom - 10}px`;
                }
            }, 10);
            return true;
        }
    }
    return false;
}

// Update score with minimal DOM updates
function updateScore(points = 0) {
    score += points;
    scoreDisplay.textContent = `SCORE: ${score}`;
    checkHighScore();
    if (score >= levelProgress + scoreToNextLevel) {
        if (levelCandyCollected) {
            levelUp();
        } else {
            showBunnySpeechBubble('Collect the candy first! 🍬');
        }
    }
    if (points > 0) {
        const pointsDisplay = document.createElement('div');
        pointsDisplay.textContent = `+${points}`;
        pointsDisplay.classList.add('points-animation');
        pointsDisplay.style.left = `${character.getBoundingClientRect().right}px`;
        pointsDisplay.style.top = `${character.getBoundingClientRect().top}px`;
        gameContainer.appendChild(pointsDisplay);
        setTimeout(() => pointsDisplay.remove(), 1000);
    }
}

// Level up function
function levelUp() {
    level++;
    levelProgress = score;
    scoreToNextLevel = 100 * level;
    levelCandyCollected = false;
    levelUpSound.currentTime = 0;
    levelUpSound.play().catch(() => {});
    updateLevelDisplay();
    const levelUpAnimation = document.createElement('div');
    levelUpAnimation.textContent = `LEVEL ${level}!`;
    levelUpAnimation.classList.add('level-up-animation');
    gameContainer.appendChild(levelUpAnimation);
    const rescueMessages = [
        'Friend rescued!', 
        'Bunny buddy freed!', 
        'Hoppy rescue!', 
        'Mission accomplished!', 
        'One more saved!'
    ];
    const rescueMessage = rescueMessages[Math.floor(Math.random() * rescueMessages.length)];
    const celebrationMessages = [
        'Woo-hoo!', 
        'Level up!', 
        'Hippity-Hop!', 
        'Awesome!', 
        'Bun-believable!'
    ];
    const celebrationMessage = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
    const bubble1 = document.createElement('div');
    bubble1.classList.add('speech-bubble', 'special');
    bubble1.textContent = celebrationMessage;
    character.appendChild(bubble1);
    setTimeout(() => {
        if (bubble1 && bubble1.parentNode) {
            bubble1.style.opacity = '0';
            bubble1.style.transition = 'opacity 0.3s';
            setTimeout(() => bubble1.remove(), 300);
        }
        const bubble2 = document.createElement('div');
        bubble2.classList.add('speech-bubble', 'special');
        bubble2.textContent = rescueMessage;
        character.appendChild(bubble2);
        setTimeout(() => {
            if (bubble2 && bubble2.parentNode) {
                bubble2.style.opacity = '0';
                bubble2.style.transform = 'translateX(-50%) translateY(-20px)';
                bubble2.style.transition = 'all 0.3s ease-out';
                setTimeout(() => {
                    if (bubble2 && bubble2.parentNode) bubble2.remove();
                }, 300);
            }
        }, 2000);
    }, 1500);
    setTimeout(() => levelUpAnimation.remove(), 2000);
    updateDifficultyForLevel();
    
    setTimeout(() => {
        if (!gameOver) placeLevelEndCandy();
    }, 2000);
}

// Place a single candy at the end of a level
function placeLevelEndCandy() {
    if (candies.length >= MAX_CANDIES) return;
    candies.forEach(candy => candy.remove());
    candies = [];
    
    const candy = document.createElement('div');
    candy.classList.add('candy');
    const xPosition = window.innerWidth - 150;
    candy.style.right = `-${xPosition}px`;
    const heightPosition = 350;
    candy.style.bottom = `${heightPosition}px`;
    candy.style.animation = 'float 2s ease-in-out infinite';
    gameContainer.appendChild(candy);
    candies.push(candy);
    
    const indicator = document.createElement('div');
    indicator.innerHTML = '🍬>>';
    indicator.style.position = 'absolute';
    indicator.style.right = '20px';
    indicator.style.top = '50%';
    indicator.style.fontSize = '24px';
    indicator.style.color = '#FF69B4';
    indicator.style.textShadow = '2px 2px 0 #000';
    indicator.style.animation = 'pulse 0.5s alternate infinite';
    indicator.style.zIndex = '100';
    gameContainer.appendChild(indicator);
    setTimeout(() => indicator.remove(), 5000);
}

// Create and update level display
function createLevelDisplay() {
    if (!levelDisplay) {
        levelDisplay = document.createElement('div');
        levelDisplay.id = 'level-display';
        gameContainer.appendChild(levelDisplay);
    }
    updateLevelDisplay();
}

function updateLevelDisplay() {
    if (levelDisplay) {
        levelDisplay.textContent = `LEVEL ${level}`;
        levelDisplay.style.position = 'absolute';
        levelDisplay.style.top = '10px';
        levelDisplay.style.left = '50%';
        levelDisplay.style.transform = 'translateX(-50%)';
        levelDisplay.style.fontSize = '20px';
        levelDisplay.style.textAlign = 'center';
        levelDisplay.style.fontWeight = 'bold';
        levelDisplay.style.color = '#fff';
        levelDisplay.style.textShadow = '2px 2px 0 #000';
        levelDisplay.style.zIndex = '100';
        levelDisplay.style.padding = '5px 15px';
        levelDisplay.style.borderRadius = '15px';
        levelDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        levelDisplay.style.fontFamily = "'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important";
    }
}

// Update difficulty
function updateDifficultyForLevel() {
    gameSpeed = 200 + (level * 50);
    updateBackgroundAnimationSpeeds(gameSpeed);
    obstacleInterval = Math.max(1000, 3000 - (level * 300));
    collectibleInterval = Math.max(1000, 2000 - (level * 100));
    platformInterval = Math.max(2000, 4000 - (level * 300));
    candyInterval = Math.max(3000, 5000 - (level * 300));
    
    const speedIndicator = document.createElement('div');
    speedIndicator.textContent = `SPEED: ${Math.floor(gameSpeed)}`;
    speedIndicator.style.position = 'absolute';
    speedIndicator.style.bottom = '20px';
    speedIndicator.style.right = '20px';
    speedIndicator.style.color = '#fff';
    speedIndicator.style.textShadow = '1px 1px 0 #000';
    speedIndicator.style.padding = '5px 10px';
    speedIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    speedIndicator.style.borderRadius = '10px';
    speedIndicator.style.zIndex = '100';
    speedIndicator.style.opacity = '0.8';
    gameContainer.appendChild(speedIndicator);
    setTimeout(() => {
        speedIndicator.style.transition = 'opacity 1s';
        speedIndicator.style.opacity = '0';
        setTimeout(() => speedIndicator.remove(), 1000);
    }, 3000);
    updateBirdDifficulty();
}

// Update background animation speeds
function updateBackgroundAnimationSpeeds(speed) {
    const speedFactor = speed / 200;
    const foreground = document.getElementById('foreground');
    const treesLayer = document.getElementById('trees-layer');
    const cloudsLayer = document.getElementById('clouds-layer');
    const groundDuration = Math.max(30, 60 / speedFactor);
    const treesDuration = Math.max(45, 90 / speedFactor);
    const cloudsDuration = Math.max(60, 120 / speedFactor);
    if (foreground) foreground.style.animationDuration = `${groundDuration}s`;
    if (treesLayer) treesLayer.style.animationDuration = `${treesDuration}s`;
    if (cloudsLayer) cloudsLayer.style.animationDuration = `${cloudsDuration}s`;
}

// Optimized game loop
function gameLoop(timestamp) {
    if (gameOver) return;
    const deltaTime = Math.min(timestamp - lastTime, 100); // Cap deltaTime to prevent large jumps
    lastTime = timestamp;

    updateBirds(deltaTime);
    birdTimer += deltaTime;
    if (birdTimer > birdInterval) {
        const gapAdjustment = createBird();
        birdTimer = 0;
        birdInterval = Math.max(2000, 4000 - (level * 300) + gapAdjustment);
    }

    obstacles.forEach((obstacleData, index) => {
        const obstacle = obstacleData.element;
        const shadow = obstacleData.shadow;
        const currentRight = parseInt(obstacle.style.right) || 0;
        obstacle.style.right = `${currentRight + gameSpeed * deltaTime / 1000}px`;
        shadow.style.right = `${currentRight + gameSpeed * deltaTime / 1000 + 22}px`;
        if (currentRight > window.innerWidth + 100) {
            obstacle.remove();
            shadow.remove();
            obstacles.splice(index, 1);
        }
    });
    obstacleTimer += deltaTime;
    if (obstacleTimer > obstacleInterval) {
        const gapAdjustment = createObstacle();
        obstacleTimer = 0;
        obstacleInterval = Math.max(1000, 3000 - (level * 300) + gapAdjustment);
    }

    collectibles.forEach((collectible, index) => {
        const currentRight = parseInt(collectible.style.right) || 0;
        collectible.style.right = `${currentRight + gameSpeed * deltaTime / 1000}px`;
        if (currentRight > window.innerWidth + 100) {
            collectible.remove();
            collectibles.splice(index, 1);
        }
    });
    collectibleTimer += deltaTime;
    if (collectibleTimer > collectibleInterval) {
        createCollectible();
        collectibleTimer = 0;
    }

    platforms.forEach((platform, index) => {
        const currentRight = parseInt(platform.style.right) || 0;
        platform.style.right = `${currentRight + gameSpeed * deltaTime / 1000}px`;
        if (currentRight > window.innerWidth + 200) {
            platform.remove();
            platforms.splice(index, 1);
        }
    });
    platformTimer += deltaTime;
    if (platformTimer > platformInterval) {
        createPlatform();
        platformTimer = 0;
    }

    blocks.forEach((block, index) => {
        const currentRight = parseInt(block.element.style.right) || 0;
        block.element.style.right = `${currentRight + gameSpeed * deltaTime / 1000}px`;
        if (currentRight > window.innerWidth + 100) {
            block.element.remove();
            blocks.splice(index, 1);
        }
    });

    candies.forEach((candy, index) => {
        const currentRight = parseInt(candy.style.right) || 0;
        candy.style.right = `${currentRight + gameSpeed * deltaTime / 1000}px`;
        if (currentRight > window.innerWidth + 100) {
            candy.remove();
            candies.splice(index, 1);
        }
    });

    checkCollisions();
    checkPlatformCollisions();
    checkBlockCollisions();

    if (!isJumping && parseInt(character.style.bottom) <= 80) {
        runTimer += deltaTime;
        if (runTimer > 100) {
            runTimer = 0;
            runFrame = (runFrame + 1) % 3;
        }
    }

    updateScore(Math.floor(deltaTime * 0.01 * (1 + (level * 0.5))));
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    // Ensure the start screen is hidden
    if (startScreen) {
        startScreen.style.display = 'none';
    }
    
    // Reset game state
    level = 1;
    levelProgress = 0;
    scoreToNextLevel = 100;
    levelCandyCollected = false;
    
    // Initialize game elements
    createLevelDisplay();
    updateLevelDisplay();
    scoreDisplay.textContent = 'SCORE: 0';
    
    // Setup character
    character.style.display = 'block';
    character.style.transform = 'scaleX(1)';
    character.style.transition = 'transform 0.1s ease, filter 0.3s ease';
    character.style.bottom = '220px';
    character.style.left = window.innerWidth <= 768 ? '50px' : '100px';
    character.style.filter = 'none';
    character.style.opacity = '1';
    character.style.backgroundImage = "url('assets/Bunny.svg')";
    
    // Initialize game state
    createBunnyShadow();
    health = 3;
    updateHealthDisplay();
    showInstructions();
    updateBackgroundAnimationSpeeds(gameSpeed);
    clearAllColliders();
    gameOver = false;
    score = 0;
    hasPowerup = false;
    characterSize = 1;
    currentDirection = 'right';
    isRunning = false;
    gameSpeed = 200;
    obstacleInterval = 3000;
    collectibleInterval = 2000;
    platformInterval = 4000;
    blockInterval = 5000;
    
    // Start background music
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log("Audio play failed:", e));
    
    // Initialize game elements
    createInitialGameElements();
    updateDifficultyForLevel();
    startBunnyBlinking();
    loadHighScore();
    candyCount = 0;
    updateCandyCounter();
    
    // Place level end candy after a delay
    setTimeout(() => {
        if (!gameOver) placeLevelEndCandy();
    }, 5000);
    
    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Show instructions
function showInstructions() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const instruction = document.createElement('div');
    instruction.id = isTouchDevice ? 'touch-instruction' : 'key-instruction';
    instruction.textContent = isTouchDevice ? 'Tap to Jump!' : 'Press SPACE to Jump!';
    instruction.style.position = 'absolute';
    instruction.style.bottom = '50px';
    instruction.style.left = '50%';
    instruction.style.transform = 'translateX(-50%)';
    instruction.style.padding = '10px 20px';
    instruction.style.background = 'rgba(255, 255, 255, 0.7)';
    instruction.style.borderRadius = '20px';
    instruction.style.zIndex = '100';
    instruction.style.fontFamily = "'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important";
    gameContainer.appendChild(instruction);
    setTimeout(() => {
        instruction.style.transition = 'opacity 1s';
        instruction.style.opacity = '0';
        setTimeout(() => instruction.remove(), 1000);
    }, 3000);
}

// End game
function endGame() {
    gameOver = true;
    checkHighScore();
    stopBunnyBlinking();
    bgMusic.pause();
    gameoverSound.play().catch(e => console.log("Audio play failed:", e));
    character.style.backgroundImage = "url('assets/Bunny Died.svg')";
    character.style.transform = 'scaleX(1)';
    const shadow = document.querySelector('.bunny-shadow');
    if (shadow) {
        shadow.style.opacity = '0';
        setTimeout(() => shadow.remove(), 300);
    }
    
    setTimeout(() => {
        startScreen.style.display = 'flex';
        startScreen.innerHTML = `
            <h1 style="font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;">GAME OVER</h1>
            <p style="font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;">YOUR SCORE: ${score}</p>
            <p style="font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;">HIGH SCORE: ${highScore}</p>
            <p style="font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;">LEVEL REACHED: ${level}</p>
            <p style="font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;">CANDIES COLLECTED: ${candyCount}</p>
            <p class="game-story" style="font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;">Your bunny friends are still waiting to be rescued! Try again!</p>
            <button id="restart-button">PLAY AGAIN</button>
        `;
        const storyElement = startScreen.querySelector('.game-story');
        if (storyElement) {
            storyElement.style.textAlign = 'center';
            storyElement.style.margin = '10px 0 20px';
            storyElement.style.fontSize = '18px';
            storyElement.style.color = '#8B4513';
            storyElement.style.fontWeight = 'bold';
            storyElement.style.fontFamily = "'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important";
        }

        // Setup Play Again button with proper mobile handling
        setTimeout(() => {
            setupRestartButton();
        }, 50);
    }, 1000);
}

// New function to set up the Play Again button properly for mobile
function setupRestartButton() {
    const restartBtn = document.getElementById('restart-button');
    if (restartBtn) {
        // Create a fresh button to replace the existing one
        const newBtn = document.createElement('button');
        newBtn.id = 'restart-button';
        newBtn.textContent = restartBtn.textContent || 'PLAY AGAIN';
        
        // Set critical mobile properties directly
        newBtn.style.cursor = 'pointer';
        newBtn.style.touchAction = 'manipulation';
        newBtn.style.webkitTapHighlightColor = 'transparent';
        newBtn.style.userSelect = 'none';
        newBtn.style.WebkitUserSelect = 'none';
        newBtn.style.fontFamily = "'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important";
        
        // Ensure consistent button styling with CSS
        newBtn.style.padding = '15px 30px';
        newBtn.style.fontSize = '20px';
        newBtn.style.background = '#ff9500';
        newBtn.style.color = 'white';
        newBtn.style.border = 'none';
        newBtn.style.borderRadius = '30px';
        newBtn.style.boxShadow = '0 5px 0 #d67e00';
        newBtn.style.minWidth = '200px';
        newBtn.style.minHeight = '60px';
        
        // Replace old button with new one
        if (restartBtn.parentNode) {
            restartBtn.parentNode.replaceChild(newBtn, restartBtn);
        } else if (startScreen) {
            startScreen.appendChild(newBtn);
        }
        
        // Add event listeners for both click and touch
        newBtn.onclick = handleRestartGame;
        newBtn.ontouchstart = function(e) {
            e.preventDefault();
            handleRestartGame(e);
        };
        
        // Add a direct inline handler as a fallback
        newBtn.setAttribute('ontouchstart', 'this.onclick(); event.preventDefault();');
    }
}

// Separate restart game handler function
function handleRestartGame(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Play button click sound
    buttonClickSound.currentTime = 0;
    buttonClickSound.play().catch(e => console.log("Audio play failed:", e));
    
    // Restart the game
    restartGame();
}

// Restart game
function restartGame() {
    clearAllColliders();
    startGame();
}

// Clear all game elements
function clearAllColliders() {
    obstacles.forEach(obstacleData => {
        obstacleData.element.remove();
        obstacleData.shadow.remove();
    });
    obstacles = [];
    collectibles.forEach(collectible => collectible.remove());
    collectibles = [];
    platforms.forEach(platform => platform.remove());
    platforms = [];
    blocks.forEach(block => block.element.remove());
    blocks = [];
    document.querySelectorAll('.points-animation').forEach(el => el.remove());
    document.querySelectorAll('.obstacle, .collectible, .platform, .brick, .questionBlock').forEach(el => el.remove());
    birds.forEach(bird => {
        const flapInterval = parseInt(bird.dataset.flapInterval);
        clearInterval(flapInterval);
        bird.remove();
    });
    birds = [];
    candies.forEach(candy => candy.remove());
    candies = [];
}

// Update candy counter
function updateCandyCounter() {
    const candyCounter = document.getElementById('candy-counter');
    if (candyCounter) candyCounter.textContent = `🍬=${candyCount}`;
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        character.style.left = '50px';
    } else {
        character.style.left = '100px';
    }
});

// Update health display
function updateHealthDisplay() {
    hearts.forEach((heart, index) => {
        heart.style.opacity = index < health ? '1' : '0.3';
    });
}

// Player takes damage
function takeDamage() {
    if (gameOver) return;
    character.style.animation = 'hit 0.5s';
    setTimeout(() => character.style.animation = '', 500);
    hurtSound.currentTime = 0;
    hurtSound.play().catch(() => {});
    health--;
    updateHealthDisplay();
    if (health <= 0) endGame();
}

// Check collisions
function checkCollisions() {
    if (gameOver) return;
    const characterBox = getBoundingBox(character);
    for (let i = 0; i < obstacles.length; i++) {
        const obstacleBox = getBoundingBox(obstacles[i].element);
        if (isColliding(characterBox, obstacleBox)) {
            takeDamage();
            obstacles[i].element.remove();
            obstacles[i].shadow.remove();
            obstacles.splice(i, 1);
            i--;
        }
    }
    for (let i = 0; i < collectibles.length; i++) {
        const collectibleBox = getBoundingBox(collectibles[i]);
        if (isColliding(characterBox, collectibleBox)) {
            const carrotValue = parseInt(collectibles[i].dataset.value || '10');
            showBunnySpeechBubble(carrotValue);
            collectibles[i].remove();
            collectibles.splice(i, 1);
            coinSound.currentTime = 0;
            coinSound.play().catch(() => {});
            updateScore(carrotValue);
            i--;
        }
    }
    for (let i = 0; i < birds.length; i++) {
        const birdBox = getBoundingBox(birds[i]);
        if (isColliding(characterBox, birdBox)) {
            takeDamage();
            const flapInterval = parseInt(birds[i].dataset.flapInterval);
            clearInterval(flapInterval);
            birds[i].remove();
            birds.splice(i, 1);
            i--;
        }
    }
    for (let i = 0; i < candies.length; i++) {
        const candyBox = getBoundingBox(candies[i]);
        if (isColliding(characterBox, candyBox)) {
            candySound.currentTime = 0;
            candySound.playbackRate = 1 + (Math.random() * 0.2 - 0.1);
            candySound.play().catch(() => {});
            candies[i].classList.add('candy-collected');
            candyCount++;
            updateCandyCounter();
            levelCandyCollected = true;
            updateScore(1);
            setTimeout(() => {
                candies[i].remove();
                candies.splice(i, 1);
            }, 500);
            showBunnySpeechBubble(`Candy Collected! 🍬`);
        }
    }
}

// Show speech bubble
function showBunnySpeechBubble(messageOrPoints) {
    document.querySelectorAll('.speech-bubble').forEach(bubble => bubble.remove());
    const bubble = document.createElement('div');
    bubble.classList.add('speech-bubble');
    bubble.style.fontFamily = "'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important";
    const messages = {
        regular: ['Carrot-astic!', 'Hop-tastic!', 'Nom nom nom!', 'Bunny approved!', 'Crunchy good!'],
        special: ['Hop-diggity!', 'Carrot jackpot!', 'Bunny heaven!', 'Ear-resistible!', 'Super-duper!']
    };
    let message;
    if (typeof messageOrPoints === 'string') {
        message = messageOrPoints;
    } else {
        const messageList = messageOrPoints > 10 ? messages.special : messages.regular;
        message = messageList[Math.floor(Math.random() * messageList.length)];
    }
    bubble.textContent = message;
    if (typeof messageOrPoints !== 'string' && messageOrPoints > 10) {
        bubble.classList.add('special');
    }
    character.appendChild(bubble);
    setTimeout(() => {
        if (bubble && bubble.parentNode) {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateX(-50%) translateY(-20px)';
            bubble.style.transition = 'all 0.3s ease-out';
            setTimeout(() => {
                if (bubble && bubble.parentNode) bubble.remove();
            }, 300);
        }
    }, 1500);
}

// Create initial game elements
function createInitialGameElements() {
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            if (!gameOver) createPlatform();
        }, i * 1500);
    }
    setTimeout(() => {
        if (!gameOver) createObstacle();
    }, 2000);
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            if (!gameOver) createCollectible();
        }, 1000 + i * 1000);
    }
}

// Bunny eye blinking
function startBunnyBlinking() {
    if (blinkIntervalId) clearInterval(blinkIntervalId);
    character.style.backgroundImage = "url('assets/Bunny.svg')";
    eyesOpen = true;
    const doubleBlink = () => {
        if (gameOver) {
            stopBunnyBlinking();
            return;
        }
        character.style.backgroundImage = "url('assets/bunny-closeeye.svg')";
        eyesOpen = false;
        setTimeout(() => {
            if (gameOver) return;
            character.style.backgroundImage = "url('assets/Bunny.svg')";
            eyesOpen = true;
            setTimeout(() => {
                if (gameOver) return;
                character.style.backgroundImage = "url('assets/bunny-closeeye.svg')";
                eyesOpen = false;
                setTimeout(() => {
                    if (gameOver) return;
                    character.style.backgroundImage = "url('assets/Bunny.svg')";
                    eyesOpen = true;
                }, 200);
            }, 300);
        }, 200);
    };
    doubleBlink();
    blinkIntervalId = setInterval(() => {
        if (gameOver) {
            stopBunnyBlinking();
            return;
        }
        doubleBlink();
    }, 2000);
}

function stopBunnyBlinking() {
    if (blinkIntervalId) {
        clearInterval(blinkIntervalId);
        blinkIntervalId = null;
    }
}

// Create bunny shadow
function createBunnyShadow() {
    const existingShadow = document.querySelector('.bunny-shadow');
    if (existingShadow) existingShadow.remove();
    const shadow = document.createElement('div');
    shadow.classList.add('bunny-shadow');
    gameContainer.appendChild(shadow);
    updateShadowPosition();
}

function updateShadowPosition() {
    const shadow = document.querySelector('.bunny-shadow');
    if (!shadow) return;
    const characterRect = character.getBoundingClientRect();
    const characterBottom = parseInt(character.style.bottom) || 220;
    const gameContainerRect = gameContainer.getBoundingClientRect();
    const characterCenter = characterRect.left + (characterRect.width / 2);
    const shadowLeft = characterCenter - gameContainerRect.left;
    shadow.style.left = `${shadowLeft}px`;
    shadow.style.bottom = '220px';
    if (characterBottom > 220) {
        const heightAboveGround = characterBottom - 220;
        const scale = Math.max(0.5, 1 - (heightAboveGround / 300));
        const opacity = Math.max(0.1, 0.3 - (heightAboveGround / 600));
        shadow.style.transform = `scale(${scale})`;
        shadow.style.opacity = opacity.toString();
    } else {
        shadow.style.transform = 'scale(1)';
        shadow.style.opacity = '0.3';
    }
}

// Create bird obstacle with limits
function createBird() {
    if (birds.length >= MAX_BIRDS) return 0;
    const bird = document.createElement('div');
    bird.classList.add('bird');
    const heightPosition = Math.floor(Math.random() * 200) + 400;
    bird.style.bottom = `${heightPosition}px`;
    bird.style.right = '-50px';
    let isFirstFlap = true;
    bird.style.backgroundImage = "url('assets/bird flap 1.svg')";
    const flapAnimation = setInterval(() => {
        if (gameOver) {
            clearInterval(flapAnimation);
            return;
        }
        bird.style.backgroundImage = isFirstFlap ? 
            "url('assets/bird flap 2.svg')" : 
            "url('assets/bird flap 1.svg')";
        isFirstFlap = !isFirstFlap;
    }, birdFlapInterval);
    bird.dataset.flapInterval = flapAnimation;
    gameContainer.appendChild(bird);
    birds.push(bird);
    return Math.random() * 1000 - 500;
}

function updateBirds(deltaTime) {
    birds.forEach((bird, index) => {
        const currentRight = parseInt(bird.style.right) || 0;
        bird.style.right = `${currentRight + gameSpeed * deltaTime / 1000}px`;
        if (currentRight > window.innerWidth + 100) {
            const flapInterval = parseInt(bird.dataset.flapInterval);
            clearInterval(flapInterval);
            bird.remove();
            birds.splice(index, 1);
        }
    });
}

function updateBirdDifficulty() {
    birdInterval = Math.max(2000, 4000 - (level * 300));
    birdFlapInterval = Math.max(100, 150 - (level * 5));
}

// High score functions
function loadHighScore() {
    const savedHighScore = localStorage.getItem('bunnyGameHighScore');
    if (savedHighScore) {
        highScore = parseInt(savedHighScore);
        updateHighScoreDisplay();
    }
}

function updateHighScoreDisplay() {
    const highScoreDisplay = document.getElementById('high-score');
    if (highScoreDisplay) highScoreDisplay.textContent = `HIGH SCORE: ${highScore}`;
}

function checkHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('bunnyGameHighScore', highScore);
        updateHighScoreDisplay();
        const highScoreDisplay = document.getElementById('high-score');
        if (highScoreDisplay) {
            highScoreDisplay.classList.add('new-high-score');
            setTimeout(() => highScoreDisplay.classList.remove('new-high-score'), 1000);
        }
        showBunnySpeechBubble('New High Score! 🏆');
    }
}

function resetHighScore() {
    highScore = 0;
    localStorage.removeItem('bunnyGameHighScore');
    updateHighScoreDisplay();
}

// Initialize game
function initGame() {
    // Add web font import for Comic Sans MS
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.cdnfonts.com/css/comic-sans-ms-4';
    document.head.appendChild(fontLink);
    
    // Add font family rules directly to document
    const fontStyle = document.createElement('style');
    fontStyle.textContent = `
        @font-face {
            font-family: 'Comic Sans MS';
            src: local('Comic Sans MS'),
                local('ComicSansMS'),
                url('https://fonts.cdnfonts.com/s/14288/COMIC.woff') format('woff');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
        }
        
        body, button, p, h1, h2, h3, div {
            font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;
        }
    `;
    document.head.appendChild(fontStyle);
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes hit {
            0% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0); }
        }
        @keyframes level-up {
            0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
            50% { transform: translate(-50%, 0) scale(1.2); opacity: 1; }
            100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
        @keyframes bounce {
            0% { transform: scale(1); }
            25% { transform: scale(1.1); }
            50% { transform: scale(1.15); }
            75% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            100% { transform: scale(1.2); }
        }
        @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0); }
        }
        .score-bounce {
            animation: bounce 0.5s ease;
        }
        .level-up-animation {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, 0);
            font-size: 36px;
            font-weight: bold;
            color: gold;
            text-shadow: 3px 3px 0 #000;
            z-index: 1000;
            animation: level-up 2s ease-out forwards;
            font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;
        }
        .speech-bubble {
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            border: 2px solid #333;
            border-radius: 16px;
            padding: 5px 8px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
            z-index: 200;
            box-shadow: 2px 2px 6px rgba(0,0,0,0.4);
            animation: bubblePop 0.5s ease-out;
            color: #222;
            font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;
        }
        .speech-bubble:after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 10px;
            background: white;
            border-left: 2px solid #333;
            border-right: 2px solid #333;
            border-bottom: 2px solid #333;
            border-radius: 0 0 8px 8px;
            border-top: none;
            box-sizing: border-box;
        }
        @keyframes bubblePop {
            0% { transform: translateX(-50%) scale(0); opacity: 0; }
            50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
            70% { transform: translateX(-50%) scale(0.9); opacity: 1; }
            85% { transform: translateX(-50%) scale(1.1); opacity: 1; }
            100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        .speech-bubble.special {
            background: #FFFDD0;
            border-color: #FFD700;
            color: #CC7722;
        }
        .speech-bubble.special:after {
            background: #FFFDD0;
            border-left-color: #FFD700;
            border-right-color: #FFD700;
            border-bottom-color: #FFD700;
        }
        .new-high-score {
            animation: bounce 0.5s ease;
            color: gold;
        }
        /* Optimize for mobile */
        body {
            touch-action: manipulation; /* Prevent double-tap zoom */
            -webkit-user-select: none; /* Disable text selection */
            user-select: none;
            font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;
        }
        #game-container {
            width: 100%;
            height: 100vh;
            overflow: hidden;
            position: relative;
        }
        #character {
            will-change: transform, bottom; /* Optimize for animations */
        }
        .obstacle, .collectible, .platform, .candy, .bird {
            will-change: right; /* Optimize for movement */
        }
        #score, #high-score, #candy-counter, #level-display {
            font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;
        }
        #start-screen h1, #start-screen p, #start-screen button {
            font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important;
        }
    `;
    document.head.appendChild(style);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    initSounds();
    
    // Properly initialize the start screen
    if (startScreen) {
        if (!document.querySelector('.game-story')) {
            const storyElement = document.createElement('p');
            storyElement.classList.add('game-story');
            storyElement.innerHTML = 'The evil mushrooms have trapped your bunny friends!<br>Collect carrots and hop through levels to rescue them!';
            storyElement.style.textAlign = 'center';
            storyElement.style.margin = '10px 0 20px';
            storyElement.style.lineHeight = '1.4';
            storyElement.style.fontSize = '18px';
            storyElement.style.color = '#8B4513';
            storyElement.style.fontWeight = 'bold';
            storyElement.style.maxWidth = '80%';
            storyElement.style.fontFamily = "'Comic Sans MS', 'Comic Sans', cursive, sans-serif";
            if (startButton) {
                startScreen.insertBefore(storyElement, startButton);
            } else {
                startScreen.appendChild(storyElement);
            }
        }
    }

    // Completely replace the start button with a new one
    setupStartButton();
    
    character.style.display = 'none';
}

// Separate function to set up the start button properly
function setupStartButton() {
    // Try to get the button by ID first
    let startBtn = document.getElementById('start-button');
    
    // If button doesn't exist, create it
    if (!startBtn && startScreen) {
        startBtn = document.createElement('button');
        startBtn.id = 'start-button';
        startBtn.textContent = 'START GAME';
        startScreen.appendChild(startBtn);
    }
    
    // If we have a button, set it up properly
    if (startBtn) {
        // Create a fresh button to replace the existing one
        const newBtn = document.createElement('button');
        newBtn.id = 'start-button';
        newBtn.textContent = startBtn.textContent || 'START GAME';
        
        // Set critical mobile properties directly
        newBtn.style.cursor = 'pointer';
        newBtn.style.touchAction = 'manipulation';
        newBtn.style.webkitTapHighlightColor = 'transparent';
        newBtn.style.userSelect = 'none';
        newBtn.style.WebkitUserSelect = 'none';
        newBtn.style.fontFamily = "'Comic Sans MS', 'Comic Sans', cursive, sans-serif !important";
        
        // Ensure consistent button styling with CSS
        newBtn.style.padding = '15px 30px';
        newBtn.style.fontSize = '20px';
        newBtn.style.background = '#ff9500';
        newBtn.style.color = 'white';
        newBtn.style.border = 'none';
        newBtn.style.borderRadius = '30px';
        newBtn.style.boxShadow = '0 5px 0 #d67e00';
        newBtn.style.minWidth = '200px';
        newBtn.style.minHeight = '60px';
        
        // Replace old button with new one
        if (startBtn.parentNode) {
            startBtn.parentNode.replaceChild(newBtn, startBtn);
        } else if (startScreen) {
            startScreen.appendChild(newBtn);
        }
        
        // Add event listeners - use only touchstart for mobile
        newBtn.onclick = handleStartGame;
        newBtn.ontouchstart = function(e) {
            e.preventDefault(); // Critical for mobile
            handleStartGame(e);
        };
        
        // Add a direct inline handler as a fallback
        newBtn.setAttribute('ontouchstart', 'this.onclick(); event.preventDefault();');
    }
}

// Separate start game handler function
function handleStartGame(e) {
    if (e) {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event bubbling
    }
    
    // Play button click sound
    buttonClickSound.currentTime = 0;
    buttonClickSound.play().catch(e => console.log("Audio play failed:", e));
    
    // Start the game
    startGame();
}

// Initialize game on load
window.addEventListener('DOMContentLoaded', initGame);
window.addEventListener('load', setupStartButton); // Run again on full load to be safe