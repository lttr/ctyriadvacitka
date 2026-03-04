import { z } from "zod"

export const contactFormSchema = z.object({
  name: z.string().min(1, "Jméno je povinné"),
  email: z.string().email("Neplatná emailová adresa"),
  message: z.string().min(10, "Zpráva musí mít alespoň 10 znaků"),
})

export type ContactForm = z.infer<typeof contactFormSchema>
