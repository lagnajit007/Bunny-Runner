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
let level = 1; // Current game level
let health = 3; // Player starts with 3 health
let obstacles = [];
let collectibles = [];
let platforms = [];
let blocks = [];
let lastTime = 0;
let gameSpeed = 200; // Starting speed in pixels per second
let obstacleTimer = 0;
let collectibleTimer = 0;
let platformTimer = 0;
let blockTimer = 0;
let obstacleInterval = 3000; // Starting interval in ms
let collectibleInterval = 2000;
let platformInterval = 4000;
let blockInterval = 5000;
let jumpSound, coinSound, gameoverSound, bgMusic, hurtSound, levelUpSound, buttonClickSound;
let hasPowerup = false;
let isRunning = false;
let runTimer = 0;
let currentDirection = 'right';
let runFrame = 0;
let characterSize = 1;
// For double-click/tap detection
let lastJumpTime = 0;
let isDoubleJump = false;
let doubleJumpReady = false;
const doubleClickThreshold = 400; // milliseconds - increased for better detection
// Animation tracking
let jumpAnimationId = null;
let doubleJumpAnimationId = null;
// Level tracking
let levelProgress = 0;
let scoreToNextLevel = 100; // Score needed to advance to next level
let levelDisplay = null; // Element to display current level
// Blinking animation
let blinkIntervalId = null;
let eyesOpen = true;

// Initialize sounds
function initSounds() {
    // Jump sound
    jumpSound = new Audio('data:audio/wav;base64,UklGRh4nAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQYnAACA');
    jumpSound.src = 'audio/jump.mp3';
    
    // Coin sound
    coinSound = new Audio('data:audio/wav;base64,UklGRh4nAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQYnAACA');
    coinSound.src = 'audio/eat.mp3';
    
    // Game over sound
    gameoverSound = new Audio('data:audio/wav;base64,UklGRh4nAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQYnAACA');
    gameoverSound.src = 'audio/gameover.mp3';
    
    // Hurt sound
    hurtSound = new Audio('data:audio/wav;base64,UklGRh4nAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQYnAACA');
    hurtSound.src = 'audio/hurt.mp3';
    
    // Background music
    bgMusic = new Audio('data:audio/wav;base64,UklGRh4nAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQYnAACA');
    bgMusic.src = 'audio/bgmusic.mp3';
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    
    // Level up sound
    levelUpSound = new Audio('data:audio/wav;base64,UklGRh4nAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQYnAACA');
    levelUpSound.src = 'audio/levelup.mp3';
    
    // Button click sound
    buttonClickSound = new Audio('data:audio/wav;base64,UklGRh4nAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQYnAACA');
    buttonClickSound.src = 'audio/click.mp3';
}

// Jump function with improved physics
function jump() {
    // Don't do anything if the game is over
    if (gameOver) return;
    
    // If already jumping, jump again from current position
    if (isJumping) {
        // Cancel existing animations to prevent conflicts
        if (jumpAnimationId) {
            cancelAnimationFrame(jumpAnimationId);
            jumpAnimationId = null;
        }
        if (doubleJumpAnimationId) {
            cancelAnimationFrame(doubleJumpAnimationId);
            doubleJumpAnimationId = null;
        }
        
        // Higher jump velocity for additional jumps
        let jumpSpeed = 14; // Higher for multi-jumps
        let gravity = 0.5;
        let velocityY = jumpSpeed;
        
        // Play jump sound with higher pitch for additional jumps
        jumpSound.currentTime = 0;
        jumpSound.playbackRate = 1.5;
        jumpSound.play().catch(e => console.log("Audio play failed:", e));
        
        // Visual effect for multi-jump
        character.style.animation = 'double-jump-effect 0.7s';
        character.style.filter = 'brightness(1.4) hue-rotate(20deg)';
        setTimeout(() => {
            character.style.animation = '';
            character.style.filter = '';
        }, 700);
        
        // Use requestAnimationFrame for smoother animation
        const multiJumpAnimation = function animateMultiJump(timestamp) {
            if (gameOver) {
                isJumping = false;
                return;
            }
            
            // Apply physics
            velocityY -= gravity;
            const currentBottom = parseInt(character.style.bottom);
            const newBottom = currentBottom + velocityY;
            
            // Check if we've reached the ground
            if (newBottom <= 140) { // Ground level
                character.style.bottom = '140px';
                isJumping = false;
                doubleJumpAnimationId = null;
                
                // Update shadow when landing
                updateShadowPosition();
                return;
            }
            
            // Update character position
            character.style.bottom = `${newBottom}px`;
            
            // Update shadow while jumping
            updateShadowPosition();
            
            // Continue animation
            doubleJumpAnimationId = requestAnimationFrame(animateMultiJump);
        };
        
        doubleJumpAnimationId = requestAnimationFrame(multiJumpAnimation);
        return;
    }
    
    // First jump
    isJumping = true;
    
    // Play jump sound
    jumpSound.currentTime = 0;
    jumpSound.playbackRate = 1.0; // Normal pitch for regular jump
    jumpSound.play().catch(e => console.log("Audio play failed:", e));
    
    // Animate jump with smoother physics
    let jumpSpeed = 12; // Initial velocity
    let gravity = 0.5; 
    let velocityY = jumpSpeed;
    
    // Use requestAnimationFrame for smoother animation
    const jumpAnimation = function animateJump(timestamp) {
        if (gameOver) {
            isJumping = false;
            return;
        }
        
        // Apply physics - ensure we keep updating velocity
        velocityY -= gravity;
        const currentBottom = parseInt(character.style.bottom);
        const newBottom = currentBottom + velocityY;
        
        // Check if we've reached the ground
        if (newBottom <= 140) { // Ground level
            character.style.bottom = '140px';
            isJumping = false;
            jumpAnimationId = null;
            
            // Update shadow when landing
            updateShadowPosition();
            return;
        }
        
        // Update character position
        character.style.bottom = `${newBottom}px`;
        
        // Update shadow while jumping
        updateShadowPosition();
        
        // Continue the animation
        jumpAnimationId = requestAnimationFrame(animateJump);
    };
    
    jumpAnimationId = requestAnimationFrame(jumpAnimation);
}

