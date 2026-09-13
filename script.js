// Global variables to store flashcards, decks, player stats, and state
let cards = [];
let decks = [];
let currentCardIndex = 0;
let showingQuestion = true;
let isStudyMode = false;
let is3DMode = false;
let currentDeckId = 'default';
let searchQuery = '';
let currentTheme = 'light';

// Three.js 3D Arena Variables
let scene, camera, renderer, cardMesh, canvasTexture, canvasContext, canvasElement, stars, gridHelper;
let targetRotationY = 0;
let currentRotationY = 0;

// Gamification State
let playerStats = {
    xp: 0,
    level: 1,
    streak: 0,
    lastStudyDate: null,
    combo: 0,
    maxCombo: 0,
    totalReviews: 0,
    correctReviews: 0,
    badges: []
};

// Chart Instance
let masteryChartInstance = null;

// Available Badges
const ALL_BADGES = [
    { id: 'first_card', name: 'First Step', desc: 'Create your first flashcard', icon: '🌱' },
    { id: 'first_study', name: 'Scholar', desc: 'Complete your first study session', icon: '📖' },
    { id: 'streak_3', name: 'On Fire', desc: 'Maintain a 3-day study streak', icon: '🔥' },
    { id: 'streak_7', name: 'Unstoppable', desc: 'Maintain a 7-day study streak', icon: '⚡' },
    { id: 'level_5', name: 'Master Mind', desc: 'Reach Player Level 5', icon: '🧠' },
    { id: 'reviews_50', name: 'Centurion', desc: 'Complete 50 card reviews', icon: '💯' },
    { id: 'deck_master', name: 'Deck Creator', desc: 'Create 3 custom decks', icon: '📚' }
];

// LocalStorage keys
const STORAGE_KEY = 'flashlearn-cards-v2';
const DECKS_STORAGE_KEY = 'flashlearn-decks-v2';
const STATS_STORAGE_KEY = 'flashlearn-player-stats-v2';
const THEME_STORAGE_KEY = 'flashlearn-theme';

// SM-2 Spaced Repetition Engine Implementation
const SM2 = {
    calculate(card, quality) {
        let { interval = 0, repetitions = 0, easeFactor = 2.5 } = card;

        if (quality >= 3) {
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            repetitions++;
        } else {
            repetitions = 0;
            interval = 1;
        }

        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;

        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + interval);

        return {
            interval,
            repetitions,
            easeFactor: Number(easeFactor.toFixed(2)),
            dueDate: nextDueDate.toISOString(),
            lastReviewed: new Date().toISOString()
        };
    },

    isDue(card) {
        if (!card.dueDate) return true;
        return new Date(card.dueDate) <= new Date();
    },

    getIntervalLabel(card, quality) {
        const result = SM2.calculate(card, quality);
        if (result.interval === 1) return '1d';
        return `${result.interval}d`;
    }
};

/**
 * Calculate XP required for next level
 */
function getXPForNextLevel(level) {
    return level * 100;
}

/**
 * Award XP to player and handle leveling up
 */
function awardXP(amount) {
    playerStats.xp += amount;
    let xpNeeded = getXPForNextLevel(playerStats.level);
    let leveledUp = false;

    while (playerStats.xp >= xpNeeded) {
        playerStats.xp -= xpNeeded;
        playerStats.level++;
        leveledUp = true;
        xpNeeded = getXPForNextLevel(playerStats.level);
    }

    if (leveledUp) {
        triggerLevelUpAnimation(playerStats.level);
        checkBadges();
    }

    savePlayerStats();
    updateGamificationUI();
}

/**
 * Update daily study streak
 */
function updateStreak() {
    const today = new Date().toDateString();
    if (playerStats.lastStudyDate) {
        const lastDate = new Date(playerStats.lastStudyDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate.toDateString() === yesterday.toDateString()) {
            playerStats.streak++;
        } else if (lastDate.toDateString() !== today) {
            playerStats.streak = 1;
        }
    } else {
        playerStats.streak = 1;
    }

    playerStats.lastStudyDate = today;
    checkBadges();
    savePlayerStats();
    updateGamificationUI();
}

