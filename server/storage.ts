import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  users, servicePackages, orders, loyaltyConfig, loyaltyTransactions,
  referrals, blogPosts, testimonials, galleryItems, contactMessages, auditLogs,
  type User, type InsertUser, type ServicePackage, type InsertServicePackage,
  type Order, type InsertOrder, type LoyaltyConfig, type InsertLoyaltyConfig,
  type LoyaltyTransaction, type InsertLoyaltyTransaction, type Referral, type InsertReferral,
  type BlogPost, type InsertBlogPost, type Testimonial, type InsertTestimonial,
  type GalleryItem, type InsertGalleryItem, type ContactMessage, type InsertContactMessage,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GS";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser & { id: string }): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getUsers(filters?: { role?: string; status?: string }): Promise<User[]>;

  // Service Packages
  getServicePackage(id: string): Promise<ServicePackage | undefined>;
  getServicePackages(activeOnly?: boolean): Promise<ServicePackage[]>;
  createServicePackage(pkg: InsertServicePackage): Promise<ServicePackage>;
  updateServicePackage(id: string, data: Partial<ServicePackage>): Promise<ServicePackage | undefined>;
  deleteServicePackage(id: string): Promise<boolean>;

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrders(filters?: { status?: string; startDate?: Date; endDate?: Date; assignedDriver?: string }): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined>;

  // Loyalty Config
  getLoyaltyConfig(): Promise<LoyaltyConfig>;
  updateLoyaltyConfig(data: Partial<LoyaltyConfig>): Promise<LoyaltyConfig>;

  // Loyalty Transactions
  getLoyaltyTransactions(customerId: string): Promise<LoyaltyTransaction[]>;
  createLoyaltyTransaction(tx: InsertLoyaltyTransaction): Promise<LoyaltyTransaction>;

  // Referrals
  getReferral(id: string): Promise<Referral | undefined>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;
  getReferralByReferred(referredId: string): Promise<Referral | undefined>;
  createReferral(ref: InsertReferral): Promise<Referral>;
  updateReferral(id: string, data: Partial<Referral>): Promise<Referral | undefined>;

  // Blog Posts
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPosts(publishedOnly?: boolean): Promise<BlogPost[]>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, data: Partial<BlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;

  // Testimonials
  getTestimonial(id: string): Promise<Testimonial | undefined>;
  getTestimonials(approvedOnly?: boolean): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: string, data: Partial<Testimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: string): Promise<boolean>;

  // Gallery Items
  getGalleryItem(id: string): Promise<GalleryItem | undefined>;
  getGalleryItems(publishedOnly?: boolean): Promise<GalleryItem[]>;
  createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem>;
  updateGalleryItem(id: string, data: Partial<GalleryItem>): Promise<GalleryItem | undefined>;
  deleteGalleryItem(id: string): Promise<boolean>;

  // Contact Messages
  getContactMessage(id: string): Promise<ContactMessage | undefined>;
  getContactMessages(): Promise<ContactMessage[]>;
  createContactMessage(msg: InsertContactMessage): Promise<ContactMessage>;
  markContactMessageRead(id: string): Promise<boolean>;
  deleteContactMessage(id: string): Promise<boolean>;

  // Audit Logs
  getAuditLogs(filters?: { performedBy?: string; targetCollection?: string }): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Analytics
  getAnalytics(startDate: Date, endDate: Date): Promise<{
    totalIncome: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    newCustomers: number;
    pointsIssued: number;
    pointsRedeemed: number;
    referralCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async createUser(user: InsertUser & { id: string }): Promise<User> {
    const referralCode = generateReferralCode();
    const [created] = await db.insert(users).values({
      ...user,
      referralCode,
      loyaltyPoints: 0,
    }).returning();
    return created;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getUsers(filters?: { role?: string; status?: string }): Promise<User[]> {
    let query = db.select().from(users);
    const conditions = [];
    if (filters?.role) conditions.push(eq(users.role, filters.role as any));
    if (filters?.status) conditions.push(eq(users.status, filters.status as any));
    if (conditions.length > 0) {
      return db.select().from(users).where(and(...conditions)).orderBy(desc(users.createdAt));
    }
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Service Packages
  async getServicePackage(id: string): Promise<ServicePackage | undefined> {
    const [pkg] = await db.select().from(servicePackages).where(eq(servicePackages.id, id));
    return pkg;
  }

  async getServicePackages(activeOnly = false): Promise<ServicePackage[]> {
    if (activeOnly) {
      return db.select().from(servicePackages).where(eq(servicePackages.isActive, true)).orderBy(servicePackages.priceSedanKD);
    }
    return db.select().from(servicePackages).orderBy(servicePackages.priceSedanKD);
  }

  async createServicePackage(pkg: InsertServicePackage): Promise<ServicePackage> {
    const id = randomUUID();
    const [created] = await db.insert(servicePackages).values({ ...pkg, id }).returning();
    return created;
  }

  async updateServicePackage(id: string, data: Partial<ServicePackage>): Promise<ServicePackage | undefined> {
    const [updated] = await db.update(servicePackages).set(data).where(eq(servicePackages.id, id)).returning();
    return updated;
  }

  async deleteServicePackage(id: string): Promise<boolean> {
    const result = await db.delete(servicePackages).where(eq(servicePackages.id, id));
    return true;
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }

  async getOrders(filters?: { status?: string; startDate?: Date; endDate?: Date; assignedDriver?: string }): Promise<Order[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(orders.status, filters.status as any));
    if (filters?.startDate) conditions.push(gte(orders.createdAt, filters.startDate));
    if (filters?.endDate) conditions.push(lte(orders.createdAt, filters.endDate));
    if (filters?.assignedDriver) conditions.push(eq(orders.assignedDriver, filters.assignedDriver));
    if (conditions.length > 0) {
      return db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt));
    }
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const [created] = await db.insert(orders).values({ ...order, id }).returning();
    return created;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined> {
    const updateData = { ...data, updatedAt: new Date() };
    const [updated] = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();
    return updated;
  }

  // Loyalty Config
  async getLoyaltyConfig(): Promise<LoyaltyConfig> {
    const [config] = await db.select().from(loyaltyConfig);
    if (!config) {
      const id = "default";
      const [created] = await db.insert(loyaltyConfig).values({
        id,
        pointsPerKD: 35,
        conversionRate: 0.004,
        maxRedeemPercentage: 0.15,
        welcomeBonusPoints: 200,
        referrerBonusPoints: 400,
        referredWelcomePoints: 200,
        firstOrderDiscount: 0.15,
      }).returning();
      return created;
    }
    return config;
  }

  async updateLoyaltyConfig(data: Partial<LoyaltyConfig>): Promise<LoyaltyConfig> {
    const config = await this.getLoyaltyConfig();
    const [updated] = await db.update(loyaltyConfig).set({ ...data, updatedAt: new Date() }).where(eq(loyaltyConfig.id, config.id)).returning();
    return updated;
  }

  // Loyalty Transactions
  async getLoyaltyTransactions(customerId: string): Promise<LoyaltyTransaction[]> {
    return db.select().from(loyaltyTransactions).where(eq(loyaltyTransactions.customerId, customerId)).orderBy(desc(loyaltyTransactions.createdAt));
  }

  async createLoyaltyTransaction(tx: InsertLoyaltyTransaction): Promise<LoyaltyTransaction> {
    const id = randomUUID();
    const [created] = await db.insert(loyaltyTransactions).values({ ...tx, id }).returning();
    return created;
  }

  // Referrals
  async getReferral(id: string): Promise<Referral | undefined> {
    const [ref] = await db.select().from(referrals).where(eq(referrals.id, id));
    return ref;
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return db.select().from(referrals).where(eq(referrals.referrerId, referrerId)).orderBy(desc(referrals.createdAt));
  }

  async getReferralByReferred(referredId: string): Promise<Referral | undefined> {
    const [ref] = await db.select().from(referrals).where(eq(referrals.referredCustomerId, referredId));
    return ref;
  }

  async createReferral(ref: InsertReferral): Promise<Referral> {
    const id = randomUUID();
    const [created] = await db.insert(referrals).values({ ...ref, id }).returning();
    return created;
  }

  async updateReferral(id: string, data: Partial<Referral>): Promise<Referral | undefined> {
    const [updated] = await db.update(referrals).set(data).where(eq(referrals.id, id)).returning();
    return updated;
  }

  // Blog Posts
  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPosts(publishedOnly = false): Promise<BlogPost[]> {
    if (publishedOnly) {
      return db.select().from(blogPosts).where(eq(blogPosts.isPublished, true)).orderBy(desc(blogPosts.createdAt));
    }
    return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = randomUUID();
    const [created] = await db.insert(blogPosts).values({ ...post, id }).returning();
    return created;
  }

  async updateBlogPost(id: string, data: Partial<BlogPost>): Promise<BlogPost | undefined> {
    const [updated] = await db.update(blogPosts).set({ ...data, updatedAt: new Date() }).where(eq(blogPosts.id, id)).returning();
    return updated;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return true;
  }

  // Testimonials
  async getTestimonial(id: string): Promise<Testimonial | undefined> {
    const [t] = await db.select().from(testimonials).where(eq(testimonials.id, id));
    return t;
  }

  async getTestimonials(approvedOnly = false): Promise<Testimonial[]> {
    if (approvedOnly) {
      return db.select().from(testimonials).where(eq(testimonials.isApproved, true)).orderBy(desc(testimonials.createdAt));
    }
    return db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const id = randomUUID();
    const [created] = await db.insert(testimonials).values({ ...testimonial, id }).returning();
    return created;
  }

  async updateTestimonial(id: string, data: Partial<Testimonial>): Promise<Testimonial | undefined> {
    const [updated] = await db.update(testimonials).set(data).where(eq(testimonials.id, id)).returning();
    return updated;
  }

  async deleteTestimonial(id: string): Promise<boolean> {
    await db.delete(testimonials).where(eq(testimonials.id, id));
    return true;
  }

  // Gallery Items
  async getGalleryItem(id: string): Promise<GalleryItem | undefined> {
    const [item] = await db.select().from(galleryItems).where(eq(galleryItems.id, id));
    return item;
  }

  async getGalleryItems(publishedOnly = false): Promise<GalleryItem[]> {
    if (publishedOnly) {
      return db.select().from(galleryItems).where(eq(galleryItems.isPublished, true)).orderBy(desc(galleryItems.createdAt));
    }
    return db.select().from(galleryItems).orderBy(desc(galleryItems.createdAt));
  }

  async createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem> {
    const id = randomUUID();
    const [created] = await db.insert(galleryItems).values({ ...item, id }).returning();
    return created;
  }

  async updateGalleryItem(id: string, data: Partial<GalleryItem>): Promise<GalleryItem | undefined> {
    const [updated] = await db.update(galleryItems).set(data).where(eq(galleryItems.id, id)).returning();
    return updated;
  }

  async deleteGalleryItem(id: string): Promise<boolean> {
    await db.delete(galleryItems).where(eq(galleryItems.id, id));
    return true;
  }

  // Contact Messages
  async getContactMessage(id: string): Promise<ContactMessage | undefined> {
    const [msg] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
    return msg;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async createContactMessage(msg: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const [created] = await db.insert(contactMessages).values({ ...msg, id }).returning();
    return created;
  }

  async markContactMessageRead(id: string): Promise<boolean> {
    await db.update(contactMessages).set({ isRead: true }).where(eq(contactMessages.id, id));
    return true;
  }

  async deleteContactMessage(id: string): Promise<boolean> {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
    return true;
  }

  // Audit Logs
  async getAuditLogs(filters?: { performedBy?: string; targetCollection?: string }): Promise<AuditLog[]> {
    const conditions = [];
    if (filters?.performedBy) conditions.push(eq(auditLogs.performedBy, filters.performedBy));
    if (filters?.targetCollection) conditions.push(eq(auditLogs.targetCollection, filters.targetCollection));
    if (conditions.length > 0) {
      return db.select().from(auditLogs).where(and(...conditions)).orderBy(desc(auditLogs.performedAt));
    }
    return db.select().from(auditLogs).orderBy(desc(auditLogs.performedAt));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const [created] = await db.insert(auditLogs).values({ ...log, id }).returning();
    return created;
  }

  // Analytics
  async getAnalytics(startDate: Date, endDate: Date): Promise<{
    totalIncome: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    newCustomers: number;
    pointsIssued: number;
    pointsRedeemed: number;
    referralCount: number;
  }> {
    const ordersInRange = await db.select().from(orders).where(
      and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))
    );

    const completedOrders = ordersInRange.filter(o => o.status === "completed");
    const cancelledOrders = ordersInRange.filter(o => o.status === "cancelled");
    const totalIncome = completedOrders.reduce((sum, o) => sum + o.priceKD - o.discountApplied, 0);

    const newCustomers = await db.select({ count: count() }).from(users).where(
      and(
        eq(users.role, "customer"),
        gte(users.createdAt, startDate),
        lte(users.createdAt, endDate)
      )
    );

    const txInRange = await db.select().from(loyaltyTransactions).where(
      and(gte(loyaltyTransactions.createdAt, startDate), lte(loyaltyTransactions.createdAt, endDate))
    );
    const pointsIssued = txInRange.filter(t => t.pointsChange > 0).reduce((sum, t) => sum + t.pointsChange, 0);
    const pointsRedeemed = txInRange.filter(t => t.pointsChange < 0).reduce((sum, t) => sum + Math.abs(t.pointsChange), 0);

    const referralsInRange = await db.select({ count: count() }).from(referrals).where(
      and(gte(referrals.createdAt, startDate), lte(referrals.createdAt, endDate))
    );

    return {
      totalIncome,
      totalOrders: ordersInRange.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      newCustomers: newCustomers[0]?.count || 0,
      pointsIssued,
      pointsRedeemed,
      referralCount: referralsInRange[0]?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
