import { createInsertSchema, createSelectSchema } from "drizzle-zod"

import {
  articles,
  news,
  sessions,
  siteSettings,
  users,
} from "~~/server/db/schema"

export const insertArticleSchema = createInsertSchema(articles)
export const selectArticleSchema = createSelectSchema(articles)

export const insertNewsSchema = createInsertSchema(news)
export const selectNewsSchema = createSelectSchema(news)

export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)

export const insertSessionSchema = createInsertSchema(sessions)
export const selectSessionSchema = createSelectSchema(sessions)

export const insertSiteSettingSchema = createInsertSchema(siteSettings)
export const selectSiteSettingSchema = createSelectSchema(siteSettings)
