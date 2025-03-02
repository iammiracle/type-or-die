// Global game instance
let game;

// p5.js sketch
const sketch = (p) => {
    p.setup = function() {
        // Create canvas with full screen dimensions
        const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        canvas.parent('game-canvas');
        
        // Initialize game
        game = new Game(p);
        
        // Preload game assets
        game.preload();
        
        // Set frame rate to ensure smooth gameplay
        p.frameRate(60);
    };
    
    p.draw = function() {
        // Clear the canvas each frame
        p.background(0);
        
        // Update and draw game
        game.update();
        game.draw();
    };
    
    // Handle keyboard input directly
    p.keyTyped = function() {
        if (game.gameState === 'playing') {
            // Only process alphabetic keys and space for typing
            if (/^[a-zA-Z ]$/.test(p.key) && !game.isPaused) {
                game.handleTyping(p.key);
            }
        }
        
        // Prevent default behavior
        return false;
    };
    
    // Handle special keys with keyPressed
    p.keyPressed = function() {
        // Handle ESC key for pause/menu
        if (p.keyCode === 27) { // ESC key
            if (game.gameState === 'playing') {
                if (game.isPaused) {
                    // If already paused, return to main menu
                    game.gameState = 'start';
                    game.isPaused = false;
                } else {
                    // If not paused, pause the game
                    game.togglePause();
                }
                return false;
            }
        }
        
        return true;
    };
    
    // Handle mouse clicks
    p.mouseClicked = function() {
        game.handleMouseClick();
        return false;
    };
    
    // Handle window resize
    p.windowResized = function() {
        // Adjust canvas to full screen
        p.resizeCanvas(window.innerWidth, window.innerHeight);
        
        // Update game dimensions
        if (game) {
            game.width = window.innerWidth;
            game.height = window.innerHeight;
            
            // Reposition player higher on the screen
            if (game.player) {
                game.player.x = game.width / 2;
                game.player.y = game.height - 100; // Higher position
            }
        }
    };
};

// Create p5 instance
new p5(sketch);

// Set up event listeners for buttons
function setupEventListeners() {
    // No need for button event listeners as we're handling everything in p5
}

// Prevent context menu on right-click
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
}); 