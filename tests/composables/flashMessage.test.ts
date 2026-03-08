import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

import { useFlashMessage } from "~~/app/composables/useFlashMessage"

describe("useFlashMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Clear any leftover state
    const { clear } = useFlashMessage()
    clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts with empty message", () => {
    const { message } = useFlashMessage()
    expect(message.value).toBe("")
  })

  it("shows a success message", () => {
    const { message, type, show } = useFlashMessage()

    show("Článek byl úspěšně odstraněn.")

    expect(message.value).toBe("Článek byl úspěšně odstraněn.")
    expect(type.value).toBe("success")
  })

  it("shows an error message", () => {
    const { message, type, show } = useFlashMessage()

    show("Nepodařilo se smazat.", "error")

    expect(message.value).toBe("Nepodařilo se smazat.")
    expect(type.value).toBe("error")
  })

  it("shows an info message", () => {
    const { message, type, show } = useFlashMessage()

    show("Informace.", "info")

    expect(message.value).toBe("Informace.")
    expect(type.value).toBe("info")
  })

  it("auto-clears after default duration (5s)", () => {
    const { message, show } = useFlashMessage()

    show("Test zpráva")
    expect(message.value).toBe("Test zpráva")

    vi.advanceTimersByTime(4999)
    expect(message.value).toBe("Test zpráva")

    vi.advanceTimersByTime(1)
    expect(message.value).toBe("")
  })

  it("auto-clears after custom duration", () => {
    const { message, show } = useFlashMessage()

    show("Krátká zpráva", "success", 2000)

    vi.advanceTimersByTime(1999)
    expect(message.value).toBe("Krátká zpráva")

    vi.advanceTimersByTime(1)
    expect(message.value).toBe("")
  })

  it("clears message manually", () => {
    const { message, show, clear } = useFlashMessage()

    show("Test")
    expect(message.value).toBe("Test")

    clear()
    expect(message.value).toBe("")
  })

  it("replaces previous message when showing a new one", () => {
    const { message, show } = useFlashMessage()

    show("První zpráva")
    expect(message.value).toBe("První zpráva")

    show("Druhá zpráva")
    expect(message.value).toBe("Druhá zpráva")
  })

  it("resets timer when showing a new message", () => {
    const { message, show } = useFlashMessage()

    show("První zpráva", "success", 3000)
    vi.advanceTimersByTime(2000)

    show("Druhá zpráva", "success", 3000)
    vi.advanceTimersByTime(2000)
    // First message would have expired, but second should still be visible
    expect(message.value).toBe("Druhá zpráva")

    vi.advanceTimersByTime(1000)
    expect(message.value).toBe("")
  })

  it("shares state across multiple calls", () => {
    const instance1 = useFlashMessage()
    const instance2 = useFlashMessage()

    instance1.show("Sdílená zpráva")
    expect(instance2.message.value).toBe("Sdílená zpráva")
  })

  it("defaults to success type", () => {
    const { type, show } = useFlashMessage()

    show("Test")
    expect(type.value).toBe("success")
  })
})
