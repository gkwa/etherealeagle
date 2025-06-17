export class UrlOverlay {
  private isEnabled = false
  private overlay: HTMLElement | null = null
  private urls: string[] = []
  private database: any = null
  private isDragging = false
  private isResizing = false
  private dragStartX = 0
  private dragStartY = 0
  private startLeft = 0
  private startTop = 0
  private resizeDragStartY = 0
  private startHeight = 0

  constructor() {
    this.loadSettings()
    this.setupMessageListener()
  }

  async setDatabase(database: any): Promise<void> {
    this.database = database
    if (this.isEnabled) {
      await this.loadUrlsFromDatabase()
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(["overlayEnabled", "overlayPosition"])
      this.isEnabled = result.overlayEnabled ?? false

      if (this.isEnabled) {
        this.createOverlay(result.overlayPosition)
        // Don't load URLs here - wait for setDatabase to be called
      }
    } catch (error) {
      console.error("Failed to load overlay settings:", error)
    }
  }

  private getDefaultPosition(): { right: number; bottom: number } {
    return { right: 20, bottom: 20 }
  }

  private async savePosition(position: {
    left: number
    top: number
    right?: number
    bottom?: number
  }): Promise<void> {
    try {
      await chrome.storage.local.set({ overlayPosition: position })
    } catch (error) {
      console.error("Failed to save overlay position:", error)
    }
  }

  private async loadUrlsFromDatabase(): Promise<void> {
    if (!this.database) return

    try {
      console.log("Loading URLs from database for overlay...")
      const links = await this.database.findAllLinks()

      // Extract URLs from all links
      this.urls = links.map((link: any) => link.targetUrl)

      console.log(`Loaded ${this.urls.length} URLs from database`)
      this.updateOverlay()
    } catch (error) {
      console.error("Failed to load URLs from database:", error)
      // Show error state in overlay
      this.updateOverlay()
    }
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(async (message) => {
      if (message.type === "OVERLAY_TOGGLE") {
        this.isEnabled = message.enabled
        if (this.isEnabled) {
          const result = await chrome.storage.local.get(["overlayPosition"])
          this.createOverlay(result.overlayPosition)
          // Load URLs when overlay is enabled
          if (this.database) {
            await this.loadUrlsFromDatabase()
          }
        } else {
          this.removeOverlay()
        }
      } else if (message.type === "LINKS_CLEARED") {
        // Clear the overlay when all links are cleared
        this.urls = []
        this.updateOverlay()
      } else if (message.type === "RESET_OVERLAY_POSITION") {
        // Reset overlay position to default
        if (this.overlay && this.isEnabled) {
          this.resetToDefaultPosition()
        }
      }
    })
  }

  private resetToDefaultPosition(): void {
    if (!this.overlay) return

    const defaultPos = this.getDefaultPosition()

    this.overlay.style.left = "auto"
    this.overlay.style.top = "auto"
    this.overlay.style.right = `${defaultPos.right}px`
    this.overlay.style.bottom = `${defaultPos.bottom}px`

    // Save the reset position
    this.savePosition({
      left: window.innerWidth - this.overlay.offsetWidth - defaultPos.right,
      top: window.innerHeight - this.overlay.offsetHeight - defaultPos.bottom,
      right: defaultPos.right,
      bottom: defaultPos.bottom,
    })

    // Brief visual feedback
    this.overlay.style.boxShadow = "0 12px 40px rgba(245, 158, 11, 0.6)"
    this.overlay.style.transform = "scale(1.05)"

    setTimeout(() => {
      if (this.overlay) {
        this.overlay.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.4)"
        this.overlay.style.transform = "scale(1)"
      }
    }, 300)
  }

  addUrl(url: string): void {
    if (!this.isEnabled) return

    this.urls.unshift(url)
    this.updateOverlay()
  }

  private createOverlay(savedPosition?: {
    left?: number
    top?: number
    right?: number
    bottom?: number
  }): void {
    if (this.overlay) return

    this.overlay = document.createElement("div")
    this.overlay.id = "etherealeagle-url-overlay"

    // Default position (bottom-right) or use saved position
    let position = "position: fixed; bottom: 20px; right: 20px;"
    if (savedPosition) {
      if (savedPosition.left !== undefined && savedPosition.top !== undefined) {
        position = `position: fixed; left: ${savedPosition.left}px; top: ${savedPosition.top}px;`
      } else if (savedPosition.right !== undefined && savedPosition.bottom !== undefined) {
        position = `position: fixed; right: ${savedPosition.right}px; bottom: ${savedPosition.bottom}px;`
      }
    }

    this.overlay.style.cssText = `
     ${position}
     width: 320px;
     max-height: 400px;
     min-height: 120px;
     background: rgba(0, 0, 0, 0.95);
     color: white;
     border-radius: 12px;
     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
     font-size: 12px;
     z-index: 999999;
     border: 1px solid #3b82f6;
     box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
     backdrop-filter: blur(10px);
     transition: box-shadow 0.2s ease, transform 0.2s ease;
     overflow: hidden;
     display: flex;
     flex-direction: column;
     user-select: none;
   `

    // Create header with drag handle
    const header = document.createElement("div")
    header.style.cssText = `
     padding: 12px 16px 8px 16px;
     border-bottom: 1px solid rgba(59, 130, 246, 0.3);
     display: flex;
     align-items: center;
     justify-content: space-between;
     background: rgba(59, 130, 246, 0.1);
     border-radius: 12px 12px 0 0;
     cursor: move;
     user-select: none;
   `

    const title = document.createElement("div")
    title.id = "etherealeagle-overlay-title"
    title.style.cssText = `
     font-weight: 600;
     color: #3b82f6;
     font-size: 13px;
     flex: 1;
   `

    const resizeHandle = document.createElement("div")
    resizeHandle.style.cssText = `
     width: 20px;
     height: 12px;
     background: linear-gradient(
       to bottom,
       transparent 2px,
       #666 2px,
       #666 3px,
       transparent 3px,
       transparent 5px,
       #666 5px,
       #666 6px,
       transparent 6px,
       transparent 8px,
       #666 8px,
       #666 9px,
       transparent 9px
     );
     cursor: ns-resize;
     opacity: 0.6;
     transition: opacity 0.2s ease;
     margin-left: 8px;
   `

    resizeHandle.addEventListener("mouseenter", () => {
      resizeHandle.style.opacity = "1"
    })

    resizeHandle.addEventListener("mouseleave", () => {
      if (!this.isResizing) {
        resizeHandle.style.opacity = "0.6"
      }
    })

    header.appendChild(title)
    header.appendChild(resizeHandle)

    // Create scrollable content area
    const content = document.createElement("div")
    content.id = "etherealeagle-overlay-content"
    content.style.cssText = `
     flex: 1;
     overflow-y: auto;
     padding: 12px 16px;
     min-height: 0;
   `

    // Custom scrollbar styling
    const scrollbarStyle = document.createElement("style")
    scrollbarStyle.textContent = `
     #etherealeagle-overlay-content::-webkit-scrollbar {
       width: 6px;
     }
     #etherealeagle-overlay-content::-webkit-scrollbar-track {
       background: rgba(255, 255, 255, 0.1);
       border-radius: 3px;
     }
     #etherealeagle-overlay-content::-webkit-scrollbar-thumb {
       background: rgba(59, 130, 246, 0.6);
       border-radius: 3px;
     }
     #etherealeagle-overlay-content::-webkit-scrollbar-thumb:hover {
       background: rgba(59, 130, 246, 0.8);
     }
   `
    document.head.appendChild(scrollbarStyle)

    this.overlay.appendChild(header)
    this.overlay.appendChild(content)
    document.body.appendChild(this.overlay)

    // Setup drag and resize functionality
    this.setupDragHandling(header, resizeHandle)

    this.updateOverlay()
  }

  private setupDragHandling(dragHandle: HTMLElement, resizeHandle: HTMLElement): void {
    // Drag functionality for moving the overlay
    const startDrag = (e: MouseEvent) => {
      // Don't start drag if clicking on resize handle
      if (e.target === resizeHandle) return

      e.preventDefault()
      this.isDragging = true
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY

      const rect = this.overlay!.getBoundingClientRect()
      this.startLeft = rect.left
      this.startTop = rect.top

      document.addEventListener("mousemove", handleDrag)
      document.addEventListener("mouseup", stopDrag)
      document.body.style.userSelect = "none"

      // Visual feedback
      this.overlay!.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.6)"
      this.overlay!.style.transform = "scale(1.02)"
    }

    const handleDrag = (e: MouseEvent) => {
      if (!this.isDragging) return

      const deltaX = e.clientX - this.dragStartX
      const deltaY = e.clientY - this.dragStartY

      let newLeft = this.startLeft + deltaX
      let newTop = this.startTop + deltaY

      // Keep overlay within viewport bounds
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      const overlayRect = {
        width: this.overlay!.offsetWidth,
        height: this.overlay!.offsetHeight,
      }

      newLeft = Math.max(10, Math.min(newLeft, viewport.width - overlayRect.width - 10))
      newTop = Math.max(10, Math.min(newTop, viewport.height - overlayRect.height - 10))

      this.overlay!.style.left = `${newLeft}px`
      this.overlay!.style.top = `${newTop}px`
      this.overlay!.style.right = "auto"
      this.overlay!.style.bottom = "auto"
    }

    const stopDrag = async () => {
      this.isDragging = false
      document.removeEventListener("mousemove", handleDrag)
      document.removeEventListener("mouseup", stopDrag)
      document.body.style.userSelect = ""

      // Reset visual feedback
      this.overlay!.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.4)"
      this.overlay!.style.transform = "scale(1)"

      // Save position
      const rect = this.overlay!.getBoundingClientRect()
      await this.savePosition({
        left: rect.left,
        top: rect.top,
      })
    }

    // Resize functionality
    const startResize = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      this.isResizing = true
      this.resizeDragStartY = e.clientY
      this.startHeight = this.overlay!.offsetHeight

      document.addEventListener("mousemove", handleResize)
      document.addEventListener("mouseup", stopResize)
      document.body.style.userSelect = "none"
      resizeHandle.style.opacity = "1"
    }

    const handleResize = (e: MouseEvent) => {
      if (!this.isResizing) return

      const deltaY = this.resizeDragStartY - e.clientY
      const newHeight = Math.max(120, Math.min(600, this.startHeight + deltaY))

      this.overlay!.style.height = `${newHeight}px`
      this.overlay!.style.maxHeight = `${newHeight}px`
    }

    const stopResize = () => {
      this.isResizing = false
      document.removeEventListener("mousemove", handleResize)
      document.removeEventListener("mouseup", stopResize)
      document.body.style.userSelect = ""
      resizeHandle.style.opacity = "0.6"
    }

    dragHandle.addEventListener("mousedown", startDrag)
    resizeHandle.addEventListener("mousedown", startResize)
  }

  private updateOverlay(): void {
    if (!this.overlay || !this.isEnabled) return

    const titleElement = document.getElementById("etherealeagle-overlay-title")
    const contentElement = document.getElementById("etherealeagle-overlay-content")

    if (!titleElement || !contentElement) return

    // Update title with count
    titleElement.textContent = `Recent Captures (${this.urls.length})`

    if (this.urls.length === 0) {
      contentElement.innerHTML =
        '<div style="opacity: 0.6; text-align: center; padding: 20px;">No URLs captured yet</div>'
      return
    }

    const urlsHtml = this.urls
      .map((url, index) => {
        const opacity = Math.max(0.4, 1 - index * 0.1)
        const truncatedUrl = url.length > 45 ? url.substring(0, 42) + "..." : url

        return `
       <div style="
         opacity: ${opacity};
         margin-bottom: 8px;
         padding: 8px 12px;
         background: rgba(59, 130, 246, 0.1);
         border-radius: 6px;
         border-left: 3px solid rgba(59, 130, 246, ${opacity});
         word-break: break-all;
         font-size: 11px;
         line-height: 1.4;
         transition: all 0.2s ease;
         cursor: pointer;
       "
       onmouseover="this.style.background='rgba(59, 130, 246, 0.2)'; this.style.transform='translateX(4px)';"
       onmouseout="this.style.background='rgba(59, 130, 246, 0.1)'; this.style.transform='translateX(0)';"
       onclick="window.open('${url.replace(/'/g, "\\'")}', '_blank')"
       title="${url.replace(/"/g, "&quot;")}"
       >
         ${truncatedUrl}
       </div>
     `
      })
      .join("")

    contentElement.innerHTML = urlsHtml
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = null
    }

    // Clean up scrollbar styles
    const scrollbarStyle = document.querySelector('style[data-etherealeagle="scrollbar"]')
    if (scrollbarStyle) {
      scrollbarStyle.remove()
    }
  }
}
