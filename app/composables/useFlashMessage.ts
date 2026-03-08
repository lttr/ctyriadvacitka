import { ref, readonly, type Ref, type DeepReadonly } from "vue"

const message = ref("")
const type = ref<"success" | "error" | "info">("success")
let timeout: ReturnType<typeof setTimeout> | null = null

export function useFlashMessage(): {
  message: DeepReadonly<Ref<string>>
  type: DeepReadonly<Ref<"success" | "error" | "info">>
  show: (
    text: string,
    kind?: "success" | "error" | "info",
    duration?: number,
  ) => void
  clear: () => void
} {
  function show(
    text: string,
    kind: "success" | "error" | "info" = "success",
    duration = 5000,
  ) {
    if (timeout) {
      clearTimeout(timeout)
    }
    message.value = text
    type.value = kind
    timeout = setTimeout(() => {
      message.value = ""
      timeout = null
    }, duration)
  }

  function clear() {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    message.value = ""
  }

  return {
    message: readonly(message),
    type: readonly(type),
    show,
    clear,
  }
}