// Handle touch events specifically for jumping
function handleTouchStart(e) {
    // Prevent default behavior to avoid scrolling
    e.preventDefault();
    
    // Don't allow rapid tapping that might break the jump
    const now = Date.now();
    if (now - lastJumpTime < 100) return; // Minimum 100ms between jump attempts
    
    // Call the jump function
    jump();
    lastJumpTime = now;
}

// Handle keyboard input
function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        // Don't trigger jump repeatedly when holding the key
        if (e.repeat) return;
        
        // Don't allow rapid pressing that might break the jump
        const now = Date.now();
        if (now - lastJumpTime < 100) return; // Minimum 100ms between jump attempts
        
        // Call the jump function
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

// Create platform
function createPlatform() {
    const platform = document.createElement('div');
    platform.classList.add('platform');
    
    // Randomize platform width and position
    const width = Math.floor(Math.random() * 100) + 64; // Between 64 and 164px
    const heightPosition = Math.floor(Math.random() * 100) + 120; // Between 120 and 220px from bottom
    
    platform.style.width = `${width}px`;
    platform.style.bottom = `${heightPosition}px`;
    platform.style.right = '-100px'; // Start off-screen
    
    gameContainer.appendChild(platform);
    platforms.push(platform);
}

// Create question block or brick
function createBlock() {
    const isQuestionBlock = Math.random() > 0.5;
    const block = document.createElement('div');
    block.classList.add(isQuestionBlock ? 'questionBlock' : 'brick');
    
    // Randomize block position
    const heightPosition = Math.floor(Math.random() * 100) + 160; // Between 160 and 260px from bottom
    
    block.style.bottom = `${heightPosition}px`;
    block.style.right = '-32px'; // Start off-screen
    block.dataset.hit = 'false';
    
    gameContainer.appendChild(block);
    blocks.push({element: block, isQuestion: isQuestionBlock});
}

// Create enemy (obstacle)
function createObstacle() {
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    
    // Randomize obstacle size between 70px and 100px
    const size = Math.floor(Math.random() * 31) + 70; // Random size between 70-100px
    obstacle.style.width = `${size}px`;
    obstacle.style.height = `${size}px`;
    
    // Position obstacle on the ground (adjust to sit on top of ground)
    obstacle.style.bottom = '130px';
    obstacle.style.right = '-50px'; // Start off-screen
    
    // Scale the background image to fit the new size
    obstacle.style.backgroundSize = 'contain';
    
    gameContainer.appendChild(obstacle);
    obstacles.push(obstacle);
    
    // Return a random value to adjust the next spawn time
    return Math.random() * 1500 - 750; // Random adjustment between -750ms and +750ms
}