/**
 * Check and unlock achievement badges
 */
function checkBadges() {
    const newlyUnlocked = [];

    ALL_BADGES.forEach(badge => {
        if (playerStats.badges.includes(badge.id)) return;

        let unlocked = false;
        if (badge.id === 'first_card' && cards.length >= 1) unlocked = true;
        if (badge.id === 'first_study' && playerStats.totalReviews >= 1) unlocked = true;
        if (badge.id === 'streak_3' && playerStats.streak >= 3) unlocked = true;
        if (badge.id === 'streak_7' && playerStats.streak >= 7) unlocked = true;
        if (badge.id === 'level_5' && playerStats.level >= 5) unlocked = true;
        if (badge.id === 'reviews_50' && playerStats.totalReviews >= 50) unlocked = true;
        if (badge.id === 'deck_master' && decks.length >= 4) unlocked = true;

        if (unlocked) {
            playerStats.badges.push(badge.id);
            newlyUnlocked.push(badge);
        }
    });

    if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach(badge => triggerBadgeNotification(badge));
        savePlayerStats();
    }
}

// DOM Element Caching
let addCardForm, questionInput, answerInput, cardContainer, cardCounter;
let prevBtn, nextBtn, flipBtn, editBtn, deleteBtn;
let startStudyBtn, exitStudyBtn, toggle3DBtn, openStatsBtn, closeStatsBtn, themeToggleBtn;
let studyProgress, progressText, deckSelect, newDeckBtn, deleteDeckBtn;
let searchInput, shuffleBtn, exportJsonBtn, exportCsvBtn, importFileInput;
let sm2RatingBar, sm2AgainBtn, sm2HardBtn, sm2GoodBtn, sm2EasyBtn;
let sm2AgainLbl, sm2HardLbl, sm2GoodLbl, sm2EasyLbl;
let statsModal, badgesGrid;

function cacheDOMElements() {
    addCardForm = document.getElementById('add-card-form');
    questionInput = document.getElementById('question');
    answerInput = document.getElementById('answer');
    cardContainer = document.getElementById('card-container');
    cardCounter = document.getElementById('card-counter');
    prevBtn = document.getElementById('prev-btn');
    nextBtn = document.getElementById('next-btn');
    flipBtn = document.getElementById('flip-btn');
    editBtn = document.getElementById('edit-btn');
    deleteBtn = document.getElementById('delete-btn');
    startStudyBtn = document.getElementById('start-study-btn');
    exitStudyBtn = document.getElementById('exit-study-btn');
    toggle3DBtn = document.getElementById('toggle-3d-btn');
    openStatsBtn = document.getElementById('open-stats-btn');
    closeStatsBtn = document.getElementById('close-stats-btn');
    themeToggleBtn = document.getElementById('theme-toggle-btn');
    studyProgress = document.getElementById('study-progress');
    progressText = document.getElementById('progress-text');
    deckSelect = document.getElementById('deck-select');
    newDeckBtn = document.getElementById('new-deck-btn');
    deleteDeckBtn = document.getElementById('delete-deck-btn');
    searchInput = document.getElementById('search-input');
    shuffleBtn = document.getElementById('shuffle-btn');
    exportJsonBtn = document.getElementById('export-json-btn');
    exportCsvBtn = document.getElementById('export-csv-btn');
    importFileInput = document.getElementById('import-file-input');
    sm2RatingBar = document.getElementById('sm2-rating-bar');
    sm2AgainBtn = document.getElementById('sm2-again');
    sm2HardBtn = document.getElementById('sm2-hard');
    sm2GoodBtn = document.getElementById('sm2-good');
    sm2EasyBtn = document.getElementById('sm2-easy');
    sm2AgainLbl = document.getElementById('sm2-again-lbl');
    sm2HardLbl = document.getElementById('sm2-hard-lbl');
    sm2GoodLbl = document.getElementById('sm2-good-lbl');
    sm2EasyLbl = document.getElementById('sm2-easy-lbl');
    statsModal = document.getElementById('stats-modal');
    badgesGrid = document.getElementById('badges-grid');
}

