import { blob } from "@nuxthub/blob"

const ATTACHMENTS_PREFIX = "attachments/"

export default defineEventHandler(async (event) => {
  await requireRole(event, "editor")

  const { blobs } = await blob.list({ prefix: ATTACHMENTS_PREFIX })
  return blobs
})
