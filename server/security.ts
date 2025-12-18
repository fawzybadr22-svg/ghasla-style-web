import rateLimit from "express-rate-limit";

// General API Rate Limit: 100 requests per minute per IP
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Rate Limit for Auth: 10 requests per minute per IP
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Order Creation Rate Limit: 20 requests per minute per IP
export const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many order requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Internal Routes Rate Limit: 5 requests per hour per IP (very strict)
export const internalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many internal requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact Form Rate Limit: 5 requests per minute per IP
export const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many contact requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
