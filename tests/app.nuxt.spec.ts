import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import App from "~/app.vue"

describe("app", () => {
  it("renders the root component", async () => {
    const component = await mountSuspended(App)
    expect(component.html()).toContain("Čtyřiadvacítka")
  })
})
