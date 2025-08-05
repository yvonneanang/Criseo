import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSafehouseSchema, insertRatingSchema, insertOrganizationSchema, insertInventorySchema } from "@shared/schema";
import { gemma3nService } from "./services/gemma";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Safehouses routes
  app.get("/api/safehouses", async (req, res) => {
    try {
      const {
        latitude,
        longitude,
        radius = 10,
        type,
        services,
        status = "available"
      } = req.query;

      const filters: any = { status };

      if (latitude && longitude) {
        filters.latitude = parseFloat(latitude as string);
        filters.longitude = parseFloat(longitude as string);
        filters.radius = parseFloat(radius as string);
      }

      if (type) {
        filters.type = type as string;
      }

      if (services) {
        filters.services = Array.isArray(services) ? services : [services];
      }

      const safehouses = await storage.getSafehouses(filters);
      res.json(safehouses);
    } catch (error) {
      console.error("Error fetching safehouses:", error);
      res.status(500).json({ error: "Failed to fetch safehouses" });
    }
  });

  app.get("/api/safehouses/:id", async (req, res) => {
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

  app.post("/api/safehouses", async (req, res) => {
    try {
      const validatedData = insertSafehouseSchema.parse(req.body);
      const safehouse = await storage.createSafehouse(validatedData);
      res.status(201).json(safehouse);
    } catch (error) {
      console.error("Error creating safehouse:", error);
      res.status(400).json({ error: "Invalid safehouse data" });
    }
  });

  app.patch("/api/safehouses/:id", async (req, res) => {
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

  // Ratings routes
  app.post("/api/ratings", async (req, res) => {
    try {
      const validatedData = insertRatingSchema.parse(req.body);
      const rating = await storage.addRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      console.error("Error adding rating:", error);
      res.status(400).json({ error: "Invalid rating data" });
    }
  });

  app.get("/api/safehouses/:id/ratings", async (req, res) => {
    try {
      const ratings = await storage.getSafehouseRatings(req.params.id);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });

  // Organizations routes
  app.get("/api/organizations", async (req, res) => {
    try {
      const { verified } = req.query;
      const verifiedFilter = verified === "true" ? true : verified === "false" ? false : undefined;
      const organizations = await storage.getOrganizations(verifiedFilter);
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.post("/api/organizations", async (req, res) => {
    try {
      const validatedData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(validatedData);
      res.status(201).json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(400).json({ error: "Invalid organization data" });
    }
  });

  // Inventory routes
  app.get("/api/safehouses/:id/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventory(req.params.id);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const validatedData = insertInventorySchema.parse(req.body);
      const item = await storage.addInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error adding inventory item:", error);
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
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

  app.delete("/api/inventory/:id", async (req, res) => {
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

  // AI Assistant routes
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { query, location, userPreferences, userLanguage } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Use localized recommendation if language is specified
      const recommendation = userLanguage 
        ? await gemma3nService.getLocalizedResourceRecommendation(query, userLanguage, location, userPreferences)
        : await gemma3nService.getResourceRecommendation(query, location, userPreferences);
      
      res.json(recommendation);
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      res.status(500).json({ error: "Failed to get AI recommendation" });
    }
  });

  // Language detection and translation endpoint
  app.post("/api/ai/translate", async (req, res) => {
    try {
      const { text, targetLanguage = 'en' } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const result = await gemma3nService.detectLanguageAndTranslate(text, targetLanguage);
      res.json(result);
    } catch (error) {
      console.error("Error with language detection/translation:", error);
      res.status(500).json({ error: "Failed to process language request" });
    }
  });

  app.post("/api/ai/recipes", async (req, res) => {
    try {
      const { inventory, peopleCount } = req.body;
      
      if (!inventory || !peopleCount) {
        return res.status(400).json({ error: "Inventory and people count are required" });
      }

      const recipes = await gemma3nService.generateRecipes(inventory, peopleCount);
      res.json(recipes);
    } catch (error) {
      console.error("Error generating recipes:", error);
      res.status(500).json({ error: "Failed to generate recipes" });
    }
  });

  app.post("/api/ai/rations", async (req, res) => {
    try {
      const { inventory, peopleCount, days = 1 } = req.body;
      
      if (!inventory || !peopleCount) {
        return res.status(400).json({ error: "Inventory and people count are required" });
      }

      const rationPlan = await gemma3nService.calculateRations(inventory, peopleCount, days);
      res.json(rationPlan);
    } catch (error) {
      console.error("Error calculating rations:", error);
      res.status(500).json({ error: "Failed to calculate rations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
