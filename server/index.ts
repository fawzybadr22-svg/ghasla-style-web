import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { initializeFirebaseAdmin } from "./firebase-admin";
import helmet from "helmet";

initializeFirebaseAdmin();

const app = express();
const httpServer = createServer(app);

const isProduction = process.env.NODE_ENV === "production";

// Trust proxy for proper IP detection behind reverse proxies (Replit, Cloudflare)
// MUST be set BEFORE any rate limiting middleware
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ===========================================
// SECURITY MIDDLEWARE (Order matters!)
// ===========================================

// 1. Helmet - Security Headers (CSP disabled for development compatibility)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// 2. HTTPS Redirect - ONLY in Production
if (isProduction) {
  app.use((req, res, next) => {
    if (req.protocol !== "https" && req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// 3. CORS Configuration - Handle OPTIONS first
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim().replace(/\/$/, ""))
  : [];

app.use((req, res, next) => {
  const origin = req.headers.origin?.replace(/\/$/, "");
  
  // Handle OPTIONS preflight requests first (before any other checks)
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
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }
  
  // Regular requests
  if (isProduction && allowedOrigins.length > 0) {
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    // In production, if origin not in list, don't set CORS headers (browser will block)
  } else {
    // Development: allow all origins
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  next();
});

// ===========================================
// BODY PARSING (Must come before rate limiters)
// ===========================================

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Rate limiters are now in server/security.ts and applied in server/routes.ts

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      
      // Log curl example for super admin setup
      const domain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0] || `localhost:${port}`;
      const protocol = domain.includes("localhost") ? "http" : "https";
      console.log("\n========================================");
      console.log("SUPER ADMIN SETUP - One-time curl example:");
      console.log("========================================");
      console.log(`curl -X POST ${protocol}://${domain}/internal/make-super-admin \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"email": "fawzybadr22@gmail.com", "secret": "YOUR_SUPER_ADMIN_SECRET"}'`);
      console.log("\nReplace YOUR_SUPER_ADMIN_SECRET with the value of SUPER_ADMIN_SECRET env var");
      console.log("========================================\n");
    },
  );
})();
