// Global variables to store our flashcards and current state
let cards = []; // Array to store all flashcard objects
let decks = []; // Array to store deck objects
let currentCardIndex = 0; // Index of currently displayed card
let showingQuestion = true; // Track if we're showing question or answer
let isStudyMode = false; // Track if we're in study mode
let currentDeckId = 'default'; // Currently selected deck

// LocalStorage keys for persistence
const STORAGE_KEY = 'flashlearn-cards';
const DECKS_STORAGE_KEY = 'flashlearn-decks';

// DOM element references - cache these for better performance
const addCardForm = document.getElementById('add-card-form');
const questionInput = document.getElementById('question');
const answerInput = document.getElementById('answer');
const cardContainer = document.getElementById('card-container');
const cardCounter = document.getElementById('card-counter');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const flipBtn = document.getElementById('flip-btn');
const deleteBtn = document.getElementById('delete-btn');
const startStudyBtn = document.getElementById('start-study-btn');
const exitStudyBtn = document.getElementById('exit-study-btn');
const studyProgress = document.getElementById('study-progress');
const progressText = document.getElementById('progress-text');
const deckSelect = document.getElementById('deck-select');
const newDeckBtn = document.getElementById('new-deck-btn');
const deleteDeckBtn = document.getElementById('delete-deck-btn');
const keyboardHints = document.getElementById('keyboard-hints');

// Event listeners setup
addCardForm.addEventListener('submit', handleAddCard);
prevBtn.addEventListener('click', showPreviousCard);
nextBtn.addEventListener('click', showNextCard);
flipBtn.addEventListener('click', flipCard);
deleteBtn.addEventListener('click', deleteCurrentCard);
startStudyBtn.addEventListener('click', enterStudyMode);
exitStudyBtn.addEventListener('click', exitStudyMode);
deckSelect.addEventListener('change', handleDeckChange);
newDeckBtn.addEventListener('click', createNewDeck);
deleteDeckBtn.addEventListener('click', deleteDeck);

// Keyboard shortcuts
document.addEventListener('keydown', handleKeyboardShortcuts);

console.log('FlashLearn app initialized with separate JS file'); // Debug log

/**
 * Save cards to localStorage for persistence
 */
function saveCards() {
    try {
        const cardsData = {
            version: '1.0', // For future migration compatibility
            cards: cards,
            lastModified: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cardsData));
        console.log('Cards saved to localStorage:', cards.length); // Debug log
    } catch (error) {
        // Learned about try-catch from Stack Overflow
        console.log('Save failed:', error);
    }
}

/**
 * Load cards from localStorage with migration support
 */
function loadCards() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            console.log('No saved cards found, starting fresh');
            return;
        }
        
        const parsedData = JSON.parse(savedData);
        
        // Handle different data formats for backward compatibility
        if (Array.isArray(parsedData)) {
            // Old format - direct array of cards
            console.log('Migrating from old card format');
            cards = parsedData.map(card => ({
                ...card,
                timesReviewed: card.timesReviewed || 0,
                created: card.created || new Date().toLocaleDateString()
            }));
        } else if (parsedData.version && parsedData.cards) {
            // New format with version info
            cards = parsedData.cards;
        }
        
        console.log('Loaded cards from localStorage:', cards.length);
        
        // Reset to first card if we have any
        if (cards.length > 0) {
            currentCardIndex = 0;
            showingQuestion = true;
        }
        
    } catch (error) {
        console.error('Failed to load cards from localStorage:', error);
        // Start fresh if we can't load saved data
        cards = [];
    }
}

/**
 * Save decks to localStorage
 */
function saveDecks() {
    try {
        const decksData = {
            version: '1.0',
            decks: decks,
            lastModified: new Date().toISOString()
        };
        localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decksData));
        console.log('Decks saved to localStorage:', decks.length);
    } catch (error) {
        console.error('Failed to save decks to localStorage:', error);
    }
}

/**
 * Load decks from localStorage
 */
