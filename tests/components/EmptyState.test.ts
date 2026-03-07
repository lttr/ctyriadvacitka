import { describe, expect, it } from "vitest"

import { mountSuspended } from "@nuxt/test-utils/runtime"
import EmptyState from "~~/app/components/EmptyState.vue"

describe("EmptyState", () => {
  it("renders with default message", async () => {
    const wrapper = await mountSuspended(EmptyState)

    expect(wrapper.text()).toContain("Žádné položky k zobrazení.")
  })

  it("renders with custom message", async () => {
    const wrapper = await mountSuspended(EmptyState, {
      props: { message: "Žádné novinky." },
    })

    expect(wrapper.text()).toContain("Žádné novinky.")
  })

  it("renders with custom heading", async () => {
    const wrapper = await mountSuspended(EmptyState, {
      props: { heading: "Prázdný seznam", message: "Nic tu není." },
    })

    expect(wrapper.text()).toContain("Prázdný seznam")
    expect(wrapper.text()).toContain("Nic tu není.")
  })

  it("renders slot content", async () => {
    const wrapper = await mountSuspended(EmptyState, {
      slots: {
        default: () => "Vlastní obsah",
      },
    })

    expect(wrapper.text()).toContain("Vlastní obsah")
  })

  it("has accessible role", async () => {
    const wrapper = await mountSuspended(EmptyState)

    expect(wrapper.find("[role='status']").exists()).toBe(true)
  })
})
