import { blob } from "@nuxthub/blob"

const HEADER_IMAGES_PREFIX = "header-images/"

export default defineEventHandler(async () => {
  const { blobs } = await blob.list({ prefix: HEADER_IMAGES_PREFIX })

  if (blobs.length === 0) {
    return null
  }

  const randomBlob = blobs[Math.floor(Math.random() * blobs.length)]!
  return {
    pathname: randomBlob.pathname,
    url: `/api/header-images/${randomBlob.pathname}`,
  }
})
