import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertServicePackageSchema, insertOrderSchema, insertContactMessageSchema,
  insertBlogPostSchema, insertTestimonialSchema, insertGalleryItemSchema,
  getServiceAreas
} from "@shared/schema";
import { 
  setSuperAdmin, 
  setAdminRole, 
  requireSuperAdmin, 
  requireAdmin,
  type AuthenticatedRequest 
} from "./firebase-admin";
import { 
  generalApiLimiter, 
  authLimiter, 
  orderLimiter, 
  internalLimiter, 
  contactLimiter 
} from "./security";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads", "offers");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const offerImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `offer-${uniqueSuffix}${ext}`);
  },
});

const uploadOfferImage = multer({
  storage: offerImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
    }
  },
});

// Default service packages for seeding
const defaultPackages = [
  {
    nameAr: "غسيل خارجي",
    nameEn: "Exterior Wash",
    nameFr: "Lavage Extérieur",
    descriptionAr: "غسيل شامل للجسم الخارجي مع تنظيف الإطارات والجنوط",
    descriptionEn: "Complete exterior wash with tire and rim cleaning",
    descriptionFr: "Lavage extérieur complet avec nettoyage des pneus et jantes",
    priceSedanKD: 3,
    priceSuvKD: 4,
    estimatedMinutes: 30,
    category: "exterior" as const,
    isActive: true,
  },
  {
    nameAr: "تنظيف داخلي",
    nameEn: "Interior Clean",
    nameFr: "Nettoyage Intérieur",
    descriptionAr: "تنظيف شامل للمقصورة الداخلية مع كنس وتعقيم",
    descriptionEn: "Complete interior cleaning with vacuuming and sanitization",
    descriptionFr: "Nettoyage intérieur complet avec aspiration et désinfection",
    priceSedanKD: 5,
    priceSuvKD: 7,
    estimatedMinutes: 45,
    category: "interior" as const,
    isActive: true,
  },
  {
    nameAr: "غسيل كامل",
    nameEn: "Full Wash",
    nameFr: "Lavage Complet",
    descriptionAr: "غسيل خارجي وداخلي شامل مع التعقيم والتعطير",
    descriptionEn: "Complete exterior and interior wash with sanitization and freshening",
    descriptionFr: "Lavage extérieur et intérieur complet avec désinfection",
    priceSedanKD: 7,
    priceSuvKD: 10,
    estimatedMinutes: 60,
    category: "full" as const,
    isActive: true,
  },
  {
    nameAr: "VIP تفصيلي",
    nameEn: "VIP Detailing",
    nameFr: "Détaillage VIP",
    descriptionAr: "خدمة تفصيلية شاملة مع تلميع السيارة وحماية الطلاء",
    descriptionEn: "Full detailing service with car polish and paint protection",
    descriptionFr: "Service de détaillage complet avec polish et protection",
    priceSedanKD: 15,
    priceSuvKD: 20,
    estimatedMinutes: 120,
    category: "vip" as const,
    isActive: true,
  },
  {
    nameAr: "اشتراك شهري (4 غسلات)",
    nameEn: "Monthly Package (4 washes)",
    nameFr: "Forfait Mensuel (4 lavages)",
    descriptionAr: "4 غسلات كاملة شهرياً بسعر مخفض",
    descriptionEn: "4 full washes per month at discounted rate",
    descriptionFr: "4 lavages complets par mois à tarif réduit",
    priceSedanKD: 25,
    priceSuvKD: 35,
    estimatedMinutes: 60,
    category: "monthly" as const,
    isActive: true,
  },
];

