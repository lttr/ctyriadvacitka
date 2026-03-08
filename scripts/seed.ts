import { createClient } from "@libsql/client"
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql"
import { hash } from "node:crypto"

import * as schema from "~~/server/db/schema"

function bcryptLikeHash(password: string): string {
  const hashed = hash("sha256", password, "hex")
  return `$2b$10$${hashed}`
}

export async function seedDatabase(db: LibSQLDatabase<typeof schema>) {
  // Users
  await db.insert(schema.users).values([
    {
      username: "admin",
      password: bcryptLikeHash("admin123"),
      name: "Jan",
      surname: "Novák",
      nickname: "Honza",
      email: "admin@24hk.cz",
      role: "admin",
    },
    {
      username: "editor",
      password: bcryptLikeHash("editor123"),
      name: "Petra",
      surname: "Svobodová",
      nickname: "Péťa",
      email: "editor@24hk.cz",
      role: "editor",
    },
    {
      username: "uzivatel",
      password: bcryptLikeHash("user123"),
      name: "Tomáš",
      surname: "Dvořák",
      nickname: "Tom",
      email: "uzivatel@24hk.cz",
      role: "registered",
    },
  ])

  // Articles
  await db.insert(schema.articles).values([
    {
      title: "Úvod",
      url: "uvod",
      content:
        "<p>Vítejte na stránkách 24. oddílu Junáka v Hradci Králové.</p>",
      requestable: false,
      inMenu: true,
      author: "admin",
      datetime: "2026-01-01T10:00:00.000Z",
    },
    {
      title: "O nás",
      url: "o-nas",
      content:
        "<p>Jsme skautský oddíl s dlouhou tradicí. Scházíme se každý týden a pořádáme výpravy do přírody.</p>",
      requestable: false,
      inMenu: true,
      author: "admin",
      datetime: "2026-01-05T10:00:00.000Z",
    },
    {
      title: "Vedení oddílu",
      url: "vedeni-oddilu",
      content:
        "<p>Oddíl vedou zkušení vedoucí s mnohaletou praxí.</p><ul><li>Hlavní vedoucí: Jan Novák</li><li>Zástupce: Petra Svobodová</li></ul>",
      requestable: false,
      inMenu: true,
      author: "admin",
      datetime: "2026-01-10T10:00:00.000Z",
    },
    {
      title: "Přihláška do oddílu",
      url: "prihlaska",
      content:
        "<p>Chcete se k nám přidat? Vyplňte přihlášku a přijďte na schůzku.</p>",
      requestable: true,
      inMenu: true,
      author: "editor",
      datetime: "2026-01-15T10:00:00.000Z",
    },
    {
      title: "Historie oddílu",
      url: "historie",
      content:
        "<p>Oddíl byl založen v roce 1990. Od té doby prošel mnoha změnami.</p>",
      requestable: false,
      inMenu: false,
      author: "admin",
      datetime: "2026-02-01T10:00:00.000Z",
    },
    {
      title: "Letní tábor 2026",
      url: "letni-tabor-2026",
      content:
        "<p>Letní tábor se bude konat v červenci na Vysočině. Podrobnosti budou upřesněny.</p>",
      requestable: true,
      inMenu: false,
      author: "editor",
      datetime: "2026-02-15T10:00:00.000Z",
    },
  ])

  // News
  await db.insert(schema.news).values([
    {
      title: "Zahájení nového roku",
      content: "<p>Sraz bude v klubovně v 16:00.</p>",
      author: "admin",
      datetime: "2026-01-07T16:00:00.000Z",
    },
    {
      title: "Výprava do Krkonoš",
      content: "<p>O víkendu jedeme na hory. Sraz v 8:00 na nádraží.</p>",
      author: "editor",
      datetime: "2026-01-14T08:00:00.000Z",
    },
    {
      title: "Skautský slib",
      content: "<p>Tři noví členové složili skautský slib.</p>",
      author: "admin",
      datetime: "2026-01-21T17:00:00.000Z",
    },
    {
      title: "Schůzka odpadá",
      content: "<p>Z důvodu prázdnin schůzka v tomto týdnu odpadá.</p>",
      author: "editor",
      datetime: "2026-01-28T10:00:00.000Z",
    },
    {
      title: "Karneval",
      content: "<p>Přijďte v maskách! Nejlepší maska vyhraje cenu.</p>",
      author: "editor",
      datetime: "2026-02-04T16:00:00.000Z",
    },
    {
      title: "Brigáda v klubovně",
      content: "<p>Potřebujeme uklidit a připravit klubovnu na jaro.</p>",
      author: "admin",
      datetime: "2026-02-11T09:00:00.000Z",
    },
    {
      title: "Závody v orientačním běhu",
      content:
        "<p>Regionální závody se budou konat v lese u Nového Hradce.</p>",
      author: "editor",
      datetime: "2026-02-18T10:00:00.000Z",
    },
    {
      title: "Nábor nových členů",
      content: "<p>Hledáme nové členy ve věku 8–15 let.</p>",
      author: "admin",
      datetime: "2026-02-25T16:00:00.000Z",
    },
    {
      title: "Jarní výprava",
      content:
        "<p>Jedeme na víkendovou výpravu do Orlických hor. Sraz v pátek v 15:00.</p>",
      author: "editor",
      datetime: "2026-03-01T15:00:00.000Z",
    },
    {
      title: "Schůzka s rodiči",
      content:
        "<p>Zveme rodiče na informační schůzku o letním táboře. Začátek v 18:00 v klubovně.</p>",
      author: "admin",
      datetime: "2026-03-04T18:00:00.000Z",
    },
    {
      title: "Fotografická soutěž",
      content:
        "<p>Pošlete své nejlepší fotky z akcí do konce března. Nejlepší budou vystaveny.</p>",
      author: "editor",
      datetime: "2026-03-02T10:00:00.000Z",
    },
  ])

  // Site settings
  const introArticles = await db.select().from(schema.articles)
  const introArticle = introArticles.find((a) => a.url === "uvod")

  await db.insert(schema.siteSettings).values([
    { key: "siteName", value: "24. oddíl Junáka Hradec Králové" },
    { key: "siteDescription", value: "Skautský oddíl" },
    { key: "contactEmail", value: "info@24hk.cz" },
    { key: "contactPhone", value: "+420 123 456 789" },
    {
      key: "contactAddress",
      value: "Klubovna, Třída ČSA 15, 500 02 Hradec Králové",
    },
    {
      key: "introArticleId",
      value: introArticle ? String(introArticle.id) : "1",
    },
    {
      key: "googleCalendarId",
      value: "example@group.calendar.google.com",
    },
    {
      key: "contactInfo",
      value: JSON.stringify([
        {
          name: "Jan Novák",
          role: "hlavní vedoucí oddílu",
          nickname: "Honza",
          phone: "+420 111 222 333",
          email: "honza@24hk.cz",
        },
        {
          name: "Petra Svobodová",
          role: "vedoucí vlčat",
          nickname: "Péťa",
          phone: "+420 444 555 666",
          email: "peta@24hk.cz",
        },
      ]),
    },
  ])
}

// Run directly when executed as a script
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.mjs"))

if (isDirectRun) {
  const client = createClient({ url: "file:.data/db/sqlite.db" })
  const db = drizzle(client, { schema })

  seedDatabase(db)
    .then(() => {
      console.log("Database seeded successfully.")
      client.close()
    })
    .catch((error) => {
      console.error("Seeding failed:", error)
      client.close()
      process.exit(1)
    })
}
