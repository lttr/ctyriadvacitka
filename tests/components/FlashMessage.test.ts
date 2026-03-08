import { describe, expect, it, beforeEach } from "vitest"

import { mountSuspended } from "@nuxt/test-utils/runtime"
import FlashMessage from "~~/app/components/FlashMessage.vue"
import { useFlashMessage } from "~~/app/composables/useFlashMessage"

describe("FlashMessage", () => {
  beforeEach(() => {
    const { clear } = useFlashMessage()
    clear()
  })

  it("is hidden when there is no message", async () => {
    const wrapper = await mountSuspended(FlashMessage)

    expect(wrapper.find(".flash-message").exists()).toBe(false)
  })

  it("shows success message", async () => {
    const { show } = useFlashMessage()
    show("Článek byl úspěšně odstraněn.")

    const wrapper = await mountSuspended(FlashMessage)

    expect(wrapper.find(".flash-message").exists()).toBe(true)
    expect(wrapper.text()).toContain("Článek byl úspěšně odstraněn.")
    expect(wrapper.find(".flash-success").exists()).toBe(true)
  })

  it("shows error message with correct class", async () => {
    const { show } = useFlashMessage()
    show("Nepodařilo se smazat.", "error")

    const wrapper = await mountSuspended(FlashMessage)

    expect(wrapper.find(".flash-error").exists()).toBe(true)
    expect(wrapper.text()).toContain("Nepodařilo se smazat.")
  })

  it("shows info message with correct class", async () => {
    const { show } = useFlashMessage()
    show("Informace.", "info")

    const wrapper = await mountSuspended(FlashMessage)

    expect(wrapper.find(".flash-info").exists()).toBe(true)
  })

  it("has accessible role attribute", async () => {
    const { show } = useFlashMessage()
    show("Test")

    const wrapper = await mountSuspended(FlashMessage)

    expect(wrapper.find("[role='status']").exists()).toBe(true)
  })

  it("has a close button", async () => {
    const { show } = useFlashMessage()
    show("Test zpráva")

    const wrapper = await mountSuspended(FlashMessage)

    const closeButton = wrapper.find(".flash-close")
    expect(closeButton.exists()).toBe(true)
    expect(closeButton.attributes("aria-label")).toBe("Zavřít")
  })

  it("clears message when close button is clicked", async () => {
    const { show, message } = useFlashMessage()
    show("Test zpráva")

    const wrapper = await mountSuspended(FlashMessage)

    await wrapper.find(".flash-close").trigger("click")

    expect(message.value).toBe("")
  })
})
