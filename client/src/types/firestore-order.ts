import { Timestamp } from "firebase/firestore";

/**
 * Firestore Order Model for Ghasla Style
 * 
 * This interface defines the structure of orders stored in Cloud Firestore
 * for real-time tracking and synchronization.
 */

// Order status enum for type safety
export type FirestoreOrderStatus = 
  | "pending"      // Order received, awaiting assignment
  | "assigned"     // Driver/team assigned
  | "on_the_way"   // Driver is on the way to customer
  | "in_progress"  // Wash in progress
  | "completed"    // Service completed
  | "cancelled";   // Order cancelled

// Vehicle information embedded in order
export interface VehicleInfo {
  make: string;       // Car brand (Toyota, BMW, etc.)
  model: string;      // Car model (Camry, X5, etc.)
  plateLast: string;  // Last digits of plate or short identifier
  color: string;      // Car color
}

// Address information for service location
export interface OrderAddress {
  area: string;       // Area/district name
  block?: string;     // Optional block number
  street?: string;    // Optional street name
  notes?: string;     // Additional notes for driver
}

// Payment methods supported
export type PaymentMethod = 
  | "cash" 
  | "knet" 
  | "visa" 
  | "apple_pay" 
  | "loyalty_points";

// Order source for analytics
export type OrderSource = 
  | "web_app" 
  | "mobile_app" 
  | "whatsapp" 
  | "call_center";

/**
 * Main Firestore Order Interface
 * 
 * Collection: orders
 * Document ID: Auto-generated or orderCode
 */
export interface FirestoreOrder {
  // Unique order code visible to customer (e.g., GS-1045)
  orderCode: string;
  
  // Firebase Auth UID of the customer
  // Used for querying all orders: where("customerId", "==", auth.currentUser.uid)
  customerId: string;
  
  // Current order status - used for Timeline and filters
  status: FirestoreOrderStatus;
  
  // Timestamps
  createdAt: Timestamp;    // serverTimestamp() on creation
  updatedAt: Timestamp;    // Updated on each status change
  
  // Service details
  serviceType: string;     // Service package name (Exterior Wash, Full Wash, etc.)
  servicePackageId: string; // Reference to service package
  
  // Vehicle information
  vehicleInfo: VehicleInfo;
  
  // Service address
  address: OrderAddress;
  
  // Pricing
  totalPrice: number;      // Final price after discounts (in KWD)
  originalPrice: number;   // Price before discounts
  discountApplied: number; // Discount amount applied
  
  // Payment
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  
  // Loyalty points
  // loyaltyPointsEarned: Points earned from this order (calculated on completion)
  loyaltyPointsEarned: number;
  // loyaltyPointsRedeemed: Points used as discount
  loyaltyPointsRedeemed: number;
  // isPointsApplied: Flag to prevent adding points twice
  // false on creation, true after points are credited to user
  isPointsApplied: boolean;
  
  // Assignment
  driverId: string | null; // Driver/team ID for tracking
  driverName?: string;     // Driver name for display
  
  // Cancellation
  cancelReason: string | null;
  
  // Source tracking for analytics
  source: OrderSource;
  
  // Referral tracking
  referralCode?: string;
}

/**
 * Create Order Input - used when creating new orders
 * Excludes auto-generated fields
 */
export interface CreateFirestoreOrder {
  customerId: string;
  serviceType: string;
  servicePackageId: string;
  vehicleInfo: VehicleInfo;
  address: OrderAddress;
  totalPrice: number;
  originalPrice: number;
  discountApplied: number;
  paymentMethod: PaymentMethod;
  loyaltyPointsRedeemed: number;
  source: OrderSource;
  referralCode?: string;
}

/**
 * Order with document ID for display
 */
export interface FirestoreOrderWithId extends FirestoreOrder {
  id: string;
}

/**
 * Generate unique order code
 * Format: GS-XXXX (X = alphanumeric)
 */
export function generateOrderCode(): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "GS-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Status display configuration
 */
export const ORDER_STATUS_CONFIG: Record<FirestoreOrderStatus, {
  labelAr: string;
  labelEn: string;
  labelFr: string;
  color: string;
  step: number;
}> = {
  pending: {
    labelAr: "قيد الانتظار",
    labelEn: "Pending",
    labelFr: "En attente",
    color: "yellow",
    step: 1
  },
  assigned: {
    labelAr: "تم التخصيص",
    labelEn: "Assigned",
    labelFr: "Assigné",
    color: "blue",
    step: 2
  },
  on_the_way: {
    labelAr: "في الطريق",
    labelEn: "On the Way",
    labelFr: "En route",
    color: "cyan",
    step: 3
  },
  in_progress: {
    labelAr: "قيد التنفيذ",
    labelEn: "In Progress",
    labelFr: "En cours",
    color: "orange",
    step: 4
  },
  completed: {
    labelAr: "مكتمل",
    labelEn: "Completed",
    labelFr: "Terminé",
    color: "green",
    step: 5
  },
  cancelled: {
    labelAr: "ملغي",
    labelEn: "Cancelled",
    labelFr: "Annulé",
    color: "red",
    step: -1
  }
};
