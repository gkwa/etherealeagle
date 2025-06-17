import { CapturedLink } from "../types/LinkCapture"

export class LinkCapture {
  captureLink(element: HTMLAnchorElement): CapturedLink {
    const targetUrl = element.href
    const sourceUrl = window.location.href
    const timestamp = Date.now()

    return {
      sourceUrl,
      targetUrl,
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
    }
  }

  showCaptureConfirmation(): void {
    const notification = document.createElement("div")
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(16, 185, 129, 0.3);
      pointer-events: none;
      animation: etherealeagle-success-slide 0.4s ease-out;
    `

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
        Link Captured Successfully
      </div>
    `

    const style = document.createElement("style")
    style.textContent = `
      @keyframes etherealeagle-success-slide {
        0% {
          transform: translateX(-100%);
          opacity: 0;
        }
        20% {
          transform: translateX(10px);
          opacity: 1;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `
    document.head.appendChild(style)

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
      style.remove()
    }, 2000)
  }
}
