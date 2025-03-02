class Enemy {
    constructor(word, x, y, speed, size, isBoss = false, type = 0) {
        this.originalWord = word;
        this.word = word;
        this.x = x;
        this.y = y;
        this.baseSpeed = speed;
        this.currentSpeed = speed;
        this.size = size;
        this.health = word.length * 10;
        this.maxHealth = this.health;
        this.damage = 1;
        this.isBoss = isBoss;
        this.isActive = false;
        this.isDefeated = false;
        this.hitEffects = [];
        this.type = type;
        this.explosionParticles = [];
        this.explosionTimer = 0;
        this.fadeAmount = 255; // For smooth fading when defeated
        
        // Visual properties
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        
        // Generate colors based on type - brighter for visibility
        switch(this.type) {
            case 0: // Red enemy
                this.primaryColor = [255, 80, 80];
                this.secondaryColor = [200, 40, 40];
                this.accentColor = [255, 200, 200];
                break;
            case 1: // Green enemy
                this.primaryColor = [80, 255, 80];
                this.secondaryColor = [40, 200, 40];
                this.accentColor = [200, 255, 200];
                break;
            case 2: // Blue enemy
                this.primaryColor = [80, 150, 255];
                this.secondaryColor = [40, 100, 200];
                this.accentColor = [200, 220, 255];
                break;
            case 3: // Purple enemy
                this.primaryColor = [200, 80, 255];
                this.secondaryColor = [150, 40, 200];
                this.accentColor = [255, 200, 255];
                break;
        }
    }

    update() {
        // Only move if not defeated
        if (!this.isDefeated) {
            // Move enemy down
            this.y += this.currentSpeed;
            
            // Rotate enemy
            this.rotation += this.rotationSpeed;
        } else {
            // If defeated, handle explosion animation
            this.explosionTimer++;
            this.fadeAmount = Math.max(0, this.fadeAmount - 5); // Smooth fade out
        }
        
        // Update hit effects
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            this.hitEffects[i].life -= 5;
            if (this.hitEffects[i].life <= 0) {
                this.hitEffects.splice(i, 1);
            }
        }
    }

    draw(p) {
        // Even if defeated, still draw the enemy but with a fading effect
        if (this.isDefeated) {
            p.push();
            p.translate(this.x, this.y);
            p.rotate(this.rotation);
            
            // Draw fading enemy
            p.fill(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2], this.fadeAmount);
            
            switch(this.type) {
                case 0: // Circle
                    p.ellipse(0, 0, this.size, this.size);
                    break;
                case 1: // Square
                    p.rect(-this.size/2, -this.size/2, this.size, this.size);
                    break;
                case 2: // Triangle
                    p.triangle(0, -this.size/2, -this.size/2, this.size/2, this.size/2, this.size/2);
                    break;
                case 3: // Diamond
                    p.quad(0, -this.size/2, this.size/2, 0, 0, this.size/2, -this.size/2, 0);
                    break;
            }
            
            p.pop();
            
            // Draw explosion particles
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * this.size/2;
                const particleSize = Math.random() * 10 + 5;
                
                p.fill(
                    255, 
                    150 + Math.random() * 100, 
                    Math.random() * 100,
                    this.fadeAmount
                );
                
                p.ellipse(
                    this.x + Math.cos(angle) * distance,
                    this.y + Math.sin(angle) * distance,
                    particleSize,
                    particleSize
                );
            }
            
            return;
        }
        
        // Save the current transformation state
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);
        
        // Draw outer glow for better visibility
        p.fill(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2], 50);
        
        switch(this.type) {
            case 0: // Circle
                p.ellipse(0, 0, this.size * 1.3, this.size * 1.3);
                break;
            case 1: // Square
                p.rect(-this.size * 0.65, -this.size * 0.65, this.size * 1.3, this.size * 1.3);
                break;
            case 2: // Triangle
                p.triangle(0, -this.size * 0.65, -this.size * 0.65, this.size * 0.65, this.size * 0.65, this.size * 0.65);
                break;
            case 3: // Diamond
                p.quad(0, -this.size * 0.65, this.size * 0.65, 0, 0, this.size * 0.65, -this.size * 0.65, 0);
                break;
        }
        
        // Draw enemy based on type
        p.fill(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        
        switch(this.type) {
            case 0: // Circle
                p.ellipse(0, 0, this.size, this.size);
                break;
            case 1: // Square
                p.rect(-this.size/2, -this.size/2, this.size, this.size);
                break;
            case 2: // Triangle
                p.triangle(0, -this.size/2, -this.size/2, this.size/2, this.size/2, this.size/2);
                break;
            case 3: // Diamond
                p.quad(0, -this.size/2, this.size/2, 0, 0, this.size/2, -this.size/2, 0);
                break;
        }
        
        // Draw inner details
        p.fill(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
        p.ellipse(0, 0, this.size * 0.6, this.size * 0.6);
        
        // Draw center
        p.fill(this.accentColor[0], this.accentColor[1], this.accentColor[2]);
        p.ellipse(0, 0, this.size * 0.3, this.size * 0.3);
        
        p.pop();

        // Draw health bar
        const healthBarWidth = this.size * 1.2;
        const healthBarHeight = 6; // Thicker for visibility
        p.fill(200, 50, 50);
        p.rect(this.x - healthBarWidth / 2, this.y - this.size / 2 - 15, healthBarWidth, healthBarHeight);
        p.fill(50, 200, 50);
        p.rect(
            this.x - healthBarWidth / 2,
            this.y - this.size / 2 - 15,
            healthBarWidth * (this.health / this.maxHealth),
            healthBarHeight
        );

        // Draw word above enemy with better visibility
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(18); // Larger text
        
        // Add text shadow for better visibility
        p.fill(0, 0, 0);
        p.text(this.word, this.x + 1, this.y - this.size / 2 - 25 + 1);
        
        // If this is the active enemy, highlight the word
        if (this.isActive) {
            // Draw a background for the text for better visibility
            p.fill(0, 0, 0, 150);
            p.rect(this.x - p.textWidth(this.word)/2 - 5, this.y - this.size / 2 - 40, p.textWidth(this.word) + 10, 30);
            
            p.fill(255, 255, 0); // Yellow for active enemy
        } else {
            p.fill(255); // White for inactive enemies
        }
        
        p.text(this.word, this.x, this.y - this.size / 2 - 25);
        
        // Draw target indicator if active
        if (this.isActive) {
            p.push();
            p.noFill();
            p.stroke(255, 255, 0);
            p.strokeWeight(2);
            
            // Animated target indicator
            const targetPulse = Math.sin(p.frameCount * 0.1) * 5 + 10;
            p.ellipse(this.x, this.y, this.size + targetPulse, this.size + targetPulse);
            
            p.pop();
        }
        
        // Draw hit effects
        for (const effect of this.hitEffects) {
            p.fill(255, 255, 0, effect.life * 2);
            p.ellipse(this.x + effect.x, this.y + effect.y, effect.size, effect.size);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        
        // Create hit effect
        this.hitEffects.push({
            x: (Math.random() - 0.5) * this.size * 0.8,
            y: (Math.random() - 0.5) * this.size * 0.8,
            size: Math.random() * 10 + 10,
            life: 100
        });
    }

    setActive(isActive) {
        this.isActive = isActive;
    }

    increaseSpeed(amount) {
        this.currentSpeed += amount;
    }

    resetSpeed() {
        this.currentSpeed = this.baseSpeed;
    }

    isOffScreen(height) {
        return this.y > height;
    }

    createExplosion() {
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            const size = Math.random() * 10 + 5;
            const life = 100;
            
            this.explosionParticles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: [
                    this.primaryColor[0],
                    this.primaryColor[1],
                    this.primaryColor[2]
                ],
                life: life
            });
        }
    }
} 