// Create coin (collectible)
function createCollectible() {
    const collectible = document.createElement('div');
    collectible.classList.add('collectible');
    
    // Determine carrot type and position based on current level
    const carrotType = Math.random() * 100; // 0-100 value for determining carrot type
    let heightPosition;
    
    if (carrotType < 20) {
        // Low carrot - easy to get by running (20% chance)
        heightPosition = Math.floor(Math.random() * 30) + 150; // 150-180px from bottom
        collectible.classList.add('low-carrot');
    } else if (carrotType < 60) {
        // Medium carrot - requires a single jump (40% chance)
        heightPosition = Math.floor(Math.random() * 60) + 190; // 190-250px from bottom
        collectible.classList.add('medium-carrot');
    } else if (carrotType < 90) {
        // High carrot - requires good jump timing (30% chance)
        heightPosition = Math.floor(Math.random() * 70) + 260; // 260-330px from bottom
        collectible.classList.add('high-carrot');
        collectible.style.filter = 'brightness(1.1)'; // Subtle highlight
    } else {
        // Super high carrot - requires multi-jumps (10% chance)
        heightPosition = Math.floor(Math.random() * 50) + 340; // 340-390px from bottom
        collectible.classList.add('super-carrot');
        // Add visual distinction for super carrots
        collectible.style.filter = 'brightness(1.3) hue-rotate(10deg)'; 
        collectible.style.transform = 'scale(1.2)'; // Make them slightly larger
    }
    
    // Adjust heights slightly as the level increases to match faster gameplay
    if (level > 1) {
        // As level increases, gradually position carrots higher
        const levelAdjustment = Math.min(level * 5, 40);
        heightPosition += Math.floor(Math.random() * levelAdjustment);
    }
    
    // Position the carrot
    collectible.style.bottom = `${heightPosition}px`;
    
    // Add slight horizontal variation for more interesting patterns
    const horizontalOffset = Math.floor(Math.random() * 100); // 0-100px extra distance
    collectible.style.right = `${-20 - horizontalOffset}px`; // Start off-screen with variation
    
    // Value of the carrot depends on its difficulty to reach
    if (heightPosition > 300) {
        collectible.dataset.value = '20'; // More valuable carrots
    } else {
        collectible.dataset.value = '10'; // Standard carrots
    }
    
    gameContainer.appendChild(collectible);
    collectibles.push(collectible);
}

// Update character animation
function updateCharacterAnimation(deltaTime) {
    if (isRunning) {
        runTimer += deltaTime;
        if (runTimer > 100) { // Change animation frame every 100ms
            runTimer = 0;
            runFrame = (runFrame + 1) % 3; // 3 animation frames
            
            // Apply run animation using sprite sheet or transform
            // For now, just change opacity slightly to show animation
            character.style.opacity = 0.8 + (runFrame * 0.1);
        }
    } else {
        // Reset to standing position
        character.style.opacity = 1;
        runFrame = 0;
    }
    
    // Apply powerup effect
    if (hasPowerup) {
        character.style.filter = `brightness(1.3)`;
        character.style.transform = `${currentDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)'} scale(${characterSize})`;
    } else {
        character.style.filter = 'none';
        character.style.transform = currentDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
    }
}

// Create powerup from question block
function createPowerup(x, y) {
    const powerup = document.createElement('div');
    powerup.classList.add('collectible');
    powerup.style.width = '40px';
    powerup.style.height = '40px';
    powerup.style.filter = 'hue-rotate(260deg) brightness(1.3)'; // Make it look different from carrots
    
    powerup.style.position = 'absolute';
    powerup.style.bottom = `${y}px`;
    powerup.style.right = `${x}px`;
    powerup.dataset.powerup = 'true';
    
    gameContainer.appendChild(powerup);
    collectibles.push(powerup);
    
    // Animate powerup coming out of block
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
    // Make hitbox slightly smaller for more forgiving gameplay
    const margin = 10;
    return box1.left + margin < box2.right - margin &&
           box1.right - margin > box2.left + margin &&
           box1.top + margin < box2.bottom - margin &&
           box1.bottom - margin > box2.top + margin;
}

// Check if character is standing on a platform
function checkPlatformCollisions() {
    const characterBox = getBoundingBox(character);
    const characterBottom = parseInt(character.style.bottom);
    const characterHeight = characterBox.height;
    
    // Only check for platform collisions when falling
    if (!isJumping && characterBottom > 500) {
        isFalling = true;
        
        // Check all platforms
        for (let i = 0; i < platforms.length; i++) {
            const platformBox = getBoundingBox(platforms[i]);
            
            // Check if character is above the platform and falling onto it
            if (characterBox.left < platformBox.right && 
                characterBox.right > platformBox.left) {
                
                const platformTop = platformBox.top;
                const characterBottom = characterBox.bottom;
                
                // If character is just above the platform (within 10px), snap to it
                if (Math.abs(characterBottom - platformTop) < 10) {
                    const platformBottomPosition = parseInt(platforms[i].style.bottom);
                    character.style.bottom = `${platformBottomPosition + platformBox.height}px`;
                    isFalling = false;
                    return true;
                }
            }
        }
        
        // If not standing on any platform, apply gravity
        if (isFalling) {
            const newBottom = Math.max(500, characterBottom - 5); // Fall at 5px per frame
            character.style.bottom = `${newBottom}px`;
            
            if (newBottom <= 500) {
                isFalling = false;
            }
        }
    }
    
    return false;
}

