import { CapturedLink } from "../types/LinkCapture"

interface LinkDocument extends CapturedLink {
  id: string
}

export class DatabaseService {
  private db: IDBDatabase | null = null
  private isInitialized = false
  private static readonly DB_NAME = "etherealeagle-db"
  private static readonly DB_VERSION = 1
  private static readonly STORE_NAME = "links"
  private static instance: DatabaseService | null = null

  // Singleton pattern to ensure one instance per context
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  private constructor() {}

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      console.log("Initializing IndexedDB database...")
      console.log("Current context:", this.getContextType())

      const request = indexedDB.open(DatabaseService.DB_NAME, DatabaseService.DB_VERSION)

      request.onerror = () => {
        console.error("Database initialization failed:", request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log("Database initialized successfully")
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        console.log("Creating object store...")

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(DatabaseService.STORE_NAME)) {
          const store = db.createObjectStore(DatabaseService.STORE_NAME, {
            keyPath: "id",
          })

          // Create indexes for better querying
          store.createIndex("timestamp", "timestamp", { unique: false })
          store.createIndex("sourceUrl", "sourceUrl", { unique: false })
          store.createIndex("targetUrl", "targetUrl", { unique: false })

          console.log("Object store and indexes created")
        }
      }
    })
  }

  private getContextType(): string {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      try {
        const manifest = chrome.runtime.getManifest()
        if (manifest) {
          return "background"
        }
      } catch {
        return "content_script"
      }
    }
    return "unknown"
  }

  async saveLink(link: CapturedLink): Promise<void> {
    await this.ensureInitialized()

    const document: LinkDocument = {
      ...link,
      id: this.generateId(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DatabaseService.STORE_NAME], "readwrite")
      const store = transaction.objectStore(DatabaseService.STORE_NAME)

      const request = store.add(document)

      request.onsuccess = () => {
        console.log("Document saved successfully:", document)
        resolve()
      }

      request.onerror = () => {
        console.error("Failed to save document:", request.error)
        reject(request.error)
      }
    })
  }

  async findAllLinks(): Promise<LinkDocument[]> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DatabaseService.STORE_NAME], "readonly")
      const store = transaction.objectStore(DatabaseService.STORE_NAME)
      const index = store.index("timestamp")

      // Get all records sorted by timestamp (newest first)
      const request = index.openCursor(null, "prev")
      const results: LinkDocument[] = []

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          console.log(`Found ${results.length} links`)
          resolve(results)
        }
      }

      request.onerror = () => {
        console.error("Failed to retrieve links:", request.error)
        reject(request.error)
      }
    })
  }

  async clearAllLinks(): Promise<void> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DatabaseService.STORE_NAME], "readwrite")
      const store = transaction.objectStore(DatabaseService.STORE_NAME)

      const request = store.clear()

      request.onsuccess = () => {
        console.log("All links cleared successfully")
        resolve()
      }

      request.onerror = () => {
        console.error("Failed to clear links:", request.error)
        reject(request.error)
      }
    })
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      console.log("Database not ready, initializing...")
      await this.initialize()
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  async destroy(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
      console.log("Database connection closed")
    }
  }
}
