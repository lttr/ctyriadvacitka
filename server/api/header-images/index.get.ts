import { blob } from "@nuxthub/blob"

const HEADER_IMAGES_PREFIX = "header-images/"

export default defineEventHandler(async () => {
  const { blobs } = await blob.list({ prefix: HEADER_IMAGES_PREFIX })
  return blobs
})
