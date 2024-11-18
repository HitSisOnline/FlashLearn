// Global variables to store our flashcards and current state
let cards = []; // Array to store all flashcard objects
let currentCardIndex = 0; // Index of currently displayed card
let showingQuestion = true; // Track if we're showing question or answer
let isStudyMode = false; // Track if we're in study mode

// LocalStorage key for persistence
const STORAGE_KEY = 'flashlearn-cards';

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

// Event listeners setup
addCardForm.addEventListener('submit', handleAddCard);
prevBtn.addEventListener('click', showPreviousCard);
nextBtn.addEventListener('click', showNextCard);
flipBtn.addEventListener('click', flipCard);
deleteBtn.addEventListener('click', deleteCurrentCard);
startStudyBtn.addEventListener('click', enterStudyMode);
exitStudyBtn.addEventListener('click', exitStudyMode);

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
        console.error('Failed to save cards to localStorage:', error);
        // Could show user notification here in the future
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
    if (cards.length === 0) {
        // No cards available - show empty state
        cardContainer.innerHTML = '<div class="no-cards">Create your first flashcard to get started!</div>';
        cardCounter.textContent = 'No cards available';
        disableAllButtons();
        return;
    }
    
    const currentCard = cards[currentCardIndex];
    const content = showingQuestion ? currentCard.question : currentCard.answer;
    const cardType = showingQuestion ? 'Question' : 'Answer';
    
    // Update the card display with current content
    cardContainer.innerHTML = `
        <div class="card">
            <div class="card-content">${content}</div>
        </div>
    `;
    
    // Update the counter with current position and type
    cardCounter.textContent = `Card ${currentCardIndex + 1} of ${cards.length} (${cardType})`;
    
    // Update study mode progress if active
    if (isStudyMode) {
        updateStudyProgress();
    }
    
    // Update navigation button states
    updateButtonStates();
    
    // Track card views when showing answer
    if (!showingQuestion) {
        currentCard.timesReviewed++;
    }
}

/**
 * Update button enabled/disabled states based on current position
 * Prevents navigation beyond array bounds
 */
function updateButtonStates() {
    const hasCards = cards.length > 0;
    
    // Enable/disable navigation buttons based on position
    prevBtn.disabled = !hasCards || currentCardIndex === 0;
    nextBtn.disabled = !hasCards || currentCardIndex === cards.length - 1;
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
    if (cards.length === 0) return;
    
    const currentCard = cards[currentCardIndex];
    const confirmMessage = `Are you sure you want to delete this card?\n\n"${currentCard.question.substring(0, 50)}..."`;
    
    if (confirm(confirmMessage)) {
        cards.splice(currentCardIndex, 1);
        
        // Save to localStorage after deletion
        saveCards();
        
        // Adjust current index if we deleted the last card
        if (currentCardIndex >= cards.length && cards.length > 0) {
            currentCardIndex = cards.length - 1;
        }
        
        showingQuestion = true;
        updateDisplay();
        
        console.log('Card deleted, remaining cards:', cards.length); // Debug log
    }
}

/**
 * Enter study mode - hide form controls and focus on review
 */
function enterStudyMode() {
    if (cards.length === 0) return;
    
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
    console.log('Entered study mode'); // Debug log
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
    
    const progress = currentCardIndex + 1;
    const total = cards.length;
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
 * Initialize the application
 * Load saved data and set up initial state
 */
function initializeApp() {
    // Load any previously saved cards first
    loadCards();
    
    updateDisplay();
    questionInput.focus(); // Focus on first input for immediate use
    
    // TODO: Add keyboard shortcuts for navigation (Space for flip, arrows for prev/next)
    // Save data periodically as backup (every 30 seconds)
    setInterval(saveCards, 30000);
}

// Start the app when DOM is ready
initializeApp();
