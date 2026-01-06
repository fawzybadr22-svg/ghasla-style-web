import express, { type Request, type Response, type NextFunction } from "express";
import path from "path";
import { createServer } from "http";
import helmet from "helmet";

import { registerRoutes } from "./routes";
import { initializeFirebaseAdmin } from "./firebase-admin";

declare module "http" {
  interface IncomingMessage {
    rawBody?: unknown;
  }
}

let appPromise: Promise<express.Express> | null = null;

export async function getApp() {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    initializeFirebaseAdmin();

    const app = express();
    const httpServer = createServer(app);

    const isProduction = process.env.NODE_ENV === "production";

    // مهم لقراءة IP الحقيقي خلف Vercel/Proxies
    app.set("trust proxy", 1);

    // 1) Helmet
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );

    // 2) HTTPS Redirect (Production only)
    if (isProduction) {
      app.use((req, res, next) => {
        if (req.protocol !== "https" && req.headers["x-forwarded-proto"] !== "https") {
          return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
      });
    }

    // 3) CORS + OPTIONS
    const allowedOrigins = process.env.ALLOWEDORIGINS
      ? process.env.ALLOWEDORIGINS
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
      : [];

    app.use((req, res, next) => {
      const origin = (req.headers.origin || "").replace(/\/$/, "");

      if (req.method === "OPTIONS") {
        if (isProduction && allowedOrigins.length > 0) {
          if (origin && allowedOrigins.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Credentials", "true");
          } else {
            return res.status(403).json({ error: "Origin not allowed" });
          }
        } else {
          if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
          if (origin) res.setHeader("Access-Control-Allow-Credentials", "true");
        }

        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Requested-With",
        );
        res.setHeader("Access-Control-Max-Age", "86400");
        return res.status(204).end();
      }

      // Regular requests
      if (isProduction && allowedOrigins.length > 0) {
        if (origin && allowedOrigins.includes(origin)) {
          res.setHeader("Access-Control-Allow-Origin", origin);
          res.setHeader("Access-Control-Allow-Credentials", "true");
        }
      } else {
        if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
        if (origin) res.setHeader("Access-Control-Allow-Credentials", "true");
      }

      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      next();
    });

    // Body parsing (مع rawBody)
    app.use(
      express.json({
        verify: (req: any, _res, buf) => {
          req.rawBody = buf;
        },
      }),
    );
    app.use(express.urlencoded({ extended: false }));

    // Static uploads (تنبيه: على Vercel التخزين المحلي مؤقت)
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

    // Routes
    await registerRoutes(httpServer, app);

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err?.status || err?.statusCode || 500;
      const message = err?.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    return app;
  })();

  return appPromise;
}