function loadDecks() {
    try {
        const savedData = localStorage.getItem(DECKS_STORAGE_KEY);
        if (!savedData) {
            // Create default deck if none exist
            decks = [{
                id: 'default',
                name: 'Default Deck',
                created: new Date().toLocaleDateString(),
                description: 'Your main flashcard collection'
            }];
            saveDecks();
            return;
        }
        
        const parsedData = JSON.parse(savedData);
        decks = parsedData.decks || [];
        
        // Ensure default deck exists
        if (!decks.find(deck => deck.id === 'default')) {
            decks.unshift({
                id: 'default',
                name: 'Default Deck',
                created: new Date().toLocaleDateString(),
                description: 'Your main flashcard collection'
            });
        }
        
        console.log('Loaded decks from localStorage:', decks.length);
        
    } catch (error) {
        console.error('Failed to load decks from localStorage:', error);
        decks = [{
            id: 'default',
            name: 'Default Deck',
            created: new Date().toLocaleDateString(),
            description: 'Your main flashcard collection'
        }];
    }
}

/**
 * Handle form submission to add a new flashcard
 * Validates input and creates new card object
 */
function handleAddCard(event) {
    event.preventDefault();
    
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();
    
    // Basic validation with improved user feedback
    if (!question || !answer) {
        alert('Please fill in both question and answer!');
        // Focus on empty field for better UX
        if (!question) {
            questionInput.focus();
        } else {
            answerInput.focus();
        }
        return;
    }
    
    // Create new card object with more metadata
    const newCard = {
        id: Date.now(), // Simple ID generation using timestamp
        question: question,
        answer: answer,
        deckId: currentDeckId, // Associate with current deck
        created: new Date().toLocaleDateString(),
        timesReviewed: 0 // Track how many times this card has been viewed
    };
    
    // Add to cards array
    cards.push(newCard);
    console.log('Added new card:', newCard.question.substring(0, 30) + '...'); // Debug log
    
    // Save to localStorage immediately
    saveCards();
    
    // Clear form inputs
    questionInput.value = '';
    answerInput.value = '';
    
    // Update display to show the newly added card
    currentCardIndex = cards.length - 1;
    showingQuestion = true;
    updateDisplay();
    
    // Give user feedback about successful creation
    questionInput.focus(); // Ready for next card
}

/**
 * Display the current card (question or answer side)
 * Handles both content and UI state updates
 */
function updateDisplay() {
    // Filter cards by current deck
    const currentDeckCards = getCardsForCurrentDeck();
    
    if (currentDeckCards.length === 0) {
        // No cards available - show empty state
        const deckName = decks.find(d => d.id === currentDeckId)?.name || 'Current Deck';
        cardContainer.innerHTML = `<div class="no-cards">No flashcards in "${deckName}" yet.<br>Create your first card to get started!</div>`;
        cardCounter.textContent = 'No cards available';
        disableAllButtons();
        return;
    }
    
    // Make sure currentCardIndex is valid for filtered cards
    if (currentCardIndex >= currentDeckCards.length) {
        currentCardIndex = 0;
    }
    
    const currentCard = currentDeckCards[currentCardIndex];
    const content = showingQuestion ? currentCard.question : currentCard.answer;
    const cardType = showingQuestion ? 'Question' : 'Answer';
    
    // Update the card display with current content
    cardContainer.innerHTML = `
        <div class="card">
            <div class="card-content">${content}</div>
        </div>
    `;
    
    // Update the counter with current position and type
    cardCounter.textContent = `Card ${currentCardIndex + 1} of ${currentDeckCards.length} (${cardType})`;
    
    // Update study mode progress if active
    if (isStudyMode) {
        updateStudyProgress();
    }
    
    // Update navigation button states
    updateButtonStates();
    
    // Track card views when showing answer
    if (!showingQuestion) {
        currentCard.timesReviewed++;
        saveCards(); // Save the updated review count
    }
}

/**
 * Update button enabled/disabled states based on current position
 * Prevents navigation beyond array bounds
 */
function updateButtonStates() {
    const currentDeckCards = getCardsForCurrentDeck();
    const hasCards = currentDeckCards.length > 0;
    
    // Enable/disable navigation buttons based on position
    prevBtn.disabled = !hasCards || currentCardIndex === 0;
    nextBtn.disabled = !hasCards || currentCardIndex === currentDeckCards.length - 1;
    flipBtn.disabled = !hasCards;
    deleteBtn.disabled = !hasCards || isStudyMode; // Disable delete in study mode
    
    // Study mode button states
    startStudyBtn.disabled = !hasCards;
}