// Check if character hits a block from below
function checkBlockCollisions() {
    if (!isJumping) return;
    
    const characterBox = getBoundingBox(character);
    
    for (let i = 0; i < blocks.length; i++) {
        const blockBox = getBoundingBox(blocks[i].element);
        
        // Only check for collision from below
        if (characterBox.top < blockBox.bottom &&
            characterBox.right > blockBox.left &&
            characterBox.left < blockBox.right &&
            characterBox.top > blockBox.top) {
                
            // Character hit block from below
            blocks[i].element.style.animation = 'hit 0.2s ease-in-out';
            
            // If it's a question block that hasn't been hit yet
            if (blocks[i].isQuestion && blocks[i].element.dataset.hit === 'false') {
                blocks[i].element.dataset.hit = 'true';
                
                // Create powerup or coin above the block
                if (Math.random() > 0.7) { // 30% chance for a powerup
                    createPowerup(
                        window.innerWidth - blockBox.left, 
                        parseInt(blocks[i].element.style.bottom) + 32
                    );
                    powerupSound.currentTime = 0;
                    powerupSound.play().catch(e => console.log("Audio play failed:", e));
                } else {
                    // Give points for hitting block
                    updateScore(10);
                    coinSound.currentTime = 0;
                    coinSound.play().catch(e => console.log("Audio play failed:", e));
                }
                
                // Change appearance of hit block
                blocks[i].element.style.filter = 'brightness(0.7)';
            } else {
                // Play bump sound for regular brick
                bumpSound.currentTime = 0;
                bumpSound.play().catch(e => console.log("Audio play failed:", e));
            }
            
            // Bounce the character down slightly
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

// Update score with animation
function updateScore(points = 0) {
    score += points;
    scoreDisplay.textContent = `SCORE: ${score}`;
    
    // Check if we should level up
    if (score >= levelProgress + scoreToNextLevel) {
        levelUp();
    }
    
    if (points > 0) {
        // Visual feedback for points
        const pointsDisplay = document.createElement('div');
        pointsDisplay.textContent = `+${points}`;
        pointsDisplay.classList.add('points-animation');
        pointsDisplay.style.left = `${character.getBoundingClientRect().right}px`;
        pointsDisplay.style.top = `${character.getBoundingClientRect().top}px`;
        gameContainer.appendChild(pointsDisplay);
        
        // Remove after animation
        setTimeout(() => {
            pointsDisplay.remove();
        }, 1000);
    }
}

// Level up function
function levelUp() {
    level++;
    levelProgress = score; // Set new baseline for next level
    scoreToNextLevel = 100 * level; // Increase score needed for next level
    
    // Play level up sound
    levelUpSound.currentTime = 0;
    levelUpSound.play().catch(e => console.log("Audio play failed:", e));
    
    // Update level display
    updateLevelDisplay();
    
    // Level up visual effect
    const levelUpAnimation = document.createElement('div');
    levelUpAnimation.textContent = `LEVEL ${level}!`;
    levelUpAnimation.classList.add('level-up-animation');
    gameContainer.appendChild(levelUpAnimation);
    
    // Show speech bubble for level up
    const rescueMessages = [
        'Friend rescued!', 
        'Bunny buddy freed!', 
        'Hoppy rescue!', 
        'Mission accomplished!', 
        'One more saved!'
    ];
    
    // Choose random rescue message
    const rescueMessage = rescueMessages[Math.floor(Math.random() * rescueMessages.length)];
    
    // Show initial reaction
    const celebrationMessages = [
        'Woo-hoo!', 
        'Level up!', 
        'Hippity-Hop!', 
        'Awesome!', 
        'Bun-believable!'
    ];
    const celebrationMessage = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
    
    // Create first bubble
    const bubble1 = document.createElement('div');
    bubble1.classList.add('speech-bubble', 'special');
    bubble1.textContent = celebrationMessage;
    character.appendChild(bubble1);
    
    // Add an additional rescue message after the initial reaction
    setTimeout(() => {
        // Remove first bubble
        if (bubble1 && bubble1.parentNode) {
            bubble1.style.opacity = '0';
            bubble1.style.transition = 'opacity 0.3s';
            setTimeout(() => bubble1.remove(), 300);
        }
        
        // Add second bubble
        const bubble2 = document.createElement('div');
        bubble2.classList.add('speech-bubble', 'special');
        bubble2.textContent = rescueMessage;
        character.appendChild(bubble2);
        
        // Remove after animation
        setTimeout(() => {
            if (bubble2 && bubble2.parentNode) {
                bubble2.style.opacity = '0';
                bubble2.style.transform = 'translateX(-50%) translateY(-20px)';
                bubble2.style.transition = 'all 0.3s ease-out';
                
                setTimeout(() => {
                    if (bubble2 && bubble2.parentNode) {
                        bubble2.remove();
                    }
                }, 300);
            }
        }, 2000);
    }, 1500);
    
    // Remove level up animation after animation
    setTimeout(() => {
        levelUpAnimation.remove();
    }, 2000);
    
    // Increase difficulty based on new level
    updateDifficultyForLevel();
}

// Create and update level display
function createLevelDisplay() {
    // Create level display element if it doesn't exist
    if (!levelDisplay) {
        levelDisplay = document.createElement('div');
        levelDisplay.id = 'level-display';
        gameContainer.appendChild(levelDisplay);
    }
    
    updateLevelDisplay();
}

// Update level display content
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
    }
}

// Update difficulty based on current level
function updateDifficultyForLevel() {
    // Base game speed increases with level
    gameSpeed = 200 + (level * 50);
    
    // Obstacle interval decreases (more obstacles at higher levels)
    obstacleInterval = Math.max(1000, 3000 - (level * 300));
    
    // Collectible interval adjustment
    collectibleInterval = Math.max(1000, 2000 - (level * 100));
    
    // Platform interval adjustment
    platformInterval = Math.max(2000, 4000 - (level * 300));
    
    // Visual indicator of current level difficulty
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
    
    // Fade out after 3 seconds
    setTimeout(() => {
        speedIndicator.style.transition = 'opacity 1s';
        speedIndicator.style.opacity = '0';
        setTimeout(() => {
            speedIndicator.remove();
        }, 1000);
    }, 3000);
}

// Game loop
function gameLoop(timestamp) {
    if (gameOver) return;
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Update obstacles
    obstacles.forEach((obstacle, index) => {
        const currentRight = parseInt(obstacle.style.right);
        obstacle.style.right = `${currentRight + gameSpeed * deltaTime / 1000}px`;
        
        if (currentRight > window.innerWidth + 100) {
            obstacle.remove();
            obstacles.splice(index, 1);
        }
    });
    
    // Update collectibles
    collectibles.forEach((collectible, index) => {
        const currentRight = parseInt(collectible.style.right);
        collectible.style.right = `${currentRight + gameSpeed * deltaTime / 1000}px`;
        
        if (currentRight > window.innerWidth + 100) {
            collectible.remove();
            collectibles.splice(index, 1);
        }
    });
    
    // Update platforms
    platforms.forEach((platform, index) => {
        const currentRight = parseInt(platform.style.right);
        platform.style.right = `${currentRight + gameSpeed * deltaTime / 1000}px`;
        
        if (currentRight > window.innerWidth + 200) {
            platform.remove();
            platforms.splice(index, 1);
        }
    });
    
    // Update blocks
    blocks.forEach((block, index) => {
        const currentRight = parseInt(block.element.style.right);
        block.element.style.right = `${currentRight + gameSpeed * deltaTime / 1000}px`;
        
        if (currentRight > window.innerWidth + 100) {
            block.element.remove();
            blocks.splice(index, 1);
        }
    });
    
    // Spawn new obstacles
    obstacleTimer += deltaTime;
    if (obstacleTimer > obstacleInterval) {
        // Add random gap adjustment to the next obstacle spawn
        const gapAdjustment = createObstacle();
        obstacleTimer = 0;
        // Apply the random gap adjustment to the next spawn
        obstacleInterval = Math.max(1000, 3000 - (level * 300) + gapAdjustment);
    }
    
    // Spawn new collectibles (carrots)
    collectibleTimer += deltaTime;
    if (collectibleTimer > collectibleInterval) {
        createCollectible();
        collectibleTimer = 0;
    }
    
    // Spawn new platforms
    platformTimer += deltaTime;
    if (platformTimer > platformInterval) {
        createPlatform();
        platformTimer = 0;
    }
    
    // Check for collisions
    checkCollisions();
    checkPlatformCollisions();
    checkBlockCollisions();
    
    // Update run animation if running on ground
    if (!isJumping && parseInt(character.style.bottom) <= 80) {
        runTimer += deltaTime;
        if (runTimer > 100) { // Update run frame every 100ms
            runTimer = 0;
            runFrame = (runFrame + 1) % 3; // 3 frames for run animation
        }
    }
    
    // Update score based on time - points increase with level
    updateScore(Math.floor(deltaTime * 0.01 * (1 + (level * 0.5))));
    
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    // Play button click sound
    buttonClickSound.currentTime = 0;
    buttonClickSound.play().catch(e => console.log("Audio play failed:", e));
    
    // Initialize sounds
    initSounds();
    
    // Reset level
    level = 1;
    levelProgress = 0;
    scoreToNextLevel = 100;
    
    // Create level display
    createLevelDisplay();
    updateLevelDisplay();
    
    // Update display
    startScreen.style.display = 'none';
    scoreDisplay.textContent = 'SCORE: 0';
    
    // Show and reset character
    character.style.display = 'block';
    character.style.transform = 'scaleX(1)';
    character.style.transition = 'none';
    character.style.bottom = '140px';
    character.style.filter = 'none';
    character.style.opacity = '1';
    character.style.backgroundImage = "url('assets/Bunny.svg')";
    
    // Add shadow under the bunny
    createBunnyShadow();
    
    // Reset health
    health = 3;
    updateHealthDisplay();
    
    // Show instructions based on device
    showInstructions();
    
    // Reset foreground animation
    const foreground = document.getElementById('foreground');
    foreground.style.animation = 'ground-scroll 30s linear infinite';
    
    // Clear any existing elements
    clearAllColliders();
    
    // Reset game state
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
    
    // Create initial game elements
    createInitialGameElements();
    
    // Set initial difficulty
    updateDifficultyForLevel();
    
    // Start eye blinking animation
    startBunnyBlinking();
    
    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Show instructions for mobile or desktop
function showInstructions() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        const touchInstruction = document.createElement('div');
        touchInstruction.id = 'touch-instruction';
        touchInstruction.textContent = 'Tap to Jump! Multiple Taps for Higher Jumps!';
        touchInstruction.style.position = 'absolute';
        touchInstruction.style.bottom = '50px';
        touchInstruction.style.left = '50%';
        touchInstruction.style.transform = 'translateX(-50%)';
        touchInstruction.style.padding = '10px 20px';
        touchInstruction.style.background = 'rgba(255, 255, 255, 0.7)';
        touchInstruction.style.borderRadius = '20px';
        touchInstruction.style.zIndex = '100';
        gameContainer.appendChild(touchInstruction);
        
        // Fade out after 3 seconds
        setTimeout(() => {
            touchInstruction.style.transition = 'opacity 1s';
            touchInstruction.style.opacity = '0';
            setTimeout(() => {
                touchInstruction.remove();
            }, 1000);
        }, 3000);
    } else {
        // Instructions for desktop
        const keyInstruction = document.createElement('div');
        keyInstruction.id = 'key-instruction';
        keyInstruction.textContent = 'Press SPACE to Jump! Multiple Presses for Higher Jumps!';
        keyInstruction.style.position = 'absolute';
        keyInstruction.style.bottom = '50px';
        keyInstruction.style.left = '50%';
        keyInstruction.style.transform = 'translateX(-50%)';
        keyInstruction.style.padding = '10px 20px';
        keyInstruction.style.background = 'rgba(255, 255, 255, 0.7)';
        keyInstruction.style.borderRadius = '20px';
        keyInstruction.style.zIndex = '100';
        gameContainer.appendChild(keyInstruction);
        
        // Fade out after 3 seconds
        setTimeout(() => {
            keyInstruction.style.transition = 'opacity 1s';
            keyInstruction.style.opacity = '0';
            setTimeout(() => {
                keyInstruction.remove();
            }, 1000);
        }, 3000);
    }
}

