import { describe, it, expect, beforeEach, vi } from "vitest"
import { InputContext } from "../InputContext"

describe("InputContext", () => {
  let inputContext: InputContext

  beforeEach(() => {
    inputContext = new InputContext()
    document.body.innerHTML = ""
  })

  it("should detect when user is typing in input field", () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    input.focus()

    expect(inputContext.isUserTyping()).toBe(true)
  })

  it("should detect when user is not typing", () => {
    expect(inputContext.isUserTyping()).toBe(false)
  })

  it("should detect contenteditable elements", () => {
    const div = document.createElement("div")
    div.setAttribute("contenteditable", "true") // Use setAttribute instead of property
    document.body.appendChild(div)

    // Mock document.activeElement to return our contenteditable div
    vi.spyOn(document, "activeElement", "get").mockReturnValue(div)

    expect(inputContext.isUserTyping()).toBe(true)

    // Restore original implementation
    vi.restoreAllMocks()
  })
})
