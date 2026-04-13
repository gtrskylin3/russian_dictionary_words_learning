// ==================== TASK 4 (Stress) ====================
const VOWELS = ['а', 'о', 'у', 'е', 'ё', 'и', 'я', 'ю', 'э', 'ы'];
let task4Database = [];
let task4GameWords = [];
let task4CurrentIndex = 0;
let task4CorrectAnswers = 0;
let task4IncorrectAnswers = 0;
let task4Answered = false;
let task4SelectedMode = 20;
let task4ErrorHistory = [];
let task4IsErrorPractice = false;

async function loadTask4Database() {
    try {
        const response = await fetch('data_4.txt');
        if (!response.ok) throw new Error('Failed to load data_4.txt');
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');

        task4Database = lines.map(line => {
            let original = line.trim();
            let hint = '';

            // Check for hint in parentheses at the end
            const hintMatch = original.match(/^(.+?)\s*\((.+?)\)$/);
            if (hintMatch) {
                // Check if the part before the hint contains uppercase vowels (stress markers)
                const wordPart = hintMatch[1].trim();
                const hintPart = hintMatch[2].trim();

                // Only treat as hint if the word part has stress markers
                const hasStressMarker = /[А-ЯЁ]/.test(wordPart);
                if (hasStressMarker) {
                    original = wordPart;
                    hint = hintPart;
                }
            }

            const lower = original.toLowerCase();

            // Find the index of the uppercase (stressed) vowel
            let stressedIndex = -1;
            for (let i = 0; i < original.length; i++) {
                if (original[i] !== original[i].toLowerCase() && VOWELS.includes(original[i].toLowerCase())) {
                    stressedIndex = i;
                    break;
                }
            }

            // Extract all vowels from the lowercase word with their positions
            const vowelPositions = [];
            for (let i = 0; i < lower.length; i++) {
                if (VOWELS.includes(lower[i])) {
                    vowelPositions.push({ char: lower[i], index: i });
                }
            }

            return {
                original,
                word: lower,
                stressedIndex,
                stressedVowel: stressedIndex >= 0 ? lower[stressedIndex] : '',
                vowelPositions,
                hint
            };
        }).filter(entry => entry.stressedIndex >= 0); // Filter out entries without stress

        console.log('Loaded', task4Database.length, 'words for Task 4');
    } catch (error) {
        console.error('Error loading Task 4 database:', error);
        task4Database = [];
    }
}

function loadTask4Errors() {
    try {
        const saved = localStorage.getItem('task4Errors');
        if (saved) task4ErrorHistory = JSON.parse(saved);
    } catch (e) {
        task4ErrorHistory = [];
    }
}

function saveTask4Errors() {
    try {
        localStorage.setItem('task4Errors', JSON.stringify(task4ErrorHistory));
    } catch (e) {
        console.error('Failed to save Task 4 errors:', e);
    }
}

