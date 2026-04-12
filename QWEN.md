# Russian Dictionary Words Learning — Словарный тренажёр

## Project Overview

A **browser-based vocabulary trainer** for Russian-speaking students preparing for **ЕГЭ (Unified State Exam) — Task 9**, which tests spelling of dictionary words (словарные слова). The app presents words with missing vowels, and the user must type the correct letter.

**Tech stack:** Pure HTML, CSS, and vanilla JavaScript — no frameworks or build tools.

## Key Features

- **Three game modes:** Quick (20 words), Medium (50 words), Full (all ~350 words)
- **Error tracking:** Mistakes are saved to `localStorage` and can be re-practiced
- **Dark/Light theme toggle**
- **Keyboard layout detection:** Warns if user types in English layout
- **Hint system:** Some words include contextual hints (e.g., "орбита (_рбита 🪐)")
- **Mobile responsive** with touch-friendly controls
- **Animations:** Shake on wrong answer, pulse on correct

## File Structure

| File | Description |
|------|-------------|
| `index.html` | Main application — UI structure + all JavaScript logic |
| `style.css` | Complete styling with CSS variables for theming (dark/light) |
| `check_spell_data.txt` | **Primary dictionary** — words with underscore placeholders for missing vowels (format: `word=pattern_with_underscores`) |
| `data.txt` | Raw word list (one word per line, some with parenthetical notes) |
| `data_4.txt` | Accent-stress word list (capital letters indicate stressed syllables) — **not currently used** by the app |
| `TODO.md` | Incomplete note about expanding the application |

## Dictionary Format (`check_spell_data.txt`)

Each line follows the format:
```
correct_word=pattern_with_underscores (optional_hint)
```

Examples:
```
абитуриент=аб_туриент
орбита=_рбита (🪐)
кампания=к_мпания (военная)
компания=к_мпания (друзей)
```

Underscores (`_`) mark positions where vowels are hidden. The app randomly selects one underscore position per word to quiz the user on.

## How to Run

Simply open `index.html` in a browser. No build step or server required for basic use.

**Note:** To load `check_spell_data.txt` via `fetch()`, the app needs to be served over HTTP (not `file://` due to CORS). Use any static server:

```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve .

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000`.

## Architecture

### Core Logic (in `index.html` `<script>`)

1. **`loadWordDatabase()`** — Fetches and parses `check_spell_data.txt` into an array of `{word, missingIndices, hint}` objects
2. **`startGame()`** — Selects words based on mode, picks one random vowel position per word to hide
3. **`displayWord()`** — Renders the word with `_` placeholder and optional hint
4. **`checkAnswer()`** — Compares user input to the correct letter, updates stats, tracks errors
5. **`showResults()`** — Displays score with emoji, percentage, and word-by-word breakdown
6. **`startPracticeErrors()`** — Creates a quiz from previously missed words

### State Management

- `wordDatabase` — All loaded words
- `gameWords` — Current session's selected words
- `errorHistory` — Persisted in `localStorage` under key `wordLearningErrors`
- `letterStats` — Per-letter accuracy tracking (in-memory only)

## Development Conventions

- **No external dependencies** — vanilla JS only
- **Russian language UI** — all text, labels, and messages are in Russian
- **CSS custom properties** for theming — add new colors by updating `:root` and `body.dark-theme`
- **Mobile-first responsive** — breakpoints at 768px and 480px

## Potential Extensions (from TODO.md)

The `TODO.md` file contains an incomplete thought about expanding the application. The `data_4.txt` file with stress-marked words suggests a potential accent-stress training mode could be added.
