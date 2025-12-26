import rateLimit from "express-rate-limit";

export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many order requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const internalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many internal requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many contact requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
