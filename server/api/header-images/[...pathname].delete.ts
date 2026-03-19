import { blob } from "@nuxthub/blob"

export default defineEventHandler(async (event) => {
  await requireRole(event, "admin")

  const pathname = getRouterParam(event, "pathname")

  if (!pathname) {
    throw createError({
      statusCode: 400,
      message: "Pathname is required",
    })
  }

  await blob.delete(pathname)

  return { success: true }
})
