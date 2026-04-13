// ==================== SHARED UTILITIES ====================
let isDarkTheme = true;

function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggle').textContent = '☀️';
        document.querySelector('meta[name="theme-color"]').setAttribute('content', '#1a1a2e');
    } else {
        document.body.classList.remove('dark-theme');
        document.getElementById('themeToggle').textContent = '🌙';
        document.querySelector('meta[name="theme-color"]').setAttribute('content', '#667eea');
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showScreen(screenId) {
    document.querySelectorAll('.main-screen, .start-screen, .game-screen, .result-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function goToMain() {
    showScreen('mainScreen');
}

function selectTrainer(task) {
    if (task === 'task9') {
        showScreen('task9StartScreen');
        if (typeof updateTask9PracticeButton === 'function') updateTask9PracticeButton();
    } else if (task === 'task10') {
        showScreen('task10StartScreen');
        if (typeof updateTask10PracticeButton === 'function') updateTask10PracticeButton();
    } else if (task === 'task4') {
        showScreen('task4StartScreen');
        if (typeof updateTask4PracticeButton === 'function') updateTask4PracticeButton();
    }
}
