import { blob, ensureBlob } from "@nuxthub/blob"

const ARTICLE_IMAGES_PREFIX = "article-images/"

export default defineEventHandler(async (event) => {
  await requireRole(event, "editor")

  let form: FormData
  try {
    form = await readFormData(event)
  } catch {
    throw createError({ statusCode: 400, message: "File is required" })
  }
  const file = form.get("file") as File | null

  if (!file || !(file instanceof File)) {
    throw createError({ statusCode: 400, message: "File is required" })
  }

  try {
    ensureBlob(file, {
      maxSize: "4MB",
      types: ["image"],
    })
  } catch {
    throw createError({
      statusCode: 400,
      message: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF (max 4MB)",
    })
  }

  const result = await blob.put(file.name, file, {
    prefix: ARTICLE_IMAGES_PREFIX,
    addRandomSuffix: true,
    contentType: file.type,
  })

  setResponseStatus(event, 201)
  return result
})
