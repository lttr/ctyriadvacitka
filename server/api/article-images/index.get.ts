import { blob } from "@nuxthub/blob"

const ARTICLE_IMAGES_PREFIX = "article-images/"

export default defineEventHandler(async (event) => {
  await requireRole(event, "editor")

  const { blobs } = await blob.list({ prefix: ARTICLE_IMAGES_PREFIX })
  return blobs
})
