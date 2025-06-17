import { DatabaseClient } from "../content/DatabaseClient"

class PopupManager {
  private database = new DatabaseClient()
  private overlayToggle: HTMLInputElement | null = null
  private linkCountElement: HTMLElement | null = null
  private clearButton: HTMLButtonElement | null = null
  private resetPositionButton: HTMLButtonElement | null = null

  async initialize(): Promise<void> {
    console.log("Popup initializing...")
    try {
      this.setupElements()
      await this.loadSettings()
      await this.updateLinkCount()
      this.setupEventListeners()
    } catch (error) {
      console.error("Popup initialization failed:", error)
    }
  }

  private setupElements(): void {
    this.overlayToggle = document.getElementById("overlay-toggle") as HTMLInputElement
    this.linkCountElement = document.getElementById("link-count")
    this.clearButton = document.getElementById("clear-links-btn") as HTMLButtonElement
    this.resetPositionButton = document.getElementById("reset-position-btn") as HTMLButtonElement
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(["overlayEnabled"])
      const overlayEnabled = result.overlayEnabled ?? false

      if (this.overlayToggle) {
        this.overlayToggle.checked = overlayEnabled
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  private async updateLinkCount(): Promise<void> {
    try {
      console.log("Updating link count...")
      const links = await this.database.findAllLinks()
      console.log("Found links:", links.length)

      if (this.linkCountElement) {
        this.linkCountElement.textContent = links.length.toString()
      }

      // Enable/disable clear button based on link count
      if (this.clearButton) {
        this.clearButton.disabled = links.length === 0
      }
    } catch (error) {
      console.error("Failed to get link count:", error)
      if (this.linkCountElement) {
        this.linkCountElement.textContent = "Error"
      }
    }
  }

  private setupEventListeners(): void {
    if (this.overlayToggle) {
      this.overlayToggle.addEventListener("change", this.handleOverlayToggle.bind(this))
    }

    if (this.clearButton) {
      this.clearButton.addEventListener("click", this.handleClearLinks.bind(this))
    }

    if (this.resetPositionButton) {
      this.resetPositionButton.addEventListener("click", this.handleResetPosition.bind(this))
    }

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.updateLinkCount()
      }
    })
  }

  private async handleOverlayToggle(): Promise<void> {
    if (!this.overlayToggle) return

    const overlayEnabled = this.overlayToggle.checked

    try {
      await chrome.storage.local.set({ overlayEnabled })

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: "OVERLAY_TOGGLE",
          enabled: overlayEnabled,
        })
      }
    } catch (error) {
      console.log("No content script to notify or storage error:", error)
    }
  }

  private async handleClearLinks(): Promise<void> {
    if (!this.clearButton) return

    try {
      this.clearButton.disabled = true
      this.clearButton.textContent = "Clearing..."

      await this.database.clearAllLinks()
      await this.updateLinkCount()

      // Notify content scripts to refresh their overlays
      const tabs = await chrome.tabs.query({})
      for (const tab of tabs) {
        if (tab.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, { type: "LINKS_CLEARED" })
          } catch {
            // Ignore errors for tabs without content scripts
          }
        }
      }

      this.clearButton.textContent = "Clear All Links"
    } catch (error) {
      console.error("Failed to clear links:", error)
      alert("Failed to clear links. Please try again.")
      this.clearButton.textContent = "Clear All Links"
      this.clearButton.disabled = false
    }
  }

  private async handleResetPosition(): Promise<void> {
    if (!this.resetPositionButton) return

    try {
      this.resetPositionButton.disabled = true
      this.resetPositionButton.textContent = "Resetting..."

      // Remove saved position from storage
      await chrome.storage.local.remove(["overlayPosition"])

      // Notify all content scripts to reset overlay position
      const tabs = await chrome.tabs.query({})
      for (const tab of tabs) {
        if (tab.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, { type: "RESET_OVERLAY_POSITION" })
          } catch {
            // Ignore errors for tabs without content scripts
          }
        }
      }

      this.resetPositionButton.textContent = "Reset Overlay Position"
      this.resetPositionButton.disabled = false

      // Show brief confirmation
      this.resetPositionButton.textContent = "Position Reset!"
      setTimeout(() => {
        if (this.resetPositionButton) {
          this.resetPositionButton.textContent = "Reset Overlay Position"
        }
      }, 1500)
    } catch (error) {
      console.error("Failed to reset position:", error)
      this.resetPositionButton.textContent = "Reset Overlay Position"
      this.resetPositionButton.disabled = false
    }
  }
}

const popupManager = new PopupManager()
popupManager.initialize().catch(console.error)
