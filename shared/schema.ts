import { z } from "zod";

// User roles
export type UserRole = "customer" | "admin" | "super_admin";
export type UserStatus = "active" | "blocked";

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  role: z.enum(["customer", "admin", "super_admin"]),
  status: z.enum(["active", "blocked"]),
  loyaltyPoints: z.number().default(0),
  referralCode: z.string(),
  referredBy: z.string().optional(),
  carInfo: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
    plateNumber: z.string().optional(),
  }).optional(),
  createdAt: z.string(),
  twoFactorEnabled: z.boolean().default(false),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = Omit<User, "id" | "createdAt" | "loyaltyPoints" | "referralCode">;

// Service Package schema
export const servicePackageSchema = z.object({
  id: z.string(),
  nameAr: z.string(),
  nameEn: z.string(),
  nameFr: z.string(),
  descriptionAr: z.string(),
  descriptionEn: z.string(),
  descriptionFr: z.string(),
  priceSedanKD: z.number(),
  priceSuvKD: z.number(),
  estimatedMinutes: z.number(),
  category: z.enum(["exterior", "interior", "full", "vip", "monthly"]),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
});

export type ServicePackage = z.infer<typeof servicePackageSchema>;
export type InsertServicePackage = Omit<ServicePackage, "id" | "createdAt">;

// Order schema
export const orderStatusSchema = z.enum(["pending", "assigned", "in_progress", "completed", "cancelled"]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  status: orderStatusSchema,
  carType: z.enum(["sedan", "suv", "other"]),
  carDetails: z.string().optional(),
  servicePackageId: z.string(),
  priceKD: z.number(),
  paymentMethod: z.enum(["cash", "online"]),
  address: z.string(),
  area: z.string(),
  preferredDate: z.string(),
  preferredTime: z.string(),
  loyaltyPointsEarned: z.number().default(0),
  loyaltyPointsRedeemed: z.number().default(0),
  discountApplied: z.number().default(0),
  referralId: z.string().optional(),
  cancelReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Order = z.infer<typeof orderSchema>;
export type InsertOrder = Omit<Order, "id" | "createdAt" | "updatedAt" | "loyaltyPointsEarned">;

// Loyalty Config schema
export const loyaltyConfigSchema = z.object({
  id: z.string(),
  pointsPerKD: z.number().default(35),
  conversionRate: z.number().default(0.004), // Points to KD (100 points = 0.4 KD)
  maxRedeemPercentage: z.number().default(0.15),
  welcomeBonusPoints: z.number().default(200),
  referrerBonusPoints: z.number().default(400),
  referredWelcomePoints: z.number().default(200),
  firstOrderDiscount: z.number().default(0),
  updatedAt: z.string(),
});

export type LoyaltyConfig = z.infer<typeof loyaltyConfigSchema>;

// Loyalty Transaction schema
export const loyaltyTransactionSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  orderId: z.string().optional(),
  pointsChange: z.number(),
  type: z.enum(["earn", "redeem", "referral_bonus", "welcome_bonus", "admin_adjustment"]),
  note: z.string().optional(),
  createdAt: z.string(),
  createdBy: z.string(),
});

export type LoyaltyTransaction = z.infer<typeof loyaltyTransactionSchema>;

// Referral schema
export const referralSchema = z.object({
  id: z.string(),
  referrerId: z.string(),
  referredCustomerId: z.string(),
  firstOrderId: z.string().optional(),
  status: z.enum(["pending", "completed", "invalid"]),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});

export type Referral = z.infer<typeof referralSchema>;

// Blog Post schema
export const blogPostSchema = z.object({
  id: z.string(),
  titleAr: z.string(),
  titleEn: z.string(),
  titleFr: z.string(),
  contentAr: z.string(),
  contentEn: z.string(),
  contentFr: z.string(),
  imageUrl: z.string().optional(),
  isPublished: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BlogPost = z.infer<typeof blogPostSchema>;

// Testimonial schema
export const testimonialSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  contentAr: z.string(),
  contentEn: z.string(),
  contentFr: z.string(),
  rating: z.number().min(1).max(5),
  imageUrl: z.string().optional(),
  isApproved: z.boolean().default(false),
  createdAt: z.string(),
});

export type Testimonial = z.infer<typeof testimonialSchema>;

// Gallery Item schema
export const galleryItemSchema = z.object({
  id: z.string(),
  beforeImageUrl: z.string(),
  afterImageUrl: z.string(),
  captionAr: z.string(),
  captionEn: z.string(),
  captionFr: z.string(),
  isPublished: z.boolean().default(true),
  createdAt: z.string(),
});

export type GalleryItem = z.infer<typeof galleryItemSchema>;

// Contact Message schema
export const contactMessageSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  createdAt: z.string(),
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;

// Audit Log schema
export const auditLogSchema = z.object({
  id: z.string(),
  actionType: z.string(),
  performedBy: z.string(),
  performedAt: z.string(),
  targetCollection: z.string(),
  targetId: z.string(),
  oldValue: z.any().optional(),
  newValue: z.any().optional(),
  note: z.string().optional(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

// Insert schemas for forms
export const insertOrderSchema = orderSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  loyaltyPointsEarned: true 
});

export const insertContactMessageSchema = contactMessageSchema.omit({ 
  id: true, 
  createdAt: true, 
  isRead: true 
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
