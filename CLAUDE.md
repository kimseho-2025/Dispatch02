# CLAUDE.md - AI Assistant Guide for Dispatch Management System

## Project Overview

**Project Name**: 성우 배차 관리 시스템 (Sungwoo Dispatch Management System)
**Type**: Single-page web application
**Primary Language**: Korean
**Tech Stack**: Vanilla JavaScript, HTML5, IndexedDB, Tailwind CSS
**Architecture**: Client-side only (no backend)

### Purpose
A weekly dispatch scheduling system for managing vehicle assignments (방통차/집게차) for a logistics company. Users can schedule, track, and manage dispatch assignments across a weekly calendar view.

---

## Repository Structure

```
/Dispatch02
├── index.html          # Single-file application (all code included)
├── CHECKPOINT.md       # Comprehensive Korean documentation (1700+ lines)
├── README.md           # Basic project description
└── .git/              # Git repository
```

### Key Characteristics
- **Single-file architecture**: Everything is in `index.html` (HTML, CSS, JavaScript)
- **No build process**: Direct browser execution via file:// or HTTP server
- **No external dependencies**: Uses CDN for Tailwind CSS and SheetJS only
- **Browser storage**: IndexedDB for data persistence, localStorage for settings

---

## Core Technologies

### Frontend Stack
- **HTML5**: Semantic structure with accessibility considerations
- **Tailwind CSS 3.x**: Utility-first CSS framework (CDN)
- **Vanilla JavaScript (ES6+)**: No frameworks (React, Vue, etc.)
- **SheetJS (xlsx@0.18.5)**: Excel file generation

### Data Storage
- **IndexedDB**: Primary data store
  - Database: `dispatchDB` (version 2)
  - Stores:
    - `weekly_reports`: Dispatch schedule data (key: weekStart YYYY-MM-DD)
    - `access_logs`: User activity logs (auto-increment ID)
    - `error_logs`: Error tracking (auto-increment ID)
- **localStorage**: User preferences and settings
  - Writer authentication (name, PIN)
  - Company/loading location favorites
  - Vehicle count settings

### Browser Compatibility
- Chrome 90+ ✅ (Primary)
- Safari 14+ ✅ (macOS/iOS with specific fixes)
- Samsung Internet 14+ ✅
- Edge 90+ ✅
- Firefox 88+ ⚠️ (Untested but expected to work)

---

## Data Model

### Weekly Report Structure
```javascript
{
  weekStart: "2025-11-16",  // Sunday of the week (YYYY-MM-DD)
  rows: [                   // 8 rows by default
    [                       // 7 columns (Sunday to Saturday)
      {
        company: "정도철강",        // REQUIRED
        loading: "남양주",          // Optional
        time: "오후 2시",           // Free-form text
        bang: "방1" or "방 3~5대",  // Vehicle assignment
        jip: "집1" or "집 2~3대",   // Vehicle assignment
        contact: "010-1234-5678",  // Optional
        notes: "급배송",            // Optional
        author: "홍길동",            // Auto-filled
        status: "SCHEDULED"        // SCHEDULED | CONFIRMED | COMPLETED
      },
      // ... 6 more cells (one per day)
    ],
    // ... 7 more rows
  ]
}
```

### State Management
```javascript
// Global state variables (critical for data integrity)
let currentWeekStart = '';  // Current displayed week
let currentRow = -1;        // Active cell row (for editing)
let currentCol = -1;        // Active cell column (for editing)
let writer = { name: '', pin: '' };  // Authenticated user

// IMPORTANT: These must be synchronized via syncState() after any data move
```

---

## Critical Concepts for AI Assistants

### 1. State Synchronization System
**Problem**: When moving data between cells/dates, the global `currentRow/currentCol` must update to prevent data loss.

**Solution**: Always call `syncState(weekStart, row, col)` after:
- Saving data (`applyAndSave()`)
- Moving cells (`moveCell()`)
- Opening modals (`openPivotModal()`)

**Example**:
```javascript
function applyAndSave() {
  // ... save logic ...
  saveToIDB(data);
  syncState(newWeekStart, targetRow, targetCol); // ✅ Critical!
  loadWeek(currentWeekStart);
}
```

