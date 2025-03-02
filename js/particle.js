class Particle {
    constructor(x, y, speed, angle, size, color, life) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.angle = angle;
        this.size = size;
        this.originalSize = size;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.gravity = 0.05;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }
    
    update() {
        this.x += this.vx;
        this.vy += this.gravity;
        this.y += this.vy;
        this.life--;
        this.size = this.originalSize * (this.life / this.maxLife);
    }
    
    draw(p) {
        const alpha = p.map(this.life, 0, this.maxLife, 0, 255);
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.noStroke();
        p.ellipse(this.x, this.y, this.size, this.size);
    }
} 