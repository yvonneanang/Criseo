import { 
  safehouses, 
  ratings, 
  organizations, 
  inventory, 
  users,
  type Safehouse, 
  type SafehouseWithRatings,
  type InsertSafehouse,
  type Rating,
  type InsertRating,
  type Organization,
  type InsertOrganization,
  type Inventory,
  type InsertInventory,
  type User,
  type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Safehouses
  getSafehouses(filters?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    type?: string;
    services?: string[];
    status?: string;
  }): Promise<SafehouseWithRatings[]>;
  getSafehouse(id: string): Promise<SafehouseWithRatings | undefined>;
  createSafehouse(safehouse: InsertSafehouse): Promise<Safehouse>;
  updateSafehouse(id: string, updates: Partial<InsertSafehouse>): Promise<Safehouse | undefined>;

  // Ratings
  addRating(rating: InsertRating): Promise<Rating>;
  getSafehouseRatings(safehouseId: string): Promise<Rating[]>;

  // Organizations
  getOrganizations(verified?: boolean): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;

  // Inventory
  getInventory(safehouseId: string): Promise<Inventory[]>;
  addInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, updates: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getSafehouses(filters?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    type?: string;
    services?: string[];
    status?: string;
  }): Promise<SafehouseWithRatings[]> {
    // Build where conditions
    const whereConditions = [];
    if (filters?.type) {
      whereConditions.push(eq(safehouses.type, filters.type));
    }
    if (filters?.status) {
      whereConditions.push(eq(safehouses.status, filters.status));
    }
    if (filters?.services && filters.services.length > 0) {
      whereConditions.push(sql`${safehouses.services} && ${filters.services}`);
    }

    // Build having conditions  
    const havingConditions = [];
    if (filters?.radius && filters?.latitude && filters?.longitude) {
      havingConditions.push(sql`(6371 * acos(cos(radians(${filters.latitude})) * cos(radians(${safehouses.latitude})) * cos(radians(${safehouses.longitude}) - radians(${filters.longitude})) + sin(radians(${filters.latitude})) * sin(radians(${safehouses.latitude})))) <= ${filters.radius}`);
    }

    // Build and execute query
    let queryBuilder = db
      .select({
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
        averageRating: sql<number>`COALESCE(AVG(${ratings.rating}), 0)`.as('averageRating'),
        distance: filters?.latitude && filters?.longitude 
          ? sql<number>`(6371 * acos(cos(radians(${filters.latitude})) * cos(radians(${safehouses.latitude})) * cos(radians(${safehouses.longitude}) - radians(${filters.longitude})) + sin(radians(${filters.latitude})) * sin(radians(${safehouses.latitude}))))`.as('distance')
          : sql<number>`0`.as('distance')
      })
      .from(safehouses)
      .leftJoin(ratings, eq(safehouses.id, ratings.safehouseId))
      .groupBy(safehouses.id);

    // Apply where conditions
    if (whereConditions.length > 0) {
      queryBuilder = queryBuilder.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)) as any;
    }

    // Apply having conditions  
    if (havingConditions.length > 0) {
      queryBuilder = queryBuilder.having(havingConditions.length === 1 ? havingConditions[0] : and(...havingConditions)) as any;
    }

    const results = await queryBuilder.orderBy(
      filters?.latitude && filters?.longitude ? asc(sql`distance`) : desc(safehouses.lastUpdated)
    );

    // Get ratings for each safehouse and ensure averageRating is a number
    const safehousesWithRatings: SafehouseWithRatings[] = await Promise.all(
      results.map(async (safehouse) => {
        const safehouseRatings = await this.getSafehouseRatings(safehouse.id);
        const averageRating = safehouseRatings.length > 0 
          ? safehouseRatings.reduce((sum, rating) => sum + rating.rating, 0) / safehouseRatings.length 
          : 0;
        return {
          ...safehouse,
          ratings: safehouseRatings,
          averageRating: Number(averageRating),
        };
      })
    );

    return safehousesWithRatings;
  }

  async getSafehouse(id: string): Promise<SafehouseWithRatings | undefined> {
    const [safehouse] = await db.select().from(safehouses).where(eq(safehouses.id, id));
    if (!safehouse) return undefined;

    const safehouseRatings = await this.getSafehouseRatings(id);
    const averageRating = safehouseRatings.length > 0 
      ? safehouseRatings.reduce((sum, rating) => sum + rating.rating, 0) / safehouseRatings.length 
      : 0;

    return {
      ...safehouse,
      ratings: safehouseRatings,
      averageRating: Number(averageRating),
    };
  }

  async createSafehouse(insertSafehouse: InsertSafehouse): Promise<Safehouse> {
    const [safehouse] = await db
      .insert(safehouses)
      .values(insertSafehouse)
      .returning();
    return safehouse;
  }

  async updateSafehouse(id: string, updates: Partial<InsertSafehouse>): Promise<Safehouse | undefined> {
    const [safehouse] = await db
      .update(safehouses)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(safehouses.id, id))
      .returning();
    return safehouse || undefined;
  }

  async addRating(insertRating: InsertRating): Promise<Rating> {
    const [rating] = await db
      .insert(ratings)
      .values(insertRating)
      .returning();
    return rating;
  }

  async getSafehouseRatings(safehouseId: string): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.safehouseId, safehouseId))
      .orderBy(desc(ratings.createdAt));
  }

  async getOrganizations(verified?: boolean): Promise<Organization[]> {
    if (verified !== undefined) {
      return await db.select().from(organizations)
        .where(eq(organizations.isVerified, verified))
        .orderBy(desc(organizations.isVerified), asc(organizations.name));
    }

    return await db.select().from(organizations)
      .orderBy(desc(organizations.isVerified), asc(organizations.name));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization || undefined;
  }

  async createOrganization(insertOrganization: InsertOrganization): Promise<Organization> {
    const [organization] = await db
      .insert(organizations)
      .values(insertOrganization)
      .returning();
    return organization;
  }

  async getInventory(safehouseId: string): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(eq(inventory.safehouseId, safehouseId))
      .orderBy(asc(inventory.category), asc(inventory.itemName));
  }

  async addInventoryItem(insertItem: InsertInventory): Promise<Inventory> {
    const [item] = await db
      .insert(inventory)
      .values({ ...insertItem, lastUpdated: new Date() })
      .returning();
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const [item] = await db
      .update(inventory)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return item || undefined;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(inventory).where(eq(inventory.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