/**
 * Disable all control buttons (used when no cards exist)
 */
function disableAllButtons() {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    flipBtn.disabled = true;
    deleteBtn.disabled = true;
}

/**
 * Navigate to previous card
 * Always starts with question side
 */
function showPreviousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showingQuestion = true; // Always start with question
        updateDisplay();
    }
}

/**
 * Navigate to next card
 * Always starts with question side
 */
function showNextCard() {
    if (currentCardIndex < cards.length - 1) {
        currentCardIndex++;
        showingQuestion = true; // Always start with question
        updateDisplay();
    }
}

/**
 * Flip current card between question and answer
 * Core flashcard functionality for active recall
 */
function flipCard() {
    if (cards.length > 0) {
        showingQuestion = !showingQuestion;
        updateDisplay();
    }
}

/**
 * Delete the current card after confirmation
 * Handles index adjustment and edge cases
 */
function deleteCurrentCard() {
    const currentDeckCards = getCardsForCurrentDeck();
    if (currentDeckCards.length === 0) return;
    
    const currentCard = currentDeckCards[currentCardIndex];
    const confirmMessage = `Are you sure you want to delete this card?\n\n"${currentCard.question.substring(0, 50)}..."`;
    
    if (confirm(confirmMessage)) {
        // Find and remove the card from the main cards array
        const cardIndex = cards.findIndex(card => card.id === currentCard.id);
        if (cardIndex > -1) {
            cards.splice(cardIndex, 1);
        }
        
        // Save to localStorage after deletion
        saveCards();
        
        // Adjust current index if we deleted the last card in current deck
        const updatedDeckCards = getCardsForCurrentDeck();
        if (currentCardIndex >= updatedDeckCards.length && updatedDeckCards.length > 0) {
            currentCardIndex = updatedDeckCards.length - 1;
        }
        
        showingQuestion = true;
        updateDisplay();
        
        console.log('Card deleted, remaining cards in deck:', updatedDeckCards.length);
    }
}

/**
 * Enter study mode - hide form controls and focus on review
 */
function enterStudyMode() {
    const currentDeckCards = getCardsForCurrentDeck();
    if (currentDeckCards.length === 0) return;
    
    isStudyMode = true;
    document.body.classList.add('study-mode');
    
    // Reset to first card for systematic review
    currentCardIndex = 0;
    showingQuestion = true;
    
    // Update UI elements
    startStudyBtn.classList.add('hidden');
    exitStudyBtn.classList.remove('hidden');
    studyProgress.classList.remove('hidden');
    cardCounter.classList.add('hidden');
    
    updateDisplay();
    console.log('Entered study mode for deck:', currentDeckId);
}

/**
 * Exit study mode - restore normal editing interface
 */
function exitStudyMode() {
    isStudyMode = false;
    document.body.classList.remove('study-mode');
    
    // Reset UI elements
    startStudyBtn.classList.remove('hidden');
    exitStudyBtn.classList.add('hidden');
    studyProgress.classList.add('hidden');
    cardCounter.classList.remove('hidden');
    
    updateDisplay();
    console.log('Exited study mode'); // Debug log
}

/**
 * Update study progress indicator
 */
function updateStudyProgress() {
    if (!isStudyMode) return;
    
    const currentDeckCards = getCardsForCurrentDeck();
    const progress = currentCardIndex + 1;
    const total = currentDeckCards.length;
    progressText.textContent = `${progress} / ${total}`;
    
    // Add completion message when finished
    if (progress === total && !showingQuestion) {
        setTimeout(() => {
            if (confirm('🎉 Study session complete! Would you like to start over?')) {
                currentCardIndex = 0;
                showingQuestion = true;
                updateDisplay();
            } else {
                exitStudyMode();
            }
        }, 1000);
    }
}

/**
 * Get cards filtered by current deck
 */
function getCardsForCurrentDeck() {
    return cards.filter(card => card.deckId === currentDeckId);
}

/**
 * Handle deck selection change
 */
function handleDeckChange(event) {
    currentDeckId = event.target.value;
    currentCardIndex = 0;
    showingQuestion = true;
    
    // Exit study mode when switching decks
    if (isStudyMode) {
        exitStudyMode();
    }
    
    updateDisplay();
    console.log('Switched to deck:', currentDeckId);
    
    // Update delete button state when switching decks
    updateDeckSelect();
}