// Seed service packages if none exist
async function seedServicePackages() {
  const existing = await storage.getServicePackages();
  if (existing.length === 0) {
    for (const pkg of defaultPackages) {
      await storage.createServicePackage(pkg);
    }
    console.log("Seeded default service packages");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed data on startup
  await seedServicePackages();

  // ====================
  // APPLY RATE LIMITERS TO ROUTE GROUPS
  // ====================
  
  // General API rate limit
  app.use("/api", generalApiLimiter);
  
  // Specific stricter limits for sensitive routes
  app.use("/api/auth", authLimiter);
  app.use("/api/users", authLimiter);
  app.use("/api/orders", orderLimiter);
  app.use("/api/contact", contactLimiter);
  app.use("/internal", internalLimiter);

  // ====================
  // INTERNAL ROUTES (One-time setup, requires SUPER_ADMIN_SECRET)
  // ====================

  const verifySuperAdminSecret = (req: any, res: any, next: any) => {
    const secret = process.env.SUPER_ADMIN_SECRET;
    const providedSecret = req.headers["x-super-admin-secret"] || req.body.secret;
    
    if (!secret) {
      return res.status(503).json({ 
        error: "SUPER_ADMIN_SECRET not configured. Set this environment variable first." 
      });
    }
    
    if (providedSecret !== secret) {
      return res.status(403).json({ error: "Invalid super admin secret" });
    }
    
    next();
  };

  app.post("/internal/make-super-admin", verifySuperAdminSecret, async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    try {
      const result = await setSuperAdmin(email);
      
      const user = await storage.getUserByEmail(email);
      if (user) {
        await storage.updateUser(user.id, { role: "super_admin" });
      }
      
      return res.json({ 
        ok: true, 
        uid: result.uid, 
        superAdmin: true,
        message: `Super admin set for ${email}` 
      });
    } catch (err: any) {
      console.error("make-super-admin error:", err);
      return res.status(500).json({ error: err.message || "failed to set super admin" });
    }
  });

  app.post("/internal/set-admin", verifySuperAdminSecret, async (req, res) => {
    const { email, isAdmin } = req.body;
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    try {
      const result = await setAdminRole(email, isAdmin !== false);
      
      const user = await storage.getUserByEmail(email);
      if (user) {
        await storage.updateUser(user.id, { role: isAdmin !== false ? "admin" : "customer" });
      }
      
      return res.json({ 
        ok: true, 
        uid: result.uid, 
        admin: isAdmin !== false,
        message: `Admin role ${isAdmin !== false ? "granted" : "revoked"} for ${email}` 
      });
    } catch (err: any) {
      console.error("set-admin error:", err);
      return res.status(500).json({ error: err.message || "failed to set admin role" });
    }
  });

  // ====================
  // PUBLIC ROUTES
  // ====================

  // Service Packages (public)
  app.get("/api/packages", async (req, res) => {
    try {
      const packages = await storage.getServicePackages(true);
      res.json(packages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/packages/:id", async (req, res) => {
    try {
      const pkg = await storage.getServicePackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ error: "Package not found" });
      }
      res.json(pkg);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Loyalty Config (public read)
  app.get("/api/loyalty/config", async (req, res) => {
    try {
      const config = await storage.getLoyaltyConfig();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Kuwait Areas (public) - with availability status
  app.get("/api/areas", (req, res) => {
    const areas = getServiceAreas();
    res.json(areas);
  });

  // Blog Posts (public)
  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts(true);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blog/:id", async (req, res) => {
    try {
      const post = await storage.getBlogPost(req.params.id);
      if (!post || !post.isPublished) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Testimonials (public approved)
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials(true);
      res.json(testimonials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gallery (public)
  app.get("/api/gallery", async (req, res) => {
    try {
      const items = await storage.getGalleryItems(true);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contact Messages (public create)
  app.post("/api/contact", async (req, res) => {
    try {
      const data = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(data);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ====================
  // AUTHENTICATION ROUTES
  // ====================

  // Register with email (creates user in database after Firebase auth)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { uid, email, name, phone, referralCode } = req.body;
      
      if (!uid || !email) {
        return res.status(400).json({ error: "User ID and email are required" });
      }

      // Check if user already exists
      const existing = await storage.getUser(uid);
      if (existing) {
        const { twoFactorSecret, ...safeUser } = existing;
        return res.json(safeUser);
      }

      // Check if referred by someone
      let referredBy: string | undefined;
      if (referralCode) {
        const referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer) {
          referredBy = referrer.id;
        }
      }

      // Create user
      const user = await storage.createUser({
        id: uid,
        email,
        name: name || email.split("@")[0],
        phone,
        referredBy,
        role: "customer",
        status: "active",
      });

      // Create referral record if referred
      if (referredBy) {
        await storage.createReferral({
          referrerId: referredBy,
          referredCustomerId: uid,
          status: "pending",
        });
      }

      const { twoFactorSecret, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Login/Register with Google (creates or returns existing user)
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { uid, email, name, phone } = req.body;
      
      if (!uid || !email) {
        return res.status(400).json({ error: "User ID and email are required" });
      }

      // Check if user already exists
      const existing = await storage.getUser(uid);
      if (existing) {
        const { twoFactorSecret, ...safeUser } = existing;
        return res.json(safeUser);
      }

      // Create new user for Google login
      const user = await storage.createUser({
        id: uid,
        email,
        name: name || email.split("@")[0],
        phone,
        role: "customer",
        status: "active",
      });

      const { twoFactorSecret, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error: any) {
      console.error("Google auth error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // ====================
  // USER ROUTES (requires authentication)
  // ====================

  // User Profile
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Remove sensitive fields
      const { twoFactorSecret, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/email/:email", async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { twoFactorSecret, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { id, ...userData } = req.body;
      if (!id) {
        return res.status(400).json({ error: "User ID is required (from Firebase)" });
      }
      
      // Check if user exists
      const existing = await storage.getUser(id);
      if (existing) {
        return res.json(existing);
      }

      // Check if referred by someone
      let referredBy = userData.referredBy;
      if (referredBy) {
        const referrer = await storage.getUserByReferralCode(referredBy);
        if (referrer) {
          referredBy = referrer.id;
        } else {
          referredBy = undefined;
        }
      }

      const user = await storage.createUser({ ...userData, id, referredBy });
      
      // Create referral record if referred
      if (referredBy) {
        await storage.createReferral({
          referrerId: referredBy,
          referredCustomerId: id,
          status: "pending",
        });
      }

      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updated = await storage.updateUser(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      const { twoFactorSecret, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // User's Loyalty Transactions
  app.get("/api/users/:id/loyalty", async (req, res) => {
    try {
      const transactions = await storage.getLoyaltyTransactions(req.params.id);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User's Referrals
  app.get("/api/users/:id/referrals", async (req, res) => {
    try {
      const referrals = await storage.getReferralsByReferrer(req.params.id);
      res.json(referrals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Account Deletion Request (GDPR/Google Play compliance)
  app.post("/api/users/:id/delete-request", async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log the deletion request for audit purposes
      await storage.createAuditLog({
        actionType: "ACCOUNT_DELETION_REQUESTED",
        performedBy: userId,
        targetCollection: "users",
        targetId: userId,
        oldValue: JSON.stringify({ email: user.email, name: user.name }),
        newValue: JSON.stringify({ status: "deletion_scheduled" }),
      });

      // Mark user as pending deletion by setting status to blocked
      await storage.updateUser(userId, { 
        status: "blocked",
      });

      res.json({ 
        success: true, 
        message: "Account deletion request submitted. Your account will be deleted within 30 days.",
        scheduledDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (error: any) {
      console.error("Account deletion request error:", error);
      res.status(500).json({ error: "Failed to process deletion request" });
    }
  });

  // Referral code lookup
  app.get("/api/referral/:code", async (req, res) => {
    try {
      const user = await storage.getUserByReferralCode(req.params.code);
      if (!user) {
        return res.status(404).json({ error: "Invalid referral code" });
      }
      res.json({ valid: true, referrerName: user.name });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ====================
  // ORDERS
  // ====================

  // Public order tracking (returns limited info, no sensitive data)
  app.get("/api/orders/track/:orderId", async (req, res) => {
    try {
      // Clean the order ID: remove #, spaces, and trim
      const cleanOrderId = req.params.orderId.replace(/^#/, "").replace(/\s+/g, "").trim();
      
      // Use partial matching to find the order
      const order = await storage.getOrderByPartialId(cleanOrderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Get service package for display name
      const servicePackage = await storage.getServicePackage(order.servicePackageId);

      // Return only non-sensitive public info
      res.json({
        id: order.id,
        status: order.status,
        carType: order.carType,
        preferredDate: order.preferredDate,
        preferredTime: order.preferredTime,
        area: order.area,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        assignedDriver: order.assignedDriver ? "Assigned" : null,
        serviceName: servicePackage ? {
          ar: servicePackage.nameAr,
          en: servicePackage.nameEn,
          fr: servicePackage.nameFr,
        } : null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Customer's orders
  app.get("/api/orders/customer/:customerId", async (req, res) => {
    try {
      const orders = await storage.getOrdersByCustomer(req.params.customerId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      console.log("POST /api/orders - Request body:", JSON.stringify(req.body, null, 2));
      
      const orderData = insertOrderSchema.parse(req.body);
      
      // Get customer for loyalty calculations
      const customer = await storage.getUser(orderData.customerId);
      if (!customer) {
        return res.status(400).json({ error: "Customer not found" });
      }
      if (customer.status === "blocked") {
        return res.status(403).json({ 
          error: "Account is blocked",
          errorAr: "حسابك محظور. يرجى التواصل مع الدعم",
          errorFr: "Votre compte est bloqué. Veuillez contacter le support"
        });
      }

      // Get service package to calculate proper price server-side
      const servicePackage = await storage.getServicePackage(orderData.servicePackageId);
      if (!servicePackage) {
        return res.status(400).json({ error: "Invalid service package" });
      }

      // Calculate base price from package and car type
      const carType = orderData.carType as "sedan" | "suv";
      const basePrice = carType === "suv" ? servicePackage.priceSuvKD : servicePackage.priceSedanKD;

      // Get loyalty config
      const loyaltyConfig = await storage.getLoyaltyConfig();

      // Validate points redemption
      let pointsToRedeem = orderData.loyaltyPointsRedeemed || 0;
      let discountApplied = 0;
      
      if (pointsToRedeem > 0) {
        if (pointsToRedeem > customer.loyaltyPoints) {
          return res.status(400).json({ error: "Insufficient loyalty points" });
        }
        const maxDiscount = basePrice * loyaltyConfig.maxRedeemPercentage;
        const pointValue = pointsToRedeem * loyaltyConfig.conversionRate;
        discountApplied = Math.min(pointValue, maxDiscount);
      }

      // Calculate final price
      const finalPrice = Math.max(0, basePrice - discountApplied);

      // Create order with server-calculated price
      const order = await storage.createOrder({
        ...orderData,
        priceKD: finalPrice,
        discountApplied,
        loyaltyPointsRedeemed: pointsToRedeem,
      });

      // Deduct redeemed points
      if (pointsToRedeem > 0) {
        await storage.updateUser(customer.id, {
          loyaltyPoints: customer.loyaltyPoints - pointsToRedeem,
        });
        await storage.createLoyaltyTransaction({
          customerId: customer.id,
          orderId: order.id,
          pointsChange: -pointsToRedeem,
          type: "redeem",
          note: `Redeemed for order ${order.id}`,
          createdBy: "system",
        });
      }

      res.status(201).json(order);
    } catch (error: any) {
      console.error("POST /api/orders - Error:", error.message);
      console.error("Request body was:", JSON.stringify(req.body, null, 2));
      res.status(400).json({ error: error.message });
    }
  });

  // Get single order
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update order status (with loyalty points on completion)
  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const { status, cancelReason, ...rest } = req.body;

      // Handle order completion - award loyalty points
      if (status === "completed" && order.status !== "completed") {
        const loyaltyConfig = await storage.getLoyaltyConfig();
        const customer = await storage.getUser(order.customerId);
        
        if (customer) {
          // Calculate points earned
          const pointsEarned = Math.floor(order.priceKD * loyaltyConfig.pointsPerKD);
          
          // Update order with points earned
          const updateData: any = { status, loyaltyPointsEarned: pointsEarned, completedAt: new Date() };
          const updated = await storage.updateOrder(req.params.id, updateData);

          // Award points to customer
          await storage.updateUser(customer.id, {
            loyaltyPoints: customer.loyaltyPoints + pointsEarned,
          });

          // Create transaction record
          await storage.createLoyaltyTransaction({
            customerId: customer.id,
            orderId: order.id,
            pointsChange: pointsEarned,
            type: "earn",
            note: `Earned from order ${order.id}`,
            createdBy: "system",
          });

          // Check if this is first order for referral bonus
          const customerOrders = await storage.getOrdersByCustomer(customer.id);
          const completedOrders = customerOrders.filter(o => o.status === "completed");
          
          if (completedOrders.length === 1 && customer.referredBy) {
            // First completed order - award referral bonuses
            const referral = await storage.getReferralByReferred(customer.id);
            if (referral && referral.status === "pending") {
              const referrer = await storage.getUser(referral.referrerId);
              
              if (referrer) {
                // Award referrer bonus
                await storage.updateUser(referrer.id, {
                  loyaltyPoints: referrer.loyaltyPoints + loyaltyConfig.referrerBonusPoints,
                });
                await storage.createLoyaltyTransaction({
                  customerId: referrer.id,
                  orderId: order.id,
                  pointsChange: loyaltyConfig.referrerBonusPoints,
                  type: "referral_bonus",
                  note: `Referral bonus for ${customer.name}`,
                  createdBy: "system",
                });

                // Award referred welcome bonus
                await storage.updateUser(customer.id, {
                  loyaltyPoints: customer.loyaltyPoints + pointsEarned + loyaltyConfig.referredWelcomePoints,
                });
                await storage.createLoyaltyTransaction({
                  customerId: customer.id,
                  orderId: order.id,
                  pointsChange: loyaltyConfig.referredWelcomePoints,
                  type: "welcome_bonus",
                  note: "Welcome bonus from referral",
                  createdBy: "system",
                });

                // Complete referral
                await storage.updateReferral(referral.id, {
                  status: "completed",
                  firstOrderId: order.id,
                  completedAt: new Date(),
                });
              }
            }
          }

          return res.json(updated);
        }
      }

      // Handle cancellation
      if (status === "cancelled") {
        const updated = await storage.updateOrder(req.params.id, { status, cancelReason });
        return res.json(updated);
      }

      // Regular update
      const updated = await storage.updateOrder(req.params.id, { status, ...rest });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ====================
  // ADMIN ROUTES
  // ====================

  // Admin: Get all packages (including inactive)
  app.get("/api/admin/packages", async (req, res) => {
    try {
      const packages = await storage.getServicePackages(false);
      res.json(packages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Create package
  app.post("/api/admin/packages", async (req, res) => {
    try {
      const data = insertServicePackageSchema.parse(req.body);
      const pkg = await storage.createServicePackage(data);
      
      // Audit log
      await storage.createAuditLog({
        actionType: "create_package",
        performedBy: req.body.performedBy || "admin",
        targetCollection: "service_packages",
        targetId: pkg.id,
        newValue: JSON.stringify(pkg),
      });

      res.status(201).json(pkg);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Update package
  app.patch("/api/admin/packages/:id", async (req, res) => {
    try {
      const oldPkg = await storage.getServicePackage(req.params.id);
      const updated = await storage.updateServicePackage(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Package not found" });
      }

      // Audit log
      await storage.createAuditLog({
        actionType: "update_package",
        performedBy: req.body.performedBy || "admin",
        targetCollection: "service_packages",
        targetId: updated.id,
        oldValue: JSON.stringify(oldPkg),
        newValue: JSON.stringify(updated),
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Delete package
  app.delete("/api/admin/packages/:id", async (req, res) => {
    try {
      const pkg = await storage.getServicePackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ error: "Package not found" });
      }

      await storage.deleteServicePackage(req.params.id);

      // Audit log
      await storage.createAuditLog({
        actionType: "delete_package",
        performedBy: req.query.performedBy as string || "admin",
        targetCollection: "service_packages",
        targetId: req.params.id,
        oldValue: JSON.stringify(pkg),
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all orders
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      const filters: any = {};
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all users
  app.get("/api/admin/users", async (req, res) => {
    try {
      const { role, status } = req.query;
      const filters: any = {};
      if (role) filters.role = role as string;
      if (status) filters.status = status as string;
      
      const users = await storage.getUsers(filters);
      // Remove sensitive data
      const safeUsers = users.map(({ twoFactorSecret, ...u }) => u);
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Block/unblock user
  app.patch("/api/admin/users/:id/status", async (req, res) => {
    try {
      const { status, performedBy } = req.body;
      if (!["active", "blocked"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updated = await storage.updateUser(req.params.id, { status });

      // Audit log
      await storage.createAuditLog({
        actionType: status === "blocked" ? "block_user" : "unblock_user",
        performedBy: performedBy || "admin",
        targetCollection: "users",
        targetId: req.params.id,
        oldValue: JSON.stringify({ status: user.status }),
        newValue: JSON.stringify({ status }),
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Adjust user points
  app.post("/api/admin/users/:id/points", async (req, res) => {
    try {
      const { pointsChange, note, performedBy } = req.body;
      if (typeof pointsChange !== "number") {
        return res.status(400).json({ error: "Points change must be a number" });
      }

      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const newPoints = Math.max(0, user.loyaltyPoints + pointsChange);
      await storage.updateUser(req.params.id, { loyaltyPoints: newPoints });

      const tx = await storage.createLoyaltyTransaction({
        customerId: req.params.id,
        pointsChange,
        type: "admin_adjustment",
        note,
        createdBy: performedBy || "admin",
      });

      // Audit log
      await storage.createAuditLog({
        actionType: "adjust_points",
        performedBy: performedBy || "admin",
        targetCollection: "users",
        targetId: req.params.id,
        oldValue: JSON.stringify({ loyaltyPoints: user.loyaltyPoints }),
        newValue: JSON.stringify({ loyaltyPoints: newPoints, adjustment: pointsChange }),
        note,
      });

      res.json({ newPoints, transaction: tx });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Update loyalty config
  app.patch("/api/admin/loyalty/config", async (req, res) => {
    try {
      const { performedBy, ...configData } = req.body;
      const oldConfig = await storage.getLoyaltyConfig();
      const updated = await storage.updateLoyaltyConfig(configData);

      // Audit log
      await storage.createAuditLog({
        actionType: "update_loyalty_config",
        performedBy: performedBy || "admin",
        targetCollection: "loyalty_config",
        targetId: updated.id,
        oldValue: JSON.stringify(oldConfig),
        newValue: JSON.stringify(updated),
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Blog posts CRUD
  app.get("/api/admin/blog", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts(false);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/blog", async (req, res) => {
    try {
      const data = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(data);
      res.status(201).json(post);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/blog/:id", async (req, res) => {
    try {
      const updated = await storage.updateBlogPost(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/blog/:id", async (req, res) => {
    try {
      await storage.deleteBlogPost(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Testimonials CRUD
  app.get("/api/admin/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials(false);
      res.json(testimonials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/testimonials", async (req, res) => {
    try {
      const data = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(data);
      res.status(201).json(testimonial);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/testimonials/:id", async (req, res) => {
    try {
      const updated = await storage.updateTestimonial(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Testimonial not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/testimonials/:id", async (req, res) => {
    try {
      await storage.deleteTestimonial(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Gallery CRUD
  app.get("/api/admin/gallery", async (req, res) => {
    try {
      const items = await storage.getGalleryItems(false);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/gallery", async (req, res) => {
    try {
      const data = insertGalleryItemSchema.parse(req.body);
      const item = await storage.createGalleryItem(data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/gallery/:id", async (req, res) => {
    try {
      const updated = await storage.updateGalleryItem(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Gallery item not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/gallery/:id", async (req, res) => {
    try {
      await storage.deleteGalleryItem(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Offers CRUD
  app.get("/api/admin/offers", async (req, res) => {
    try {
      const offers = await storage.getOffers(false);
      res.json(offers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/offers", async (req, res) => {
    try {
      const { titleAr, titleEn, titleFr, descriptionAr, descriptionEn, descriptionFr,
        discountPercentage, discountAmountKD, imageUrl, startDate, endDate, isActive } = req.body;
      
      const offer = await storage.createOffer({
        titleAr,
        titleEn,
        titleFr,
        descriptionAr,
        descriptionEn,
        descriptionFr,
        discountPercentage: discountPercentage || null,
        discountAmountKD: discountAmountKD || null,
        imageUrl: imageUrl || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive ?? true,
      });
      res.status(201).json(offer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/offers/:id", async (req, res) => {
    try {
      const updateData: any = { ...req.body };
      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
      
      const updated = await storage.updateOffer(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Offer not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/offers/:id", async (req, res) => {
    try {
      await storage.deleteOffer(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload offer image
  app.post("/api/admin/offers/upload-image", uploadOfferImage.single("image"), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const imageUrl = `/uploads/offers/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public: Active offers
  app.get("/api/offers/active", async (req, res) => {
    try {
      const offers = await storage.getActiveOffers();
      res.json(offers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Contact messages
  app.get("/api/admin/messages", async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/messages/:id/read", async (req, res) => {
    try {
      await storage.markContactMessageRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/messages/:id", async (req, res) => {
    try {
      await storage.deleteContactMessage(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Audit logs
  app.get("/api/admin/audit-logs", async (req, res) => {
    try {
      const { performedBy, targetCollection } = req.query;
      const filters: any = {};
      if (performedBy) filters.performedBy = performedBy as string;
      if (targetCollection) filters.targetCollection = targetCollection as string;
      
      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Clear audit logs (superAdmin only)
  app.delete("/api/admin/audit-logs", requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { olderThanDays, clearAll } = req.query;
      
      // Validate input - require explicit clearAll=true for full deletion
      if (olderThanDays) {
        const days = parseInt(olderThanDays as string);
        if (Number.isNaN(days) || days <= 0) {
          return res.status(400).json({ error: "olderThanDays must be a positive number" });
        }
        
        const deletedCount = await storage.clearAuditLogs(days);
        
        await storage.createAuditLog({
          actionType: "clear_audit_logs",
          performedBy: req.user?.uid || "system",
          targetCollection: "auditLogs",
          targetId: "bulk",
          newValue: JSON.stringify({ deletedCount, olderThanDays: days }),
        });
        
        return res.json({ success: true, deletedCount });
      }
      
      // Require explicit clearAll=true for full deletion
      if (clearAll === "true") {
        const deletedCount = await storage.clearAuditLogs();
        
        await storage.createAuditLog({
          actionType: "clear_audit_logs",
          performedBy: req.user?.uid || "system",
          targetCollection: "auditLogs",
          targetId: "bulk",
          newValue: JSON.stringify({ deletedCount, clearAll: true }),
        });
        
        return res.json({ success: true, deletedCount });
      }
      
      return res.status(400).json({ error: "Must specify olderThanDays or clearAll=true" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Analytics
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const analytics = await storage.getAnalytics(start, end);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: CSV Export
  app.get("/api/admin/export/orders", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
      const orders = await storage.getOrders(filters);
      
      const csv = [
        "ID,Customer ID,Status,Car Type,Service Package,Price (KD),Payment Method,Area,Date,Time,Points Earned,Points Redeemed,Discount,Created At",
        ...orders.map(o => 
          `${o.id},${o.customerId},${o.status},${o.carType},${o.servicePackageId},${o.priceKD},${o.paymentMethod},${o.area},${o.preferredDate},${o.preferredTime},${o.loyaltyPointsEarned},${o.loyaltyPointsRedeemed},${o.discountApplied},${o.createdAt}`
        )
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ====================
  // SUPER ADMIN ROUTES - Admin Management (Protected)
  // ====================

  // Get all admins and delegates (superAdmin only)
  app.get("/api/admin/admins", requireSuperAdmin, async (req: any, res) => {
    try {
      const delegates = await storage.getUsers({ role: "delegate" });
      const admins = await storage.getUsers({ role: "admin" });
      const superAdmins = await storage.getUsers({ role: "super_admin" });
      const allAdmins = [...superAdmins, ...admins, ...delegates].map(({ twoFactorSecret, ...u }) => u);
      res.json(allAdmins);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new admin (superAdmin only)
  app.post("/api/admin/admins", requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { email, name, phone, role, password } = req.body;
      
      // Use authenticated user from middleware
      const authenticatedUserId = req.user?.uid;
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!email || !name) {
        return res.status(400).json({ error: "Email and name are required" });
      }

      const validRoles = ["delegate", "admin", "super_admin"];
      const adminRole = validRoles.includes(role) ? role : "admin";

      // Check if user exists in database
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Create user in Firebase Auth
      const { getFirebaseAdmin } = await import("./firebase-admin");
      const firebaseAdmin = getFirebaseAdmin();
      
      let firebaseUser;
      try {
        firebaseUser = await firebaseAdmin.auth().getUserByEmail(email);
      } catch (e: any) {
        if (e.code === "auth/user-not-found") {
          firebaseUser = await firebaseAdmin.auth().createUser({
            email,
            password: password || `${email.split("@")[0]}@Temp123!`,
            displayName: name,
          });
        } else {
          throw e;
        }
      }

      // Set custom claims based on role
      await firebaseAdmin.auth().setCustomUserClaims(firebaseUser.uid, {
        delegate: adminRole === "delegate",
        admin: adminRole === "admin" || adminRole === "super_admin",
        superAdmin: adminRole === "super_admin",
      });

      // Create user in database
      const user = await storage.createUser({
        id: firebaseUser.uid,
        email,
        name,
        phone: phone || null,
        role: adminRole,
        status: "active",
      });

      // Audit log with verified authenticated user
      await storage.createAuditLog({
        actionType: "create_admin",
        performedBy: authenticatedUserId,
        targetCollection: "users",
        targetId: user.id,
        newValue: JSON.stringify({ email, name, role: adminRole }),
      });

      const { twoFactorSecret, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error: any) {
      console.error("Create admin error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Update admin (superAdmin only)
  app.patch("/api/admin/admins/:id", requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { name, phone, role, status } = req.body;
      
      // Use authenticated user from middleware
      const authenticatedUserId = req.user?.uid;
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Admin not found" });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (status && ["active", "blocked"].includes(status)) updateData.status = status;
      
      // Handle role change with transactional safety
      if (role && ["delegate", "admin", "super_admin", "customer"].includes(role)) {
        // Prevent demoting last super admin
        if (user.role === "super_admin" && role !== "super_admin") {
          const superAdmins = await storage.getUsers({ role: "super_admin" });
          const activeSuperAdmins = superAdmins.filter(u => u.status === "active");
          if (activeSuperAdmins.length <= 1) {
            return res.status(400).json({ error: "Cannot demote the last super admin" });
          }
        }
        
        // Update Firebase custom claims FIRST before storage
        const { getFirebaseAdmin } = await import("./firebase-admin");
        const firebaseAdmin = getFirebaseAdmin();
        try {
          await firebaseAdmin.auth().setCustomUserClaims(req.params.id, {
            delegate: role === "delegate",
            admin: role === "admin" || role === "super_admin",
            superAdmin: role === "super_admin",
          });
          
          // Revoke refresh tokens to force claim refresh on next auth
          await firebaseAdmin.auth().revokeRefreshTokens(req.params.id);
        } catch (claimError: any) {
          console.error("Firebase claim update failed:", claimError);
          return res.status(500).json({ error: "Failed to update user permissions in authentication system" });
        }
        
        updateData.role = role;
      }

      const updated = await storage.updateUser(req.params.id, updateData);

      // Post-mutation verification: ensure at least one active super admin exists
      const postUpdateSuperAdmins = await storage.getUsers({ role: "super_admin" });
      const activePostUpdate = postUpdateSuperAdmins.filter(u => u.status === "active");
      if (activePostUpdate.length === 0) {
        // Rollback: restore original role
        await storage.updateUser(req.params.id, { role: user.role });
        const { getFirebaseAdmin } = await import("./firebase-admin");
        const firebaseAdmin = getFirebaseAdmin();
        await firebaseAdmin.auth().setCustomUserClaims(req.params.id, {
          delegate: user.role === "delegate",
          admin: user.role === "admin" || user.role === "super_admin",
          superAdmin: user.role === "super_admin",
        });
        return res.status(400).json({ error: "Operation would remove all super admins. Rolled back." });
      }

      // Audit log with verified authenticated user
      await storage.createAuditLog({
        actionType: "update_admin",
        performedBy: authenticatedUserId,
        targetCollection: "users",
        targetId: req.params.id,
        oldValue: JSON.stringify({ name: user.name, role: user.role, status: user.status }),
        newValue: JSON.stringify(updateData),
      });

      const { twoFactorSecret, ...safeUser } = updated!;
      res.json(safeUser);
    } catch (error: any) {
      console.error("Update admin error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Deactivate admin (soft delete - superAdmin only)
  app.delete("/api/admin/admins/:id", requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      // Use authenticated user from middleware
      const authenticatedUserId = req.user?.uid;
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Admin not found" });
      }

      // Don't allow deleting yourself
      if (authenticatedUserId === req.params.id) {
        return res.status(400).json({ error: "Cannot deactivate your own account" });
      }

      // Prevent deactivating last super admin
      if (user.role === "super_admin") {
        const superAdmins = await storage.getUsers({ role: "super_admin" });
        const activeSuperAdmins = superAdmins.filter(u => u.status === "active");
        if (activeSuperAdmins.length <= 1) {
          return res.status(400).json({ error: "Cannot deactivate the last super admin" });
        }
      }

      // Remove Firebase admin claims FIRST with transactional safety
      const { getFirebaseAdmin } = await import("./firebase-admin");
      const firebaseAdmin = getFirebaseAdmin();
      try {
        await firebaseAdmin.auth().setCustomUserClaims(req.params.id, {
          admin: false,
          superAdmin: false,
        });
        
        // Revoke refresh tokens to force claim refresh
        await firebaseAdmin.auth().revokeRefreshTokens(req.params.id);
      } catch (claimError: any) {
        console.error("Firebase claim removal failed:", claimError);
        return res.status(500).json({ error: "Failed to revoke user permissions in authentication system" });
      }

      // Soft delete - set status to blocked and role to customer
      await storage.updateUser(req.params.id, { status: "blocked", role: "customer" });

      // Post-mutation verification: ensure at least one active super admin exists
      const postUpdateSuperAdmins = await storage.getUsers({ role: "super_admin" });
      const activePostUpdate = postUpdateSuperAdmins.filter(u => u.status === "active");
      if (activePostUpdate.length === 0) {
        // Rollback: restore original role and status
        await storage.updateUser(req.params.id, { role: user.role, status: user.status });
        await firebaseAdmin.auth().setCustomUserClaims(req.params.id, {
          admin: user.role !== "customer",
          superAdmin: user.role === "super_admin",
        });
        return res.status(400).json({ error: "Operation would remove all super admins. Rolled back." });
      }

      // Audit log with verified authenticated user
      await storage.createAuditLog({
        actionType: "deactivate_admin",
        performedBy: authenticatedUserId,
        targetCollection: "users",
        targetId: req.params.id,
        oldValue: JSON.stringify({ role: user.role, status: user.status }),
        newValue: JSON.stringify({ role: "customer", status: "blocked" }),
      });

      res.json({ success: true, message: "Admin deactivated" });
    } catch (error: any) {
      console.error("Delete admin error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // DELEGATE (DRIVER) ROUTES
  // ==========================================
  
  const { requireDelegate, requireAuth } = await import("./firebase-admin");

  // Get delegate profile
  app.get("/api/delegate/profile", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const delegate = await storage.getUser(delegateId);
      if (!delegate || (delegate.role !== "delegate" && delegate.role !== "admin" && delegate.role !== "super_admin")) {
        return res.status(403).json({ error: "Not a delegate" });
      }
      
      const { twoFactorSecret, ...safeDelegate } = delegate;
      res.json(safeDelegate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update delegate settings (auto-accept, availability)
  app.patch("/api/delegate/profile", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { autoAcceptOrders, isAvailable, currentLatitude, currentLongitude } = req.body;
      
      const updateData: any = {};
      if (typeof autoAcceptOrders === "boolean") updateData.autoAcceptOrders = autoAcceptOrders;
      if (typeof isAvailable === "boolean") updateData.isAvailable = isAvailable;
      if (currentLatitude !== undefined) updateData.currentLatitude = currentLatitude;
      if (currentLongitude !== undefined) updateData.currentLongitude = currentLongitude;
      
      const updated = await storage.updateUser(delegateId, updateData);
      const { twoFactorSecret, ...safeDelegate } = updated!;
      res.json(safeDelegate);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get available orders for delegate (pending orders in their coverage area)
  app.get("/api/delegate/orders/available", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const delegate = await storage.getUser(delegateId);
      if (!delegate) {
        return res.status(404).json({ error: "Delegate not found" });
      }
      
      // Get pending orders
      const allOrders = await storage.getOrders({ status: "pending" });
      
      // Filter by delegate's coverage areas if set
      let availableOrders = allOrders;
      if (delegate.coverageAreas && delegate.coverageAreas.length > 0) {
        availableOrders = allOrders.filter(order => 
          delegate.coverageAreas!.includes(order.area)
        );
      }
      
      // Enrich with service package info
      const enrichedOrders = await Promise.all(availableOrders.map(async (order) => {
        const servicePackage = await storage.getServicePackage(order.servicePackageId);
        const customer = await storage.getUser(order.customerId);
        return {
          ...order,
          serviceName: servicePackage?.nameEn || "Unknown",
          serviceNameAr: servicePackage?.nameAr || "غير معروف",
          customerName: customer?.name || "Customer",
          customerPhone: customer?.phone || "",
        };
      }));
      
      res.json(enrichedOrders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get delegate's current (assigned) orders
  app.get("/api/delegate/orders/current", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get orders assigned to this delegate that are not completed/cancelled
      const assignedOrders = await storage.getOrders({ assignedDriver: delegateId });
      const activeOrders = assignedOrders.filter(o => 
        o.status === "assigned" || o.status === "on_the_way" || o.status === "in_progress"
      );
      
      // Enrich with service package and customer info
      const enrichedOrders = await Promise.all(activeOrders.map(async (order) => {
        const servicePackage = await storage.getServicePackage(order.servicePackageId);
        const customer = await storage.getUser(order.customerId);
        return {
          ...order,
          serviceName: servicePackage?.nameEn || "Unknown",
          serviceNameAr: servicePackage?.nameAr || "غير معروف",
          customerName: customer?.name || "Customer",
          customerPhone: customer?.phone || "",
        };
      }));
      
      res.json(enrichedOrders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get delegate's completed orders (history)
  app.get("/api/delegate/orders/history", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const assignedOrders = await storage.getOrders({ assignedDriver: delegateId });
      const completedOrders = assignedOrders.filter(o => 
        o.status === "completed" || o.status === "cancelled"
      );
      
      // Enrich with service package info
      const enrichedOrders = await Promise.all(completedOrders.map(async (order) => {
        const servicePackage = await storage.getServicePackage(order.servicePackageId);
        return {
          ...order,
          serviceName: servicePackage?.nameEn || "Unknown",
          serviceNameAr: servicePackage?.nameAr || "غير معروف",
        };
      }));
      
      res.json(enrichedOrders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get order details for delegate
  app.get("/api/delegate/orders/:id", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Only allow access if order is pending or assigned to this delegate
      if (order.status !== "pending" && order.assignedDriver !== delegateId) {
        return res.status(403).json({ error: "Not authorized to view this order" });
      }
      
      const servicePackage = await storage.getServicePackage(order.servicePackageId);
      const customer = await storage.getUser(order.customerId);
      
      res.json({
        ...order,
        serviceName: servicePackage?.nameEn || "Unknown",
        serviceNameAr: servicePackage?.nameAr || "غير معروف",
        estimatedMinutes: servicePackage?.estimatedMinutes || 0,
        customerName: customer?.name || "Customer",
        customerPhone: customer?.phone || "",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Accept an order
  app.post("/api/delegate/orders/:id/accept", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.status !== "pending") {
        return res.status(400).json({ error: "Order is not available for acceptance" });
      }
      
      // Check delegate's max active orders
      const delegate = await storage.getUser(delegateId);
      if (!delegate) {
        return res.status(404).json({ error: "Delegate not found" });
      }
      
      const currentOrders = await storage.getOrders({ assignedDriver: delegateId });
      const activeCount = currentOrders.filter(o => 
        o.status === "assigned" || o.status === "on_the_way" || o.status === "in_progress"
      ).length;
      
      if (activeCount >= (delegate.maxActiveOrders || 3)) {
        return res.status(400).json({ error: "Maximum active orders reached" });
      }
      
      const updated = await storage.updateOrder(req.params.id, {
        status: "assigned",
        assignedDriver: delegateId,
        assignedAt: new Date(),
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Reject an order (log rejection - order stays in pending for other delegates)
  app.post("/api/delegate/orders/:id/reject", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { reason } = req.body;
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.status !== "pending") {
        return res.status(400).json({ error: "Order is not available for rejection" });
      }
      
      // Log the rejection for analytics
      await storage.createAuditLog({
        actionType: "delegate_reject_order",
        performedBy: delegateId,
        targetCollection: "orders",
        targetId: order.id,
        newValue: JSON.stringify({ reason: reason || "No reason provided" }),
      });
      
      res.json({ success: true, message: "Order rejected" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update order status (on_the_way, in_progress, completed)
  app.patch("/api/delegate/orders/:id/status", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { status, finalPriceKD, isPaid, delegateNotes, beforePhotoUrl, afterPhotoUrl } = req.body;
      
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.assignedDriver !== delegateId) {
        return res.status(403).json({ error: "Not authorized to update this order" });
      }
      
      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        assigned: ["on_the_way", "cancelled"],
        on_the_way: ["in_progress", "cancelled"],
        in_progress: ["completed", "cancelled"],
      };
      
      if (!validTransitions[order.status]?.includes(status)) {
        return res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}` });
      }
      
      const updateData: any = { status };
      
      // Set timestamp based on status
      if (status === "on_the_way") {
        updateData.onTheWayAt = new Date();
      } else if (status === "in_progress") {
        updateData.startedAt = new Date();
      } else if (status === "completed") {
        updateData.completedAt = new Date();
        if (finalPriceKD !== undefined) updateData.finalPriceKD = finalPriceKD;
        if (isPaid !== undefined) updateData.isPaid = isPaid;
        
        // Calculate and award loyalty points on completion
        const priceForPoints = finalPriceKD || order.priceKD;
        const loyaltyConfigData = await storage.getLoyaltyConfig();
        const pointsPerKD = loyaltyConfigData?.pointsPerKD || 35;
        const pointsEarned = Math.floor(priceForPoints * pointsPerKD);
        
        updateData.loyaltyPointsEarned = pointsEarned;
        
        // Add points to customer
        const customer = await storage.getUser(order.customerId);
        if (customer) {
          await storage.updateUser(order.customerId, {
            loyaltyPoints: customer.loyaltyPoints + pointsEarned,
          });
          
          // Create loyalty transaction
          await storage.createLoyaltyTransaction({
            customerId: order.customerId,
            orderId: order.id,
            pointsChange: pointsEarned,
            type: "earn",
            note: `Points earned from order ${order.id}`,
            createdBy: delegateId,
          });
        }
      }
      
      if (delegateNotes) updateData.delegateNotes = delegateNotes;
      if (beforePhotoUrl) updateData.beforePhotoUrl = beforePhotoUrl;
      if (afterPhotoUrl) updateData.afterPhotoUrl = afterPhotoUrl;
      
      const updated = await storage.updateOrder(req.params.id, updateData);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get delegate statistics (enhanced with completion time and ratings)
  app.get("/api/delegate/stats", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { period } = req.query; // today, week, month
      
      const assignedOrders = await storage.getOrders({ assignedDriver: delegateId });
      const ratings = await storage.getOrderRatingsByDelegate(delegateId);
      
      // Filter by period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      
      const periodOrders = assignedOrders.filter(o => 
        o.completedAt && new Date(o.completedAt) >= startDate
      );
      
      const completedOrders = periodOrders.filter(o => o.status === "completed");
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.finalPriceKD || o.priceKD), 0);
      
      // Calculate average completion time (from startedAt to completedAt)
      const ordersWithTime = completedOrders.filter(o => o.startedAt && o.completedAt);
      let avgCompletionMinutes = 0;
      if (ordersWithTime.length > 0) {
        const totalMinutes = ordersWithTime.reduce((sum, o) => {
          const started = new Date(o.startedAt!).getTime();
          const completed = new Date(o.completedAt!).getTime();
          return sum + (completed - started) / 60000;
        }, 0);
        avgCompletionMinutes = Math.round(totalMinutes / ordersWithTime.length);
      }
      
      // Calculate average rating
      const periodRatings = ratings.filter(r => new Date(r.createdAt) >= startDate);
      const avgRating = periodRatings.length > 0 
        ? periodRatings.reduce((sum, r) => sum + r.rating, 0) / periodRatings.length 
        : 0;
      
      res.json({
        completedOrdersCount: completedOrders.length,
        totalRevenue,
        period: period || "month",
        activeOrdersCount: assignedOrders.filter(o => 
          o.status === "assigned" || o.status === "on_the_way" || o.status === "in_progress"
        ).length,
        avgCompletionMinutes,
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings: periodRatings.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update delegate location
  app.patch("/api/delegate/location", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { latitude, longitude } = req.body;
      
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      
      const updated = await storage.updateUser(delegateId, {
        currentLatitude: latitude,
        currentLongitude: longitude,
      });
      
      res.json({ success: true, location: { latitude, longitude } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Upload order photos (before/after)
  app.patch("/api/delegate/orders/:id/photos", requireDelegate, async (req: AuthenticatedRequest, res) => {
    try {
      const delegateId = req.user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { beforePhotoUrl, afterPhotoUrl } = req.body;
      
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.assignedDriver !== delegateId) {
        return res.status(403).json({ error: "Not authorized to update this order" });
      }
      
      const updateData: any = {};
      if (beforePhotoUrl) updateData.beforePhotoUrl = beforePhotoUrl;
      if (afterPhotoUrl) updateData.afterPhotoUrl = afterPhotoUrl;
      
      const updated = await storage.updateOrder(req.params.id, updateData);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Customer rating for completed order
  app.post("/api/orders/:id/rating", async (req, res) => {
    try {
      const { customerId, rating, comment } = req.body;
      
      if (!customerId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Invalid rating data" });
      }
      
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.status !== "completed") {
        return res.status(400).json({ error: "Can only rate completed orders" });
      }
      
      if (order.customerId !== customerId) {
        return res.status(403).json({ error: "Not authorized to rate this order" });
      }
      
      if (!order.assignedDriver) {
        return res.status(400).json({ error: "Order has no assigned delegate" });
      }
      
      // Check if already rated
      const existingRating = await storage.getOrderRating(order.id);
      if (existingRating) {
        return res.status(400).json({ error: "Order already rated" });
      }
      
      const newRating = await storage.createOrderRating({
        orderId: order.id,
        customerId,
        delegateId: order.assignedDriver,
        rating,
        comment,
      });
      
      res.json(newRating);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get delegate location for admin/customer tracking
  app.get("/api/orders/:id/delegate-location", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (!order.assignedDriver) {
        return res.status(400).json({ error: "No delegate assigned" });
      }
      
      if (order.status !== "on_the_way") {
        return res.json({ tracking: false, message: "Delegate not en route" });
      }
      
      const delegate = await storage.getUser(order.assignedDriver);
      if (!delegate) {
        return res.status(404).json({ error: "Delegate not found" });
      }
      
      res.json({
        tracking: true,
        latitude: delegate.currentLatitude,
        longitude: delegate.currentLongitude,
        delegateName: delegate.name,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ====================
  // PAYMENTS ROUTES
  // ====================

  // Create payment for an order
  app.post("/api/payments/create", async (req, res) => {
    try {
      const { orderId, customerId, amountKD, customerEmail, customerPhone, paymentGateway } = req.body;

      if (!orderId || !customerId || !amountKD) {
        return res.status(400).json({ error: "orderId, customerId and amountKD are required" });
      }

      // Check if order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if payment already exists for this order
      const existingPayment = await storage.getPaymentByOrderId(orderId);
      if (existingPayment && existingPayment.status === "captured") {
        return res.status(400).json({ error: "Order already paid" });
      }

      // Create payment record
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const payment = await storage.createPayment({
        orderId,
        customerId,
        amountKD,
        currency: "KWD",
        status: "pending",
        paymentGateway: paymentGateway || "tap",
        customerEmail,
        customerPhone,
        callbackUrl: `${baseUrl}/api/payments/callback`,
      });

      // TODO: Integrate with actual Tap Payments API
      // For now, return a mock payment URL that simulates the gateway
      // In production, this would call Tap Payments API to create a charge
      const mockPaymentUrl = `${baseUrl}/payment/checkout/${payment.id}`;

      const updated = await storage.updatePayment(payment.id, {
        status: "initiated",
        paymentUrl: mockPaymentUrl,
      });

      res.status(201).json({
        paymentId: payment.id,
        paymentUrl: mockPaymentUrl,
        status: "initiated",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Payment webhook callback (for Tap Payments)
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const { id, status, reference, source, amount, currency, transaction } = req.body;

      // Find payment by gateway charge ID or reference
      let payment = await storage.getPaymentByGatewayId(id);
      
      if (!payment && reference?.payment) {
        payment = await storage.getPayment(reference.payment);
      }

      if (!payment) {
        console.log("Payment not found for webhook:", id);
        return res.status(200).json({ received: true });
      }

      // Map Tap status to our status
      let newStatus: "pending" | "initiated" | "captured" | "failed" | "refunded" | "cancelled" = "pending";
      if (status === "CAPTURED") newStatus = "captured";
      else if (status === "FAILED") newStatus = "failed";
      else if (status === "REFUNDED") newStatus = "refunded";
      else if (status === "CANCELLED" || status === "DECLINED") newStatus = "cancelled";

      const updateData: any = {
        status: newStatus,
        gatewayChargeId: id,
        gatewayResponse: JSON.stringify(req.body),
      };

      if (source?.payment_method) updateData.cardBrand = source.payment_method;
      if (source?.last_four) updateData.cardLastFour = source.last_four;
      if (transaction?.id) updateData.gatewayTransactionId = transaction.id;

      if (newStatus === "captured") {
        updateData.paidAt = new Date();
        
        // Update order as paid
        await storage.updateOrder(payment.orderId, { isPaid: true });
      }

      await storage.updatePayment(payment.id, updateData);

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(200).json({ received: true, error: error.message });
    }
  });

  // Get payment status
  app.get("/api/payments/:id", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get payment by order ID
  app.get("/api/payments/order/:orderId", async (req, res) => {
    try {
      const payment = await storage.getPaymentByOrderId(req.params.orderId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found for this order" });
      }
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Simulate successful payment (DEVELOPMENT ONLY - for testing without real gateway)
  // In production, payments should ONLY be confirmed via webhook from Tap/KNET
  app.post("/api/payments/:id/simulate-success", async (req, res) => {
    // SECURITY: Only allow in development environment
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ 
        error: "Payment simulation is disabled in production. Use real payment gateway." 
      });
    }

    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (payment.status === "captured") {
        return res.status(400).json({ error: "Payment already completed" });
      }

      // Update payment as successful
      await storage.updatePayment(payment.id, {
        status: "captured",
        paidAt: new Date(),
        cardBrand: "KNET",
        gatewayTransactionId: `SIM-${Date.now()}`,
      });

      // Update order as paid
      await storage.updateOrder(payment.orderId, { isPaid: true });

      res.json({ success: true, message: "Payment simulated successfully (DEV ONLY)" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Simulate failed payment (DEVELOPMENT ONLY - for testing)
  app.post("/api/payments/:id/simulate-failure", async (req, res) => {
    // SECURITY: Only allow in development environment
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ 
        error: "Payment simulation is disabled in production. Use real payment gateway." 
      });
    }

    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (payment.status === "captured") {
        return res.status(400).json({ error: "Cannot fail a completed payment" });
      }

      await storage.updatePayment(payment.id, {
        status: "failed",
        errorMessage: req.body.errorMessage || "Payment declined",
      });

      res.json({ success: true, message: "Payment failure simulated (DEV ONLY)" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Customer payment history
  app.get("/api/payments/customer/:customerId", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByCustomer(req.params.customerId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
