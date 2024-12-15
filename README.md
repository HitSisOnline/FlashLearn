# FlashLearn

A simple, lightweight flashcard application for studying and memorization with deck organization and study modes.

## Overview

FlashLearn is a minimal web-based flashcard app built as an academic prototype in October 2024, then progressively enhanced through December 2024. **Prototype built Oct 2024 during coursework; enhancements Nov–Dec 2024 while learning Git and best practices.** It allows users to create, organize, and review flashcards for effective learning across multiple subjects.

## Features

- **Add Flashcards**: Create question-answer pairs with a simple form
- **Deck Organization**: Organize cards into subject-specific decks (Math, History, etc.)
- **Study Mode**: Focused review interface with progress tracking
- **Card Navigation**: Browse through cards with Previous/Next buttons
- **Flip Functionality**: Click to reveal answers, promoting active recall
- **Keyboard Shortcuts**: Space (flip), arrows (navigate), Ctrl+S (study mode)
- **Delete Cards**: Remove unwanted flashcards
- **Persistent Storage**: Cards and decks automatically saved to browser storage
- **Responsive Design**: Works on desktop and mobile devices
- **Clean UI**: Minimalist interface focused on learning

## Usage

1. Open `index.html` in any modern web browser
2. **Create Decks**: Use the "New Deck" button to organize cards by subject
3. **Add Cards**: Fill in the question and answer fields, click "Add Flashcard"
4. **Study Mode**: Click "🎯 Start Study Mode" for focused review sessions
5. **Navigate**: Use Previous/Next buttons or arrow keys to browse cards
6. **Flip Cards**: Click the card or press Space to reveal answers
7. **Keyboard Shortcuts**:
   - **Space**: Flip current card
   - **← →**: Navigate between cards  
   - **Ctrl+S**: Toggle study mode
   - **Esc**: Exit study mode

## Screenshots
*[Screenshots would be placed here showing the main interface, study mode, and deck selection]*

## Technical Details

- **Pure HTML/CSS/JavaScript**: No frameworks or dependencies
- **Modular Architecture**: Separated CSS, JS, and HTML files
- **localStorage Persistence**: Cards and decks automatically saved and restored
- **Deck System**: Organize flashcards by subject with real-time filtering
- **Study Mode**: Distraction-free interface with progress tracking  
- **Responsive**: Uses Flexbox for mobile-friendly layout
- **Data Migration**: Supports upgrading from older storage formats
- **Keyboard Navigation**: Full keyboard support for efficient studying

## Academic Context

**Academic submission October 2024** - Created as a coursework prototype to demonstrate fundamental web development concepts including DOM manipulation, event handling, and responsive design. Progressively enhanced through November-December 2024 while learning Git workflows and software development best practices.

## Development Timeline

- **Oct 2024**: Initial single-file prototype with basic CRUD operations
- **Oct 2024**: Refactored to separate CSS/JS files, improved responsive design  
- **Nov 2024**: Added localStorage persistence and data migration
- **Nov 2024**: Implemented study mode with progress tracking
- **Dec 2024**: Added deck organization system for subject separation
- **Dec 2024**: Final polish with keyboard shortcuts and enhanced mobile support

## Known Issues

- Safari may show minor visual glitches during card flip animations
- No search or filtering capabilities yet
- Limited to single browser/device (no cloud sync)
- Deck rename/delete functionality not yet implemented

## Future Enhancements

- Persistent storage using localStorage
- Study modes and progress tracking
- Card categories/decks
- Import/export functionality

---

*Built with vanilla web technologies for learning and educational purposes.*
