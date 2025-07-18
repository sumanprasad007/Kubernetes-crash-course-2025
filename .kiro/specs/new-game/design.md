# Design Document

## Overview

This design document outlines the implementation of a new game feature for the existing gaming platform. Based on the analysis of the current architecture, the new game will be a **Memory Card Matching Game** (also known as Concentration or Pairs). This game type provides engaging gameplay while fitting well within the existing platform's patterns and technical constraints.

The Memory Card Matching Game will follow the established architectural patterns:
- React component-based frontend with consistent styling
- Integration with the existing authentication system
- Game statistics tracking via backend API
- Responsive design with Tailwind CSS
- Protected routing through PrivateRoute component

## Architecture

### Frontend Architecture
The new game will be implemented as a React functional component following the same patterns as existing games:

```
frontend/src/components/
├── MemoryGame.js          # Main game component
├── Dashboard.js           # Updated to include new game link
└── App.js                 # Updated routing configuration
```

### Backend Integration
The game will integrate with the existing game-service backend:
- Utilize existing `/game/stats` endpoint for win/loss tracking
- Follow the same JWT authentication pattern
- Use the same database schema (`games_stats` table)

### Database Schema
No new database tables required. The game will use the existing `games_stats` table:
```sql
games_stats (
  user_id INT,
  game_type VARCHAR,  -- 'memory-game'
  wins INT,
  losses INT
)
```

## Components and Interfaces

### MemoryGame Component

**State Management:**
```javascript
const [cards, setCards] = useState([])           // Array of card objects
const [flippedCards, setFlippedCards] = useState([])  // Currently flipped card indices
const [matchedPairs, setMatchedPairs] = useState([])  // Matched card pairs
const [moves, setMoves] = useState(0)            // Number of moves made
const [gameWon, setGameWon] = useState(false)    // Game completion status
const [gameStarted, setGameStarted] = useState(false)  // Game state
```

**Card Object Structure:**
```javascript
{
  id: number,        // Unique identifier
  symbol: string,    // Card symbol/emoji
  isFlipped: boolean,// Current flip state
  isMatched: boolean // Whether card is matched
}
```

**Key Methods:**
- `initializeGame()` - Sets up new game with shuffled cards
- `handleCardClick(cardId)` - Handles card selection logic
- `checkForMatch()` - Evaluates if two flipped cards match
- `resetGame()` - Resets game state for new game
- `updateGameStats(won)` - Sends statistics to backend

### Dashboard Integration

**Updated Dashboard Component:**
- Add new game link in the games navigation section
- Update leaderboard table to include Memory Game statistics
- Maintain existing styling and layout patterns

**Backend API Integration:**
- Extend `/users/scores` endpoint response to include memory game stats
- Use existing `/game/stats` endpoint with `game_type: 'memory-game'`

## Data Models

### Game Configuration
```javascript
const GAME_CONFIG = {
  GRID_SIZE: 16,           // 4x4 grid (8 pairs)
  CARD_SYMBOLS: ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎪', '🎸'],
  FLIP_DELAY: 1000,        // Delay before hiding non-matching cards
  DIFFICULTY_LEVELS: {
    EASY: { pairs: 6, gridCols: 3 },
    MEDIUM: { pairs: 8, gridCols: 4 },
    HARD: { pairs: 12, gridCols: 4 }
  }
}
```

### API Request/Response Models

**Game Stats Update Request:**
```javascript
{
  game_type: 'memory-game',
  wins: 1,      // 1 if game won, 0 if lost
  losses: 0     // 1 if game lost, 0 if won
}
```

**Scores Response (Extended):**
```javascript
{
  username: string,
  snake_high_score: number,
  tic_tac_toe_wins: number,
  tic_tac_toe_losses: number,
  rps_wins: number,
  rps_losses: number,
  memory_game_wins: number,    // New field
  memory_game_losses: number   // New field
}
```

## Error Handling

### Frontend Error Handling
- **Card Flip Errors:** Prevent flipping already matched or currently flipped cards
- **API Errors:** Log backend communication errors without disrupting gameplay
- **State Errors:** Validate game state transitions to prevent invalid states
- **Performance:** Implement debouncing for rapid card clicks

### Backend Error Handling
- Utilize existing error handling patterns in game-service
- JWT token validation follows existing authentication flow
- Database connection errors handled by existing retry logic

### Error Recovery
- Game state corruption: Provide "Reset Game" option
- API failures: Continue gameplay locally, retry stats update
- Network issues: Queue stats updates for retry when connection restored

## Testing Strategy

### Unit Testing
**Frontend Component Tests:**
- Card flip logic and state management
- Game win/loss detection
- Statistics calculation accuracy
- Component rendering with different game states

**Test Cases:**
```javascript
describe('MemoryGame', () => {
  test('initializes game with correct number of cards')
  test('flips cards correctly on click')
  test('detects matching pairs')
  test('prevents flipping matched cards')
  test('calculates moves correctly')
  test('detects game completion')
  test('resets game state properly')
})
```

### Integration Testing
- **API Integration:** Test game stats submission with mock backend
- **Authentication:** Verify JWT token handling
- **Routing:** Test navigation to/from game component
- **Dashboard Integration:** Verify leaderboard updates

### User Experience Testing
- **Responsive Design:** Test on mobile, tablet, and desktop viewports
- **Performance:** Ensure smooth animations and transitions
- **Accessibility:** Keyboard navigation and screen reader compatibility
- **Cross-browser:** Test on Chrome, Firefox, Safari, Edge

### Backend Testing
- **Existing Endpoints:** Verify `/game/stats` handles new game type
- **Database Operations:** Test stats insertion and updates
- **Error Scenarios:** Test with invalid tokens, missing data

## Implementation Approach

### Phase 1: Core Game Logic
1. Create basic MemoryGame component structure
2. Implement card grid generation and shuffling
3. Add card flip mechanics and matching logic
4. Implement game state management (moves, completion)

### Phase 2: UI/UX Implementation
1. Apply consistent styling with existing games
2. Add animations for card flips and matches
3. Implement responsive grid layout
4. Add game controls (reset, difficulty selection)

### Phase 3: Backend Integration
1. Integrate JWT authentication
2. Implement game statistics tracking
3. Add error handling for API calls
4. Test backend communication

### Phase 4: Platform Integration
1. Update Dashboard component with new game link
2. Extend leaderboard to show memory game stats
3. Update App.js routing configuration
4. Add PrivateRoute protection

### Technical Considerations

**Performance Optimizations:**
- Use React.memo for card components to prevent unnecessary re-renders
- Implement efficient card shuffling algorithm (Fisher-Yates)
- Optimize animation performance with CSS transforms

**Accessibility:**
- Add ARIA labels for screen readers
- Implement keyboard navigation (Tab, Enter, Space)
- Ensure sufficient color contrast for card states
- Provide alternative text for card symbols

**Mobile Responsiveness:**
- Touch-friendly card sizes (minimum 44px touch targets)
- Responsive grid that adapts to screen width
- Optimized animations for mobile performance
- Prevent zoom on double-tap

This design ensures the Memory Card Matching Game integrates seamlessly with the existing platform while providing an engaging new gaming experience for users.