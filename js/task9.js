// ==================== TASK 9 (Spelling) ====================
let task9Database = [];
let task9GameWords = [];
let task9CurrentIndex = 0;
let task9CorrectAnswers = 0;
let task9IncorrectAnswers = 0;
let task9Answered = false;
let task9SelectedMode = 20;
let task9ErrorHistory = [];
let task9IsErrorPractice = false;

async function loadTask9Database() {
    try {
        const response = await fetch('check_spell_data.txt');
        if (!response.ok) throw new Error('Failed to load check_spell_data.txt');
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');

        task9Database = lines.map(line => {
            const [correctWord, patternWithHint] = line.split('=');
            const trimmedWord = correctWord.trim();
            let trimmedPattern = patternWithHint.trim();
            let hint = '';

            const hintMatch = trimmedPattern.match(/^(.+?)\s*\((.+?)\)$/);
            if (hintMatch) {
                trimmedPattern = hintMatch[1].trim();
                hint = hintMatch[2].trim();
            }

            const missingIndices = [];
            for (let i = 0; i < trimmedPattern.length; i++) {
                if (trimmedPattern[i] === '_') missingIndices.push(i);
            }

            return { word: trimmedWord, missingIndices, hint };
        });

        console.log('Loaded', task9Database.length, 'words for Task 9');
    } catch (error) {
        console.error('Error loading Task 9 database:', error);
        task9Database = [];
    }
}

function loadTask9Errors() {
    try {
        const saved = localStorage.getItem('task9Errors');
        if (saved) task9ErrorHistory = JSON.parse(saved);
    } catch (e) {
        task9ErrorHistory = [];
    }
}

function saveTask9Errors() {
    try {
        localStorage.setItem('task9Errors', JSON.stringify(task9ErrorHistory));
    } catch (e) {
        console.error('Failed to save Task 9 errors:', e);
    }
}

function selectTask9Mode(btn) {
    document.querySelectorAll('#task9StartScreen .mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    task9SelectedMode = parseInt(btn.dataset.mode);
}

async function startTask9Game() {
    const startBtn = document.getElementById('task9StartBtn');
    const loadingMsg = document.getElementById('task9LoadingMessage');

    if (task9Database.length === 0) {
        startBtn.disabled = true;
        loadingMsg.style.display = 'block';
        await loadTask9Database();
        startBtn.disabled = false;
        loadingMsg.style.display = 'none';
    }

    if (task9Database.length === 0) {
        alert('Не удалось загрузить словарь. Проверьте наличие файла check_spell_data.txt');
        return;
    }

    task9IsErrorPractice = false;

    if (task9SelectedMode === 0) {
        task9GameWords = shuffleArray([...task9Database]);
    } else {
        task9GameWords = shuffleArray([...task9Database]).slice(0, task9SelectedMode);
    }

    task9GameWords = task9GameWords.map(entry => {
        const index = entry.missingIndices[Math.floor(Math.random() * entry.missingIndices.length)];
        return { word: entry.word, hideIndex: index, correctLetter: entry.word[index], hint: entry.hint || '' };
    });

    task9CurrentIndex = 0;
    task9CorrectAnswers = 0;
    task9IncorrectAnswers = 0;
    task9Answered = false;

    document.getElementById('task9TotalQuestions').textContent = task9GameWords.length;
    document.getElementById('task9CorrectCount').textContent = '0';
    document.getElementById('task9IncorrectCount').textContent = '0';

    showScreen('task9GameScreen');
    displayTask9Word();
}

function displayTask9Word() {
    task9Answered = false;
    const entry = task9GameWords[task9CurrentIndex];
    const word = entry.word;
    const hideIndex = entry.hideIndex;
    const hint = entry.hint;

    let displayWord = word.substring(0, hideIndex) + '_' + word.substring(hideIndex + 1);

    document.getElementById('task9CurrentQuestion').textContent = task9CurrentIndex + 1;
    document.getElementById('task9WordDisplay').innerHTML = displayWord.replace('_', '<span class="missing-letter">_</span>');

    const hintElement = document.getElementById('task9WordHint');
    hintElement.textContent = hint ? '(' + hint + ')' : '';

    const input = document.getElementById('task9LetterInput');
    input.value = '';
    input.className = '';
    input.disabled = false;
    input.focus();

    document.getElementById('task9Feedback').textContent = '';
    document.getElementById('task9Feedback').className = 'feedback';
    document.getElementById('task9SubmitBtn').style.display = 'block';
    document.getElementById('task9NextBtn').style.display = 'none';

    const progress = ((task9CurrentIndex) / task9GameWords.length) * 100;
    document.getElementById('task9ProgressFill').style.width = progress + '%';

    document.getElementById('task9SubmitBtn').dataset.correctLetter = entry.correctLetter;
    document.getElementById('task9SubmitBtn').dataset.fullWord = word;
    document.getElementById('task9SubmitBtn').dataset.hideIndex = hideIndex;
}

function checkTask9Answer() {
    if (task9Answered) return;

    const input = document.getElementById('task9LetterInput');
    const userAnswer = input.value.toLowerCase().trim();
    const correctLetter = document.getElementById('task9SubmitBtn').dataset.correctLetter.toLowerCase();
    const fullWord = document.getElementById('task9SubmitBtn').dataset.fullWord;

    if (!userAnswer) {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 300);
        return;
    }

    task9Answered = true;
    const isCorrect = userAnswer === correctLetter;

    if (isCorrect) {
        task9CorrectAnswers++;
        input.className = 'correct pulse';
        document.getElementById('task9Feedback').textContent = '✅ Правильно!';
        document.getElementById('task9Feedback').className = 'feedback correct';

        if (task9IsErrorPractice) {
            const hideIdx = parseInt(document.getElementById('task9SubmitBtn').dataset.hideIndex);
            const errorIndex = task9ErrorHistory.findIndex(e => e.word === fullWord && e.hideIndex === hideIdx);
            if (errorIndex >= 0) {
                task9ErrorHistory.splice(errorIndex, 1);
                saveTask9Errors();
            }
        }
    } else {
        task9IncorrectAnswers++;
        input.className = 'incorrect shake';
        document.getElementById('task9Feedback').textContent = '❌ Неправильно! Правильный ответ: ' + fullWord.toUpperCase();
        document.getElementById('task9Feedback').className = 'feedback incorrect';

        const hideIdx = parseInt(document.getElementById('task9SubmitBtn').dataset.hideIndex);
        const existingIndex = task9ErrorHistory.findIndex(e => e.word === fullWord && e.hideIndex === hideIdx);
        if (existingIndex >= 0) {
            task9ErrorHistory[existingIndex].count = (task9ErrorHistory[existingIndex].count || 1) + 1;
            task9ErrorHistory[existingIndex].lastError = Date.now();
            task9ErrorHistory[existingIndex].userAnswer = userAnswer;
        } else {
            task9ErrorHistory.push({ word: fullWord, hideIndex: hideIdx, correctLetter, userAnswer, timestamp: Date.now(), count: 1 });
        }
        saveTask9Errors();
    }

    document.getElementById('task9CorrectCount').textContent = task9CorrectAnswers;
    document.getElementById('task9IncorrectCount').textContent = task9IncorrectAnswers;

    input.disabled = true;
    document.getElementById('task9SubmitBtn').style.display = 'none';
    document.getElementById('task9NextBtn').style.display = 'block';
}