function bindEventListeners() {
    addCardForm.addEventListener('submit', handleAddCard);
    prevBtn.addEventListener('click', showPreviousCard);
    nextBtn.addEventListener('click', showNextCard);
    flipBtn.addEventListener('click', flipCard);
    editBtn.addEventListener('click', editCurrentCard);
    deleteBtn.addEventListener('click', deleteCurrentCard);
    startStudyBtn.addEventListener('click', enterStudyMode);
    exitStudyBtn.addEventListener('click', exitStudyMode);
    toggle3DBtn.addEventListener('click', toggle3DMode);
    openStatsBtn.addEventListener('click', openStatsModal);
    closeStatsBtn.addEventListener('click', closeStatsModal);
    themeToggleBtn.addEventListener('click', toggleTheme);
    deckSelect.addEventListener('change', handleDeckChange);
    newDeckBtn.addEventListener('click', createNewDeck);
    deleteDeckBtn.addEventListener('click', deleteDeck);
    searchInput.addEventListener('input', handleSearch);
    shuffleBtn.addEventListener('click', shuffleCurrentDeck);
    exportJsonBtn.addEventListener('click', exportDataJSON);
    exportCsvBtn.addEventListener('click', exportDataCSV);
    importFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) importDataFile(e.target.files[0]);
    });

    sm2AgainBtn.addEventListener('click', () => handleSM2Rating(1));
    sm2HardBtn.addEventListener('click', () => handleSM2Rating(3));
    sm2GoodBtn.addEventListener('click', () => handleSM2Rating(4));
    sm2EasyBtn.addEventListener('click', () => handleSM2Rating(5));

    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Toggle Light and Dark theme mode
 */
function toggleTheme() {
    if (currentTheme === 'light') {
        currentTheme = 'dark';
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        themeToggleBtn.textContent = '🌙 Dark';
    } else {
        currentTheme = 'light';
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        themeToggleBtn.textContent = '☀️ Light';
    }
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    currentTheme = savedTheme;
    if (currentTheme === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        if (themeToggleBtn) themeToggleBtn.textContent = '🌙 Dark';
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (themeToggleBtn) themeToggleBtn.textContent = '☀️ Light';
    }
}

/**
 * Filter active cards based on deck and search query
 */
function getActiveCards() {
    return cards.filter(card => {
        const matchesDeck = card.deckId === currentDeckId;
        const matchesSearch = !searchQuery ||
            card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            card.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDeck && matchesSearch;
    });
}

/**
 * Display current card
 */
function updateDisplay() {
    const active = getActiveCards();

    if (active.length === 0) {
        const currentDeck = decks.find(d => d.id === currentDeckId);
        cardContainer.innerHTML = `<div class="no-cards">No flashcards in "${currentDeck?.name || 'Current Deck'}".<br>Create your first card to get started!</div>`;
        cardCounter.textContent = 'No cards available';
        disableAllButtons();
        if (is3DMode) update3DCardTexture('No cards available in this deck.', true);
        return;
    }

    if (currentCardIndex >= active.length) {
        currentCardIndex = 0;
    }

    const currentCard = active[currentCardIndex];
    const content = showingQuestion ? currentCard.question : currentCard.answer;
    const cardType = showingQuestion ? 'Question' : 'Answer';

    const cardBgClass = showingQuestion ? 'question-card-bg' : 'answer-card-bg';
    cardContainer.innerHTML = `
        <div class="card ${cardBgClass}" id="active-2d-card">
            <div class="card-content">${content}</div>
        </div>
    `;

    document.getElementById('active-2d-card').addEventListener('click', flipCard);

    if (is3DMode) {
        update3DCardTexture(content, showingQuestion);
    }

    cardCounter.textContent = `Card ${currentCardIndex + 1} of ${active.length} (${cardType})`;

    if (isStudyMode) {
        updateStudyProgress();
        updateSM2Labels(currentCard);
    }

    updateButtonStates();
}

/**
 * Handle SM2 Intervals preview on rating buttons
 */
