import { blob } from "@nuxthub/blob"

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, "pathname")

  if (!pathname) {
    throw createError({
      statusCode: 400,
      statusMessage: "Pathname is required",
    })
  }

  return blob.serve(event, pathname)
})
