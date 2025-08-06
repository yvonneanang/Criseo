var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertInventorySchema: () => insertInventorySchema,
  insertOrganizationSchema: () => insertOrganizationSchema,
  insertRatingSchema: () => insertRatingSchema,
  insertSafehouseSchema: () => insertSafehouseSchema,
  insertUserSchema: () => insertUserSchema,
  inventory: () => inventory,
  inventoryRelations: () => inventoryRelations,
  organizations: () => organizations,
  ratings: () => ratings,
  ratingsRelations: () => ratingsRelations,
  safehouses: () => safehouses,
  safehousesRelations: () => safehousesRelations,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var safehouses = pgTable("safehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  type: text("type").notNull(),
  // 'safehouse', 'warehouse', 'medical'
  currentOccupancy: integer("current_occupancy").notNull().default(0),
  maxCapacity: integer("max_capacity").notNull(),
  phoneNumber: text("phone_number"),
  status: text("status").notNull().default("available"),
  // 'available', 'full', 'closed'
  services: text("services").array().notNull().default([]),
  // ['food', 'medical', 'shelter', 'supplies']
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  safehouseId: varchar("safehouse_id").notNull().references(() => safehouses.id),
  rating: integer("rating").notNull(),
  // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // 'ngo', 'government', 'charity'
  description: text("description"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  website: text("website"),
  services: text("services").array().notNull().default([]),
  isVerified: boolean("is_verified").notNull().default(false),
  responseTime: text("response_time"),
  // e.g., "< 1 hour", "24 hours"
  languages: text("languages").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  safehouseId: varchar("safehouse_id").notNull().references(() => safehouses.id),
  itemName: text("item_name").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  // 'kg', 'pieces', 'bottles', etc.
  category: text("category").notNull(),
  // 'food', 'medical', 'clothing', 'water'
  expiryDate: timestamp("expiry_date"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow()
});
var safehousesRelations = relations(safehouses, ({ many }) => ({
  ratings: many(ratings),
  inventory: many(inventory)
}));
var ratingsRelations = relations(ratings, ({ one }) => ({
  safehouse: one(safehouses, {
    fields: [ratings.safehouseId],
    references: [safehouses.id]
  })
}));
var inventoryRelations = relations(inventory, ({ one }) => ({
  safehouse: one(safehouses, {
    fields: [inventory.safehouseId],
    references: [safehouses.id]
  })
}));
var insertSafehouseSchema = createInsertSchema(safehouses).omit({
  id: true,
  createdAt: true
});
var insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true
});
var insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true
});
var insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import dotenv from "dotenv";
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.prod" });
} else {
  dotenv.config({ path: ".env.dev" });
}
neonConfig.webSocketConstructor = ws;
console.log(process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, sql as sql2, and, desc, asc } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getSafehouses(filters) {
    const whereConditions = [];
    if (filters?.type) {
      whereConditions.push(eq(safehouses.type, filters.type));
    }
    if (filters?.status) {
      whereConditions.push(eq(safehouses.status, filters.status));
    }
    if (filters?.services && filters.services.length > 0) {
      whereConditions.push(sql2`${safehouses.services} && ${filters.services}`);
    }
    const havingConditions = [];
    if (filters?.radius && filters?.latitude && filters?.longitude) {
      havingConditions.push(sql2`(6371 * acos(cos(radians(${filters.latitude})) * cos(radians(${safehouses.latitude})) * cos(radians(${safehouses.longitude}) - radians(${filters.longitude})) + sin(radians(${filters.latitude})) * sin(radians(${safehouses.latitude})))) <= ${filters.radius}`);
    }
    let queryBuilder = db.select({
      id: safehouses.id,
      name: safehouses.name,
      address: safehouses.address,
      latitude: safehouses.latitude,
      longitude: safehouses.longitude,
      type: safehouses.type,
      currentOccupancy: safehouses.currentOccupancy,
      maxCapacity: safehouses.maxCapacity,
      phoneNumber: safehouses.phoneNumber,
      status: safehouses.status,
      services: safehouses.services,
      lastUpdated: safehouses.lastUpdated,
      createdAt: safehouses.createdAt,
      averageRating: sql2`COALESCE(AVG(${ratings.rating}), 0)`.as("averageRating"),
      distance: filters?.latitude && filters?.longitude ? sql2`(6371 * acos(cos(radians(${filters.latitude})) * cos(radians(${safehouses.latitude})) * cos(radians(${safehouses.longitude}) - radians(${filters.longitude})) + sin(radians(${filters.latitude})) * sin(radians(${safehouses.latitude}))))`.as("distance") : sql2`0`.as("distance")
    }).from(safehouses).leftJoin(ratings, eq(safehouses.id, ratings.safehouseId)).groupBy(safehouses.id);
    if (whereConditions.length > 0) {
      queryBuilder = queryBuilder.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }
    if (havingConditions.length > 0) {
      queryBuilder = queryBuilder.having(havingConditions.length === 1 ? havingConditions[0] : and(...havingConditions));
    }
    const results = await queryBuilder.orderBy(
      filters?.latitude && filters?.longitude ? asc(sql2`distance`) : desc(safehouses.lastUpdated)
    );
    const safehousesWithRatings = await Promise.all(
      results.map(async (safehouse) => {
        const safehouseRatings = await this.getSafehouseRatings(safehouse.id);
        const averageRating = safehouseRatings.length > 0 ? safehouseRatings.reduce((sum, rating) => sum + rating.rating, 0) / safehouseRatings.length : 0;
        return {
          ...safehouse,
          ratings: safehouseRatings,
          averageRating: Number(averageRating)
        };
      })
    );
    return safehousesWithRatings;
  }
  async getSafehouse(id) {
    const [safehouse] = await db.select().from(safehouses).where(eq(safehouses.id, id));
    if (!safehouse) return void 0;
    const safehouseRatings = await this.getSafehouseRatings(id);
    const averageRating = safehouseRatings.length > 0 ? safehouseRatings.reduce((sum, rating) => sum + rating.rating, 0) / safehouseRatings.length : 0;
    return {
      ...safehouse,
      ratings: safehouseRatings,
      averageRating: Number(averageRating)
    };
  }
  async createSafehouse(insertSafehouse) {
    const [safehouse] = await db.insert(safehouses).values(insertSafehouse).returning();
    return safehouse;
  }
  async updateSafehouse(id, updates) {
    const [safehouse] = await db.update(safehouses).set({ ...updates, lastUpdated: /* @__PURE__ */ new Date() }).where(eq(safehouses.id, id)).returning();
    return safehouse || void 0;
  }
  async addRating(insertRating) {
    const [rating] = await db.insert(ratings).values(insertRating).returning();
    return rating;
  }
  async getSafehouseRatings(safehouseId) {
    return await db.select().from(ratings).where(eq(ratings.safehouseId, safehouseId)).orderBy(desc(ratings.createdAt));
  }
  async getOrganizations(verified) {
    if (verified !== void 0) {
      return await db.select().from(organizations).where(eq(organizations.isVerified, verified)).orderBy(desc(organizations.isVerified), asc(organizations.name));
    }
    return await db.select().from(organizations).orderBy(desc(organizations.isVerified), asc(organizations.name));
  }
  async getOrganization(id) {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization || void 0;
  }
  async createOrganization(insertOrganization) {
    const [organization] = await db.insert(organizations).values(insertOrganization).returning();
    return organization;
  }
  async getInventory(safehouseId) {
    return await db.select().from(inventory).where(eq(inventory.safehouseId, safehouseId)).orderBy(asc(inventory.category), asc(inventory.itemName));
  }
  async addInventoryItem(insertItem) {
    const [item] = await db.insert(inventory).values({ ...insertItem, lastUpdated: /* @__PURE__ */ new Date() }).returning();
    return item;
  }
  async updateInventoryItem(id, updates) {
    const [item] = await db.update(inventory).set({ ...updates, lastUpdated: /* @__PURE__ */ new Date() }).where(eq(inventory.id, id)).returning();
    return item || void 0;
  }
  async deleteInventoryItem(id) {
    const result = await db.delete(inventory).where(eq(inventory.id, id));
    return (result.rowCount || 0) > 0;
  }
};
var storage = new DatabaseStorage();