function updateSM2Labels(card) {
    if (!card) return;
    sm2AgainLbl.textContent = SM2.getIntervalLabel(card, 1);
    sm2HardLbl.textContent = SM2.getIntervalLabel(card, 3);
    sm2GoodLbl.textContent = SM2.getIntervalLabel(card, 4);
    sm2EasyLbl.textContent = SM2.getIntervalLabel(card, 5);
}

/**
 * Handle rating submission for Spaced Repetition
 */
function handleSM2Rating(quality) {
    const active = getActiveCards();
    if (active.length === 0) return;

    const currentCard = active[currentCardIndex];
    const sm2Result = SM2.calculate(currentCard, quality);

    currentCard.interval = sm2Result.interval;
    currentCard.repetitions = sm2Result.repetitions;
    currentCard.easeFactor = sm2Result.easeFactor;
    currentCard.dueDate = sm2Result.dueDate;
    currentCard.lastReviewed = sm2Result.lastReviewed;

    playerStats.totalReviews++;
    if (quality >= 3) {
        playerStats.correctReviews++;
        playerStats.combo++;
        if (playerStats.combo > playerStats.maxCombo) {
            playerStats.maxCombo = playerStats.combo;
        }

        let xpGained = 15 + Math.min(50, playerStats.combo * 5);
        if (quality === 5) xpGained += 10;
        awardXP(xpGained);
    } else {
        playerStats.combo = 0;
    }

    updateStreak();
    saveCards();
    savePlayerStats();
    updateGamificationUI();

    if (currentCardIndex < active.length - 1) {
        currentCardIndex++;
        showingQuestion = true;
        targetRotationY = 0;
        updateDisplay();
    } else {
        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
        }
        setTimeout(() => {
            alert(`🎉 Study session complete! Combo: ${playerStats.combo}. Keep up the daily streak!`);
            exitStudyMode();
        }, 500);
    }
}

function updateButtonStates() {
    const active = getActiveCards();
    const hasCards = active.length > 0;

    prevBtn.disabled = !hasCards || currentCardIndex === 0;
    nextBtn.disabled = !hasCards || currentCardIndex === active.length - 1;
    flipBtn.disabled = !hasCards;
    editBtn.disabled = !hasCards;
    deleteBtn.disabled = !hasCards || isStudyMode;
    startStudyBtn.disabled = !hasCards;
}

function disableAllButtons() {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    flipBtn.disabled = true;
    editBtn.disabled = true;
    deleteBtn.disabled = true;
}

function showPreviousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showingQuestion = true;
        targetRotationY = 0;
        updateDisplay();
    }
}

function showNextCard() {
    const active = getActiveCards();
    if (currentCardIndex < active.length - 1) {
        currentCardIndex++;
        showingQuestion = true;
        targetRotationY = 0;
        updateDisplay();
    }
}

function flipCard() {
    const active = getActiveCards();
    if (active.length > 0) {
        showingQuestion = !showingQuestion;
        targetRotationY += Math.PI;
        updateDisplay();
    }
}

function handleAddCard(e) {
    e.preventDefault();
    const q = questionInput.value.trim();
    const a = answerInput.value.trim();
    if (!q || !a) return;

    const newCard = {
        id: Date.now(),
        question: q,
        answer: a,
        deckId: currentDeckId,
        created: new Date().toLocaleDateString(),
        timesReviewed: 0,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        dueDate: new Date().toISOString()
    };

    cards.push(newCard);
    saveCards();

    questionInput.value = '';
    answerInput.value = '';
    const active = getActiveCards();
    currentCardIndex = active.length - 1;
    showingQuestion = true;
    updateDisplay();
    checkBadges();
}

function deleteCurrentCard() {
    const active = getActiveCards();
    if (active.length === 0) return;

    const currentCard = active[currentCardIndex];
    if (confirm(`Delete card "${currentCard.question.substring(0, 30)}..."?`)) {
        cards = cards.filter(c => c.id !== currentCard.id);
        saveCards();

        const updatedActive = getActiveCards();
        if (currentCardIndex >= updatedActive.length && updatedActive.length > 0) {
            currentCardIndex = updatedActive.length - 1;
        }
        showingQuestion = true;
        updateDisplay();
    }
}

