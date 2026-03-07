export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)

  if (!user) {
    await deleteSession(event)
    return {
      success: true,
      message: "Není přihlášen žádný uživatel.",
      wasLoggedIn: false,
    }
  }

  await deleteSession(event)
  return { success: true, wasLoggedIn: true }
})
