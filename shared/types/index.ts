import type { InferInsertModel, InferSelectModel } from "drizzle-orm"

import type { articles, news, siteSettings, users } from "~~/server/db/schema"

export type Article = InferSelectModel<typeof articles>
export type NewArticle = InferInsertModel<typeof articles>

export type News = InferSelectModel<typeof news>
export type NewNews = InferInsertModel<typeof news>

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type SiteSetting = InferSelectModel<typeof siteSettings>
export type NewSiteSetting = InferInsertModel<typeof siteSettings>