function enterStudyMode() {
    const active = getActiveCards();
    if (active.length === 0) return;

    isStudyMode = true;
    document.body.classList.add('study-mode');
    currentCardIndex = 0;
    showingQuestion = true;

    startStudyBtn.classList.add('hidden');
    exitStudyBtn.classList.remove('hidden');
    studyProgress.classList.remove('hidden');
    sm2RatingBar.classList.remove('hidden');
    cardCounter.classList.add('hidden');

    updateDisplay();
}

function exitStudyMode() {
    isStudyMode = false;
    document.body.classList.remove('study-mode');

    startStudyBtn.classList.remove('hidden');
    exitStudyBtn.classList.add('hidden');
    studyProgress.classList.add('hidden');
    sm2RatingBar.classList.add('hidden');
    cardCounter.classList.remove('hidden');

    updateDisplay();
}

function updateStudyProgress() {
    const active = getActiveCards();
    progressText.textContent = `${currentCardIndex + 1} / ${active.length}`;
}

function handleDeckChange(e) {
    currentDeckId = e.target.value;
    currentCardIndex = 0;
    showingQuestion = true;
    if (isStudyMode) exitStudyMode();
    updateDisplay();
    updateDeckSelect();
}

function createNewDeck() {
    const name = prompt('Enter name for new deck:');
    if (!name || !name.trim()) return;

    const newDeck = {
        id: 'deck_' + Date.now(),
        name: name.trim(),
        created: new Date().toLocaleDateString(),
        description: `Custom deck: ${name.trim()}`
    };

    decks.push(newDeck);
    saveDecks();
    currentDeckId = newDeck.id;
    updateDeckSelect();
    updateDisplay();
    checkBadges();
}

function deleteDeck() {
    if (currentDeckId === 'default') {
        alert('Cannot delete the Default Deck!');
        return;
    }

    const currentDeck = decks.find(d => d.id === currentDeckId);
    const deckCards = getActiveCards();

    if (confirm(`Delete deck "${currentDeck.name}" and all ${deckCards.length} cards in it?`)) {
        cards = cards.filter(c => c.deckId !== currentDeckId);
        decks = decks.filter(d => d.id !== currentDeckId);
        saveCards();
        saveDecks();
        currentDeckId = 'default';
        updateDeckSelect();
        updateDisplay();
    }
}

function updateDeckSelect() {
    deckSelect.innerHTML = '';
    decks.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        deckSelect.appendChild(opt);
    });
    deckSelect.value = currentDeckId;
    deleteDeckBtn.disabled = (currentDeckId === 'default');
}

function handleSearch(e) {
    searchQuery = e.target.value.trim();
    currentCardIndex = 0;
    updateDisplay();
}

/**
 * Analytics Modal & Chart.js Integration
 */
function openStatsModal() {
    statsModal.classList.remove('hidden');

    document.getElementById('stat-total-reviews').textContent = playerStats.totalReviews;
    const acc = playerStats.totalReviews > 0 ? Math.round((playerStats.correctReviews / playerStats.totalReviews) * 100) : 0;
    document.getElementById('stat-accuracy').textContent = `${acc}%`;
    document.getElementById('stat-max-combo').textContent = playerStats.maxCombo;

    renderBadgesGrid();
    renderMasteryChart();
}

function closeStatsModal() {
    statsModal.classList.add('hidden');
}

