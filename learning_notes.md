# Learning Notes - FlashLearn Development

## 2024-10-14
**First prototype completed**

Created the initial single-file flashcard app for my web development coursework. Key learning points:
- DOM manipulation with vanilla JavaScript is more verbose than expected but gives good control
- CSS variables make theming much easier to manage
- Form validation and user feedback are crucial for good UX
- Array methods like splice() are handy for managing dynamic lists

**Challenges faced:**
- Getting the card flip functionality to feel smooth
- Managing state between question/answer views
- Making the layout responsive without using a framework

**What worked well:**
- Single-file approach keeps everything simple for now
- CSS hover effects add nice polish
- Event listeners make the UI feel interactive

**Next steps:**
- Maybe split into separate files for better organization
- Need to add persistence so cards don't disappear on refresh
- Could use keyboard shortcuts for better navigation

## 2024-10-21
**Refactored to separate files**

Finally split the monolithic HTML file into separate CSS and JS files. This feels much cleaner and more professional:
- `styles.css` - All styling separated out, added more CSS variables for consistency
- `script.js` - JavaScript logic isolated, better comments and structure
- Improved responsive design with better Flexbox layouts
- Added some CSS experiments I found online (backdrop-filter, better animations)

**What I learned:**
- File organization makes debugging much easier
- CSS variables are super powerful for theming
- Better commenting in JS helps when coming back to code later
- Responsive design needs more testing on different screen sizes

**Improvements made:**
- Enhanced button hover effects with transform and shadows
- Better spacing and typography throughout
- Improved form focus states for accessibility
- Added fade-in animations for smoother UX

**Still need to work on:**
- Adding persistence with localStorage
- Maybe some keyboard shortcuts for power users

## 2024-11-04
**Added localStorage persistence**

Finally tackled the persistence issue! Cards now save automatically to localStorage and load when you refresh the page:
- Implemented `saveCards()` and `loadCards()` functions with error handling
- Added data versioning for future migration compatibility  
- Cards save immediately when added/deleted, plus auto-save every 30 seconds
- Built-in migration logic to handle old data formats gracefully

**Technical lessons learned:**
- localStorage can fail (storage quota, private browsing), so try/catch is essential
- JSON.stringify/parse for complex objects works well for simple persistence
- Adding version info to saved data makes future updates much easier
- Browser dev tools localStorage inspector is super helpful for debugging

**What surprised me:**
- How simple localStorage API is compared to what I expected
- The importance of handling edge cases (empty storage, corrupted data)
- Setting up periodic auto-save gives peace of mind

**Next priorities:**
- Study mode for focused review sessions
- Maybe deck organization for different subjects

## 2024-11-18
**Added Study Mode for focused review**

Implemented a dedicated study mode that really improves the learning experience:
- Toggle between normal editing and focused study interface
- Progress tracking shows "Progress: 3 / 10" style indicators  
- Automatically starts from first card for systematic review
- Disables editing functions (like delete) to prevent accidents
- Celebration message when completing a study session

**Technical implementation:**
- Used CSS classes (.study-mode) to toggle UI states
- Added new DOM elements for progress tracking
- Mode switching through simple boolean flag (isStudyMode)
- Event delegation keeps code clean and organized

**UX insights:**
- Hiding the form during study reduces distractions significantly
- Progress indicator provides motivation to complete sessions
- Starting from card 1 each time feels more systematic
- The completion celebration encourages continued use

**What I learned:**
- CSS class toggling is powerful for mode switching
- setTimeout for delayed interactions (completion dialog) works well
- User feedback (progress, completion) is crucial for engagement

**Next steps:**
- Deck organization for subject separation (Math, History, etc.)
- Maybe card shuffle option for variety

## 2024-12-02
**Added Deck Organization System**

Implemented a complete deck system for organizing flashcards by subject or topic:
- Created deck objects with ID, name, creation date, and description
- Added dropdown selector to switch between decks instantly
- Simple "New Deck" button with prompt-based creation
- Cards now have deckId property to associate them with specific decks
- Automatic filtering shows only cards from the currently selected deck

**Technical implementation:**
- New localStorage key for deck persistence (flashlearn-decks)
- Separate deck management functions (saveDecks, loadDecks, updateDeckSelect)
- Modified card display logic to filter by currentDeckId
- Updated all navigation to work with filtered card arrays
- Added deck switching logic that resets card position

**Data structure decisions:**
- Each card has deckId property linking it to a deck
- Default deck (id: 'default') always exists for backward compatibility
- Deck IDs use timestamp-based generation like cards
- Cards filter in real-time based on selected deck

**UX considerations:**
- Deck controls hidden during study mode to reduce distractions
- Switching decks automatically exits study mode for clarity
- New deck creation immediately switches to that deck
- Default deck ensures existing cards remain accessible

**Limitations intentionally left for now:**
- No deck rename/delete functionality (kept simple)
- No deck import/export (TODO for future)
- No card moving between decks (can be added later)

**What I learned:**
- Filtering arrays in real-time works smoothly for this use case
- Dropdown state management needs careful attention
- Having a default deck prevents edge cases with empty deck lists
- Simple prompt() for deck creation is enough for MVP

## 2024-11-18
**Added Study Mode functionality**

Implemented a focused study mode that hides editing controls and provides sequential review:
- "Start Study Mode" button that switches to review-only interface
- Progress indicator showing "current / total" cards reviewed
- Auto-disables delete button during study to prevent accidents
- Completion message with option to restart or exit when reaching the end
- Clean UI toggle between normal and study modes

**Technical implementation:**
- Added `isStudyMode` boolean flag and CSS class toggling
- New functions: `enterStudyMode()`, `exitStudyMode()`, `updateStudyProgress()`
- DOM manipulation to show/hide relevant UI elements
- Smart button state management based on current mode

**UX insights:**
- Study mode feels much more focused without the form distractions
- Progress indicator gives good sense of accomplishment
- Starting from card 1 each session provides consistency
- Completion celebration encourages continued use

**What I learned:**
- CSS class toggling is powerful for mode switching
- setTimeout with user confirmation creates nice flow for session completion
- Conditional logic in existing functions (like updateButtonStates) keeps code clean

**TODO for next time:**
- Deck organization for different subjects
- Maybe keyboard shortcuts for faster navigation
