class Player {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size; // Reduced size
        this.health = 100;
        this.maxHealth = 100;
        this.score = 0;
        this.level = 1;
        this.isAttacking = false;
        this.attackFrame = 0;
        this.attackDuration = 15;
    }

    draw(p) {
        // ULTRA-VISIBLE PLAYER DESIGN
        
        // Draw beacon around player for maximum visibility
        p.fill(0, 200, 255, 30);
        p.ellipse(this.x, this.y, this.size * 4, this.size * 4);
        
        // Strong outer glow
        p.fill(0, 200, 255, 60);
        p.ellipse(this.x, this.y, this.size * 3, this.size * 3);
        
        // Inner glow
        p.fill(0, 150, 255, 100);
        p.ellipse(this.x, this.y, this.size * 2, this.size * 2);
        
        // Draw ship body - BRIGHT WHITE TRIANGLE
        p.fill(255, 255, 255);
        p.triangle(
            this.x, this.y - this.size,           // Top point
            this.x - this.size * 0.7, this.y + this.size * 0.4, // Bottom left
            this.x + this.size * 0.7, this.y + this.size * 0.4  // Bottom right
        );
        
        // Draw colored overlay - BRIGHT BLUE
        p.fill(50, 220, 255, 230);
        p.triangle(
            this.x, this.y - this.size * 0.8,           // Top point
            this.x - this.size * 0.6, this.y + this.size * 0.3, // Bottom left
            this.x + this.size * 0.6, this.y + this.size * 0.3  // Bottom right
        );
        
        // Draw cockpit - BRIGHT WHITE
        p.fill(255, 255, 255);
        p.ellipse(this.x, this.y - this.size * 0.2, this.size * 0.4, this.size * 0.4);
        
        // Draw thrusters with animation - BRIGHTER FLAMES
        const flameHeight = Math.sin(p.frameCount * 0.2) * 5 + 15;
        
        // Left thruster
        p.fill(255, 180, 0);
        p.rect(this.x - this.size * 0.5, this.y + this.size * 0.4, this.size * 0.2, this.size * 0.15);
        p.fill(255, 150, 0, 230);
        p.triangle(
            this.x - this.size * 0.5, this.y + this.size * 0.55,
            this.x - this.size * 0.4, this.y + this.size * 0.55 + flameHeight,
            this.x - this.size * 0.3, this.y + this.size * 0.55
        );
        
        // Right thruster
        p.fill(255, 180, 0);
        p.rect(this.x + this.size * 0.3, this.y + this.size * 0.4, this.size * 0.2, this.size * 0.15);
        p.fill(255, 150, 0, 230);
        p.triangle(
            this.x + this.size * 0.3, this.y + this.size * 0.55,
            this.x + this.size * 0.4, this.y + this.size * 0.55 + flameHeight,
            this.x + this.size * 0.5, this.y + this.size * 0.55
        );
        
        // Add a strong white outline
        p.stroke(255);
        p.strokeWeight(2.5);
        p.noFill();
        p.triangle(
            this.x, this.y - this.size,
            this.x - this.size * 0.7, this.y + this.size * 0.4,
            this.x + this.size * 0.7, this.y + this.size * 0.4
        );
        p.noStroke();
        
        // Draw attack animation if attacking
        if (this.isAttacking) {
            this.drawAttack(p);
            this.attackFrame++;
            if (this.attackFrame >= this.attackDuration) {
                this.isAttacking = false;
                this.attackFrame = 0;
            }
        }
    }

    drawAttack(p) {
        // Attack animation - muzzle flash from top of ship
        const progress = this.attackFrame / this.attackDuration;
        const size = this.size * (1 - progress);
        
        p.fill(0, 255, 0, 150 * (1 - progress));
        p.ellipse(this.x, this.y - this.size, size, size);
    }
    
    attack() {
        this.isAttacking = true;
        this.attackFrame = 0;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }
        return this.health <= 0; // Return true if player is defeated
    }
    
    heal(amount) {
        this.health += amount;
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
    }
    
    addScore(points) {
        this.score += points;
    }
    
    levelUp() {
        this.level++;
        // Heal player a bit when leveling up
        this.heal(20);
    }
    
    reset() {
        this.health = this.maxHealth;
        this.score = 0;
        this.level = 1;
        this.isAttacking = false;
    }
} 