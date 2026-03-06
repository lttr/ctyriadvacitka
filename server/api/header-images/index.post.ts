import { blob, ensureBlob } from "@nuxthub/blob"

const HEADER_IMAGES_PREFIX = "header-images/"

export default defineEventHandler(async (event) => {
  await requireRole(event, "admin")

  let form: FormData
  try {
    form = await readFormData(event)
  } catch {
    throw createError({ statusCode: 400, statusMessage: "File is required" })
  }
  const file = form.get("file") as File | null

  if (!file || !(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: "File is required" })
  }

  try {
    ensureBlob(file, {
      maxSize: "8MB",
      types: ["image"],
    })
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Invalid file type. Allowed: JPEG, PNG, WebP, GIF (max 5MB)",
    })
  }

  const result = await blob.put(file.name, file, {
    prefix: HEADER_IMAGES_PREFIX,
    addRandomSuffix: true,
    contentType: file.type,
  })

  setResponseStatus(event, 201)
  return result
})
