import { contactFormSchema } from "~~/shared/types/contact"

export default defineEventHandler(async (event) => {
  checkContactRateLimit(event)

  const body = await readBody(event)

  const result = contactFormSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Neplatná data formuláře",
      data: result.error.issues,
    })
  }

  // Log the contact form submission (email sending will be added later)
  console.log("[contact]", {
    name: result.data.name,
    email: result.data.email,
    message: result.data.message,
  })

  return { success: true }
})
