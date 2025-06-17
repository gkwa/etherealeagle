import { DatabaseService } from "../storage/DatabaseService"

class BackgroundService {
  private database = DatabaseService.getInstance()
  private isReady = false

  async initialize(): Promise<void> {
    console.log("EtherealEagle background service initialized")

    try {
      await this.database.initialize()
      console.log("Database initialized in background script")
      this.isReady = true
    } catch (error) {
      console.error("Failed to initialize database in background:", error)
    }

    this.setupMessageHandlers()
  }

  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep the message channel open for async responses
    })
  }

  private async handleMessage(message: any, sender: any, sendResponse: any): Promise<void> {
    try {
      switch (message.type) {
        case "PING":
          sendResponse({ success: true, ready: this.isReady })
          break

        case "SAVE_LINK":
          if (!this.isReady) {
            sendResponse({ success: false, error: "Database not ready" })
            return
          }
          await this.database.saveLink(message.link)
          sendResponse({ success: true })
          break

        case "GET_ALL_LINKS":
          if (!this.isReady) {
            sendResponse({ success: false, error: "Database not ready" })
            return
          }
          const links = await this.database.findAllLinks()
          sendResponse({ success: true, links })
          break

        case "CLEAR_ALL_LINKS":
          if (!this.isReady) {
            sendResponse({ success: false, error: "Database not ready" })
            return
          }
          await this.database.clearAllLinks()
          sendResponse({ success: true })
          break

        default:
          sendResponse({ success: false, error: "Unknown message type" })
      }
    } catch (error) {
      console.error("Error handling message:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      sendResponse({ success: false, error: errorMessage })
    }
  }
}

const backgroundService = new BackgroundService()
backgroundService.initialize()
