import { blob, ensureBlob } from "@nuxthub/blob"

export default defineEventHandler(async (event) => {
  await requireRole(event, "editor")

  let form: FormData
  try {
    form = await readFormData(event)
  } catch {
    throw createError({ statusCode: 400, statusMessage: "File is required" })
  }

  const files = form.getAll("files") as File[]

  if (!files.length || !(files[0] instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Musíte vybrat nejméně 1 obrázek!",
    })
  }

  const year = new Date().getFullYear()
  const prefix = `attachments/${year}/`
  const results = []

  for (const file of files) {
    try {
      ensureBlob(file, {
        maxSize: "8MB",
        types: ["image"],
      })
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Obrázek musí být ve formátu JPEG, PNG nebo GIF.",
      })
    }

    const result = await blob.put(file.name, file, {
      prefix,
      addRandomSuffix: false,
      contentType: file.type,
    })

    results.push(result)
  }

  setResponseStatus(event, 201)
  return results
})
