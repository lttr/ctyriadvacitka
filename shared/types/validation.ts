import { createInsertSchema, createSelectSchema } from "drizzle-zod"

import { articles, news, siteSettings, users } from "~~/server/db/schema"

export const insertArticleSchema = createInsertSchema(articles)
export const selectArticleSchema = createSelectSchema(articles)

export const insertNewsSchema = createInsertSchema(news)
export const selectNewsSchema = createSelectSchema(news)

export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)

export const insertSiteSettingSchema = createInsertSchema(siteSettings)
export const selectSiteSettingSchema = createSelectSchema(siteSettings)
