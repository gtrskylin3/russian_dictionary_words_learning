// ==================== TASK 10 (PRE/PRI) ====================
let task10Database = [];
let task10GameWords = [];
let task10CurrentIndex = 0;
let task10CorrectAnswers = 0;
let task10IncorrectAnswers = 0;
let task10Answered = false;
let task10SelectedMode = 20;
let task10ErrorHistory = [];
let task10IsErrorPractice = false;

async function loadTask10Database() {
    try {
        const response = await fetch('data_10.txt');
        if (!response.ok) throw new Error('Failed to load data_10.txt');
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');

        task10Database = lines.map(line => {
            const [correctWord, patternWithHint] = line.split('=');
            const trimmedWord = correctWord.trim();
            let trimmedPattern = patternWithHint.trim();
            let hint = '';

            const hintMatch = trimmedPattern.match(/^(.+?)\s*\((.+?)\)$/);
            if (hintMatch) {
                trimmedPattern = hintMatch[1].trim();
                hint = hintMatch[2].trim();
            }

            // Find the underscore position (this is where the vowel is missing)
            const underscoreIndex = trimmedPattern.indexOf('_');
            
            // The correct letter is either 'е' or 'и' at the underscore position
            const correctLetter = trimmedWord[underscoreIndex];

            return { 
                word: trimmedWord, 
                pattern: trimmedPattern,
                underscoreIndex,
                correctLetter,
                hint 
            };
        }).filter(entry => entry.correctLetter === 'е' || entry.correctLetter === 'и');

        console.log('Loaded', task10Database.length, 'words for Task 10');
    } catch (error) {
        console.error('Error loading Task 10 database:', error);
        task10Database = [];
    }
}

function loadTask10Errors() {
    try {
        const saved = localStorage.getItem('task10Errors');
        if (saved) task10ErrorHistory = JSON.parse(saved);
    } catch (e) {
        task10ErrorHistory = [];
    }
}

function saveTask10Errors() {
    try {
        localStorage.setItem('task10Errors', JSON.stringify(task10ErrorHistory));
    } catch (e) {
        console.error('Failed to save Task 10 errors:', e);
    }
}

