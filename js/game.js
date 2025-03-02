class Game {
    constructor(p) {
        this.p = p;
        this.width = p.width;
        this.height = p.height;
        
        // Position player higher on the screen for better visibility
        this.player = new Player(this.width / 2, this.height - 100, 40); // Higher position
        
        this.enemies = [];
        this.currentEnemy = null;
        this.difficulty = 'easy';
        this.gameState = 'start';
        this.isPaused = false;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 120;
        this.enemiesDefeated = 0;
        this.enemiesPerLevel = 10;
        this.typingAccuracy = 100;
        this.typingSpeed = 0;
        this.lastTypedTime = 0;
        this.typedCharacters = 0;
        this.bullets = [];
        this.customWords = null;
        this.lives = 3;
        this.maxLives = 3;
        this.gameOverReason = '';
        
        // Visual effects
        this.particles = [];
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;
        
        // Background stars
        this.stars = [];
        for (let i = 0; i < 300; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.1,
                color: [255, 255, 255], // Simple white stars
                brightness: 150 + Math.random() * 105 // For twinkling effect
            });
        }
        
        // Sound effects
        this.sounds = {
            typing: null,
            shooting: null,
            enemyDefeat: null,
            playerHit: null,
            levelUp: null,
            gameOver: null,
            menuSelect: null,
            loseLife: null,
            powerUp: null,
            pause: null,
            unpause: null
        };
        
        // Load high scores from local storage
        this.highScores = JSON.parse(localStorage.getItem('keystrikesHighScores')) || [];
        
        // Power-ups for more fun
        this.powerUps = [];
        this.powerUpTypes = ['rapidFire', 'shield', 'multiShot', 'slowMotion'];
        this.activePowerUps = {
            rapidFire: 0,
            shield: 0,
            multiShot: 0,
            slowMotion: 0
        };
        
        // Menu buttons
        this.menuButtons = {
            start: [
                { text: "NEW GAME", x: this.width / 2, y: 300, width: 300, height: 50 },
                { text: "MY STATS", x: this.width / 2, y: 370, width: 300, height: 50 },
                { text: "LOAD YOUR OWN TEXT", x: this.width / 2, y: 440, width: 300, height: 50 }
            ]
        };
        
        // Error handling
        this.errorCount = 0;
        this.maxErrors = 3;
    }
    
    preload() {
        // Set loading state
        this.isLoading = true;
        
        // Add a loading timeout to prevent getting stuck
        this.loadingTimeout = setTimeout(() => {
            console.log("Loading timeout reached, forcing game to start");
            this.isLoading = false;
        }, 5000); // 5 second timeout
        
        // Load sounds with error handling
        const loadSound = (key, url, volume) => {
            try {
                // Use relative URLs that work with a local server
                const fullUrl = url;
                
                this.sounds[key] = new Howl({
                    src: [fullUrl],
                    volume: volume,
                    html5: true, // Force HTML5 Audio to avoid CORS issues
                    format: ['mp3'],
                    onload: () => this.checkLoading(),
                    onloaderror: (id, err) => {
                        console.error(`Error loading sound ${key}:`, err);
                        // Create a silent sound as a fallback
                        this.sounds[key] = {
                            play: function() { 
                                console.log(`Silent fallback for ${key}`);
                                return { 
                                    _id: 0,
                                    stop: function() {} 
                                }; 
                            },
                            stop: function() {}
                        };
                        this.checkLoading(); // Count as loaded even if it failed
                    }
                });
            } catch (e) {
                console.error(`Failed to create Howl for ${key}:`, e);
                // Create a silent sound as a fallback
                this.sounds[key] = {
                    play: function() { 
                        console.log(`Silent fallback for ${key}`);
                        return { 
                            _id: 0,
                            stop: function() {} 
                        }; 
                    },
                    stop: function() {}
                };
                this.checkLoading(); // Count as loaded even if it failed
            }
        };
        
        // Load each sound with error handling
        loadSound('typing', 'assets/typing.mp3', 0.5);
        loadSound('shooting', 'assets/shooting.mp3', 0.3);
        loadSound('enemyDefeat', 'assets/explosion.mp3', 0.3);
        loadSound('playerHit', 'assets/hurt.mp3', 0.4);
        loadSound('levelUp', 'assets/levelUp.mp3', 0.5);
        loadSound('gameOver', 'assets/gameOver.mp3', 0.5);
        loadSound('menuSelect', 'assets/select.mp3', 0.3);
        loadSound('loseLife', 'assets/hurt.mp3', 0.5);
        loadSound('powerUp', 'assets/powerUp.mp3', 0.5);
        loadSound('pause', 'assets/pause.mp3', 0.3);
        loadSound('unpause', 'assets/unpause.mp3', 0.3);
        
        // Track loading progress
        this.loadedSounds = 0;
        this.totalSounds = Object.keys(this.sounds).length;
    }
    
    checkLoading() {
        this.loadedSounds++;
        
        if (this.loadedSounds >= this.totalSounds) {
            // Clear the timeout since we've loaded everything
            if (this.loadingTimeout) {
                clearTimeout(this.loadingTimeout);
                this.loadingTimeout = null;
            }
            this.isLoading = false;
        }
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // Adjust game parameters based on difficulty
        switch (difficulty) {
            case 'easy':
                this.enemySpawnInterval = 120; // 2 seconds
                break;
            case 'medium':
                this.enemySpawnInterval = 90; // 1.5 seconds
                break;
            case 'hard':
                this.enemySpawnInterval = 60; // 1 second
                break;
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.player.reset();
        this.enemies = [];
        this.currentEnemy = null;
        this.enemiesDefeated = 0;
        this.typingAccuracy = 100;
        this.typingSpeed = 0;
        this.typedCharacters = 0;
        this.lastTypedTime = 0;
        this.lives = this.maxLives;
        this.particles = [];
        this.bullets = [];
        this.activePlayers = Math.floor(Math.random() * 500) + 500; // Random number of active players for display
        
        // No DOM manipulation - we're using canvas only
        
        // Update UI
        this.updateUI();
    }
    
    endGame() {
        this.gameState = 'gameOver';
        
        // Reset screen shake
        this.shakeAmount = 0;
        
        // Check if we have a new high score
        const newScore = {
            score: this.player.score,
            level: this.player.level,
            date: new Date().toISOString()
        };
        
        this.highScores.push(newScore);
        
        // Sort and limit to top 10
        this.highScores.sort((a, b) => b.score - a.score);
        if (this.highScores.length > 10) {
            this.highScores.length = 10;
        }
        
        // Save to local storage
        localStorage.setItem('keystrikesHighScores', JSON.stringify(this.highScores));
        
        // Save stats for My Stats screen
        const currentHighScore = localStorage.getItem('keystrikesHighScore') || 0;
        if (this.player.score > currentHighScore) {
            localStorage.setItem('keystrikesHighScore', this.player.score);
        }
        
        // Increment games played
        const gamesPlayed = parseInt(localStorage.getItem('keystrikesGamesPlayed') || 0) + 1;
        localStorage.setItem('keystrikesGamesPlayed', gamesPlayed);
        
        // Add to total enemies defeated
        const totalEnemiesDefeated = parseInt(localStorage.getItem('keystrikesTotalEnemiesDefeated') || 0) + this.enemiesDefeated;
        localStorage.setItem('keystrikesTotalEnemiesDefeated', totalEnemiesDefeated);
        
        // Check for best accuracy
        const bestAccuracy = parseFloat(localStorage.getItem('keystrikesHighestAccuracy') || 0);
        if (this.typingAccuracy > bestAccuracy) {
            localStorage.setItem('keystrikesHighestAccuracy', this.typingAccuracy.toFixed(1));
        }
        
        // Check for best WPM
        const bestWPM = parseFloat(localStorage.getItem('keystrikesHighestWPM') || 0);
        if (this.typingSpeed > bestWPM) {
            localStorage.setItem('keystrikesHighestWPM', this.typingSpeed.toFixed(1));
        }
        
        // Play game over sound
        this.safePlaySound('gameOver');
        
        // Hide custom text area if it exists
        this.hideCustomTextArea();
    }
    
    update() {
        try {
            if (this.gameState === 'playing' && !this.isPaused) {
                // Update screen shake
                if (this.shakeAmount > 0) {
                    this.shakeAmount *= this.shakeDecay;
                    if (this.shakeAmount < 0.1) {
                        this.shakeAmount = 0;
                    }
                }
                
                // Update stars
                for (const star of this.stars) {
                    star.y += star.speed;
                    if (star.y > this.height) {
                        star.y = 0;
                        star.x = Math.random() * this.width;
                    }
                }
                
                // Update particles
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    this.particles[i].update();
                    if (this.particles[i].life <= 0) {
                        this.particles.splice(i, 1);
                    }
                }
                
                // Update power-ups
                this.updatePowerUps();
                this.updateActivePowerUps();
                
                // Randomly spawn power-ups (1% chance per frame)
                if (Math.random() < 0.001) {
                    this.spawnPowerUp();
                }
                
                // Spawn enemies
                this.enemySpawnTimer++;
                if (this.enemySpawnTimer >= this.enemySpawnInterval) {
                    this.spawnEnemy();
                    this.enemySpawnTimer = 0;
                }
                
                // Update enemies
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const enemy = this.enemies[i];
                    enemy.update();
                    
                    // Check if enemy reached bottom
                    if (enemy.y > this.height + enemy.size) {
                        // Player loses a life when enemy reaches bottom
                        this.loseLife();
                        this.enemies.splice(i, 1);
                        
                        // If this was the current enemy, clear it
                        if (this.currentEnemy === enemy) {
                            this.currentEnemy = null;
                        }
                    }
                }
                
                // Update bullets
                for (let i = this.bullets.length - 1; i >= 0; i--) {
                    const bullet = this.bullets[i];
                    bullet.update();
                    
                    // Remove bullets that go off screen
                    if (bullet.y < -bullet.size || bullet.y > this.height + bullet.size || 
                        bullet.x < -bullet.size || bullet.x > this.width + bullet.size) {
                        this.bullets.splice(i, 1);
                        continue;
                    }
                    
                    // CRITICAL FIX: Check for collision with the target enemy first
                    if (bullet.targetEnemy && !bullet.targetEnemy.isDefeated) {
                        if (this.checkCollision(bullet, bullet.targetEnemy)) {
                            // Create hit effect
                            this.createHitParticles(bullet.targetEnemy.x, bullet.targetEnemy.y);
                            
                            // Damage enemy
                            bullet.targetEnemy.takeDamage(bullet.damage);
                            
                            // Remove bullet
                            this.bullets.splice(i, 1);
                            
                            // If enemy is defeated by bullet collision
                            if (bullet.targetEnemy.health <= 0) {
                                bullet.targetEnemy.isDefeated = true;
                                this.enemiesDefeated++;
                                this.player.score += bullet.targetEnemy.originalWord.length * 10;
                                
                                // Create explosion
                                this.createExplosionParticles(bullet.targetEnemy.x, bullet.targetEnemy.y);
                                
                                // If this was the current enemy, clear it
                                if (this.currentEnemy === bullet.targetEnemy) {
                                    this.currentEnemy = null;
                                }
                                
                                // Remove enemy after explosion animation
                                setTimeout(() => {
                                    const index = this.enemies.indexOf(bullet.targetEnemy);
                                    if (index !== -1) {
                                        this.enemies.splice(index, 1);
                                    }
                                }, 1000); // Longer delay for explosion
                                
                                // Check for level up
                                if (this.enemiesDefeated >= this.enemiesPerLevel) {
                                    this.levelUp();
                                }
                            }
                            
                            continue;
                        }
                    }
                    
                    // Check for collision with any other enemy
                    for (let j = 0; j < this.enemies.length; j++) {
                        const enemy = this.enemies[j];
                        if (!enemy.isDefeated && enemy !== bullet.targetEnemy && this.checkCollision(bullet, enemy)) {
                            // Create hit effect
                            this.createHitParticles(enemy.x, enemy.y);
                            
                            // Damage enemy
                            enemy.takeDamage(bullet.damage);
                            
                            // Remove bullet
                            this.bullets.splice(i, 1);
                            
                            // If enemy is defeated by bullet collision
                            if (enemy.health <= 0) {
                                enemy.isDefeated = true;
                                this.enemiesDefeated++;
                                this.player.score += enemy.originalWord.length * 10;
                                
                                // Create explosion
                                this.createExplosionParticles(enemy.x, enemy.y);
                                
                                // If this was the current enemy, clear it
                                if (this.currentEnemy === enemy) {
                                    this.currentEnemy.isActive = false;
                                    this.currentEnemy = null;
                                }
                                
                                // Remove enemy after explosion animation
                                setTimeout(() => {
                                    const index = this.enemies.indexOf(enemy);
                                    if (index !== -1) {
                                        this.enemies.splice(index, 1);
                                    }
                                }, 1000); // Longer delay for explosion
                                
                                // Check for level up
                                if (this.enemiesDefeated >= this.enemiesPerLevel) {
                                    this.levelUp();
                                }
                            }
                            
                            break;
                        }
                    }
                }
                
                // CRITICAL FIX: Always check if we need a new current enemy
                if (!this.currentEnemy) {
                    this.selectNewCurrentEnemy();
                }
            }
            
            // Always update stars for background animation, even when paused
            for (const star of this.stars) {
                star.y += star.speed * 0.5; // Slower when paused
                if (star.y > this.height) {
                    star.y = 0;
                    star.x = Math.random() * this.width;
                }
            }
            
            // Reset error count if update succeeds
            this.errorCount = 0;
        } catch (error) {
            console.error("Game update error:", error);
            this.errorCount++;
            
            // If we've had multiple errors in a row, try to recover
            if (this.errorCount >= this.maxErrors) {
                // Pause the game to prevent further errors
                this.isPaused = true;
                
                // Alert the user
                alert("The game encountered an error and has been paused. Please restart the game.");
                
                // Reset error count
                this.errorCount = 0;
            }
        }
    }
    
    draw() {
        // Clear the screen with black background
        this.p.background(0);
        
        // Reset transformation
        this.p.resetMatrix();
        
        if (this.isLoading) {
            this.drawLoadingScreen();
            return;
        }
        
        if (this.gameState === 'start') {
            this.drawStartScreen();
        } else if (this.gameState === 'playing') {
            // Apply screen shake
            if (this.shakeAmount > 0) {
                this.p.translate(
                    Math.random() * this.shakeAmount - this.shakeAmount / 2,
                    Math.random() * this.shakeAmount - this.shakeAmount / 2
                );
            }
            
            // Draw stars
            this.drawStars();
            
            // Draw game elements
            this.drawGameElements();
            
            // Draw UI at the top with high contrast
            this.drawGameUI();
            
            // Draw pause overlay if paused
            if (this.isPaused) {
                this.drawPauseScreen();
            }
        } else if (this.gameState === 'gameOver') {
            this.drawGameOverScreen();
        } else if (this.gameState === 'settings') {
            this.drawSettingsScreen();
        } else if (this.gameState === 'leaderboard') {
            this.drawLeaderboardScreen();
        } else if (this.gameState === 'loadText') {
            this.drawLoadTextScreen();
        } else if (this.gameState === 'myStats') {
            this.drawMyStatsScreen();
        } else {
            // Other screens (settings, leaderboard, etc.)
            this.drawStars();
            this.p.fill(0, 0, 0, 200);
            this.p.rect(0, 0, this.width, this.height);
            
            this.p.fill(255);
            this.p.textAlign(this.p.CENTER, this.p.CENTER);
            this.p.textSize(40);
            this.p.text("Coming Soon", this.width/2, this.height/2);
            
            // Back button
            this.p.textSize(20);
            this.p.text("Back to Main Menu", this.width/2, this.height/2 + 100);
        }
        
        // Debug info moved to bottom right corner
        if (this.gameState === 'playing') {
            this.drawDebugInfo();
        }
    }
    
    drawLoadingScreen() {
        // Draw space background
        this.drawSpaceBackground();
        
        // Semi-transparent overlay
        this.p.fill(0, 0, 0, 200);
        this.p.rect(0, 0, this.width, this.height);
        
        // Loading title
        this.p.fill(0, 200, 255);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.textSize(40);
        this.p.text("LOADING...", this.width / 2, this.height / 2 - 50);
        
        // Loading bar background
        this.p.fill(50);
        this.p.rect(this.width / 2 - 150, this.height / 2, 300, 20, 5);
        
        // Loading bar progress
        const progress = this.loadedSounds / this.totalSounds;
        this.p.fill(0, 200, 255);
        this.p.rect(this.width / 2 - 150, this.height / 2, 300 * progress, 20, 5);
        
        // Loading percentage
        this.p.fill(255);
        this.p.textSize(16);
        this.p.text(`${Math.round(progress * 100)}%`, this.width / 2, this.height / 2 + 40);
    }
    
    drawStartScreen() {
        // Draw animated space background
        this.drawSpaceBackground();
        
        // Draw title with reduced size
        this.p.textFont('Orbitron'); // Use gaming font
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        
        // Title glow effect
        const glowAmount = Math.sin(this.p.frameCount * 0.05) * 10 + 20;
        this.p.fill(0, 150, 255, glowAmount);
        this.p.textSize(60); // Reduced size
        this.p.text("KEYSTRIKES", this.width / 2 + 2, 150 + 2);
        
        // Main title
        this.p.fill(0, 200, 255);
        this.p.textSize(60); // Reduced size
        this.p.text("KEYSTRIKES", this.width / 2, 150);
        
        // Subtitle
        this.p.fill(200, 200, 200);
        this.p.textSize(20);
        this.p.text("TYPE TO SURVIVE", this.width / 2, 200);
        
        // Draw menu buttons
        for (let i = 0; i < this.menuButtons.start.length; i++) {
            const button = this.menuButtons.start[i];
            
            // Check if mouse is over this button
            const isHovered = this.isMouseOverButton(button);
            
            // Draw button background
            this.p.fill(isHovered ? 0 : 20, isHovered ? 100 : 30, isHovered ? 150 : 50, 200);
            this.p.rect(button.x - button.width / 2, button.y - button.height / 2, button.width, button.height, 5);
            
            // Draw button text
            this.p.fill(isHovered ? 255 : 200);
            this.p.textSize(isHovered ? 22 : 20);
            this.p.text(button.text, button.x, button.y);
        }
        
        // Instructions at bottom
        this.p.textSize(16);
        this.p.fill(200);
        this.p.text("TYPE THE WORDS TO DESTROY ENEMIES", this.width / 2, this.height - 100);
        this.p.text("SURVIVE AS LONG AS YOU CAN", this.width / 2, this.height - 70);
        
        // Controls info
        this.p.textSize(14);
        this.p.fill(150);
        this.p.text("PRESS 'ESC' TO PAUSE OR RETURN TO MENU", this.width / 2, this.height - 40);
        
        // Version info
        this.p.textSize(12);
        this.p.fill(150);
        this.p.text("v1.1", this.width - 30, this.height - 20);
    }
    
    drawSpaceBackground() {
        // Draw dark space background with gradient
        this.p.background(10, 5, 20);
        
        // Draw a subtle gradient
        this.p.push();
        this.p.noStroke();
        for (let y = 0; y < this.height; y += 5) {
            const alpha = this.p.map(y, 0, this.height, 50, 0);
            this.p.fill(50, 0, 80, alpha);
            this.p.rect(0, y, this.width, 5);
        }
        this.p.pop();
        
        // Draw stars
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Update star position
            star.y += star.speed;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
            
            // Draw star with twinkle effect
            const brightness = star.brightness + Math.sin(this.p.frameCount * 0.05 + i) * 30;
            this.p.fill(brightness, brightness, brightness, 200);
            this.p.noStroke();
            this.p.ellipse(star.x, star.y, star.size, star.size);
        }
        
        // Draw nebula effect
        this.p.push();
        this.p.blendMode(this.p.ADD);
        for (let i = 0; i < 3; i++) {
            const x = this.width / 2 + Math.cos(this.p.frameCount * 0.001 + i) * 200;
            const y = this.height / 2 + Math.sin(this.p.frameCount * 0.002 + i) * 100;
            const size = 300 + Math.sin(this.p.frameCount * 0.01 + i) * 50;
            
            this.p.fill(30 + i * 20, 0, 50 + i * 10, 5);
            this.p.ellipse(x, y, size, size);
        }
        this.p.pop();
    }
    
    isMouseOverText(txt, x, y) {
        const textWidth = this.p.textWidth(txt);
        const textHeight = 30; // Approximate height
        
        return (
            this.p.mouseX > x - textWidth / 2 &&
            this.p.mouseX < x + textWidth / 2 &&
            this.p.mouseY > y - textHeight / 2 &&
            this.p.mouseY < y + textHeight / 2
        );
    }
    
    spawnEnemy() {
        // Get a random word based on difficulty
        const word = this.customWords ? 
            this.customWords[Math.floor(Math.random() * this.customWords.length)] : 
            getRandomWord(this.difficulty);
        
        // Find a position that doesn't overlap with existing enemies
        let x, overlapping;
        const padding = 80; // Minimum distance between enemies
        
        // Try up to 10 times to find a non-overlapping position
        let attempts = 0;
        do {
            overlapping = false;
            x = Math.random() * (this.width - 100) + 50;
            
            // Check if this position overlaps with any existing enemy
            for (const enemy of this.enemies) {
                const distance = Math.abs(x - enemy.x);
                if (distance < padding) {
                    overlapping = true;
                    break;
                }
            }
            
            attempts++;
        } while (overlapping && attempts < 10);
        
        // If we couldn't find a non-overlapping position after 10 attempts,
        // just use the last position we tried
        
        const enemySize = 35 + Math.random() * 15; // Smaller enemies
        const enemySpeed = 0.5 + Math.random() * (this.player.level * 0.1);
        
        // Create a random enemy type (0-3)
        const enemyType = Math.floor(Math.random() * 4);
        
        const enemy = new Enemy(
            word,
            x,
            -enemySize / 2,
            enemySpeed,
            enemySize,
            false,
            enemyType
        );
        
        this.enemies.push(enemy);
    }
    
    handleTyping(key) {
        if (this.gameState !== 'playing' || this.isPaused) return;
        
        // If we have a current enemy, check if the typed key matches
        if (this.currentEnemy && !this.currentEnemy.isDefeated) {
            // Check if the typed key matches the first letter of the current enemy's word
            if (key.toLowerCase() === this.currentEnemy.word.charAt(0).toLowerCase()) {
                // Correct key pressed
                this.typedCharacters++;
                
                // Update typing speed
                const currentTime = Date.now();
                if (this.lastTypedTime !== 0) {
                    const timeDiff = currentTime - this.lastTypedTime;
                    this.typingSpeed = (this.typedCharacters / 5) / (timeDiff / 60000);
                }
                this.lastTypedTime = currentTime;
                
                // Remove the first letter from the word
                this.currentEnemy.word = this.currentEnemy.word.substring(1);
                
                // Create bullet
                this.shootBullet(this.currentEnemy);
                
                // If word is completely typed
                if (this.currentEnemy.word.length === 0) {
                    // Mark enemy as defeated
                    const targetEnemy = this.currentEnemy;
                    this.currentEnemy.isActive = false;
                    this.currentEnemy = null;
                    
                    // Find a new enemy to target
                    this.selectNewCurrentEnemy();
                }
                
                // Play typing sound
                this.safePlaySound('typing');
            } else {
                // Incorrect key pressed - reduce accuracy
                this.typingAccuracy = Math.max(0, this.typingAccuracy - 2);
            }
        } else {
            // No current enemy - find one
            if (this.enemies.length > 0) {
                // Find enemy whose word starts with the typed key
                for (const enemy of this.enemies) {
                    if (!enemy.isDefeated && enemy.word.charAt(0).toLowerCase() === key.toLowerCase()) {
                        // Found a matching enemy
                        if (this.currentEnemy) {
                            this.currentEnemy.isActive = false;
                        }
                        
                        this.currentEnemy = enemy;
                        this.currentEnemy.isActive = true;
                        
                        // Remove the first letter and create bullet
                        this.currentEnemy.word = this.currentEnemy.word.substring(1);
                        this.shootBullet(this.currentEnemy);
                        
                        // Update typing stats
                        this.typedCharacters++;
                        const currentTime = Date.now();
                        if (this.lastTypedTime !== 0) {
                            const timeDiff = currentTime - this.lastTypedTime;
                            this.typingSpeed = (this.typedCharacters / 5) / (timeDiff / 60000);
                        }
                        this.lastTypedTime = currentTime;
                        
                        // If word is completely typed
                        if (this.currentEnemy.word.length === 0) {
                            // Mark enemy as defeated
                            this.currentEnemy.isActive = false;
                            this.currentEnemy = null;
                            
                            // Find a new enemy to target
                            this.selectNewCurrentEnemy();
                        }
                        
                        // Play typing sound
                        this.safePlaySound('typing');
                        
                        break;
                    }
                }
            }
        }
    }
    
    shootBullet(targetEnemy) {
        // Create a new bullet
        const bullet = new Bullet(
            this.player.x,
            this.player.y - this.player.size / 2,
            targetEnemy
        );
        
        // Add bullet to the array
        this.bullets.push(bullet);
        
        // Play shooting sound
        this.safePlaySound('shooting');
    }
    
    checkCollision(bullet, enemy) {
        // Calculate distance between bullet and enemy
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if distance is less than sum of radii
        return distance < (bullet.size/2 + enemy.size/2);
    }
    
    levelUp() {
        // Increase player level
        this.player.level++;
        
        // Reset enemies defeated counter
        this.enemiesDefeated = 0;
        
        // Increase enemies per level
        this.enemiesPerLevel += 2;
        
        // Decrease enemy spawn interval (make them spawn faster)
        this.enemySpawnInterval = Math.max(30, this.enemySpawnInterval - 10);
        
        // Play level up sound
        this.safePlaySound('levelUp');
        
        // Create level up particles
        for (let i = 0; i < 50; i++) {
            this.particles.push(new Particle(
                this.width / 2,
                this.height / 2,
                Math.random() * 5 + 2,
                [0, 255, 255],
                Math.random() * 3 + 1,
                Math.random() * Math.PI * 2,
                Math.random() * 5 + 2
            ));
        }
    }
    
    updateUI() {
        // No DOM manipulation - we're using canvas only
        // All UI is drawn in the drawGameUI method
    }
    
    resetGame() {
        // Reset to start screen
        this.gameState = 'start';
    }
    
    drawSettingsScreen() {
        this.drawSpaceBackground();
        
        // Draw title
        this.p.fill(255);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.textSize(40);
        this.p.text("SETTINGS", this.width / 2, 100);
        
        // Draw settings options
        const settingsY = 200;
        const settingsSpacing = 50;
        
        this.p.textSize(24);
        
        // Difficulty
        this.p.fill(255);
        this.p.text("Difficulty:", this.width / 2 - 100, settingsY);
        
        // Easy
        this.p.fill(this.difficulty === 'easy' ? '#00ff00' : '#aaaaaa');
        this.p.text("Easy", this.width / 2 + 50, settingsY);
        
        // Medium
        this.p.fill(this.difficulty === 'medium' ? '#00ff00' : '#aaaaaa');
        this.p.text("Medium", this.width / 2 + 120, settingsY);
        
        // Hard
        this.p.fill(this.difficulty === 'hard' ? '#00ff00' : '#aaaaaa');
        this.p.text("Hard", this.width / 2 + 190, settingsY);
        
        // Sound
        // ... add sound settings if needed
        
        // Back button
        this.p.fill(this.isMouseOverText("Back", this.width / 2, settingsY + settingsSpacing * 3) ? '#ff9900' : '#ff6600');
        this.p.text("Back", this.width / 2, settingsY + settingsSpacing * 3);
    }
    
    drawLeaderboardScreen() {
        this.drawSpaceBackground();
        
        // Draw title
        this.p.fill(255);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.textSize(40);
        this.p.text("LEADERBOARD", this.width / 2, 100);
        
        // Draw high scores
        const leaderboardY = 180;
        const leaderboardSpacing = 40;
        
        this.p.textSize(24);
        this.p.textAlign(this.p.CENTER, this.p.TOP);
        
        if (this.highScores.length === 0) {
            this.p.fill(200);
            this.p.text("No scores yet. Play a game!", this.width / 2, leaderboardY);
        } else {
            // Header
            this.p.fill(200);
            this.p.text("Rank", this.width / 2 - 150, leaderboardY);
            this.p.text("Score", this.width / 2, leaderboardY);
            this.p.text("Level", this.width / 2 + 150, leaderboardY);
            
            // Scores
            const sortedScores = [...this.highScores].sort((a, b) => b.score - a.score);
            const displayCount = Math.min(sortedScores.length, 5);
            
            for (let i = 0; i < displayCount; i++) {
                const score = sortedScores[i];
                const y = leaderboardY + leaderboardSpacing + i * leaderboardSpacing;
                
                // Rank
                this.p.fill(i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 200);
                this.p.text(`#${i + 1}`, this.width / 2 - 150, y);
                
                // Score
                this.p.text(score.score, this.width / 2, y);
                
                // Level
                this.p.text(score.level, this.width / 2 + 150, y);
            }
        }
        
        // Back button
        this.p.fill(this.isMouseOverText("Back", this.width / 2, leaderboardY + leaderboardSpacing * 7) ? '#ff9900' : '#ff6600');
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.text("Back", this.width / 2, leaderboardY + leaderboardSpacing * 7);
    }
    
    drawLoadTextScreen() {
        this.drawSpaceBackground();
        
        // Draw title
        this.p.fill(255);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.textSize(40);
        this.p.text("CUSTOM WORDS", this.width / 2, 100);
        
        // Instructions
        this.p.textSize(18);
        this.p.fill(200);
        this.p.text("Use a predefined set of typing-related words", this.width / 2, 150);
        
        // Text area (visual representation)
        this.p.fill(30);
        this.p.stroke(100);
        this.p.rect(this.width / 2 - 250, 180, 500, 150, 5);
        
        // Show sample words
        this.p.fill(150);
        this.p.textSize(14);
        this.p.text("keyboard, typing, speed, practice, improve...", this.width / 2, 255);
        
        // Load button
        const loadBtnHovered = this.isMouseOverText("Load", this.width / 2 - 100, 380);
        this.p.fill(loadBtnHovered ? '#ff9900' : '#ff6600');
        this.p.textSize(24);
        this.p.text("Load", this.width / 2 - 100, 380);
        
        // Back button
        const backBtnHovered = this.isMouseOverText("Back", this.width / 2 + 100, 380);
        this.p.fill(backBtnHovered ? '#ff9900' : '#ff6600');
        this.p.text("Back", this.width / 2 + 100, 380);
    }
    
    drawGameOverScreen() {
        // Draw space background
        this.drawSpaceBackground();
        
        // Semi-transparent overlay
        this.p.fill(0, 0, 0, 200);
        this.p.rect(0, 0, this.width, this.height);
        
        // Game over title with animation
        const pulseAmount = Math.sin(this.p.frameCount * 0.1) * 5;
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        
        // Title shadow
        this.p.fill(150, 0, 0, 150);
        this.p.textSize(60 + pulseAmount);
        this.p.text("GAME OVER", this.width / 2 + 3, 150 + 3);
        
        // Title
        this.p.fill(255, 50, 50);
        this.p.textSize(60 + pulseAmount);
        this.p.text("GAME OVER", this.width / 2, 150);
        
        // Show reason for game over
        this.p.fill(255);
        this.p.textSize(20);
        this.p.text(this.gameOverReason, this.width / 2, 210);
        
        // Show score
        this.p.fill(255);
        this.p.textSize(30);
        this.p.text(`SCORE: ${this.player.score}`, this.width / 2, 270);
        
        // Show level reached
        this.p.textSize(24);
        this.p.text(`LEVEL: ${this.player.level}`, this.width / 2, 320);
        
        // Show typing stats
        this.p.textSize(18);
        this.p.text(`Accuracy: ${this.typingAccuracy.toFixed(1)}%`, this.width / 2, 360);
        this.p.text(`Speed: ${this.typingSpeed.toFixed(1)} WPM`, this.width / 2, 390);
        
        // Check if it's a new high score
        const isNewHighScore = this.highScores.length > 0 && this.player.score >= this.highScores[0].score;
        
        if (isNewHighScore) {
            // New high score celebration
            const glowAmount = Math.sin(this.p.frameCount * 0.2) * 50 + 150;
            this.p.fill(255, 215, 0, glowAmount);
            this.p.textSize(36);
            this.p.text("NEW HIGH SCORE!", this.width / 2, 450);
        }
        
        // Motivational message
        const messages = [
            "You'll get them next time!",
            "Practice makes perfect!",
            "Keep typing, keep improving!",
            "Every keystroke makes you faster!",
            "Speed comes with practice!"
        ];
        const messageIndex = Math.floor(this.player.score / 100) % messages.length;
        
        this.p.fill(200, 200, 200);
        this.p.textSize(16);
        this.p.text(messages[messageIndex], this.width / 2, 480);
        
        // Restart button
        const restartBtnY = 520;
        const restartBtnHovered = this.p.mouseY > restartBtnY - 25 && this.p.mouseY < restartBtnY + 25 &&
                                 this.p.mouseX > this.width / 2 - 100 && this.p.mouseX < this.width / 2 + 100;
        
        this.p.fill(restartBtnHovered ? 0 : 20, restartBtnHovered ? 100 : 30, restartBtnHovered ? 150 : 50, 200);
        this.p.rect(this.width / 2 - 100, restartBtnY - 25, 200, 50, 5);
        
        this.p.fill(restartBtnHovered ? 255 : 200);
        this.p.textSize(restartBtnHovered ? 24 : 22);
        this.p.text("PLAY AGAIN", this.width / 2, restartBtnY);
        
        // Main menu button
        const menuBtnY = 590;
        const menuBtnHovered = this.p.mouseY > menuBtnY - 25 && this.p.mouseY < menuBtnY + 25 &&
                              this.p.mouseX > this.width / 2 - 100 && this.p.mouseX < this.width / 2 + 100;
        
        this.p.fill(menuBtnHovered ? 0 : 20, menuBtnHovered ? 100 : 30, menuBtnHovered ? 150 : 50, 200);
        this.p.rect(this.width / 2 - 100, menuBtnY - 25, 200, 50, 5);
        
        this.p.fill(menuBtnHovered ? 255 : 200);
        this.p.textSize(menuBtnHovered ? 24 : 22);
        this.p.text("MAIN MENU", this.width / 2, menuBtnY);
        
        // Share Score button
        // const shareBtnY = 660;
        // const shareBtnHovered = this.p.mouseY > shareBtnY - 25 && this.p.mouseY < shareBtnY + 25 &&
        //                        this.p.mouseX > this.width / 2 - 100 && this.p.mouseX < this.width / 2 + 100;
        
        // this.p.fill(shareBtnHovered ? 0 : 20, shareBtnHovered ? 100 : 30, shareBtnHovered ? 150 : 50, 200);
        // this.p.rect(this.width / 2 - 100, shareBtnY - 25, 200, 50, 5);
        
        // this.p.fill(shareBtnHovered ? 255 : 200);
        // this.p.textSize(shareBtnHovered ? 24 : 22);
        // this.p.text("SHARE SCORE", this.width / 2, shareBtnY);
    }
    
    handleMouseClick() {
        if (this.gameState === 'start') {
            // Check which menu option was clicked using the menuButtons array
            for (const button of this.menuButtons.start) {
                if (this.isMouseOverButton(button)) {
                    this.safePlaySound('menuSelect');
                    
                    switch (button.text) {
                        case "NEW GAME":
                            this.startGame();
                            break;
                        case "MY STATS":
                            this.gameState = 'myStats';
                            break;
                        case "LOAD YOUR OWN TEXT":
                            this.gameState = 'loadText';
                            this.showCustomTextArea();
                            break;
                    }
                    
                    return;
                }
            }
        } else if (this.gameState === 'settings') {
            const settingsY = 200;
            const settingsSpacing = 50;
            
            // Difficulty settings
            if (this.p.mouseY > settingsY - 15 && this.p.mouseY < settingsY + 15) {
                if (this.p.mouseX > this.width / 2 + 30 && this.p.mouseX < this.width / 2 + 70) {
                    this.safePlaySound('menuSelect');
                    this.setDifficulty('easy');
                } else if (this.p.mouseX > this.width / 2 + 100 && this.p.mouseX < this.width / 2 + 140) {
                    this.safePlaySound('menuSelect');
                    this.setDifficulty('medium');
                } else if (this.p.mouseX > this.width / 2 + 170 && this.p.mouseX < this.width / 2 + 210) {
                    this.safePlaySound('menuSelect');
                    this.setDifficulty('hard');
                }
            }
            
            // Back button
            if (this.isMouseOverText("Back", this.width / 2, settingsY + settingsSpacing * 3)) {
                this.safePlaySound('menuSelect');
                this.gameState = 'start';
            }
        } else if (this.gameState === 'leaderboard') {
            const leaderboardY = 180;
            const leaderboardSpacing = 40;
            
            // Back button
            if (this.isMouseOverText("Back", this.width / 2, leaderboardY + leaderboardSpacing * 7)) {
                this.safePlaySound('menuSelect');
                this.gameState = 'start';
            }
        } else if (this.gameState === 'loadText') {
            const textAreaRect = {
                x: this.width / 2 - 250,
                y: 180,
                width: 500,
                height: 150
            };
            
            // Check if text area was clicked
            if (
                this.p.mouseX > textAreaRect.x &&
                this.p.mouseX < textAreaRect.x + textAreaRect.width &&
                this.p.mouseY > textAreaRect.y &&
                this.p.mouseY < textAreaRect.y + textAreaRect.height
            ) {
                document.getElementById('custom-text-area').focus();
            }
            
            // Load button
            if (this.isMouseOverText("Load", this.width / 2 - 100, 380)) {
                this.safePlaySound('menuSelect');
                this.loadCustomText();
            }
            
            // Back button
            if (this.isMouseOverText("Back", this.width / 2 + 100, 380)) {
                this.safePlaySound('menuSelect');
                this.hideCustomTextArea();
                this.gameState = 'start';
            }
        } else if (this.gameState === 'gameOver') {
            // Play Again button
            const restartBtnY = 520;
            if (this.p.mouseY > restartBtnY - 25 && this.p.mouseY < restartBtnY + 25 &&
                this.p.mouseX > this.width / 2 - 100 && this.p.mouseX < this.width / 2 + 100) {
                this.safePlaySound('menuSelect');
                this.startGame();
                return;
            }
            
            // Main Menu button
            const menuBtnY = 590;
            if (this.p.mouseY > menuBtnY - 25 && this.p.mouseY < menuBtnY + 25 &&
                this.p.mouseX > this.width / 2 - 100 && this.p.mouseX < this.width / 2 + 100) {
                this.safePlaySound('menuSelect');
                this.gameState = 'start';
                return;
            }
            
            // Share Score button
            const shareBtnY = 660;
            if (this.p.mouseY > shareBtnY - 25 && this.p.mouseY < shareBtnY + 25 &&
                this.p.mouseX > this.width / 2 - 100 && this.p.mouseX < this.width / 2 + 100) {
                this.safePlaySound('menuSelect');
                this.shareScore();
                return;
            }
        } else if (this.gameState === 'playing' && this.isPaused) {
            // Check for resume button click
            const resumeBtnY = this.height / 2 + 100;
            if (this.p.mouseY > resumeBtnY - 25 && this.p.mouseY < resumeBtnY + 25 &&
                this.p.mouseX > this.width / 2 - 100 && this.p.mouseX < this.width / 2 + 100) {
                this.isPaused = false;
                if (this.sounds.unpause) {
                    this.safePlaySound('unpause');
                }
                return;
            }
            
            // Check for main menu button click
            const menuBtnY = this.height / 2 + 170;
            if (this.p.mouseY > menuBtnY - 25 && this.p.mouseY < menuBtnY + 25 &&
                this.p.mouseX > this.width / 2 - 100 && this.p.mouseX < this.width / 2 + 100) {
                this.gameState = 'start';
                this.isPaused = false;
                return;
            }
        }
    }
    
    // Helper method to check if mouse is over a button
    isMouseOverButton(button) {
        return (
            this.p.mouseX > button.x - button.width / 2 &&
            this.p.mouseX < button.x + button.width / 2 &&
            this.p.mouseY > button.y - button.height / 2 &&
            this.p.mouseY < button.y + button.height / 2
        );
    }
    
    showCustomTextArea() {
        this.showingCustomTextArea = true;
    }
    
    hideCustomTextArea() {
        this.showingCustomTextArea = false;
    }
    
    loadCustomText() {
        // In canvas mode, we'll use a predefined set of words
        // since we can't get text from a DOM element
        const sampleWords = [
            "keyboard", "typing", "speed", "practice", "improve",
            "skills", "words", "letters", "accuracy", "challenge",
            "game", "play", "score", "level", "enemy",
            "defeat", "bullet", "shoot", "target", "focus"
        ];
        
        this.customWords = sampleWords;
        this.hideCustomTextArea();
        this.startGame();
    }
    
    loseLife() {
        // Decrease lives
        this.lives--;
        
        // Play lose life sound
        this.safePlaySound('loseLife');
        
        // Add screen shake
        this.shakeAmount = 20;
        
        // Check if game over
        if (this.lives <= 0) {
            this.gameOverReason = "You ran out of lives!";
            this.endGame();
        }
    }
    
    createHitParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(
                x, 
                y, 
                Math.random() * 2 - 1, 
                Math.random() * 2 - 1, 
                5,
                [255, 255, 255],
                60
            ));
        }
    }
    
    createExplosionParticles(x, y) {
        // Play explosion sound
        this.safePlaySound('enemyDefeat');
        
        // Create explosion particles
        const colors = [
            [255, 100, 0],  // Orange
            [255, 200, 0],  // Yellow
            [255, 0, 0],    // Red
            [200, 200, 200] // White
        ];
        
        for (let i = 0; i < 30; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(
                x,
                y,
                Math.random() * 5 + 2,
                color,
                Math.random() * 3 + 1,
                Math.random() * Math.PI * 2,
                Math.random() * 5 + 3
            ));
        }
    }
    
    drawGameUI() {
        // Draw UI background at the top
        this.p.fill(0, 0, 0, 200);
        this.p.rect(0, 0, this.width, 50);
        
        // Draw score and level with high contrast
        this.p.fill(255);
        this.p.textAlign(this.p.LEFT, this.p.CENTER);
        this.p.textSize(20);
        this.p.text(`SCORE: ${this.player.score}`, 20, 25);
        
        // Draw level in center
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.text(`LEVEL: ${this.player.level}`, this.width/2, 25);
        
        // Draw lives on right
        this.p.textAlign(this.p.RIGHT, this.p.CENTER);
        this.p.text(`LIVES: ${this.lives}`, this.width - 20, 25);
        
        // If there's a current enemy, show its word at the bottom of the screen
        if (this.currentEnemy && !this.currentEnemy.isDefeated) {
            // Draw word background
            this.p.fill(0, 0, 0, 150);
            this.p.rect(this.width/2 - 150, this.height - 80, 300, 40);
            
            this.p.textAlign(this.p.CENTER, this.p.CENTER);
            this.p.textSize(24);
            
            // Highlight the first letter in green
            if (this.currentEnemy.word.length > 0) {
                const firstChar = this.currentEnemy.word.charAt(0);
                const restOfWord = this.currentEnemy.word.substring(1);
                
                // Calculate positions
                const totalWidth = this.p.textWidth(firstChar) + this.p.textWidth(restOfWord);
                const startX = this.width/2 - totalWidth/2;
                
                // Draw first letter in green
                this.p.fill(0, 255, 0);
                this.p.text(firstChar, startX + this.p.textWidth(firstChar)/2, this.height - 60);
                
                // Draw rest of word in white
                this.p.fill(255);
                this.p.text(restOfWord, startX + this.p.textWidth(firstChar) + this.p.textWidth(restOfWord)/2, this.height - 60);
            }
        }
    }
    
    drawPauseScreen() {
        // Semi-transparent overlay
        this.p.fill(0, 0, 0, 150);
        this.p.rect(0, 0, this.width, this.height);
        
        // Pause title
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.fill(255);
        this.p.textSize(60);
        this.p.text("PAUSED", this.width / 2, this.height / 2 - 50);
        
        // Instructions
        // this.p.textSize(24);
        // this.p.text("Press 'P' to resume", this.width / 2, this.height / 2 + 30);
        
        // Resume button
        const resumeBtnY = this.height / 2 + 100;
        const resumeBtnHovered = this.p.mouseY > resumeBtnY - 25 && this.p.mouseY < resumeBtnY + 25 &&
                                this.p.mouseX > this.width / 2 - 100 && this.p.mouseX < this.width / 2 + 100;
        
        this.p.fill(resumeBtnHovered ? 0 : 20, resumeBtnHovered ? 100 : 30, resumeBtnHovered ? 150 : 50, 200);
        this.p.rect(this.width / 2 - 100, resumeBtnY - 25, 200, 50, 5);
        
        this.p.fill(resumeBtnHovered ? 255 : 200);
        this.p.textSize(resumeBtnHovered ? 24 : 22);
        this.p.text("RESUME", this.width / 2, resumeBtnY);
        
        // Main menu button
        const menuBtnY = this.height / 2 + 170;
        const menuBtnHovered = this.p.mouseY > menuBtnY - 25 && this.p.mouseY < menuBtnY + 25 &&
                              this.p.mouseX > this.width / 2 - 100 && this.p.mouseX < this.width / 2 + 100;
        
        this.p.fill(menuBtnHovered ? 0 : 20, menuBtnHovered ? 100 : 30, menuBtnHovered ? 150 : 50, 200);
        this.p.rect(this.width / 2 - 100, menuBtnY - 25, 200, 50, 5);
        
        this.p.fill(menuBtnHovered ? 255 : 200);
        this.p.textSize(menuBtnHovered ? 24 : 22);
        this.p.text("MAIN MENU", this.width / 2, menuBtnY);
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.safePlaySound('pause');
        } else {
            this.safePlaySound('unpause');
        }
    }
    
    spawnPowerUp() {
        const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];
        const x = Math.random() * (this.width - 60) + 30;
        const y = -30;
        
        this.powerUps.push({
            x: x,
            y: y,
            type: type,
            size: 30,
            speed: 1 + Math.random(),
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            // Update position
            powerUp.y += powerUp.speed;
            powerUp.rotation += powerUp.rotationSpeed;
            
            // Check if off screen
            if (powerUp.y > this.height + powerUp.size) {
                this.powerUps.splice(i, 1);
                continue;
            }
            
            // Check for collision with player
            const dist = Math.sqrt(
                Math.pow(powerUp.x - this.player.x, 2) + 
                Math.pow(powerUp.y - this.player.y, 2)
            );
            
            if (dist < powerUp.size + this.player.size / 2) {
                // Activate power-up
                this.activatePowerUp(powerUp.type);
                
                // Create collection effect
                this.createPowerUpCollectEffect(powerUp.x, powerUp.y, powerUp.type);
                
                // Remove power-up
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    drawPowerUp(powerUp) {
        this.p.push();
        this.p.translate(powerUp.x, powerUp.y);
        this.p.rotate(powerUp.rotation);
        
        // Draw glow
        this.p.noStroke();
        
        switch (powerUp.type) {
            case 'rapidFire':
                this.p.fill(255, 100, 100, 100);
                break;
            case 'shield':
                this.p.fill(100, 100, 255, 100);
                break;
            case 'multiShot':
                this.p.fill(255, 255, 100, 100);
                break;
            case 'slowMotion':
                this.p.fill(100, 255, 255, 100);
                break;
        }
        
        this.p.ellipse(0, 0, powerUp.size * 1.5, powerUp.size * 1.5);
        
        // Draw power-up icon
        switch (powerUp.type) {
            case 'rapidFire':
                // Draw rapid fire icon (lightning bolt)
                this.p.fill(255, 100, 100);
                this.p.beginShape();
                this.p.vertex(-5, -15);
                this.p.vertex(5, -5);
                this.p.vertex(0, 0);
                this.p.vertex(10, 15);
                this.p.vertex(0, 5);
                this.p.vertex(-10, 15);
                this.p.endShape(this.p.CLOSE);
                break;
                
            case 'shield':
                // Draw shield icon
                this.p.fill(100, 100, 255);
                this.p.beginShape();
                this.p.vertex(0, -15);
                this.p.vertex(15, -5);
                this.p.vertex(10, 15);
                this.p.vertex(0, 10);
                this.p.vertex(-10, 15);
                this.p.vertex(-15, -5);
                this.p.endShape(this.p.CLOSE);
                break;
                
            case 'multiShot':
                // Draw multi-shot icon (three bullets)
                this.p.fill(255, 255, 100);
                this.p.rect(-10, -10, 5, 20, 2);
                this.p.rect(-2, -15, 5, 25, 2);
                this.p.rect(6, -10, 5, 20, 2);
                break;
                
            case 'slowMotion':
                // Draw slow motion icon (clock)
                this.p.fill(100, 255, 255);
                this.p.ellipse(0, 0, 20, 20);
                this.p.fill(0, 100, 100);
                this.p.ellipse(0, 0, 15, 15);
                this.p.stroke(100, 255, 255);
                this.p.strokeWeight(2);
                this.p.line(0, 0, 0, -7);
                this.p.line(0, 0, 7, 0);
                break;
        }
        
        this.p.pop();
    }
    
    activatePowerUp(type) {
        const duration = 600; // 10 seconds at 60fps
        
        switch (type) {
            case 'rapidFire':
                this.activePowerUps.rapidFire = duration;
                break;
            case 'shield':
                this.activePowerUps.shield = duration;
                this.player.health = this.player.maxHealth; // Restore health
                break;
            case 'multiShot':
                this.activePowerUps.multiShot = duration;
                break;
            case 'slowMotion':
                this.activePowerUps.slowMotion = duration;
                // Slow down all enemies
                for (const enemy of this.enemies) {
                    enemy.currentSpeed = enemy.baseSpeed * 0.5;
                }
                break;
        }
        
        // Play power-up sound
        // if (this.sounds.powerUp) {
        //     this.sounds.powerUp.play();
        // }
    }
    
    updateActivePowerUps() {
        // Update rapid fire
        if (this.activePowerUps.rapidFire > 0) {
            this.activePowerUps.rapidFire--;
        }
        
        // Update shield
        if (this.activePowerUps.shield > 0) {
            this.activePowerUps.shield--;
        }
        
        // Update multi-shot
        if (this.activePowerUps.multiShot > 0) {
            this.activePowerUps.multiShot--;
        }
        
        // Update slow motion
        if (this.activePowerUps.slowMotion > 0) {
            this.activePowerUps.slowMotion--;
            
            // If slow motion just ended, reset enemy speeds
            if (this.activePowerUps.slowMotion === 0) {
                for (const enemy of this.enemies) {
                    enemy.currentSpeed = enemy.baseSpeed;
                }
            }
        }
    }
    
    createPowerUpCollectEffect(x, y, type) {
        // Create particles based on power-up type
        let color;
        
        switch (type) {
            case 'rapidFire':
                color = [255, 100, 100];
                break;
            case 'shield':
                color = [100, 100, 255];
                break;
            case 'multiShot':
                color = [255, 255, 100];
                break;
            case 'slowMotion':
                color = [100, 255, 255];
                break;
        }
        
        // Create particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const size = Math.random() * 10 + 5;
            
            this.particles.push(new Particle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                size,
                color,
                60
            ));
        }
    }
    
    // Add a dedicated method to select a new enemy
    selectNewCurrentEnemy() {
        
        // Clear current enemy first
        if (this.currentEnemy) {
            this.currentEnemy.isActive = false;
            this.currentEnemy = null;
        }
        
        // Find a new enemy that's not defeated
        for (const enemy of this.enemies) {
            if (!enemy.isDefeated) {
                this.currentEnemy = enemy;
                this.currentEnemy.isActive = true;
                break;
            }
        }
    }
    
    // New method to draw stars
    drawStars() {
        for (const star of this.stars) {
            this.p.fill(star.color[0], star.color[1], star.color[2]);
            this.p.ellipse(star.x, star.y, star.size, star.size);
        }
    }
    
    // New method to draw game elements
    drawGameElements() {
        // Draw bullets
        for (const bullet of this.bullets) {
            bullet.draw(this.p);
        }
        
        // Draw enemies
        for (const enemy of this.enemies) {
            enemy.draw(this.p);
        }
        
        // Draw particles
        for (const particle of this.particles) {
            particle.draw(this.p);
        }
        
        // CRITICAL: Draw player LAST so it's on top of everything
        this.player.draw(this.p);
    }
    
    // New method for debug info
    drawDebugInfo() {
        this.p.fill(255, 255, 0);
        this.p.textAlign(this.p.RIGHT, this.p.BOTTOM);
        this.p.textSize(12);
        this.p.text(`Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`, this.width - 10, this.height - 70);
    }
    
    // Method to share score on social media
    shareScore() {
        const text = `I scored ${this.player.score} points and reached level ${this.player.level} in KEYSTRIKES typing game! Can you beat my score?`;
        const url = window.location.href;
        
        // Try to use Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'KEYSTRIKES - My Score',
                text: text,
                url: url
            }).catch(error => {
                console.log('Error sharing:', error);
                this.fallbackShare(text, url);
            });
        } else {
            this.fallbackShare(text, url);
        }
    }
    
    // Fallback method for sharing
    fallbackShare(text, url) {
        // Create a temporary input to copy the text
        const input = document.createElement('textarea');
        input.value = `${text} ${url}`;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        
        // Alert the user
        alert('Score copied to clipboard! Share it with your friends.');
    }
    
    // Add a safe method to play sounds
    safePlaySound(soundKey) {
        try {
            if (this.sounds[soundKey] && typeof this.sounds[soundKey].play === 'function') {
                // Try to play the sound, but don't crash if it fails
                try {
                    return this.sounds[soundKey].play();
                } catch (playError) {
                    console.error(`Error playing sound ${soundKey}:`, playError);
                    return null;
                }
            } else {
                // Sound not loaded or not a function
                console.warn(`Sound ${soundKey} not available or not playable`);
                return null;
            }
        } catch (e) {
            console.error(`Error accessing sound ${soundKey}:`, e);
            return null;
        }
    }
    
    drawMyStatsScreen() {
        // Draw space background
        this.drawSpaceBackground();
        
        // Draw title
        this.p.textFont('Orbitron');
        this.p.textSize(40);
        this.p.fill(0, 200, 255);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.text("MY STATS", this.width / 2, 100);
        
        // Get stats from local storage
        let highScore = localStorage.getItem('keystrikesHighScore') || 0;
        let gamesPlayed = localStorage.getItem('keystrikesGamesPlayed') || 0;
        let totalEnemiesDefeated = localStorage.getItem('keystrikesTotalEnemiesDefeated') || 0;
        let bestAccuracy = localStorage.getItem('keystrikesHighestAccuracy') || 0;
        let bestWPM = localStorage.getItem('keystrikesHighestWPM') || 0;
        
        // Draw stats
        this.p.textSize(24);
        this.p.fill(255);
        this.p.textAlign(this.p.LEFT, this.p.CENTER);
        
        const statsX = this.width / 2 - 200;
        const statsStartY = 200;
        const lineHeight = 50;
        
        this.p.text("High Score:", statsX, statsStartY);
        this.p.text("Games Played:", statsX, statsStartY + lineHeight);
        this.p.text("Enemies Defeated:", statsX, statsStartY + lineHeight * 2);
        this.p.text("Best Accuracy:", statsX, statsStartY + lineHeight * 3);
        this.p.text("Best WPM:", statsX, statsStartY + lineHeight * 4);
        
        // Draw values
        this.p.textAlign(this.p.RIGHT, this.p.CENTER);
        this.p.fill(0, 255, 0);
        
        const valuesX = this.width / 2 + 200;
        this.p.text(highScore, valuesX, statsStartY);
        this.p.text(gamesPlayed, valuesX, statsStartY + lineHeight);
        this.p.text(totalEnemiesDefeated, valuesX, statsStartY + lineHeight * 2);
        this.p.text(bestAccuracy + "%", valuesX, statsStartY + lineHeight * 3);
        this.p.text(bestWPM + " WPM", valuesX, statsStartY + lineHeight * 4);
        
        // Back button
        this.p.textSize(20);
        this.p.fill(200);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        
        const backButton = { text: "BACK", x: this.width / 2, y: this.height - 100, width: 200, height: 40 };
        const isHovered = this.isMouseOverButton(backButton);
        
        // Draw button background
        this.p.fill(isHovered ? 0 : 20, isHovered ? 150 : 50, isHovered ? 255 : 100);
        this.p.rect(backButton.x - backButton.width / 2, backButton.y - backButton.height / 2, 
                   backButton.width, backButton.height, 5);
        
        // Draw button text
        this.p.fill(255);
        this.p.text(backButton.text, backButton.x, backButton.y);
        
        // Handle back button click
        if (isHovered && this.p.mouseIsPressed) {
            this.gameState = 'start';
            this.safePlaySound('menuSelect');
        }
    }
} 