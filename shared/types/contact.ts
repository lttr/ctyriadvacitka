import { z } from "zod"

export const contactFormSchema = z.object({
  name: z.string().min(1, "Jméno je povinné"),
  email: z.string().email("Neplatná emailová adresa"),
  message: z.string().min(10, "Zpráva musí mít alespoň 10 znaků"),
})

export type ContactForm = z.infer<typeof contactFormSchema>

export const contactPersonSchema = z.object({
  name: z.string().min(1, "Jméno je povinné"),
  role: z.string().min(1, "Role je povinná"),
  nickname: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email("Neplatná emailová adresa").optional().default(""),
  photo: z.string().optional().default(""),
})

export const contactPersonsSchema = z.array(contactPersonSchema)

export type ContactPerson = z.infer<typeof contactPersonSchema>