function selectTask10Mode(btn) {
    document.querySelectorAll('#task10StartScreen .mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    task10SelectedMode = parseInt(btn.dataset.mode);
}

async function startTask10Game() {
    const startBtn = document.getElementById('task10StartBtn');
    const loadingMsg = document.getElementById('task10LoadingMessage');

    if (task10Database.length === 0) {
        startBtn.disabled = true;
        loadingMsg.style.display = 'block';
        await loadTask10Database();
        startBtn.disabled = false;
        loadingMsg.style.display = 'none';
    }

    if (task10Database.length === 0) {
        alert('Не удалось загрузить словарь. Проверьте наличие файла data_10.txt');
        return;
    }

    task10IsErrorPractice = false;

    if (task10SelectedMode === 0) {
        task10GameWords = shuffleArray([...task10Database]);
    } else {
        task10GameWords = shuffleArray([...task10Database]).slice(0, task10SelectedMode);
    }

    task10CurrentIndex = 0;
    task10CorrectAnswers = 0;
    task10IncorrectAnswers = 0;
    task10Answered = false;

    document.getElementById('task10TotalQuestions').textContent = task10GameWords.length;
    document.getElementById('task10CorrectCount').textContent = '0';
    document.getElementById('task10IncorrectCount').textContent = '0';

    showScreen('task10GameScreen');
    displayTask10Word();
}

function displayTask10Word() {
    task10Answered = false;
    const entry = task10GameWords[task10CurrentIndex];
    const pattern = entry.pattern;
    const hint = entry.hint;

    document.getElementById('task10CurrentQuestion').textContent = task10CurrentIndex + 1;
    
    // Display the word with underscore highlighted
    document.getElementById('task10WordDisplay').innerHTML = pattern.replace('_', '<span class="missing-letter">_</span>');

    const hintElement = document.getElementById('task10WordHint');
    hintElement.textContent = hint ? '(' + hint + ')' : '';

    document.getElementById('task10Feedback').textContent = '';
    document.getElementById('task10Feedback').className = 'feedback';
    document.getElementById('task10NextBtn').style.display = 'none';

    // Enable and reset PRE/PRI buttons
    const preBtn = document.getElementById('task10PreBtn');
    const priBtn = document.getElementById('task10PriBtn');
    preBtn.disabled = false;
    priBtn.disabled = false;
    preBtn.className = 'pre-pri-btn';
    priBtn.className = 'pre-pri-btn';

    const progress = ((task10CurrentIndex) / task10GameWords.length) * 100;
    document.getElementById('task10ProgressFill').style.width = progress + '%';

    // Store correct letter for checking
    preBtn.dataset.correctLetter = entry.correctLetter;
    priBtn.dataset.correctLetter = entry.correctLetter;
    document.getElementById('task10NextBtn').dataset.fullWord = entry.word;
}

function checkTask10Answer(userChoice) {
    if (task10Answered) return;

    task10Answered = true;
    const preBtn = document.getElementById('task10PreBtn');
    const priBtn = document.getElementById('task10PriBtn');
    const correctLetter = preBtn.dataset.correctLetter.toLowerCase();
    const fullWord = document.getElementById('task10NextBtn').dataset.fullWord;

    const isCorrect = userChoice === correctLetter;

    // Disable both buttons
    preBtn.disabled = true;
    priBtn.disabled = true;

    if (isCorrect) {
        task10CorrectAnswers++;
        
        // Highlight the chosen correct button
        if (userChoice === 'е') {
            preBtn.classList.add('correct');
        } else {
            priBtn.classList.add('correct');
        }
        
        document.getElementById('task10Feedback').textContent = '✅ Правильно!';
        document.getElementById('task10Feedback').className = 'feedback correct';

        if (task10IsErrorPractice) {
            const errorIndex = task10ErrorHistory.findIndex(e => e.word === fullWord);
            if (errorIndex >= 0) {
                task10ErrorHistory.splice(errorIndex, 1);
                saveTask10Errors();
            }
        }
    } else {
        task10IncorrectAnswers++;
        
        // Highlight the chosen wrong button
        if (userChoice === 'е') {
            preBtn.classList.add('incorrect');
        } else {
            priBtn.classList.add('incorrect');
        }

        // Highlight the correct button
        if (correctLetter === 'е') {
            preBtn.classList.add('correct-highlight');
        } else {
            priBtn.classList.add('correct-highlight');
        }

        const correctWord_display = fullWord;
        document.getElementById('task10Feedback').textContent = '❌ Неправильно! Правильно: ' + correctWord_display.toUpperCase();
        document.getElementById('task10Feedback').className = 'feedback incorrect';

        const existingIndex = task10ErrorHistory.findIndex(e => e.word === fullWord);
        if (existingIndex >= 0) {
            task10ErrorHistory[existingIndex].count = (task10ErrorHistory[existingIndex].count || 1) + 1;
            task10ErrorHistory[existingIndex].lastError = Date.now();
            task10ErrorHistory[existingIndex].userAnswer = userChoice;
        } else {
            task10ErrorHistory.push({ 
                word: fullWord, 
                correctLetter, 
                userAnswer: userChoice, 
                timestamp: Date.now(), 
                count: 1 
            });
        }
        saveTask10Errors();
    }

    document.getElementById('task10CorrectCount').textContent = task10CorrectAnswers;
    document.getElementById('task10IncorrectCount').textContent = task10IncorrectAnswers;

    document.getElementById('task10NextBtn').style.display = 'block';
}

function nextTask10Word() {
    task10CurrentIndex++;
    if (task10CurrentIndex >= task10GameWords.length) {
        showTask10Results();
    } else {
        displayTask10Word();
    }
}

function showTask10Results() {
    showScreen('task10ResultScreen');
    const percentage = Math.round((task10CorrectAnswers / task10GameWords.length) * 100);

    let emoji, message;
    if (percentage >= 90) { emoji = '🏆'; message = 'Отлично! Вы прекрасно знаете ПРЕ/ПРИ!'; }
    else if (percentage >= 70) { emoji = '👍'; message = 'Хороший результат! Есть над чем поработать.'; }
    else if (percentage >= 50) { emoji = '📚'; message = 'Неплохо, но стоит подучить некоторые слова.'; }
    else { emoji = '💪'; message = 'Нужно больше практики. Не сдавайтесь!'; }

    document.getElementById('task10ResultEmoji').textContent = emoji;
    document.getElementById('task10FinalScore').textContent = task10CorrectAnswers + '/' + task10GameWords.length + ' (' + percentage + '%)';
    document.getElementById('task10ResultMessage').textContent = message;
}

function startTask10PracticeErrors() {
    if (task10ErrorHistory.length === 0) { alert('Нет ошибок для отработки!'); return; }

    task10GameWords = task10ErrorHistory.map(error => {
        const dbEntry = task10Database.find(w => w.word === error.word);
        return dbEntry || { 
            word: error.word, 
            pattern: error.word.replace(error.correctLetter, '_'), 
            underscoreIndex: error.word.indexOf(error.correctLetter),
            correctLetter: error.correctLetter, 
            hint: '' 
        };
    });

    task10GameWords = shuffleArray(task10GameWords);
    task10CurrentIndex = 0;
    task10CorrectAnswers = 0;
    task10IncorrectAnswers = 0;
    task10Answered = false;
    task10IsErrorPractice = true;

    document.getElementById('task10TotalQuestions').textContent = task10GameWords.length;
    document.getElementById('task10CorrectCount').textContent = '0';
    document.getElementById('task10IncorrectCount').textContent = '0';

    showScreen('task10GameScreen');
    displayTask10Word();
}

function updateTask10PracticeButton() {
    const btn = document.getElementById('task10PracticeErrorsBtn');
    if (task10ErrorHistory.length > 0) {
        btn.style.display = 'block';
        btn.textContent = '🔄 Отработать ошибки (' + task10ErrorHistory.length + ')';
    } else {
        btn.style.display = 'none';
    }
}

function exitTask10() {
    goToTask10Start();
}

function goToTask10Start() {
    showScreen('task10StartScreen');
    updateTask10PracticeButton();
}