/**
 * Create a new deck
 */
function createNewDeck() {
    const deckName = prompt('Enter a name for the new deck:');
    if (!deckName || !deckName.trim()) return;
    
    const newDeck = {
        id: 'deck_' + Date.now(),
        name: deckName.trim(),
        created: new Date().toLocaleDateString(),
        description: `Custom deck: ${deckName.trim()}`
    };
    
    decks.push(newDeck);
    saveDecks();
    updateDeckSelect();
    
    // Switch to new deck
    currentDeckId = newDeck.id;
    deckSelect.value = currentDeckId;
    currentCardIndex = 0;
    showingQuestion = true;
    updateDisplay();
    updateDeckSelect(); // This will update the delete button state too
    
    console.log('Created new deck:', newDeck.name);
}

/**
 * Delete the current deck (with safety checks)
 */
function deleteDeck() {
    // Can't delete default deck - that would break everything
    if (currentDeckId === 'default') {
        alert('Cannot delete the Default Deck!');
        return;
    }
    
    // Make sure user really wants to delete
    const currentDeck = decks.find(d => d.id === currentDeckId);
    const deckCards = getCardsForCurrentDeck();
    
    let confirmMsg = `Delete deck "${currentDeck.name}"?`;
    if (deckCards.length > 0) {
        confirmMsg += `\n\nThis will also DELETE ${deckCards.length} flashcard(s) in this deck!`;
    }
    
    if (!confirm(confirmMsg)) return;
    
    // Remove all cards from this deck first
    cards = cards.filter(card => card.deckId !== currentDeckId);
    saveCards();
    
    // Remove the deck itself
    decks = decks.filter(deck => deck.id !== currentDeckId);
    saveDecks();
    
    // Switch back to default deck
    currentDeckId = 'default';
    currentCardIndex = 0;
    showingQuestion = true;
    
    // Update UI
    updateDeckSelect();
    updateDisplay();
    
    console.log('Deleted deck:', currentDeck.name);
}

/**
 * Update the deck selection dropdown
 */
function updateDeckSelect() {
    deckSelect.innerHTML = '';
    
    decks.forEach(deck => {
        const option = document.createElement('option');
        option.value = deck.id;
        option.textContent = deck.name;
        deckSelect.appendChild(option);
    });
    
    deckSelect.value = currentDeckId;
    
    // Update delete button state - can't delete default deck
    deleteDeckBtn.disabled = (currentDeckId === 'default');
}

/**
 * Handle keyboard shortcuts for better UX
 */
function handleKeyboardShortcuts(event) {
    // Don't interfere if user is typing in form fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
        return;
    }
    
    const currentDeckCards = getCardsForCurrentDeck();
    if (currentDeckCards.length === 0) return;
    
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
        case 'KeyS':
            if (event.shiftKey) {
                event.preventDefault();
                if (isStudyMode) {
                    exitStudyMode();
                } else {
                    enterStudyMode();
                }
            }
            break;
        case 'Escape':
            if (isStudyMode) {
                event.preventDefault();
                exitStudyMode();
            }
            break;
    }
}

/**
 * Initialize the application
 * Load saved data and set up initial state
 */
function initializeApp() {
    // Load any previously saved decks and cards
    loadDecks();
    loadCards();
    
    // Set up deck selector
    updateDeckSelect();
    
    updateDisplay();
    questionInput.focus(); // Focus on first input for immediate use
    
    // Show keyboard shortcuts hint to user
    console.log('💡 Keyboard shortcuts: Space (flip), ← → (navigate), Shift+S (toggle study mode), Esc (exit study)');
    
    // Show keyboard hints briefly on load
    showKeyboardHints();
    
    // TODO: Add card shuffle option for variety
    // Save data periodically as backup (every 30 seconds)
    setInterval(() => {
        saveCards();
        saveDecks();
    }, 30000);
}

/**
 * Show keyboard hints temporarily
 */
function showKeyboardHints() {
    keyboardHints.classList.add('show');
    setTimeout(() => {
        keyboardHints.classList.remove('show');
    }, 4000); // Hide after 4 seconds
}

// Start the app when DOM is ready
initializeApp();
