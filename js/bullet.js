class Bullet {
    constructor(x, y, targetEnemy) {
        this.x = x;
        this.y = y;
        this.targetEnemy = targetEnemy;
        this.size = 20;
        this.damage = 10;
        
        // Calculate direction to target
        const dx = targetEnemy.x - x;
        const dy = targetEnemy.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize and set velocity
        const speed = 12;
        this.velX = (dx / dist) * speed;
        this.velY = (dy / dist) * speed;
        
        // Calculate rotation based on velocity
        this.rotation = Math.atan2(this.velY, this.velX) + Math.PI/2;
        
        // Get the first letter of the target's original word for display
        this.letter = targetEnemy.originalWord.charAt(0);
        
        // Add trail effect
        this.trail = [];
        for (let i = 0; i < 5; i++) {
            this.trail.push({
                x: this.x - this.velX * i * 0.5,
                y: this.y - this.velY * i * 0.5
            });
        }
    }
    
    update() {
        // Update trail positions
        for (let i = this.trail.length - 1; i > 0; i--) {
            this.trail[i].x = this.trail[i-1].x;
            this.trail[i].y = this.trail[i-1].y;
        }
        this.trail[0].x = this.x;
        this.trail[0].y = this.y;
        
        // Move bullet according to velocity
        this.x += this.velX;
        this.y += this.velY;
        
        // If we have a target enemy and it's not defeated, update direction to follow it
        if (this.targetEnemy && !this.targetEnemy.isDefeated) {
            // Calculate direction to enemy
            const dx = this.targetEnemy.x - this.x;
            const dy = this.targetEnemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Stronger homing effect
            const speed = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
            const dirX = dx / dist;
            const dirY = dy / dist;
            
            // Blend current direction with target direction (homing effect)
            this.velX = this.velX * 0.8 + dirX * speed * 0.2;
            this.velY = this.velY * 0.8 + dirY * speed * 0.2;
            
            // Normalize to maintain constant speed
            const newSpeed = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
            this.velX = (this.velX / newSpeed) * speed;
            this.velY = (this.velY / newSpeed) * speed;
            
            // Update rotation
            this.rotation = Math.atan2(this.velY, this.velX) + Math.PI/2;
        }
    }
    
    draw(p) {
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 150 * (1 - i / this.trail.length);
            p.fill(0, 255, 0, alpha);
            p.ellipse(this.trail[i].x, this.trail[i].y, this.size * 0.7 * (1 - i / this.trail.length), this.size * 0.7 * (1 - i / this.trail.length));
        }
        
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);
        
        // Draw bullet glow
        p.fill(0, 255, 0, 100);
        p.ellipse(0, 0, this.size * 1.8, this.size * 1.8);
        
        // Draw bullet body
        p.fill(0, 255, 0);
        p.beginShape();
        p.vertex(0, -this.size/2);
        p.vertex(-this.size/3, this.size/2);
        p.vertex(this.size/3, this.size/2);
        p.endShape(p.CLOSE);
        
        // Draw letter with better visibility
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(this.size * 0.8);
        p.textStyle(p.BOLD);
        p.text(this.letter, 0, 0);
        
        p.pop();
    }
} 