// End game
function endGame() {
    gameOver = true;
    
    // Stop the blinking animation
    stopBunnyBlinking();
    
    // Play game over sound
    bgMusic.pause();
    gameoverSound.play().catch(e => console.log("Audio play failed:", e));
    
    // Visual effect for game over - change to dead bunny image
    character.style.backgroundImage = "url('assets/Bunny Died.svg')";
    character.style.transform = 'scaleX(1)'; // Reset any transform
    
    // Remove shadow when bunny dies
    const shadow = document.querySelector('.bunny-shadow');
    if (shadow) {
        shadow.style.opacity = '0';
        setTimeout(() => {
            shadow.remove();
        }, 300);
    }
    
    // Show game over screen
    setTimeout(() => {
        startScreen.style.display = 'flex';
        startScreen.innerHTML = `
            <h1>GAME OVER</h1>
            <p>YOUR SCORE: ${score}</p>
            <p>LEVEL REACHED: ${level}</p>
            <p class="game-story">Your bunny friends are still waiting to be rescued! Try again!</p>
            <button id="restart-button">PLAY AGAIN</button>
        `;
        
        // Style the story text
        const storyElement = startScreen.querySelector('.game-story');
        if (storyElement) {
            storyElement.style.textAlign = 'center';
            storyElement.style.margin = '10px 0 20px';
            storyElement.style.fontSize = '18px';
            storyElement.style.color = '#8B4513';
            storyElement.style.fontWeight = 'bold';
            //storyElement.style.textShadow = '1px 1px 2px #000';
        }
        
        // Add event listener with a slight delay to ensure DOM is updated
        setTimeout(() => {
            const restartBtn = document.getElementById('restart-button');
            if (restartBtn) {
                restartBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log("Restart button clicked");
                    // Play button click sound
                    if (buttonClickSound) {
                        buttonClickSound.currentTime = 0;
                        buttonClickSound.play().catch(e => console.log("Audio play failed:", e));
                    }
                    restartGame();
                });
            }
        }, 50);
    }, 1000);
}