// server/services/gemma.ts
import ollama from "ollama";
var Gemma3nService = class {
  async detectLanguageAndTranslate(text2, targetLanguage = "en") {
    try {
      const prompt = `You are a multilingual language expert. Analyze the following text and:
1. Detect the source language
2. Translate it to ${targetLanguage} if it's not already in that language
3. Provide confidence score (0-1)

Text: "${text2}"

Respond with JSON in this exact format:
{
  "detectedLanguage": "language_code (e.g., 'en', 'es', 'fr', 'ar')",
  "translatedText": "translated text in target language",
  "confidence": confidence_score_between_0_and_1
}`;
      const response = await ollama.generate({
        model: "gemma3n:e2b",
        prompt,
        format: {
          type: "object",
          properties: {
            detectedLanguage: { type: "string" },
            translatedText: { type: "string" },
            confidence: { type: "number" }
          },
          required: ["detectedLanguage", "translatedText", "confidence"]
        },
        system: "You are a professional translator and language detection specialist with expertise in crisis communication and humanitarian contexts.",
        stream: false
      });
      const rawJson = response.response;
      if (rawJson) {
        const result = JSON.parse(rawJson);
        return result;
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error("Error with language detection/translation:", error);
      throw new Error(`Language service failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async getLocalizedResourceRecommendation(query, userLanguage = "en", location, userPreferences) {
    try {
      const languageInstruction = userLanguage !== "en" ? `Respond in ${userLanguage} language when appropriate, especially for user-facing text.` : "";
      const prompt = `You are a crisis aid assistant helping people find humanitarian resources. ${languageInstruction}
      
User query: "${query}"
User language: ${userLanguage}
${location ? `User location: ${location.latitude}, ${location.longitude}` : ""}
${userPreferences ? `User preferences: ${JSON.stringify(userPreferences)}` : ""}

Based on this query, provide recommendations for crisis resources like safehouses, food warehouses, medical facilities, or humanitarian organizations. Consider the urgency and provide actionable next steps. Use culturally appropriate language and consider regional contexts.

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "type": "safehouse|warehouse|medical|organization",
      "reason": "explanation of why this resource type is recommended",
      "priority": "high|medium|low",
      "contactInfo": {
        "phone": "emergency phone number",
        "email": "contact email",
        "website": "organization website"
      }
    }
  ],
  "urgencyLevel": "emergency|urgent|normal",
  "nextSteps": ["specific action items for the user"]
}`;
      const response = await ollama.generate({
        model: "gemma3n:e2b",
        prompt,
        format: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  reason: { type: "string" },
                  priority: { type: "string" },
                  contactInfo: {
                    type: "object",
                    properties: {
                      phone: { type: "string" },
                      email: { type: "string" },
                      website: { type: "string" }
                    }
                  }
                },
                required: ["type", "reason", "priority"]
              }
            },
            urgencyLevel: { type: "string" },
            nextSteps: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["recommendations", "urgencyLevel", "nextSteps"]
        },
        system: "You are a knowledgeable crisis aid assistant with access to humanitarian resource databases. Always prioritize safety and provide accurate, helpful information for people in crisis situations. Adapt your communication style to the user's language and cultural context.",
        stream: false
      });
      const rawJson = response.response;
      if (rawJson) {
        const result = JSON.parse(rawJson);
        return result;
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error("Error getting localized AI recommendation:", error);
      throw new Error(`Failed to get AI recommendation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async getResourceRecommendation(query, location, userPreferences) {
    try {
      const prompt = `You are a crisis aid assistant helping people find humanitarian resources. 
      
User query: "${query}"
${location ? `User location: ${location.latitude}, ${location.longitude}` : ""}
${userPreferences ? `User preferences: ${JSON.stringify(userPreferences)}` : ""}

Based on this query, provide recommendations for crisis resources like safehouses, food warehouses, medical facilities, or humanitarian organizations. Consider the urgency and provide actionable next steps.

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "type": "safehouse|warehouse|medical|organization",
      "reason": "explanation of why this resource type is recommended",
      "priority": "high|medium|low",
      "contactInfo": {
        "phone": "emergency phone number",
        "email": "contact email",
        "website": "organization website"
      }
    }
  ],
  "urgencyLevel": "emergency|urgent|normal",
  "nextSteps": ["specific action items for the user"]
}`;
      const response = await ollama.generate({
        model: "gemma3n:e2b",
        prompt,
        format: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  reason: { type: "string" },
                  priority: { type: "string" },
                  contactInfo: {
                    type: "object",
                    properties: {
                      phone: { type: "string" },
                      email: { type: "string" },
                      website: { type: "string" }
                    }
                  }
                },
                required: ["type", "reason", "priority"]
              }
            },
            urgencyLevel: { type: "string" },
            nextSteps: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["recommendations", "urgencyLevel", "nextSteps"]
        },
        system: "You are a knowledgeable crisis aid assistant with access to humanitarian resource databases. Always prioritize safety and provide accurate, helpful information for people in crisis situations.",
        stream: false
      });
      const rawJson = response.response;
      if (rawJson) {
        const result = JSON.parse(rawJson);
        return result;
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      throw new Error(`Failed to get AI recommendation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async generateRecipes(inventory2, peopleCount) {
    try {
      const inventoryList = inventory2.map(
        (item) => `${item.itemName}: ${item.quantity} ${item.unit}`
      ).join(", ");
      const prompt = `You are a nutrition expert helping design meals for people in crisis situations. 

Available inventory: ${inventoryList}
Number of people: ${peopleCount}

Create 3-5 nutritious, practical recipes using only the available ingredients. Focus on:
1. Maximum nutrition with available ingredients
2. Simple preparation methods suitable for crisis conditions
3. Efficient use of resources
4. Cultural sensitivity and dietary considerations

Respond with JSON in this exact format:
{
  "recipes": [
    {
      "name": "recipe name",
      "servings": number,
      "ingredients": [
        {
          "item": "ingredient name",
          "quantity": number,
          "unit": "unit of measurement"
        }
      ],
      "instructions": ["step 1", "step 2", "step 3"],
      "nutritionalInfo": {
        "calories": estimated_calories_per_serving,
        "protein": "protein content estimate",
        "carbs": "carbohydrate content estimate"
      }
    }
  ]
}`;
      const response = await ollama.generate({
        model: "gemma3n:e2b",
        prompt,
        format: {
          type: "object",
          properties: {
            recipes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  servings: { type: "number" },
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item: { type: "string" },
                        quantity: { type: "number" },
                        unit: { type: "string" }
                      },
                      required: ["item", "quantity", "unit"]
                    }
                  },
                  instructions: {
                    type: "array",
                    items: { type: "string" }
                  },
                  nutritionalInfo: {
                    type: "object",
                    properties: {
                      calories: { type: "number" },
                      protein: { type: "string" },
                      carbs: { type: "string" }
                    }
                  }
                },
                required: ["name", "servings", "ingredients", "instructions"]
              }
            }
          },
          required: ["recipes"]
        },
        system: "You are a nutritionist and crisis response expert specializing in food preparation during humanitarian emergencies.",
        stream: false
      });
      const rawJson = response.response;
      console.log("This is the raw json, ", rawJson);
      if (rawJson) {
        const result = JSON.parse(rawJson);
        return result;
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error("Error generating recipes:", error);
      throw new Error(`Failed to generate recipes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async calculateRations(inventory2, peopleCount, days = 1) {
    try {
      const inventoryList = inventory2.map(
        (item) => `${item.itemName}: ${item.quantity} ${item.unit} (expires: ${item.expiryDate || "N/A"})`
      ).join(", ");
      const prompt = `You are a humanitarian logistics expert calculating food rations for crisis situations.

Available inventory: ${inventoryList}
Number of people: ${peopleCount}
Number of days: ${days}

Calculate optimal ration distribution considering:
1. Minimum 2000 calories per person per day
2. Balanced nutrition (protein, carbs, vitamins)
3. Food safety and expiration dates
4. Equitable distribution
5. Storage and preparation constraints

Respond with JSON in this exact format:
{
  "totalDays": ${days},
  "peopleCount": ${peopleCount},
  "dailyCaloriesPerPerson": estimated_calories,
  "rationBreakdown": [
    {
      "day": 1,
      "meals": [
        {
          "meal": "breakfast|lunch|dinner",
          "items": [
            {
              "item": "food item name",
              "quantityPerPerson": number,
              "unit": "unit",
              "totalQuantity": number
            }
          ]
        }
      ]
    }
  ],
  "recommendations": ["optimization suggestions"],
  "shortages": [
    {
      "item": "item name",
      "needed": amount_needed,
      "available": amount_available,
      "unit": "unit"
    }
  ]
}`;
      const response = await ollama.generate({
        model: "gemma3n:e2b",
        prompt,
        format: {
          type: "object",
          properties: {
            totalDays: { type: "number" },
            peopleCount: { type: "number" },
            dailyCaloriesPerPerson: { type: "number" },
            rationBreakdown: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  meals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        meal: { type: "string" },
                        // "breakfast", "lunch", "dinner"
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              item: { type: "string" },
                              quantityPerPerson: { type: "number" },
                              unit: { type: "string" },
                              totalQuantity: { type: "number" }
                            },
                            required: ["item", "quantityPerPerson", "unit", "totalQuantity"]
                          }
                        }
                      },
                      required: ["meal", "items"]
                    }
                  }
                },
                required: ["day", "meals"]
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            shortages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  needed: { type: "number" },
                  available: { type: "number" },
                  unit: { type: "string" }
                },
                required: ["item", "needed", "available", "unit"]
              }
            }
          },
          required: [
            "totalDays",
            "peopleCount",
            "dailyCaloriesPerPerson",
            "rationBreakdown",
            "recommendations",
            "shortages"
          ]
        },
        system: "You are a humanitarian aid specialist with expertise in food distribution, nutrition planning, and crisis management.",
        stream: false
      });
      const rawJson = response.response;
      if (rawJson) {
        const result = JSON.parse(rawJson);
        console.log(result);
        return result;
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error("Error calculating rations:", error);
      throw new Error(`Failed to calculate rations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};
var gemma3nService = new Gemma3nService();

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/safehouses", async (req, res) => {
    try {
      const {
        latitude,
        longitude,
        radius = 10,
        type,
        services,
        status = "available"
      } = req.query;
      const filters = { status };
      if (latitude && longitude) {
        filters.latitude = parseFloat(latitude);
        filters.longitude = parseFloat(longitude);
        filters.radius = parseFloat(radius);
      }
      if (type) {
        filters.type = type;
      }
      if (services) {
        filters.services = Array.isArray(services) ? services : [services];
      }
      const safehouses2 = await storage.getSafehouses(filters);
      res.json(safehouses2);
    } catch (error) {
      console.error("Error fetching safehouses:", error);
      res.status(500).json({ error: "Failed to fetch safehouses" });
    }
  });
  app2.get("/api/safehouses/:id", async (req, res) => {
    try {
      const safehouse = await storage.getSafehouse(req.params.id);
      if (!safehouse) {
        return res.status(404).json({ error: "Safehouse not found" });
      }
      res.json(safehouse);
    } catch (error) {
      console.error("Error fetching safehouse:", error);
      res.status(500).json({ error: "Failed to fetch safehouse" });
    }
  });
  app2.post("/api/safehouses", async (req, res) => {
    try {
      const validatedData = insertSafehouseSchema.parse(req.body);
      const safehouse = await storage.createSafehouse(validatedData);
      res.status(201).json(safehouse);
    } catch (error) {
      console.error("Error creating safehouse:", error);
      res.status(400).json({ error: "Invalid safehouse data" });
    }
  });
  app2.patch("/api/safehouses/:id", async (req, res) => {
    try {
      const validatedData = insertSafehouseSchema.partial().parse(req.body);
      const safehouse = await storage.updateSafehouse(req.params.id, validatedData);
      if (!safehouse) {
        return res.status(404).json({ error: "Safehouse not found" });
      }
      res.json(safehouse);
    } catch (error) {
      console.error("Error updating safehouse:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });
  app2.post("/api/ratings", async (req, res) => {
    try {
      const validatedData = insertRatingSchema.parse(req.body);
      const rating = await storage.addRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      console.error("Error adding rating:", error);
      res.status(400).json({ error: "Invalid rating data" });
    }
  });
  app2.get("/api/safehouses/:id/ratings", async (req, res) => {
    try {
      const ratings2 = await storage.getSafehouseRatings(req.params.id);
      res.json(ratings2);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });
  app2.get("/api/organizations", async (req, res) => {
    try {
      const { verified } = req.query;
      const verifiedFilter = verified === "true" ? true : verified === "false" ? false : void 0;
      const organizations2 = await storage.getOrganizations(verifiedFilter);
      res.json(organizations2);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });
  app2.post("/api/organizations", async (req, res) => {
    try {
      const validatedData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(validatedData);
      res.status(201).json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(400).json({ error: "Invalid organization data" });
    }
  });
  app2.get("/api/safehouses/:id/inventory", async (req, res) => {
    try {
      const inventory2 = await storage.getInventory(req.params.id);
      res.json(inventory2);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });
  app2.post("/api/inventory", async (req, res) => {
    try {
      const validatedData = insertInventorySchema.parse(req.body);
      const item = await storage.addInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error adding inventory item:", error);
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });
  app2.patch("/api/inventory/:id", async (req, res) => {
    try {
      const validatedData = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, validatedData);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });
  app2.delete("/api/inventory/:id", async (req, res) => {
    try {
      const success = await storage.deleteInventoryItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ error: "Failed to delete inventory item" });
    }
  });
  app2.post("/api/ai/recommend", async (req, res) => {
    try {
      const { query, location, userPreferences, userLanguage } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }
      const recommendation = userLanguage ? await gemma3nService.getLocalizedResourceRecommendation(query, userLanguage, location, userPreferences) : await gemma3nService.getResourceRecommendation(query, location, userPreferences);
      res.json(recommendation);
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      res.status(500).json({ error: "Failed to get AI recommendation" });
    }
  });
  app2.post("/api/ai/translate", async (req, res) => {
    try {
      const { text: text2, targetLanguage = "en" } = req.body;
      if (!text2) {
        return res.status(400).json({ error: "Text is required" });
      }
      const result = await gemma3nService.detectLanguageAndTranslate(text2, targetLanguage);
      res.json(result);
    } catch (error) {
      console.error("Error with language detection/translation:", error);
      res.status(500).json({ error: "Failed to process language request" });
    }
  });
  app2.post("/api/ai/recipes", async (req, res) => {
    try {
      const { inventory: inventory2, peopleCount } = req.body;
      if (!inventory2 || !peopleCount) {
        return res.status(400).json({ error: "Inventory and people count are required" });
      }
      const recipes = await gemma3nService.generateRecipes(inventory2, peopleCount);
      res.json(recipes);
    } catch (error) {
      console.error("Error generating recipes:", error);
      res.status(500).json({ error: "Failed to generate recipes" });
    }
  });
  app2.post("/api/ai/rations", async (req, res) => {
    try {
      const { inventory: inventory2, peopleCount, days = 1 } = req.body;
      if (!inventory2 || !peopleCount) {
        return res.status(400).json({ error: "Inventory and people count are required" });
      }
      const rationPlan = await gemma3nService.calculateRations(inventory2, peopleCount, days);
      res.json(rationPlan);
    } catch (error) {
      console.error("Error calculating rations:", error);
      res.status(500).json({ error: "Failed to calculate rations" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
