import { eq } from "drizzle-orm"
import { createTransport } from "nodemailer"
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

  const { name, email, message } = result.data

  const setting = await db
    .select()
    .from(tables.siteSettings)
    .where(eq(tables.siteSettings.key, "contactEmail"))
    .get()

  const recipients = setting?.value || process.env.SMTP_FROM || ""
  if (!recipients) {
    throw createError({
      statusCode: 500,
      message: "E-mail se nepodařilo odeslat.",
    })
  }

  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT) || 587
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpFrom = process.env.SMTP_FROM

  if (!smtpHost || !smtpFrom) {
    console.warn("[contact] SMTP not configured, logging submission instead:", {
      name,
      email,
      message,
    })
    return { success: true }
  }

  const transporter = createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  })

  try {
    await transporter.sendMail({
      from: smtpFrom,
      replyTo: email,
      to: recipients,
      subject: "Email z BasicRS",
      text: `Jméno: ${name}\nE-mail: ${email}\n\n${message}`,
    })
  } catch (error) {
    console.error("[contact] Failed to send email:", error)
    throw createError({
      statusCode: 500,
      message: "E-mail se nepodařilo odeslat.",
    })
  }

  return { success: true }
})
