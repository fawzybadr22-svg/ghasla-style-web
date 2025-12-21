import { pgTable, text, integer, boolean, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["customer", "delegate", "admin", "super_admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "blocked"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "assigned", "on_the_way", "in_progress", "completed", "cancelled"]);
export const carTypeEnum = pgEnum("car_type", ["sedan", "suv", "other"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "online"]);
export const serviceCategoryEnum = pgEnum("service_category", ["exterior", "interior", "full", "vip", "monthly"]);
export const loyaltyTransactionTypeEnum = pgEnum("loyalty_transaction_type", ["earn", "redeem", "referral_bonus", "welcome_bonus", "admin_adjustment"]);
export const referralStatusEnum = pgEnum("referral_status", ["pending", "completed", "invalid"]);
export const offerTargetAudienceEnum = pgEnum("offer_target_audience", ["all", "new_customers", "existing_customers"]);
export const offerLoyaltyScopeEnum = pgEnum("offer_loyalty_scope", ["inside_loyalty", "outside_loyalty"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "initiated", "captured", "failed", "refunded", "cancelled"]);
export const customerTierEnum = pgEnum("customer_tier", ["bronze", "silver", "gold"]);

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("customer"),
  status: userStatusEnum("status").notNull().default("active"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  carMake: text("car_make"),
  carModel: text("car_model"),
  carColor: text("car_color"),
  carPlateNumber: text("car_plate_number"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  // Delegate-specific fields
  autoAcceptOrders: boolean("auto_accept_orders").notNull().default(false),
  coverageAreas: text("coverage_areas").array(),
  maxActiveOrders: integer("max_active_orders").notNull().default(3),
  isAvailable: boolean("is_available").notNull().default(true),
  currentLatitude: real("current_latitude"),
  currentLongitude: real("current_longitude"),
  tier: customerTierEnum("tier").notNull().default("bronze"),
  completedOrdersCount: integer("completed_orders_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, loyaltyPoints: true, referralCode: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Service Packages table
export const servicePackages = pgTable("service_packages", {
  id: text("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  nameFr: text("name_fr").notNull(),
  descriptionAr: text("description_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionFr: text("description_fr").notNull(),
  priceSedanKD: real("price_sedan_kd").notNull(),
  priceSuvKD: real("price_suv_kd").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  category: serviceCategoryEnum("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServicePackageSchema = createInsertSchema(servicePackages).omit({ id: true, createdAt: true });
export type InsertServicePackage = z.infer<typeof insertServicePackageSchema>;
export type ServicePackage = typeof servicePackages.$inferSelect;

// Orders table
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  carType: carTypeEnum("car_type").notNull(),
  carDetails: text("car_details"),
  servicePackageId: text("service_package_id").notNull().references(() => servicePackages.id),
  priceKD: real("price_kd").notNull(),
  finalPriceKD: real("final_price_kd"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  address: text("address").notNull(),
  area: text("area").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(),
  loyaltyPointsEarned: integer("loyalty_points_earned").notNull().default(0),
  loyaltyPointsRedeemed: integer("loyalty_points_redeemed").notNull().default(0),
  discountApplied: real("discount_applied").notNull().default(0),
  referralId: text("referral_id"),
  cancelReason: text("cancel_reason"),
  assignedDriver: text("assigned_driver"),
  assignedAt: timestamp("assigned_at"),
  startedAt: timestamp("started_at"),
  onTheWayAt: timestamp("on_the_way_at"),
  completedAt: timestamp("completed_at"),
  delegateNotes: text("delegate_notes"),
  customerNotes: text("customer_notes"),
  beforePhotoUrl: text("before_photo_url"),
  afterPhotoUrl: text("after_photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  loyaltyPointsEarned: true, 
  completedAt: true,
  assignedAt: true,
  startedAt: true,
  onTheWayAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Loyalty Config table
export const loyaltyConfig = pgTable("loyalty_config", {
  id: text("id").primaryKey(),
  pointsPerKD: integer("points_per_kd").notNull().default(35),
  conversionRate: real("conversion_rate").notNull().default(0.004),
  maxRedeemPercentage: real("max_redeem_percentage").notNull().default(0.15),
  welcomeBonusPoints: integer("welcome_bonus_points").notNull().default(200),
  referrerBonusPoints: integer("referrer_bonus_points").notNull().default(400),
  referredWelcomePoints: integer("referred_welcome_points").notNull().default(200),
  firstOrderDiscount: real("first_order_discount").notNull().default(0.15),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLoyaltyConfigSchema = createInsertSchema(loyaltyConfig).omit({ id: true, updatedAt: true });
export type InsertLoyaltyConfig = z.infer<typeof insertLoyaltyConfigSchema>;
export type LoyaltyConfig = typeof loyaltyConfig.$inferSelect;

// Loyalty Transactions table
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => users.id),
  orderId: text("order_id"),
  pointsChange: integer("points_change").notNull(),
  type: loyaltyTransactionTypeEnum("type").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({ id: true, createdAt: true });
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;

// Referrals table
export const referrals = pgTable("referrals", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id").notNull().references(() => users.id),
  referredCustomerId: text("referred_customer_id").notNull().references(() => users.id),
  firstOrderId: text("first_order_id"),
  status: referralStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true, completedAt: true });
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

// Blog Posts table
export const blogPosts = pgTable("blog_posts", {
  id: text("id").primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  titleFr: text("title_fr").notNull(),
  contentAr: text("content_ar").notNull(),
  contentEn: text("content_en").notNull(),
  contentFr: text("content_fr").notNull(),
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Testimonials table
export const testimonials = pgTable("testimonials", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  contentAr: text("content_ar").notNull(),
  contentEn: text("content_en").notNull(),
  contentFr: text("content_fr").notNull(),
  rating: integer("rating").notNull(),
  imageUrl: text("image_url"),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, createdAt: true });
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

// Gallery Items table
export const galleryItems = pgTable("gallery_items", {
  id: text("id").primaryKey(),
  beforeImageUrl: text("before_image_url").notNull(),
  afterImageUrl: text("after_image_url").notNull(),
  captionAr: text("caption_ar").notNull(),
  captionEn: text("caption_en").notNull(),
  captionFr: text("caption_fr").notNull(),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({ id: true, createdAt: true });
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;
export type GalleryItem = typeof galleryItems.$inferSelect;

// Offers/Promotions table
export const offers = pgTable("offers", {
  id: text("id").primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  titleFr: text("title_fr").notNull(),
  descriptionAr: text("description_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionFr: text("description_fr").notNull(),
  discountPercentage: real("discount_percentage"),
  discountAmountKD: real("discount_amount_kd"),
  imageUrl: text("image_url"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  targetAudience: offerTargetAudienceEnum("target_audience").notNull().default("all"),
  loyaltyScope: offerLoyaltyScopeEnum("loyalty_scope").notNull().default("outside_loyalty"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offers).omit({ id: true, createdAt: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;

// Contact Messages table
export const contactMessages = pgTable("contact_messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true, isRead: true });
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actionType: text("action_type").notNull(),
  performedBy: text("performed_by").notNull(),
  performedAt: timestamp("performed_at").notNull().defaultNow(),
  targetCollection: text("target_collection").notNull(),
  targetId: text("target_id").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  note: text("note"),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, performedAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Order Ratings table
export const orderRatings = pgTable("order_ratings", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id),
  customerId: text("customer_id").notNull().references(() => users.id),
  delegateId: text("delegate_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderRatingSchema = createInsertSchema(orderRatings).omit({ id: true, createdAt: true });
export type InsertOrderRating = z.infer<typeof insertOrderRatingSchema>;
export type OrderRating = typeof orderRatings.$inferSelect;

// Payments table - for KNET/Tap Payments integration
export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id),
  customerId: text("customer_id").notNull().references(() => users.id),
  amountKD: real("amount_kd").notNull(),
  currency: text("currency").notNull().default("KWD"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paymentGateway: text("payment_gateway").notNull().default("tap"), // tap, knet, myfatoorah
  gatewayTransactionId: text("gateway_transaction_id"),
  gatewayChargeId: text("gateway_charge_id"),
  gatewayTrackingId: text("gateway_tracking_id"),
  gatewayResponse: text("gateway_response"), // JSON string of full response
  paymentUrl: text("payment_url"),
  callbackUrl: text("callback_url"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  cardBrand: text("card_brand"), // KNET, VISA, etc.
  cardLastFour: text("card_last_four"),
  errorMessage: text("error_message"),
  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  refundAmount: real("refund_amount"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  paidAt: true,
  refundedAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Kuwait Areas for service validation - with availability status
// Areas currently available for service
export const availableAreasNow = [
  { nameAr: "السلام", nameEn: "Al-Salam", nameFr: "Al-Salam" },
  { nameAr: "السالمية", nameEn: "Salmiya", nameFr: "Salmiya" },
  { nameAr: "الدسمة", nameEn: "Dasma", nameFr: "Dasma" },
  { nameAr: "الدعية", nameEn: "Daiya", nameFr: "Daiya" },
  { nameAr: "الشامية", nameEn: "Shamiya", nameFr: "Shamiya" },
  { nameAr: "الروضة", nameEn: "Rawda", nameFr: "Rawda" },
  { nameAr: "العديلية", nameEn: "Adiliya", nameFr: "Adiliya" },
  { nameAr: "كيفان", nameEn: "Kaifan", nameFr: "Kaifan" },
  { nameAr: "الخالدية", nameEn: "Khaldiya", nameFr: "Khaldiya" },
  { nameAr: "القادسية", nameEn: "Qadsiya", nameFr: "Qadsiya" },
  { nameAr: "الفيحاء", nameEn: "Faiha", nameFr: "Faiha" },
  { nameAr: "المنصورية", nameEn: "Mansouriya", nameFr: "Mansouriya" },
  { nameAr: "النزهة", nameEn: "Nuzha", nameFr: "Nuzha" },
  { nameAr: "اليرموك", nameEn: "Yarmouk", nameFr: "Yarmouk" },
  { nameAr: "السرة", nameEn: "Surra", nameFr: "Surra" },
  { nameAr: "قرطبة", nameEn: "Qortuba", nameFr: "Qortuba" },
  { nameAr: "الشعب البحري", nameEn: "Shaab Al-Bahri", nameFr: "Shaab Al-Bahri" },
  { nameAr: "ضاحية عبد الله السالم", nameEn: "Abdullah Al-Salem", nameFr: "Abdullah Al-Salem" },
  { nameAr: "الشويخ السكنية", nameEn: "Shuwaikh Residential", nameFr: "Shuwaikh Résidentiel" },
] as const;

// Areas coming soon
export const areasComingSoon = [
  { nameAr: "حولي", nameEn: "Hawalli", nameFr: "Hawalli" },
  { nameAr: "الفروانية", nameEn: "Farwaniya", nameFr: "Farwaniya" },
  { nameAr: "الأحمدي", nameEn: "Ahmadi", nameFr: "Ahmadi" },
  { nameAr: "الجهراء", nameEn: "Jahra", nameFr: "Jahra" },
  { nameAr: "مبارك الكبير", nameEn: "Mubarak Al-Kabeer", nameFr: "Mubarak Al-Kabeer" },
  { nameAr: "العاصمة", nameEn: "Capital", nameFr: "Capitale" },
  { nameAr: "صباح السالم", nameEn: "Sabah Al-Salem", nameFr: "Sabah Al-Salem" },
  { nameAr: "المنقف", nameEn: "Mangaf", nameFr: "Mangaf" },
  { nameAr: "الفحيحيل", nameEn: "Fahaheel", nameFr: "Fahaheel" },
  { nameAr: "المهبولة", nameEn: "Mahboula", nameFr: "Mahboula" },
  { nameAr: "الجابرية", nameEn: "Jabriya", nameFr: "Jabriya" },
  { nameAr: "مشرف", nameEn: "Mishref", nameFr: "Mishref" },
  { nameAr: "سلوى", nameEn: "Salwa", nameFr: "Salwa" },
  { nameAr: "الرميثية", nameEn: "Rumaithiya", nameFr: "Rumaithiya" },
  { nameAr: "بيان", nameEn: "Bayan", nameFr: "Bayan" },
  { nameAr: "الفنطاس", nameEn: "Fintas", nameFr: "Fintas" },
  { nameAr: "أبو حليفة", nameEn: "Abu Halifa", nameFr: "Abu Halifa" },
  { nameAr: "العقيلة", nameEn: "Egaila", nameFr: "Egaila" },
  { nameAr: "الصبحية", nameEn: "Subahiya", nameFr: "Subahiya" },
  { nameAr: "جليب الشيوخ", nameEn: "Jleeb Al-Shuyoukh", nameFr: "Jleeb Al-Shuyoukh" },
  { nameAr: "خيطان", nameEn: "Khaitan", nameFr: "Khaitan" },
  { nameAr: "الأندلس", nameEn: "Andalus", nameFr: "Andalus" },
  { nameAr: "الرقعي", nameEn: "Riggae", nameFr: "Riggae" },
] as const;

// Combined areas for API/validation - use English names as identifiers
export const kuwaitAreas = [
  ...availableAreasNow.map(a => a.nameEn),
  ...areasComingSoon.map(a => a.nameEn)
] as const;

export type KuwaitArea = typeof kuwaitAreas[number];

// Service area with availability info
export interface ServiceArea {
  nameAr: string;
  nameEn: string;
  nameFr: string;
  isAvailable: boolean;
}

// Get all areas with availability status
export function getServiceAreas(): ServiceArea[] {
  return [
    ...availableAreasNow.map(a => ({ ...a, isAvailable: true })),
    ...areasComingSoon.map(a => ({ ...a, isAvailable: false })),
  ];
}
