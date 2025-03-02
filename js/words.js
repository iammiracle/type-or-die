// Word lists for different difficulty levels
const WORDS = {
    easy: [
        "cat", "dog", "run", "jump", "play", "fast", "slow", "big", "small", "red",
        "blue", "green", "happy", "sad", "hot", "cold", "sun", "moon", "star", "sky",
        "tree", "fish", "bird", "book", "game", "ball", "car", "home", "food", "water"
    ],
    
    medium: [
        "computer", "keyboard", "monitor", "program", "coding", "function", "variable", "algorithm",
        "database", "network", "internet", "software", "hardware", "developer", "application",
        "challenge", "solution", "problem", "creative", "design", "graphics", "animation",
        "interface", "experience", "technology", "innovation", "digital", "virtual", "system", "platform"
    ],
    
    hard: [
        "extraordinary", "sophisticated", "implementation", "authentication", "visualization",
        "infrastructure", "communication", "collaboration", "productivity", "development",
        "optimization", "functionality", "accessibility", "compatibility", "reliability",
        "architecture", "intelligence", "recognition", "performance", "integration",
        "configuration", "maintenance", "encryption", "decryption", "synchronization",
        "parallelism", "concurrency", "distributed", "microservice", "containerization"
    ],
    
    // Boss battle sentences
    bossSentences: [
        "The quick brown fox jumps over the lazy dog.",
        "Programming is the art of telling another human what one wants the computer to do.",
        "Debugging is twice as hard as writing the code in the first place.",
        "The best way to predict the future is to invent it.",
        "Code is like humor. When you have to explain it, it's bad."
    ]
};

// Function to get a random word based on difficulty
function getRandomWord(difficulty) {
    const wordList = WORDS[difficulty];
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
}

// Function to get a random boss sentence
function getRandomBossSentence() {
    const randomIndex = Math.floor(Math.random() * WORDS.bossSentences.length);
    return WORDS.bossSentences[randomIndex];
} 