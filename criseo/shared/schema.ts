import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const safehouses = pgTable("safehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  type: text("type").notNull(), // 'safehouse', 'warehouse', 'medical'
  currentOccupancy: integer("current_occupancy").notNull().default(0),
  maxCapacity: integer("max_capacity").notNull(),
  phoneNumber: text("phone_number"),
  status: text("status").notNull().default("available"), // 'available', 'full', 'closed'
  services: text("services").array().notNull().default([]), // ['food', 'medical', 'shelter', 'supplies']
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  safehouseId: varchar("safehouse_id").notNull().references(() => safehouses.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'ngo', 'government', 'charity'
  description: text("description"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  website: text("website"),
  services: text("services").array().notNull().default([]),
  isVerified: boolean("is_verified").notNull().default(false),
  responseTime: text("response_time"), // e.g., "< 1 hour", "24 hours"
  languages: text("languages").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  safehouseId: varchar("safehouse_id").notNull().references(() => safehouses.id),
  itemName: text("item_name").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(), // 'kg', 'pieces', 'bottles', etc.
  category: text("category").notNull(), // 'food', 'medical', 'clothing', 'water'
  expiryDate: timestamp("expiry_date"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Relations
export const safehousesRelations = relations(safehouses, ({ many }) => ({
  ratings: many(ratings),
  inventory: many(inventory),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  safehouse: one(safehouses, {
    fields: [ratings.safehouseId],
    references: [safehouses.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  safehouse: one(safehouses, {
    fields: [inventory.safehouseId],
    references: [safehouses.id],
  }),
}));

// Insert schemas
export const insertSafehouseSchema = createInsertSchema(safehouses).omit({
  id: true,
  createdAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Types
export type InsertSafehouse = z.infer<typeof insertSafehouseSchema>;
export type Safehouse = typeof safehouses.$inferSelect;
export type SafehouseWithRatings = Safehouse & { ratings: Rating[]; averageRating: number; };

export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
