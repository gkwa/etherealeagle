export class InputContext {
  isUserTyping(): boolean {
    const activeElement = document.activeElement

    if (!activeElement) return false

    const tagName = activeElement.tagName.toLowerCase()
    const inputTypes = ["input", "textarea", "select"]

    if (inputTypes.includes(tagName)) return true

    const contentEditable = activeElement.getAttribute("contenteditable")
    if (contentEditable === "true" || contentEditable === "") return true

    return false
  }
}
