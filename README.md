# EtherealEagle

A Chrome extension that allows users to capture and store links from any webpage using a simple hold-and-click interaction with a resizable, draggable overlay for viewing captured links.

## Features

- **Hold 'C' key** to activate capture mode with visual indicator
- **Click any link** while holding 'C' to capture it
- **Persistent storage** using IndexedDB in background script
- **Global capture list** works across all domains
- **Resizable overlay** showing recent captures with drag-to-move functionality
- **Context-aware** - ignores input when typing in forms
- **Visual feedback** with success notifications
- **Management interface** via popup with clear and reset options

## Quick Start

```bash
# Setup and build
just setup
```

## Installation

1. Build the extension: `just build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

## Usage

1. **Navigate to any webpage**
2. **Hold down the 'C' key** to activate capture mode (blue indicator appears top-left)
3. **While holding 'C', click any link** to capture it (green success message appears)
4. **Release 'C'** to exit capture mode
5. **View captured links** in the overlay (if enabled) or popup
6. **Drag the overlay** by clicking and dragging the header to move it anywhere on screen
7. **Resize the overlay** by dragging the resize handle in the top-right corner
8. **Click any URL** in the overlay to open it in a new tab

## Management

### Extension Popup

Click the EtherealEagle icon in the toolbar to:

- **View capture count** - see total number of captured links
- **Toggle overlay** - show/hide the URL overlay on pages
- **Reset position** - move overlay back to default bottom-right position
- **Clear all links** - instantly remove all captured links (no confirmation)

### Developer Tools Access

To view or clear the database directly:

1. **Go to** `chrome://extensions/`
2. **Enable "Developer mode"**
3. **Find EtherealEagle** and click **"service worker"**
4. **In the Dev Tools Console**, run:

```javascript
// View all captured links in a table
const request = indexedDB.open("etherealeagle-db")
request.onsuccess = () => {
  const db = request.result
  const transaction = db.transaction(["links"], "readonly")
  const store = transaction.objectStore("links")
  const getAllRequest = store.getAll()
  getAllRequest.onsuccess = () => {
    console.table(getAllRequest.result)
  }
}

// Clear all captured links
const clearRequest = indexedDB.open("etherealeagle-db")
clearRequest.onsuccess = () => {
  const db = clearRequest.result
  const transaction = db.transaction(["links"], "readwrite")
  const store = transaction.objectStore("links")
  store.clear()
  console.log("All links cleared!")
}

// Delete entire database
indexedDB.deleteDatabase("etherealeagle-db")
```

## Architecture

- **Background Script**: Manages IndexedDB database and message passing
- **Content Scripts**: Handle key detection, link capture, and overlay display
- **Popup Interface**: Provides user controls and statistics
- **Storage**: IndexedDB for link data, chrome.storage.local for UI preferences

## Development

```bash
# Install dependencies
just setup

# Build for development
just build

# Run tests
just test

# Clean artifacts
just teardown
```

### Project Structure

```
src/
├── background/         # Background script and database service
├── content/           # Content scripts for capture and overlay
├── popup/            # Extension popup interface
├── storage/          # Database service and types
└── types/            # TypeScript type definitions
```

### Technology Stack

- **TypeScript** for type-safe development
- **Vite** for fast builds and development
- **IndexedDB** for persistent local storage
- **Chrome Extension APIs** for cross-tab communication
- **Vitest** for testing

## Keyboard Shortcuts

- **Hold 'C'**: Activate link capture mode
- **C + Click**: Capture any link while in capture mode

## Visual Indicators

- **Blue indicator (top-left)**: Capture mode is active
- **Green notification (top-left)**: Link captured successfully
- **Overlay (draggable)**: Shows recent captures with count

## Troubleshooting

### Overlay disappeared or moved off-screen

- Click the extension icon and press **"Reset Overlay Position"**

### Links not being captured

- Ensure you're holding 'C' before clicking the link
- Check that you're not typing in an input field
- Try refreshing the page to reload the content script

### Database issues

- Use the Dev Tools console commands above to inspect or clear data
- Check the background service worker for error messages
