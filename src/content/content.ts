import { CaptureMode } from "./CaptureMode"
import { LinkCapture } from "./LinkCapture"
import { InputContext } from "./InputContext"
import { DatabaseClient } from "./DatabaseClient"
import { UrlOverlay } from "./UrlOverlay"

class ContentScript {
  private captureMode = new CaptureMode()
  private linkCapture = new LinkCapture()
  private inputContext = new InputContext()
  private database = new DatabaseClient()
  private urlOverlay = new UrlOverlay()
  private isHoldingC = false

  async initialize(): Promise<void> {
    console.log("Content script initializing...")
    try {
      // Wait for background script to be ready
      await this.waitForBackgroundScript()

      // Pass database client to overlay so it can load URLs
      await this.urlOverlay.setDatabase(this.database)

      this.setupEventHandlers()
      console.log("Content script initialized successfully")
    } catch (error) {
      console.error("Content script initialization failed:", error)
    }
  }

  private async waitForBackgroundScript(): Promise<void> {
    return new Promise((resolve) => {
      const checkBackground = () => {
        chrome.runtime.sendMessage({ type: "PING" }, (response) => {
          if (chrome.runtime.lastError || !response) {
            // Background script not ready, try again
            setTimeout(checkBackground, 100)
          } else {
            console.log("Background script is ready")
            resolve()
          }
        })
      }
      checkBackground()
    })
  }

  private setupEventHandlers(): void {
    document.addEventListener("keydown", this.handleKeyDown.bind(this))
    document.addEventListener("keyup", this.handleKeyUp.bind(this))
    document.addEventListener("click", this.handleClick.bind(this), true)
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.inputContext.isUserTyping()) return
    if (event.repeat) return // Ignore repeated keydown events

    if (event.key === "c" || event.key === "C") {
      if (!this.isHoldingC) {
        this.isHoldingC = true
        this.captureMode.activate()
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (event.key === "c" || event.key === "C") {
      this.isHoldingC = false
      // Delay deactivation slightly to allow click processing
      setTimeout(() => {
        if (!this.isHoldingC) {
          this.captureMode.deactivate()
        }
      }, 50)
    }
  }

  private async handleClick(event: MouseEvent): Promise<void> {
    if (!this.captureMode.isCaptureModeActive()) return

    const target = event.target as HTMLElement
    const linkElement = this.findLinkElement(target)

    if (linkElement) {
      event.preventDefault()
      event.stopPropagation()

      const capturedLink = this.linkCapture.captureLink(linkElement)

      try {
        console.log("Saving captured link:", capturedLink)
        await this.database.saveLink(capturedLink)
        console.log("Link saved successfully")

        this.linkCapture.showCaptureConfirmation()
        this.urlOverlay.addUrl(capturedLink.targetUrl)
      } catch (error) {
        console.error("Failed to save captured link:", error)
      }
    }
  }

  private findLinkElement(element: HTMLElement): HTMLAnchorElement | null {
    let current = element

    while (current && current.tagName !== "BODY") {
      if (current.tagName === "A" && (current as HTMLAnchorElement).href) {
        return current as HTMLAnchorElement
      }
      current = current.parentElement!
    }

    return null
  }
}

const contentScript = new ContentScript()
contentScript.initialize().catch(console.error)
