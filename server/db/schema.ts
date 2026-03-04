import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const articles = sqliteTable("articles", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  url: text().notNull().unique(),
  content: text(),
  requestable: int({ mode: "boolean" }).notNull().default(false),
  inMenu: int("in_menu", { mode: "boolean" }).notNull().default(false),
  author: text(),
  datetime: text(),
})

export const news = sqliteTable("news", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  content: text(),
  author: text(),
  datetime: text(),
})

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(),
  password: text().notNull(),
  name: text(),
  surname: text(),
  nickname: text(),
  email: text().unique(),
  role: text().notNull().default("registered"),
})

export const siteSettings = sqliteTable("site_settings", {
  key: text().primaryKey(),
  value: text(),
})