// Clear all game elements/colliders
function clearAllColliders() {
    // Remove all obstacles
    obstacles.forEach(obstacle => obstacle.remove());
    obstacles = [];
    
    // Remove all collectibles
    collectibles.forEach(collectible => collectible.remove());
    collectibles = [];
    
    // Remove all platforms
    platforms.forEach(platform => platform.remove());
    platforms = [];
    
    // Remove all blocks
    blocks.forEach(block => block.element.remove());
    blocks = [];
    
    // Remove any animations
    document.querySelectorAll('.points-animation').forEach(el => el.remove());
    
    // Additional cleanup - remove any elements that might have been missed
    document.querySelectorAll('.obstacle, .collectible, .platform, .brick, .questionBlock').forEach(el => el.remove());
}

// Restart game
function restartGame() {
    // Play button click sound
    buttonClickSound.currentTime = 0;
    buttonClickSound.play().catch(e => console.log("Audio play failed:", e));
    
    // Clear existing elements
    clearAllColliders();
    
    // Start fresh
    startGame();
}

// Initialize and set up event listeners
function initGame() {
    // Add CSS for animations and game elements
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
            font-family: 'Comic Sans MS', cursive, sans-serif;
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
        
        .bunny-shadow {
            position: absolute;
            bottom: 125px;
            width: 60px;
            height: 20px;
            background: rgba(14, 61, 0, 0.48);
            border-radius: 50%;
            z-index: 5;
            transform: translateX(-50%);
            left: 50%;
            filter: blur(0px);
            transition: opacity 0.3s, transform 0.3s;
        }
    `;
    document.head.appendChild(style);
    
    // Set up keyboard events
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Set up touch events for mobile jumping
    document.addEventListener('touchstart', handleTouchStart);
    
    // Initialize sounds first so they're ready
    initSounds();
    
    // Add story to start screen
    if (startScreen) {
        // Check if we need to add the story
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
           // storyElement.style.textShadow = '1px 1px 2px #000';
            storyElement.style.maxWidth = '80%';
            
            // Insert after the title but before the button
            startScreen.insertBefore(storyElement, startButton);
        }
    }
    
    // Set up start button with forceful approach
    const startBtn = document.getElementById('start-button');
    if (startBtn) {
        // Remove any existing listeners to avoid duplicates
        startBtn.replaceWith(startBtn.cloneNode(true));
        // Get the fresh clone
        const freshStartBtn = document.getElementById('start-button');
        // Add click listener 
        freshStartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Start button clicked");
            // Play button click sound
            if (buttonClickSound) {
                buttonClickSound.currentTime = 0;
                buttonClickSound.play().catch(e => console.log("Audio play failed:", e));
            }
            startGame();
        });
    }
    
    // Hide character initially
    character.style.display = 'none';
}

// Initialize the game when the page loads
window.addEventListener('load', initGame);

// Handle window resize for responsive layout
window.addEventListener('resize', () => {
    // Adjust character position on small screens
    if (window.innerWidth <= 768) {
        character.style.left = '50px';
    } else {
        character.style.left = '100px';
    }
});

// Update health display based on current health value
function updateHealthDisplay() {
    hearts.forEach((heart, index) => {
        if (index < health) {
            heart.style.opacity = '1';
        } else {
            heart.style.opacity = '0.3';
        }
    });
}

// Player takes damage
function takeDamage() {
    if (gameOver) return;
    
    // Flash character to indicate damage
    character.style.animation = 'hit 0.5s';
    setTimeout(() => {
        character.style.animation = '';
    }, 500);
    
    // Play hurt sound
    hurtSound.currentTime = 0;
    hurtSound.play().catch(e => console.log("Audio play failed:", e));
    
    // Decrease health
    health--;
    updateHealthDisplay();
    
    // Check if game over
    if (health <= 0) {
        endGame();
    }
}

// Update functions
function checkCollisions() {
    if (gameOver) return;
    
    const characterBox = getBoundingBox(character);
    
    // Check obstacles collisions
    for (let i = 0; i < obstacles.length; i++) {
        const obstacleBox = getBoundingBox(obstacles[i]);
        
        if (isColliding(characterBox, obstacleBox)) {
            // Take damage instead of immediate game over
            takeDamage();
            
            // Remove the obstacle
            obstacles[i].remove();
            obstacles.splice(i, 1);
            i--;
        }
    }
    
    // Check collectible collisions
    for (let i = 0; i < collectibles.length; i++) {
        const collectibleBox = getBoundingBox(collectibles[i]);
        
        if (isColliding(characterBox, collectibleBox)) {
            // Get carrot value before removing it
            const carrotValue = parseInt(collectibles[i].dataset.value || '10');
            
            // Show speech bubble when collecting carrots
            showBunnySpeechBubble(carrotValue);
            
            // Remove from DOM and array
            collectibles[i].remove();
            collectibles.splice(i, 1);
            
            // Play sound
            coinSound.currentTime = 0;
            coinSound.play().catch(e => console.log("Audio play failed:", e));
            
            // Add score based on carrot value
            updateScore(carrotValue);
            i--;
        }
    }
}

// Show speech bubble for bunny
function showBunnySpeechBubble(points) {
    // Remove any existing speech bubbles
    document.querySelectorAll('.speech-bubble').forEach(bubble => bubble.remove());
    
    // Create a new bubble with a random message
    const bubble = document.createElement('div');
    bubble.classList.add('speech-bubble');
    
    // Different messages based on point value and some randomness
    const messages = {
        regular: [
            'Carrot-astic!', 
            'Hop-tastic!', 
            'Nom nom nom!', 
            'Bunny approved!', 
            'Crunchy good!'
        ],
        special: [
            'Hop-diggity!', 
            'Carrot jackpot!', 
            'Bunny heaven!', 
            'Ear-resistible!', 
            'Super-duper!'
        ]
    };
    
    // Choose message based on points
    const messageList = points > 10 ? messages.special : messages.regular;
    const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
    bubble.textContent = randomMessage;
    
    // Add special class for high-value points
    if (points > 10) {
        bubble.classList.add('special');
    }
    
    // Add to character
    character.appendChild(bubble);
    
    // Remove after animation
    setTimeout(() => {
        if (bubble && bubble.parentNode) {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateX(-50%) translateY(-20px)';
            bubble.style.transition = 'all 0.3s ease-out';
            
            setTimeout(() => {
                if (bubble && bubble.parentNode) {
                    bubble.remove();
                }
            }, 300);
        }
    }, 1500);
}

// Create initial game elements
function createInitialGameElements() {
    // Create initial platforms
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            if (!gameOver) {
                createPlatform();
            }
        }, i * 1500);
    }
    
    // Create initial obstacles
    setTimeout(() => {
        if (!gameOver) {
            createObstacle();
        }
    }, 2000);
    
    // Create initial carrots
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            if (!gameOver) {
                createCollectible();
            }
        }, 1000 + i * 1000);
    }
}

// Bunny eye blinking function
function startBunnyBlinking() {
    // Clear any existing blink interval
    if (blinkIntervalId) {
        clearInterval(blinkIntervalId);
    }
    
    // Reset to eyes open
    character.style.backgroundImage = "url('assets/Bunny.svg')";
    eyesOpen = true;
    
    // Double blink function - blinks twice quickly
    const doubleBlink = () => {
        if (gameOver) {
            stopBunnyBlinking();
            return;
        }
        
        // First blink
        character.style.backgroundImage = "url('assets/bunny-closeeye.svg')";
        eyesOpen = false;
        
        // Open eyes after 200ms
        setTimeout(() => {
            if (gameOver) return;
            
            character.style.backgroundImage = "url('assets/Bunny.svg')";
            eyesOpen = true;
            
            // Short delay between blinks (300ms)
            setTimeout(() => {
                if (gameOver) return;
                
                // Second blink
                character.style.backgroundImage = "url('assets/bunny-closeeye.svg')";
                eyesOpen = false;
                
                // Open eyes again after 200ms
                setTimeout(() => {
                    if (gameOver) return;
                    
                    character.style.backgroundImage = "url('assets/Bunny.svg')";
                    eyesOpen = true;
                }, 200);
            }, 300);
        }, 200);
    };
    
    // Initial blink
    doubleBlink();
    
    // Set up interval for double blinks every 4 seconds
    blinkIntervalId = setInterval(() => {
        if (gameOver) {
            stopBunnyBlinking();
            return;
        }
        doubleBlink();
    }, 2000);
}

// Stop bunny eye blinking
function stopBunnyBlinking() {
    if (blinkIntervalId) {
        clearInterval(blinkIntervalId);
        blinkIntervalId = null;
    }
}

// Create shadow under the bunny
function createBunnyShadow() {
    // Remove any existing shadow
    const existingShadow = document.querySelector('.bunny-shadow');
    if (existingShadow) {
        existingShadow.remove();
    }
    
    // Create new shadow element
    const shadow = document.createElement('div');
    shadow.classList.add('bunny-shadow');
    
    // Position shadow relative to character's current position
    shadow.style.left = character.style.left;
    
    // Add shadow to game container
    gameContainer.appendChild(shadow);
    
    // Position it correctly
    updateShadowPosition();
}

// Update shadow position based on bunny's height
function updateShadowPosition() {
    const shadow = document.querySelector('.bunny-shadow');
    if (!shadow) return;
    
    const characterRect = character.getBoundingClientRect();
    const characterBottom = parseInt(character.style.bottom);
    
    // Position the shadow directly under the bunny's center
    const characterCenterX = characterRect.left + (characterRect.width / 2);
    const gameContainerRect = gameContainer.getBoundingClientRect();
    const shadowLeftPosition = characterCenterX - gameContainerRect.left;
    
    // Set shadow position
    shadow.style.left = `${shadowLeftPosition}px`;
    
    // Scale and fade shadow based on jump height
    if (characterBottom > 140) {
        // Calculate how high the bunny is above ground level
        const heightAboveGround = characterBottom - 140;
        
        // Scale shadow smaller as bunny jumps higher
        const scale = Math.max(0.5, 1 - (heightAboveGround / 300));
        
        // Make shadow more transparent as bunny jumps higher
        const opacity = Math.max(0.1, 0.3 - (heightAboveGround / 600));
        
        shadow.style.transform = `translateX(-50%) scale(${scale})`;
        shadow.style.opacity = opacity.toString();
    } else {
        // Reset to normal when on ground
        shadow.style.transform = 'translateX(-50%) scale(1)';
        shadow.style.opacity = '0.3';
    }
}