function renderBadgesGrid() {
    badgesGrid.innerHTML = '';
    ALL_BADGES.forEach(badge => {
        const isUnlocked = playerStats.badges.includes(badge.id);
        const card = document.createElement('div');
        card.className = `badge-card ${isUnlocked ? 'unlocked' : ''}`;
        card.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div>
                <div class="badge-title">${badge.name}</div>
                <div class="badge-desc">${badge.desc}</div>
            </div>
        `;
        badgesGrid.appendChild(card);
    });
}

function renderMasteryChart() {
    const ctx = document.getElementById('mastery-chart').getContext('2d');
    if (masteryChartInstance) masteryChartInstance.destroy();

    const newCards = cards.filter(c => (c.repetitions || 0) === 0).length;
    const learning = cards.filter(c => (c.repetitions || 0) > 0 && (c.repetitions || 0) < 4).length;
    const mastered = cards.filter(c => (c.repetitions || 0) >= 4).length;

    masteryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['New', 'Learning', 'Mastered'],
            datasets: [{
                data: [newCards, learning, mastered],
                backgroundColor: ['#ec4899', '#f59e0b', '#10b981']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Card Mastery Distribution' }
            }
        }
    });
}

function handleKeyboardShortcuts(event) {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;

    switch (event.code) {
        case 'Space':
            event.preventDefault();
            flipCard();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            showPreviousCard();
            break;
        case 'ArrowRight':
            event.preventDefault();
            showNextCard();
            break;
        case 'Digit1':
            if (isStudyMode) { event.preventDefault(); handleSM2Rating(1); }
            break;
        case 'Digit2':
            if (isStudyMode) { event.preventDefault(); handleSM2Rating(3); }
            break;
        case 'Digit3':
            if (isStudyMode) { event.preventDefault(); handleSM2Rating(4); }
            break;
        case 'Digit4':
            if (isStudyMode) { event.preventDefault(); handleSM2Rating(5); }
            break;
        case 'KeyS':
            if (event.shiftKey) {
                event.preventDefault();
                isStudyMode ? exitStudyMode() : enterStudyMode();
            }
            break;
        case 'Escape':
            if (isStudyMode) exitStudyMode();
            if (!statsModal.classList.contains('hidden')) closeStatsModal();
            break;
    }
}

/**
 * Three.js 3D Arcade Arena Setup
 */
function init3DArena() {
    const container = document.getElementById('three-container');
    if (!container || scene) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 6.5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xec4899, 1.2);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x8b5cf6, 1.5, 12);
    pointLight.position.set(-3, -2, 3);
    scene.add(pointLight);

    gridHelper = new THREE.GridHelper(20, 20, 0xec4899, 0x3b82f6);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
        starPositions[i] = (Math.random() - 0.5) * 22;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xf43f5e, size: 0.06 });
    stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    canvasElement = document.createElement('canvas');
    canvasElement.width = 512;
    canvasElement.height = 320;
    canvasContext = canvasElement.getContext('2d');
    canvasTexture = new THREE.CanvasTexture(canvasElement);

    const cardGeo = new THREE.BoxGeometry(3.4, 2.1, 0.08);
    const materials = [
        new THREE.MeshStandardMaterial({ color: 0x1e1b4b }),
        new THREE.MeshStandardMaterial({ color: 0x1e1b4b }),
        new THREE.MeshStandardMaterial({ color: 0x1e1b4b }),
        new THREE.MeshStandardMaterial({ color: 0x1e1b4b }),
        new THREE.MeshStandardMaterial({ map: canvasTexture, roughness: 0.2 }),
        new THREE.MeshStandardMaterial({ map: canvasTexture, roughness: 0.2 })
    ];

    cardMesh = new THREE.Mesh(cardGeo, materials);
    scene.add(cardMesh);

    window.addEventListener('resize', onWindowResize);
    container.addEventListener('click', flipCard);

    animate3D();
}

function onWindowResize() {
    const container = document.getElementById('three-container');
    if (!container || !renderer || !camera) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function update3DCardTexture(text, isQuestion) {
    if (!canvasContext) return;

    const gradient = canvasContext.createLinearGradient(0, 0, 512, 320);
    if (isQuestion) {
        gradient.addColorStop(0, '#1e1b4b');
        gradient.addColorStop(1, '#311042');
    } else {
        gradient.addColorStop(0, '#064e3b');
        gradient.addColorStop(1, '#022c22');
    }

    canvasContext.fillStyle = gradient;
    canvasContext.fillRect(0, 0, 512, 320);

    canvasContext.lineWidth = 14;
    canvasContext.strokeStyle = isQuestion ? '#ec4899' : '#10b981';
    canvasContext.strokeRect(7, 7, 498, 306);

    canvasContext.fillStyle = isQuestion ? '#f43f5e' : '#34d399';
    canvasContext.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(isQuestion ? '⚡ QUESTION' : '✨ ANSWER', 256, 52);

    canvasContext.fillStyle = '#ffffff';
    canvasContext.font = '22px "Plus Jakarta Sans", sans-serif';

    const words = text.split(' ');
    let line = '';
    let y = 130;
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = canvasContext.measureText(testLine);
        if (metrics.width > 420 && n > 0) {
            canvasContext.fillText(line, 256, y);
            line = words[n] + ' ';
            y += 34;
        } else {
            line = testLine;
        }
    }
    canvasContext.fillText(line, 256, y);

    canvasTexture.needsUpdate = true;
}

function animate3D() {
    requestAnimationFrame(animate3D);

    if (stars) stars.rotation.y += 0.0008;

    if (cardMesh) {
        cardMesh.position.y = Math.sin(Date.now() * 0.0025) * 0.12;
        currentRotationY += (targetRotationY - currentRotationY) * 0.1;
        cardMesh.rotation.y = currentRotationY;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function toggle3DMode() {
    is3DMode = !is3DMode;
    const btn = document.getElementById('toggle-3d-btn');
    const threeContainer = document.getElementById('three-container');

    if (is3DMode) {
        btn.textContent = '🎮 3D Arena: ON';
        threeContainer.classList.remove('hidden');
        init3DArena();
    } else {
        btn.textContent = '🎮 3D Arena: OFF';
        threeContainer.classList.add('hidden');
    }
    updateDisplay();
}

function updateGamificationUI() {
    const levelBadge = document.getElementById('player-level');
    const xpFill = document.getElementById('xp-bar-fill');
    const xpText = document.getElementById('xp-text');
    const streakBadge = document.getElementById('player-streak');
    const comboBadge = document.getElementById('player-combo');

    if (levelBadge) levelBadge.textContent = `Level ${playerStats.level}`;
    const xpNeeded = getXPForNextLevel(playerStats.level);
    const xpPct = Math.min(100, Math.floor((playerStats.xp / xpNeeded) * 100));

    if (xpFill) xpFill.style.width = `${xpPct}%`;
    if (xpText) xpText.textContent = `${playerStats.xp} / ${xpNeeded} XP`;
    if (streakBadge) streakBadge.textContent = `🔥 ${playerStats.streak} Days`;
    if (comboBadge) comboBadge.textContent = `⚡ Combo x${playerStats.combo}`;
}

function exportDataJSON() {
    const exportObject = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        decks: decks,
        cards: cards,
        playerStats: playerStats
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `flashlearn_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function exportDataCSV() {
    const active = getActiveCards();
    if (active.length === 0) {
        alert('No cards available to export in current deck.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,ID,Deck,Question,Answer,Repetitions,EaseFactor,Interval,DueDate\n";
    const currentDeck = decks.find(d => d.id === currentDeckId);

    active.forEach(c => {
        const row = [
            c.id,
            `"${(currentDeck?.name || 'Default').replace(/"/g, '""')}"`,
            `"${c.question.replace(/"/g, '""')}"`,
            `"${c.answer.replace(/"/g, '""')}"`,
            c.repetitions || 0,
            c.easeFactor || 2.5,
            c.interval || 0,
            c.dueDate || ''
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `deck_${currentDeckId}_cards.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function importDataFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        try {
            if (file.name.endsWith('.json')) {
                const imported = JSON.parse(content);
                if (imported.decks) {
                    imported.decks.forEach(d => {
                        if (!decks.some(existing => existing.id === d.id)) decks.push(d);
                    });
                }
                if (imported.cards) {
                    imported.cards.forEach(c => {
                        if (!cards.some(existing => existing.id === c.id)) cards.push(c);
                    });
                }
                saveDecks();
                saveCards();
                alert('JSON Import successful!');
            } else if (file.name.endsWith('.csv')) {
                const lines = content.split('\n').filter(line => line.trim());
                let addedCount = 0;
                for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                    if (parts && parts.length >= 2) {
                        const q = parts[parts.length - 2].replace(/^"|"$/g, '').replace(/""/g, '"');
                        const a = parts[parts.length - 1].replace(/^"|"$/g, '').replace(/""/g, '"');
                        cards.push({
                            id: Date.now() + i,
                            question: q,
                            answer: a,
                            deckId: currentDeckId,
                            created: new Date().toLocaleDateString(),
                            timesReviewed: 0,
                            easeFactor: 2.5,
                            interval: 0,
                            repetitions: 0,
                            dueDate: new Date().toISOString()
                        });
                        addedCount++;
                    }
                }
                saveCards();
                alert(`CSV Import successful! Added ${addedCount} cards.`);
            }
            updateDeckSelect();
            updateDisplay();
            checkBadges();
        } catch (err) {
            alert('Failed to import file. Please check format.');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

function editCurrentCard() {
    const active = getActiveCards();
    if (active.length === 0) return;

    const card = active[currentCardIndex];
    const newQuestion = prompt('Edit Question:', card.question);
    if (newQuestion === null) return;
    const newAnswer = prompt('Edit Answer:', card.answer);
    if (newAnswer === null) return;

    if (!newQuestion.trim() || !newAnswer.trim()) {
        alert('Question and Answer cannot be empty!');
        return;
    }

    card.question = newQuestion.trim();
    card.answer = newAnswer.trim();
    saveCards();
    updateDisplay();
}

function shuffleCurrentDeck() {
    const active = getActiveCards();
    if (active.length <= 1) return;

    for (let i = active.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = active[i];
        active[i] = active[j];
        active[j] = temp;
    }

    let idx = 0;
    cards = cards.map(c => {
        if (c.deckId === currentDeckId && (!searchQuery || active.includes(c))) {
            return active[idx++];
        }
        return c;
    });

    currentCardIndex = 0;
    showingQuestion = true;
    saveCards();
    updateDisplay();
}

function savePlayerStats() {
    try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(playerStats));
    } catch (e) {
        console.error('Failed to save player stats:', e);
    }
}

function loadPlayerStats() {
    try {
        const data = localStorage.getItem(STATS_STORAGE_KEY);
        if (data) {
            playerStats = { ...playerStats, ...JSON.parse(data) };
        }
    } catch (e) {
        console.error('Failed to load player stats:', e);
    }
}

function saveCards() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: '2.0', cards: cards }));
    } catch (e) {
        console.error('Save failed:', e);
    }
}

function loadCards() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) { cards = []; return; }
        cards = (JSON.parse(savedData)).cards || [];
    } catch (e) {
        cards = [];
    }
}

function saveDecks() {
    try {
        localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify({ version: '2.0', decks: decks }));
    } catch (e) {
        console.error('Failed to save decks:', e);
    }
}

function loadDecks() {
    try {
        const savedData = localStorage.getItem(DECKS_STORAGE_KEY);
        if (!savedData) {
            decks = [{ id: 'default', name: 'Default Deck', created: new Date().toLocaleDateString(), description: 'Main flashcards' }];
            saveDecks();
            return;
        }
        decks = (JSON.parse(savedData)).decks || [];
    } catch (e) {
        decks = [{ id: 'default', name: 'Default Deck', created: new Date().toLocaleDateString(), description: 'Main flashcards' }];
    }
}

function triggerLevelUpAnimation(newLevel) {
    if (typeof confetti === 'function') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
    console.log(`🎉 Level Up! You reached level ${newLevel}`);
}

function triggerBadgeNotification(badge) {
    if (typeof confetti === 'function') {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    }
    console.log(`🏆 Badge Unlocked: ${badge.name} (${badge.icon}) - ${badge.desc}`);
}

function initializeApp() {
    cacheDOMElements();
    bindEventListeners();
    loadTheme();
    loadDecks();
    loadCards();
    loadPlayerStats();
    updateDeckSelect();
    updateGamificationUI();
    updateDisplay();
}

initializeApp();
