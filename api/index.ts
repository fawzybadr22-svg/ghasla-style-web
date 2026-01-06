import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { initializeFirebaseAdmin } from "./lib/firebaseAdmin";
import { storage } from "./lib/storage";
import {
  setSuperAdmin,
  setAdminRole,
  setDelegateRole,
  requireSuperAdmin,
  requireAdmin,
  requireDelegate,
  requireAuth,
} from "./lib/firebaseAdmin";
import {
  generalApiLimiter,
  authLimiter,
  orderLimiter,
  internalLimiter,
  contactLimiter,
} from "./lib/security";
import { z } from "zod";
import {
  insertServicePackageSchema,
  insertOrderSchema,
  insertContactMessageSchema,
  insertBlogPostSchema,
  insertTestimonialSchema,
  insertGalleryItemSchema,
  getServiceAreas,
} from "../shared/schema";

initializeFirebaseAdmin();

const app = express();

const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS
      .split(",")
      .map((o) => o.trim().replace(/\/$/, ""))
  : [];

app.use((req, res, next) => {
  const origin = req.headers.origin?.replace(/\/$/, "");

  if (req.method === "OPTIONS") {
    if (isProduction && allowedOrigins.length > 0) {
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
      } else {
        return res.status(403).json({ error: "Origin not allowed" });
      }
    } else {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
      if (origin) {
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }
    }
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  if (isProduction && allowedOrigins.length > 0) {
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  } else {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Rate Limiters
app.use("/api", generalApiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/users", authLimiter);
app.use("/api/orders", orderLimiter);
app.use("/api/contact", contactLimiter);
app.use("/api/internal", internalLimiter);

// Verify Super Admin Secret
const verifySuperAdminSecret = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const secret = process.env.SUPER_ADMIN_SECRET;
  const providedSecret = req.headers["x-super-admin-secret"] || req.body.secret;

  if (!secret) {
    return res.status(503).json({
      error: "SUPER_ADMIN_SECRET not configured.",
    });
  }

  if (providedSecret !== secret) {
    return res.status(403).json({ error: "Invalid super admin secret" });
  }

  next();
};

// Internal Routes
app.post(
  "/api/internal/make-super-admin",
  verifySuperAdminSecret,
  async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    try {
      const result = await setSuperAdmin(email);
      const user = await storage.getUserByEmail(email);
      if (user) {
        // schema role enum: superadmin
        await storage.updateUser(user.id, { role: "superadmin" });
      }
      return res.json({ ok: true, uid: result.uid, superAdmin: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "failed" });
    }
  },
);

app.post("/api/internal/set-admin", verifySuperAdminSecret, async (req, res) => {
  const { email, isAdmin } = req.body;
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  try {
    const result = await setAdminRole(email, isAdmin !== false);
    const user = await storage.getUserByEmail(email);
    if (user) {
      await storage.updateUser(user.id, {
        role: isAdmin !== false ? "admin" : "customer",
      });
    }
    return res.json({ ok: true, uid: result.uid, admin: isAdmin !== false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "failed" });
  }
});

app.post(
  "/api/internal/set-delegate",
  verifySuperAdminSecret,
  async (req, res) => {
    const { email, isDelegate } = req.body;
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    try {
      const result = await setDelegateRole(email, isDelegate !== false);
      const user = await storage.getUserByEmail(email);
      if (user) {
        await storage.updateUser(user.id, {
          role: isDelegate !== false ? "delegate" : "customer",
        });
      }
      return res.json({
        ok: true,
        uid: result.uid,
        delegate: isDelegate !== false,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "failed" });
    }
  },
);

// Public Routes

// Service Packages
app.get("/api/packages", async (_req, res) => {
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

// Loyalty Config
app.get("/api/loyalty/config", async (_req, res) => {
  try {
    const config = await storage.getLoyaltyConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Kuwait Areas
app.get("/api/areas", (_req, res) => {
  const areas = getServiceAreas();
  res.json(areas);
});

// Blog Posts
app.get("/api/blog", async (_req, res) => {
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

// Testimonials
app.get("/api/testimonials", async (_req, res) => {
  try {
    const testimonials = await storage.getTestimonials(true);
    res.json(testimonials);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Gallery
app.get("/api/gallery", async (_req, res) => {
  try {
    const items = await storage.getGalleryItems(true);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Contact Messages
app.post("/api/contact", async (req, res) => {
  try {
    const data = insertContactMessageSchema.parse(req.body);
    const message = await storage.createContactMessage(data);
    res.status(201).json(message);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { uid, email, name, phone, referralCode } = req.body;

    if (!uid || !email) {
      return res
        .status(400)
        .json({ error: "User ID and email are required" });
    }

    const existing = await storage.getUser(uid);
    if (existing) {
      const { twoFactorSecret, ...safeUser } = existing as any;
      return res.json(safeUser);
    }

    let referredBy: string | undefined;
    if (referralCode) {
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    const user = await storage.createUser({
      id: uid,
      email,
      name: name || email.split("@")[0],
      phone,
      referredBy,
      role: "customer",
      status: "active",
    });

    if (referredBy) {
      await storage.createReferral({
        referrerId: referredBy,
        referredCustomerId: uid,
        status: "pending",
      });
    }

    const { twoFactorSecret, ...safeUser } = user as any;
    res.status(201).json(safeUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { uid, email, name, phone } = req.body;

    if (!uid || !email) {
      return res
        .status(400)
        .json({ error: "User ID and email are required" });
    }

    const existing = await storage.getUser(uid);
    if (existing) {
      const { twoFactorSecret, ...safeUser } = existing as any;
      return res.json(safeUser);
    }

    const user = await storage.createUser({
      id: uid,
      email,
      name: name || email.split("@")[0],
      phone,
      role: "customer",
      status: "active",
    });

    const { twoFactorSecret, ...safeUser } = user as any;
    res.status(201).json(safeUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// User Routes
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { twoFactorSecret, ...safeUser } = user as any;
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
    const { twoFactorSecret, ...safeUser } = user as any;
    res.json(safeUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { id, ...userData } = req.body;
    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const existing = await storage.getUser(id);
    if (existing) {
      return res.json(existing);
    }

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
    const { twoFactorSecret, ...safeUser } = updated as any;
    res.json(safeUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/users/:id/loyalty", async (req, res) => {
  try {
    const transactions = await storage.getLoyaltyTransactions(req.params.id);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:id/referrals", async (req, res) => {
  try {
    const referrals = await storage.getReferralsByReferrer(req.params.id);
    res.json(referrals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/referral/:code", async (req, res) => {
  try {
    const user = await storage.getUserByReferralCode(req.params.code);
    if (!user) {
      return res.status(404).json({ error: "Invalid referral code" });
    }
    res.json({ valid: true, referrerName: (user as any).name });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Orders
app.get("/api/orders/track/:orderId", async (req, res) => {
  try {
    const cleanOrderId = req.params.orderId
      .replace(/^#/, "")
      .replace(/\s+/g, "")
      .trim();

    const order = await storage.getOrderByPartialId(cleanOrderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const servicePackage = await storage.getServicePackage(
      (order as any).servicePackageId,
    );

    res.json({
      id: (order as any).id,
      status: (order as any).status,
      carType: (order as any).carType,
      preferredDate: (order as any).preferredDate,
      preferredTime: (order as any).preferredTime,
      area: (order as any).area,
      createdAt: (order as any).createdAt,
      completedAt: (order as any).completedAt,
      assignedDriver: (order as any).assignedDriver ? "Assigned" : null,
      serviceName: servicePackage
        ? {
            ar: (servicePackage as any).nameAr,
            en: (servicePackage as any).nameEn,
            fr: (servicePackage as any).nameFr,
          }
        : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/orders/customer/:customerId", async (req, res) => {
  try {
    const orders = await storage.getOrdersByCustomer(req.params.customerId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const orderData = insertOrderSchema.parse(req.body);

    const customer = await storage.getUser(orderData.customerId);
    if (!customer) {
      return res.status(400).json({ error: "Customer not found" });
    }
    if ((customer as any).status === "blocked") {
      return res.status(403).json({ error: "Account is blocked" });
    }

    const servicePackage = await storage.getServicePackage(
      orderData.servicePackageId,
    );
    if (!servicePackage) {
      return res.status(400).json({ error: "Invalid service package" });
    }

    const carType = orderData.carType as "sedan" | "suv";
    const basePrice =
      carType === "suv"
        ? (servicePackage as any).priceSuvKD
        : (servicePackage as any).priceSedanKD;

    const loyaltyConfig = await storage.getLoyaltyConfig();

    const pointsToRedeem = orderData.loyaltyPointsRedeemed || 0;
    let discountApplied = 0;

    if (pointsToRedeem > 0) {
      if (pointsToRedeem > (customer as any).loyaltyPoints) {
        return res.status(400).json({ error: "Insufficient loyalty points" });
      }
      const maxDiscount = basePrice * (loyaltyConfig as any).maxRedeemPercentage;
      const pointValue = pointsToRedeem * (loyaltyConfig as any).conversionRate;
      discountApplied = Math.min(pointValue, maxDiscount);
    }

    const finalPrice = Math.max(0, basePrice - discountApplied);

    const order = await storage.createOrder({
      ...orderData,
      priceKD: finalPrice,
      discountApplied,
      loyaltyPointsRedeemed: pointsToRedeem,
    });

    if (pointsToRedeem > 0) {
      await storage.updateUser((customer as any).id, {
        loyaltyPoints: (customer as any).loyaltyPoints - pointsToRedeem,
      });

      await storage.createLoyaltyTransaction({
        customerId: (customer as any).id,
        orderId: (order as any).id,
        pointsChange: -pointsToRedeem,
        type: "redeem",
        note: "Points redeemed for order",
        createdBy: (customer as any).id,
      });
    }

    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  try {
    const updated = await storage.updateOrder(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin Routes
app.get("/api/admin/orders", requireAdmin, async (req: Request, res) => {
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

app.get("/api/admin/users", requireAdmin, async (req: Request, res) => {
  try {
    const { role, status } = req.query;
    const filters: any = {};
    if (role) filters.role = role as string;
    if (status) filters.status = status as string;

    const users = await storage.getUsers(filters);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/packages", requireAdmin, async (_req: Request, res) => {
  try {
    const packages = await storage.getServicePackages();
    res.json(packages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/packages", requireAdmin, async (req: Request, res) => {
  try {
    const data = insertServicePackageSchema.parse(req.body);
    const pkg = await storage.createServicePackage(data);
    res.status(201).json(pkg);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/admin/packages/:id", requireAdmin, async (req: Request, res) => {
  try {
    const updated = await storage.updateServicePackage(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Package not found" });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete(
  "/api/admin/packages/:id",
  requireAdmin,
  async (req: Request, res) => {
    try {
      await storage.deleteServicePackage(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.get("/api/admin/loyalty", requireAdmin, async (_req: Request, res) => {
  try {
    const config = await storage.getLoyaltyConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/admin/loyalty", requireAdmin, async (req: Request, res) => {
  try {
    const updated = await storage.updateLoyaltyConfig(req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delegate Routes
app.get("/api/delegate/orders", requireDelegate, async (req: Request, res) => {
  try {
    const delegateId = (req as any).user?.uid;
    if (!delegateId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUser(delegateId);
    if (!user) {
      return res.status(404).json({ error: "Delegate not found" });
    }

    const { status } = req.query;
    const filters: any = { assignedDriver: delegateId };
    if (status) filters.status = status as string;

    const orders = await storage.getOrders(filters);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/delegate/available", requireDelegate, async (_req: Request, res) => {
  try {
    const orders = await storage.getOrders({ status: "pending" });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/api/delegate/orders/:id/accept",
  requireDelegate,
  async (req: Request, res) => {
    try {
      const delegateId = (req as any).user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if ((order as any).status !== "pending") {
        return res.status(400).json({ error: "Order is not pending" });
      }

      const updated = await storage.updateOrder((order as any).id, {
        status: "assigned",
        assignedDriver: delegateId,
        assignedAt: new Date(),
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.post(
  "/api/delegate/orders/:id/status",
  requireDelegate,
  async (req: Request, res) => {
    try {
      const delegateId = (req as any).user?.uid;
      if (!delegateId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { status } = req.body; // expected: ontheway | inprogress | completed
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const updateData: any = { status };

      if (status === "ontheway") {
        updateData.onTheWayAt = new Date();
      } else if (status === "inprogress") {
        updateData.startedAt = new Date();
      } else if (status === "completed") {
        updateData.completedAt = new Date();

        const customer = await storage.getUser((order as any).customerId);
        if (customer) {
          const loyaltyConfig = await storage.getLoyaltyConfig();
          const pointsEarned = Math.floor(
            (order as any).priceKD * (loyaltyConfig as any).pointsPerKD,
          );

          await storage.updateUser((customer as any).id, {
            loyaltyPoints: (customer as any).loyaltyPoints + pointsEarned,
            completedOrdersCount: (customer as any).completedOrdersCount + 1,
          });

          await storage.createLoyaltyTransaction({
            customerId: (customer as any).id,
            orderId: (order as any).id,
            pointsChange: pointsEarned,
            type: "earn",
            note: "Points earned from completed order",
            createdBy: delegateId,
          });

          updateData.loyaltyPointsEarned = pointsEarned;
        }
      }

      const updated = await storage.updateOrder((order as any).id, updateData);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Vercel handler (بديل export default app)
export default async function handler(req: any, res: any) {
  return app(req, res);
}