**Bug Reference**: See CHECKPOINT.md Section 5.1, Bug B1 for detailed explanation.

### 2. Safari Date Parsing
Safari requires special date parsing due to inconsistent ISO date handling.

**Always use**:
```javascript
function parseDate(dateString) {
  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateString.match(isoPattern);
  if (match) {
    return new Date(
      parseInt(match[1], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[3], 10)
    );
  }
  return new Date(dateString);
}
```

**Bug Reference**: CHECKPOINT.md Section 5.1, Bug B4

### 3. Mobile Touch Events
PC hover and mobile touch events are unified:

```javascript
// PC: Immediate display on hover
cellElement.addEventListener('mouseenter', () => showControls());
cellElement.addEventListener('mouseleave', () => hideControls());

// Mobile: Long-press (500ms) with vibration
cellElement.addEventListener('touchstart', (e) => {
  touchTimer = setTimeout(() => {
    showControls();
    navigator.vibrate(50); // Haptic feedback
  }, 500);
}, { passive: true });
```

### 4. iOS Keyboard Overlap Fix
Uses `visualViewport` API to prevent keyboard from covering input buttons:

```javascript
if ('visualViewport' in window) {
  window.visualViewport.addEventListener('resize', function() {
    // Auto-scroll modal when keyboard appears
    if (heightDiff > 100) {
      modalContent.scrollTop = modalContent.scrollHeight;
      modalContent.style.paddingBottom = heightDiff + 'px';
    }
  });
}
```

---

## Development Workflows

### Making Code Changes

1. **Read First**: Always use `Read` tool on `index.html` before editing
2. **Edit Carefully**: Use `Edit` tool with exact string matching
3. **Preserve Indentation**: HTML is heavily nested; maintain exact spacing
4. **Test Cross-Browser**: Changes affecting dates, IndexedDB, or events need Safari testing

### Adding New Features

**Example: Adding a new dispatch status**

1. Update `STATUS_MAP` object:
```javascript
const STATUS_MAP = {
  // ... existing statuses ...
  CANCELLED: {
    name: '취소',
    class: 'status-cancelled',
    color: 'bg-red-100 text-red-700'
  }
};
```

2. Add CSS class:
```css
.status-cancelled {
  background: linear-gradient(to right, #fee2e2, #fecaca);
  color: #991b1b;
  border-color: #ef4444;
}
```

3. Update HTML select:
```html
<select id="pivotStatus">
  <!-- existing options -->
  <option value="CANCELLED">취소</option>
</select>
```

### Common Tasks

#### Task: Search for a specific function
```bash
# Use Grep tool (not bash grep)
Grep(pattern="function openPivotModal", output_mode="content")
```

#### Task: Find all event listeners
```bash
Grep(pattern="addEventListener", output_mode="content", -C=2)
```

#### Task: Locate IndexedDB operations
```bash
Grep(pattern="getStore|saveToIDB|IndexedDB", output_mode="content")
```

---

## Key Functions Reference

### Core Data Operations

| Function | Purpose | Critical Notes |
|----------|---------|----------------|
| `initDB()` | Initialize IndexedDB | Called on page load; creates schema if not exists |
| `saveToIDB(data)` | Save week data | Returns Promise; handles transactions |
| `loadWeek(weekStart)` | Load week data | Renders both input and view tables |
| `syncState(week, row, col)` | Update global state | **MUST call after data moves** |
| `applyAndSave()` | Save modal data | Handles same-week and cross-week moves |

### UI Functions

| Function | Purpose | Mobile Considerations |
|----------|---------|----------------------|
| `openPivotModal(row, col)` | Open edit modal | Sets currentRow/Col immediately |
| `renderInputTable(data)` | Render editable table | Attaches touch + mouse events |
| `renderViewTable(data)` | Render readonly table | Click opens Focus View |
| `updatePivotPreview()` | Update modal preview | Real-time feedback |

### Utility Functions

| Function | Purpose | Browser Compat |
|----------|---------|----------------|
| `parseDate(str)` | Parse YYYY-MM-DD | Safari-compatible |
| `formatDate(date)` | Date to YYYY-MM-DD | Standard |
| `getWeekStart(date)` | Get Sunday of week | Timezone-aware |