function selectTask4Mode(btn) {
    document.querySelectorAll('#task4StartScreen .mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    task4SelectedMode = parseInt(btn.dataset.mode);
}

async function startTask4Game() {
    const startBtn = document.getElementById('task4StartBtn');
    const loadingMsg = document.getElementById('task4LoadingMessage');

    if (task4Database.length === 0) {
        startBtn.disabled = true;
        loadingMsg.style.display = 'block';
        await loadTask4Database();
        startBtn.disabled = false;
        loadingMsg.style.display = 'none';
    }

    if (task4Database.length === 0) {
        alert('Не удалось загрузить словарь. Проверьте наличие файла data_4.txt');
        return;
    }

    task4IsErrorPractice = false;

    if (task4SelectedMode === 0) {
        task4GameWords = shuffleArray([...task4Database]);
    } else {
        task4GameWords = shuffleArray([...task4Database]).slice(0, task4SelectedMode);
    }

    task4GameWords = task4GameWords.map(entry => {
        return {
            word: entry.word,
            original: entry.original,
            stressedIndex: entry.stressedIndex,
            stressedVowel: entry.stressedVowel,
            vowelPositions: entry.vowelPositions,
            hint: entry.hint || ''
        };
    });

    task4CurrentIndex = 0;
    task4CorrectAnswers = 0;
    task4IncorrectAnswers = 0;
    task4Answered = false;

    document.getElementById('task4TotalQuestions').textContent = task4GameWords.length;
    document.getElementById('task4CorrectCount').textContent = '0';
    document.getElementById('task4IncorrectCount').textContent = '0';

    showScreen('task4GameScreen');
    displayTask4Word();
}

function displayTask4Word() {
    task4Answered = false;
    const entry = task4GameWords[task4CurrentIndex];
    const word = entry.word;
    const hint = entry.hint;

    // Build the word display with vowel buttons inline
    const displayContainer = document.getElementById('task4WordDisplay');
    displayContainer.innerHTML = '';

    for (let i = 0; i < word.length; i++) {
        if (word[i] === 'ё') {
            // Display Ё as Е (since Ё always has stress) - make it clickable
            const btn = document.createElement('button');
            btn.className = 'vowel-btn-inline';
            btn.textContent = 'е';
            btn.dataset.vowelIndex = i;
            btn.onclick = () => checkTask4Stress(i, btn);
            displayContainer.appendChild(btn);
        } else if (VOWELS.includes(word[i])) {
            const btn = document.createElement('button');
            btn.className = 'vowel-btn-inline';
            btn.textContent = word[i];
            btn.dataset.vowelIndex = i;
            btn.onclick = () => checkTask4Stress(i, btn);
            displayContainer.appendChild(btn);
        } else {
            const span = document.createElement('span');
            span.textContent = word[i];
            span.className = 'consonant-char';
            displayContainer.appendChild(span);
        }
    }

    // Display hint if available (same style as Task 9)
    const hintElement = document.getElementById('task4WordHint');
    hintElement.textContent = hint ? '(' + hint + ')' : '';

    document.getElementById('task4Feedback').textContent = '';
    document.getElementById('task4Feedback').className = 'feedback';
    document.getElementById('task4NextBtn').style.display = 'none';

    const progress = ((task4CurrentIndex) / task4GameWords.length) * 100;
    document.getElementById('task4ProgressFill').style.width = progress + '%';

    document.getElementById('task4CurrentQuestion').textContent = task4CurrentIndex + 1;
}

function checkTask4Stress(selectedIndex, btnElement) {
    if (task4Answered) return;

    task4Answered = true;
    const entry = task4GameWords[task4CurrentIndex];
    const isCorrect = selectedIndex === entry.stressedIndex;

    // Disable all vowel buttons
    document.querySelectorAll('.vowel-btn-inline').forEach(b => b.disabled = true);

    if (isCorrect) {
        task4CorrectAnswers++;
        btnElement.classList.add('correct');
        document.getElementById('task4Feedback').textContent = '✅ Правильно!';
        document.getElementById('task4Feedback').className = 'feedback correct';

        if (task4IsErrorPractice) {
            const errorIndex = task4ErrorHistory.findIndex(e => e.word === entry.word && e.stressedIndex === entry.stressedIndex);
            if (errorIndex >= 0) {
                task4ErrorHistory.splice(errorIndex, 1);
                saveTask4Errors();
            }
        }
    } else {
        task4IncorrectAnswers++;
        btnElement.classList.add('incorrect');

        // Highlight the correct button
        document.querySelectorAll('.vowel-btn-inline').forEach(b => {
            if (parseInt(b.dataset.vowelIndex) === entry.stressedIndex) {
                b.classList.add('correct-highlight');
            }
        });

        document.getElementById('task4Feedback').textContent = '❌ Неправильно! Правильное ударение: ' + entry.original.replace(/ё/g, 'е');
        document.getElementById('task4Feedback').className = 'feedback incorrect';

        const existingIndex = task4ErrorHistory.findIndex(e => e.word === entry.word && e.stressedIndex === entry.stressedIndex);
        if (existingIndex >= 0) {
            task4ErrorHistory[existingIndex].count = (task4ErrorHistory[existingIndex].count || 1) + 1;
            task4ErrorHistory[existingIndex].lastError = Date.now();
        } else {
            task4ErrorHistory.push({
                word: entry.word,
                original: entry.original,
                stressedIndex: entry.stressedIndex,
                timestamp: Date.now(),
                count: 1
            });
        }
        saveTask4Errors();
    }

    document.getElementById('task4CorrectCount').textContent = task4CorrectAnswers;
    document.getElementById('task4IncorrectCount').textContent = task4IncorrectAnswers;

    document.getElementById('task4NextBtn').style.display = 'block';
}

function nextTask4Word() {
    task4CurrentIndex++;
    if (task4CurrentIndex >= task4GameWords.length) {
        showTask4Results();
    } else {
        displayTask4Word();
    }
}

function showTask4Results() {
    showScreen('task4ResultScreen');
    const percentage = Math.round((task4CorrectAnswers / task4GameWords.length) * 100);

    let emoji, message;
    if (percentage >= 90) { emoji = '🏆'; message = 'Отлично! Вы прекрасно знаете ударения!'; }
    else if (percentage >= 70) { emoji = '👍'; message = 'Хороший результат! Есть над чем поработать.'; }
    else if (percentage >= 50) { emoji = '📚'; message = 'Неплохо, но стоит подучить некоторые слова.'; }
    else { emoji = '💪'; message = 'Нужно больше практики. Не сдавайтесь!'; }

    document.getElementById('task4ResultEmoji').textContent = emoji;
    document.getElementById('task4FinalScore').textContent = task4CorrectAnswers + '/' + task4GameWords.length + ' (' + percentage + '%)';
    document.getElementById('task4ResultMessage').textContent = message;
}

function startTask4PracticeErrors() {
    if (task4ErrorHistory.length === 0) { alert('Нет ошибок для отработки!'); return; }

    task4GameWords = task4ErrorHistory.map(error => {
        const dbEntry = task4Database.find(w => w.word === error.word);
        return dbEntry || { word: error.word, original: error.original, stressedIndex: error.stressedIndex, vowelPositions: [], hint: '' };
    });

    task4GameWords = shuffleArray(task4GameWords);
    task4CurrentIndex = 0;
    task4CorrectAnswers = 0;
    task4IncorrectAnswers = 0;
    task4Answered = false;
    task4IsErrorPractice = true;

    document.getElementById('task4TotalQuestions').textContent = task4GameWords.length;
    document.getElementById('task4CorrectCount').textContent = '0';
    document.getElementById('task4IncorrectCount').textContent = '0';

    showScreen('task4GameScreen');
    displayTask4Word();
}

function updateTask4PracticeButton() {
    const btn = document.getElementById('task4PracticeErrorsBtn');
    if (task4ErrorHistory.length > 0) {
        btn.style.display = 'block';
        btn.textContent = '🔄 Отработать ошибки (' + task4ErrorHistory.length + ')';
    } else {
        btn.style.display = 'none';
    }
}

function exitTask4() {
    goToTask4Start();
}

function goToTask4Start() {
    showScreen('task4StartScreen');
    updateTask4PracticeButton();
}