function nextTask9Word() {
    task9CurrentIndex++;
    if (task9CurrentIndex >= task9GameWords.length) {
        showTask9Results();
    } else {
        displayTask9Word();
    }
}

function showTask9Results() {
    showScreen('task9ResultScreen');
    const percentage = Math.round((task9CorrectAnswers / task9GameWords.length) * 100);

    let emoji, message;
    if (percentage >= 90) { emoji = '🏆'; message = 'Отлично! Вы прекрасно знаете словарные слова!'; }
    else if (percentage >= 70) { emoji = '👍'; message = 'Хороший результат! Есть над чем поработать.'; }
    else if (percentage >= 50) { emoji = '📚'; message = 'Неплохо, но стоит подучить некоторые слова.'; }
    else { emoji = '💪'; message = 'Нужно больше практики. Не сдавайтесь!'; }

    document.getElementById('task9ResultEmoji').textContent = emoji;
    document.getElementById('task9FinalScore').textContent = task9CorrectAnswers + '/' + task9GameWords.length + ' (' + percentage + '%)';
    document.getElementById('task9ResultMessage').textContent = message;
}

function startTask9PracticeErrors() {
    if (task9ErrorHistory.length === 0) { alert('Нет ошибок для отработки!'); return; }

    task9GameWords = task9ErrorHistory.map(error => {
        const dbEntry = task9Database.find(w => w.word === error.word);
        return { word: error.word, hideIndex: error.hideIndex, correctLetter: error.word[error.hideIndex], hint: dbEntry ? dbEntry.hint : '' };
    });

    task9GameWords = shuffleArray(task9GameWords);
    task9CurrentIndex = 0;
    task9CorrectAnswers = 0;
    task9IncorrectAnswers = 0;
    task9Answered = false;
    task9IsErrorPractice = true;

    document.getElementById('task9TotalQuestions').textContent = task9GameWords.length;
    document.getElementById('task9CorrectCount').textContent = '0';
    document.getElementById('task9IncorrectCount').textContent = '0';

    showScreen('task9GameScreen');
    displayTask9Word();
}

function updateTask9PracticeButton() {
    const btn = document.getElementById('task9PracticeErrorsBtn');
    if (task9ErrorHistory.length > 0) {
        btn.style.display = 'block';
        btn.textContent = '🔄 Отработать ошибки (' + task9ErrorHistory.length + ')';
    } else {
        btn.style.display = 'none';
    }
}

function exitTask9() {
    goToTask9Start();
}

function goToTask9Start() {
    showScreen('task9StartScreen');
    updateTask9PracticeButton();
}

// Task 9 layout warning
document.addEventListener('DOMContentLoaded', () => {
    const letterInputEl = document.getElementById('task9LetterInput');
    const layoutWarningEl = document.getElementById('task9LayoutWarning');

    if (letterInputEl && layoutWarningEl) {
        letterInputEl.addEventListener('input', function() {
            const value = this.value;
            if (!value) { layoutWarningEl.classList.remove('visible'); return; }
            const isLatinLetter = /[a-zA-Z]/.test(value);
            layoutWarningEl.classList.toggle('visible', isLatinLetter);
        });

        letterInputEl.addEventListener('focus', () => layoutWarningEl.classList.remove('visible'));
        letterInputEl.addEventListener('blur', () => layoutWarningEl.classList.remove('visible'));
    }
});