---

## Bug Fixes Applied (Reference)

The codebase has 12 major bugs fixed (B1-B12). When working on related features:

### Most Critical Bugs to Understand

**B1: Data Move Loss** (CHECKPOINT.md:462-498)
- **Symptom**: Moving data between cells causes deletion
- **Fix**: Call `syncState()` after every save
- **Impact**: HIGH - Data integrity

**B6: Vehicle Range Validation** (CHECKPOINT.md:500-531)
- **Symptom**: Min/max vehicle range not validated
- **Fix**: Added `parseInt()` and min ≤ max check
- **Impact**: MEDIUM - User experience

**B8: Post-Auth Empty Table** (CHECKPOINT.md:469)
- **Symptom**: Blank table after authentication
- **Fix**: Call `loadWeek()` in `saveWriter()`
- **Impact**: HIGH - Critical flow

### All Bugs
See CHECKPOINT.md Section 5.1 for complete list with before/after code.

---

## Coding Conventions

### JavaScript Style
- **Variables**: camelCase (`currentWeekStart`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_ROWS`)
- **Functions**: camelCase (`openPivotModal`)
- **No semicolons**: Consistent omission (existing style)

### HTML/CSS
- **IDs**: camelCase (`pivotModal`, `weekDisplay`)
- **Classes**: Tailwind utilities + custom (`.cell-preview`, `.status-scheduled`)
- **Responsive**: Mobile-first with `md:` breakpoints

### Korean Language
- All user-facing text is in Korean
- Comments can be English (for AI assistants) or Korean
- When adding features, match existing Korean terminology:
  - 배차 = dispatch
  - 업체명 = company name
  - 상차지 = loading location
  - 방통차/집게차 = vehicle types

---

## IndexedDB Operations

### Reading Data
```javascript
function getStore(mode = 'readonly') {
  const tx = db.transaction(STORE_NAME, mode);
  return tx.objectStore(STORE_NAME);
}

// Usage
const store = getStore('readonly');
const req = store.get(weekStart);
req.onsuccess = (e) => {
  const data = e.target.result || createEmptyWeek(weekStart);
  // ... process data
};
req.onerror = (e) => {
  console.error('IDB error:', e.target.error);
};
```

### Writing Data
```javascript
function saveToIDB(data) {
  return new Promise((resolve, reject) => {
    const store = getStore('readwrite');
    if (!store) {
      reject('Store unavailable');
      return;
    }

    const req = store.put(data);
    req.onsuccess = () => resolve(data);
    req.onerror = (e) => reject(e.target.error);
  });
}
```

### Always Include Error Handlers
All IndexedDB requests MUST have `onerror` handlers (Bug B12).

---

## Testing Guidelines

### Manual Testing Checklist
When modifying code, test these scenarios:

1. **Data Persistence**
   - [ ] Create dispatch entry
   - [ ] Refresh page (F5)
   - [ ] Verify data still exists

2. **Data Movement**
   - [ ] Create entry on Monday
   - [ ] Move to Tuesday via date picker
   - [ ] Verify: Tuesday has data, Monday is empty
   - [ ] Move to next week
   - [ ] Verify: Correct week shows data

3. **Mobile (Chrome DevTools)**
   - [ ] Long-press cell (500ms)
   - [ ] Verify: Buttons appear
   - [ ] Open modal, type in input
   - [ ] Verify: Save button visible (not covered by keyboard)

4. **Cross-Browser**
   - [ ] Chrome: All features work
   - [ ] Safari: Date picker works, search works
   - [ ] Mobile Safari: Keyboard doesn't cover buttons

### Automated Testing
Currently no unit tests. Consider adding:
- Jest for utility functions (`parseDate`, `formatDate`, etc.)
- Cypress for E2E flows
- IndexedDB mocking for storage tests

---

## Performance Considerations

### Current Performance Profile
- **Page Load**: Target < 3 seconds (measured via `performance.timing`)
- **IDB Operations**: < 100ms per save/load
- **Scroll**: 60fps (uses `requestAnimationFrame` for header)

### Optimization Points
1. **Large datasets**: Virtual scrolling not implemented (8 rows x 7 days is small)
2. **Log cleanup**: Auto-delete after 50 entries to prevent bloat
3. **Touch events**: Use `{ passive: true }` for scroll performance

### Memory Management
- **Cache**: No in-memory cache (always reads from IDB)
- **Logs**: Max 50 access logs, 50 error logs
- **LocalStorage**: ~1KB (negligible)

---

## Security Considerations

### Authentication
- **Level**: Basic PIN (4-digit numeric)
- **Storage**: localStorage (plain text) - NOT secure
- **Recommendation**: For production, implement:
  - Server-side authentication
  - Encrypted storage
  - Session management

### Data Privacy
- **Local-only**: No data sent to servers
- **Export**: Users can download CSV/Excel (warn about sensitive data)
- **Logs**: Access logs include user info (GDPR consideration)

### XSS Prevention
- **User input**: All text inputs are rendered via `.textContent` or safely interpolated
- **No eval()**: Code does not use `eval()` or `Function()` constructor

---

## Deployment

### Local Development
```bash
# Option 1: File protocol (limited IndexedDB)
open index.html

# Option 2: HTTP server (recommended)
python3 -m http.server 8000
# Then open http://localhost:8000

# Option 3: VSCode Live Server
# Right-click index.html > "Open with Live Server"
```

### Production Deployment
1. **Static hosting**: Upload `index.html` to any web server
2. **HTTPS required**: IndexedDB requires secure context
3. **CDN verification**: Ensure Tailwind CSS and SheetJS CDNs are accessible
4. **No build step**: File is ready as-is

### Recommended Hosts
- GitHub Pages (free)
- Netlify (free tier)
- Vercel (free tier)
- Any static hosting with HTTPS

---

## Troubleshooting for AI Assistants

### Issue: "Data not saving"
**Diagnosis Steps**:
1. Check browser console for IndexedDB errors
2. Verify `db` variable is not null (`console.log('DB:', db)`)
3. Confirm `getStore()` returns valid store
4. Check if `saveToIDB()` Promise rejects

**Common Causes**:
- Browser private mode (some browsers block IndexedDB)
- Quota exceeded (unlikely with small dataset)
- Missing `onerror` handler (error swallowed silently)

### Issue: "Data disappears after moving"
**Root Cause**: State not synchronized (Bug B1)

**Fix**:
```javascript
// Add after any data move operation
syncState(newWeekStart, targetRow, targetCol);
```

### Issue: "Safari date picker broken"
**Root Cause**: Date parsing (Bug B4)

**Fix**: Use `parseDate()` instead of `new Date()`:
```javascript
// ❌ Wrong
const date = new Date('2025-11-16');

// ✅ Correct
const date = parseDate('2025-11-16');
```

### Issue: "Mobile buttons not appearing"
**Check**:
1. Touch events registered? (`getEventListeners(cell)` in Chrome)
2. CSS `opacity` and `pointer-events` correct?
3. Long-press duration met (500ms)?

---

## AI Assistant Best Practices

### When Reading Code
1. **Start with CHECKPOINT.md**: It has comprehensive Korean documentation
2. **Search before modifying**: Use `Grep` to find all occurrences
3. **Understand state management**: `currentRow/Col/WeekStart` are critical
4. **Check bug history**: Your change might reintroduce fixed bugs (Section 5.1)

### When Modifying Code
1. **Read entire function first**: Functions are long and have multiple concerns
2. **Preserve mobile compatibility**: Test touch events if changing UI
3. **Maintain Korean UX**: All user messages must be in Korean
4. **Add error handlers**: Every IndexedDB operation needs `onerror`

### When Adding Features
1. **Follow existing patterns**: Study similar features first
2. **Update both tables**: Input table AND view table often need changes
3. **Update modal**: Pivot modal is the primary data entry point
4. **Test data flow**: Create → Save → Load → Refresh → Verify

### Communication with Users
- **Language**: Respond in English (or Korean if user prefers)
- **Technical level**: Assume user is non-technical unless proven otherwise
- **Korean terminology**: Use Korean terms when discussing features
  - Example: "I'll add a new field to the 피벗 모달 (pivot modal)"

---

## File Modification Guidelines

### Editing index.html

**DO**:
- Use `Edit` tool with exact string matching
- Preserve all whitespace and indentation
- Test changes in browser immediately
- Keep functions logically grouped (existing structure)

**DON'T**:
- Reformat the entire file (breaks Edit tool)
- Change indentation style (inconsistent tabs/spaces will break)
- Remove comments (even if they seem redundant)
- Split into multiple files (single-file architecture is intentional)

### Example Edit
```javascript
// ❌ Wrong: Whitespace doesn't match
Edit(
  old_string="function openPivotModal(row,col) {",
  new_string="function openPivotModal(row, col) {"
)

// ✅ Correct: Exact match with Read output
Edit(
  old_string="        function openPivotModal(row, col) {",
  new_string="        function openPivotModal(row, col, prefilledData = {}) {"
)
```

---

## External Resources

### Documentation
- **Primary**: `CHECKPOINT.md` (comprehensive Korean documentation)
- **Quick ref**: This file (CLAUDE.md)
- **Code**: `index.html` (single source of truth)

### Dependencies
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility CSS framework
- [SheetJS](https://docs.sheetjs.com/) - Excel file generation
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - Storage API

### Browser APIs Used
- IndexedDB (storage)
- localStorage (preferences)
- visualViewport (iOS keyboard)
- Vibration API (haptic feedback)
- Blob/File API (exports)

---

## Quick Command Reference

### Search Operations
```bash
# Find function definition
Grep(pattern="function functionName", output_mode="content")

# Find all TODO comments
Grep(pattern="TODO|FIXME", output_mode="content")

# Find event listeners
Grep(pattern="addEventListener", output_mode="files_with_matches")

# Find specific element by ID
Grep(pattern="getElementById\\('elementId'\\)", output_mode="content")
```

### File Operations
```bash
# Read entire file
Read(file_path="/home/user/Dispatch02/index.html")

# Read specific section (if known line numbers)
Read(file_path="/home/user/Dispatch02/index.html", offset=800, limit=100)

# List all files
Glob(pattern="**/*")
```

---

## Version History

### Current Version
- **Version**: 1.1.0
- **Date**: 2025-11-18
- **Status**: 12 critical bugs fixed (B1-B12)
- **Browser Support**: Chrome, Safari, Edge, Samsung Internet

### Known Limitations
1. **Single user**: No multi-user collaboration
2. **Local only**: No cloud sync
3. **No backup**: Manual export required
4. **Basic auth**: 4-digit PIN (not secure)
5. **No undo**: Permanent deletion (no trash)

### Planned Improvements (from CHECKPOINT.md Section 14)
- PWA support (service worker)
- Auto-save (10-second interval)
- Undo/Redo
- Backend integration
- Real-time collaboration
- File attachments
- Statistics dashboard

---

## Contact & Support

### For Bugs
- Use in-app "버그 리포트" (Bug Report) feature
- Authenticated users can view error logs

### For Development Questions
- Refer to `CHECKPOINT.md` Section 9 (Maintenance Guide)
- Check Bug History (Section 5) for similar issues
- Review Code Structure (Section 6) for function relationships

---

## Summary for AI Assistants

**This is a production-ready single-page dispatch management application with:**
- ✅ Comprehensive Korean documentation (CHECKPOINT.md)
- ✅ 12 critical bugs already fixed
- ✅ Cross-browser compatibility (including Safari/iOS)
- ✅ Mobile-optimized UI with touch events
- ✅ IndexedDB persistence with proper error handling
- ✅ Clean separation of concerns despite single-file architecture

**Critical things to remember:**
1. Always call `syncState()` after data moves
2. Use `parseDate()` for Safari compatibility
3. Test mobile touch events when changing UI
4. Maintain Korean language for all user-facing text
5. Add `onerror` handlers to all IndexedDB operations
6. Read CHECKPOINT.md for detailed Korean documentation

**When in doubt:**
- Search the codebase with `Grep`
- Read the relevant section in CHECKPOINT.md
- Check if a similar bug was already fixed (Section 5.1)
- Follow existing patterns rather than introducing new paradigms

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Maintained For**: Claude Code AI Assistant
**Primary Language**: English (code/documentation), Korean (user-facing)
