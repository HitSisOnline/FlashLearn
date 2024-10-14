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
