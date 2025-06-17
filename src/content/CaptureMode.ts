export class CaptureMode {
  private isActive = false
  private indicator: HTMLElement | null = null

  activate(): void {
    if (this.isActive) return

    this.isActive = true
    this.createIndicator()
  }

  deactivate(): void {
    if (!this.isActive) return

    this.isActive = false
    this.removeIndicator()
  }

  isCaptureModeActive(): boolean {
    return this.isActive
  }

  private createIndicator(): void {
    this.indicator = document.createElement("div")
    this.indicator.id = "etherealeagle-capture-indicator"
    this.indicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: #3b82f6;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(59, 130, 246, 0.3);
      pointer-events: none;
      animation: etherealeagle-pulse 1.5s ease-in-out infinite;
    `

    this.indicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 6px; height: 6px; background: #10b981; border-radius: 50%; animation: etherealeagle-blink 1s ease-in-out infinite;"></div>
        Link Capture Active
      </div>
    `

    const style = document.createElement("style")
    style.textContent = `
      @keyframes etherealeagle-pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.9;
        }
        50% {
          transform: scale(1.02);
          opacity: 1;
        }
      }

      @keyframes etherealeagle-blink {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.3;
        }
      }
    `
    document.head.appendChild(style)

    document.body.appendChild(this.indicator)
  }

  private removeIndicator(): void {
    if (this.indicator) {
      this.indicator.remove()
      this.indicator = null
    }

    // Clean up styles
    const style = document.querySelector('style[data-etherealeagle="capture-mode"]')
    if (style) {
      style.remove()
    }
  }
}
