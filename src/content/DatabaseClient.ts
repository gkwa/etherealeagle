import { CapturedLink } from "../types/LinkCapture"

interface LinkDocument extends CapturedLink {
  id: string
}

export class DatabaseClient {
  async saveLink(link: CapturedLink): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "SAVE_LINK", link }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        if (response.success) {
          resolve()
        } else {
          reject(new Error(response.error || "Failed to save link"))
        }
      })
    })
  }

  async findAllLinks(): Promise<LinkDocument[]> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "GET_ALL_LINKS" }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        if (response.success) {
          resolve(response.links || [])
        } else {
          reject(new Error(response.error || "Failed to get links"))
        }
      })
    })
  }

  async clearAllLinks(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "CLEAR_ALL_LINKS" }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        if (response.success) {
          resolve()
        } else {
          reject(new Error(response.error || "Failed to clear links"))
        }
      })
    })
  }
}
