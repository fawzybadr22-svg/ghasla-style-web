import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  increment,
  runTransaction,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";
import type { 
  CreateFirestoreOrder, 
  FirestoreOrder
} from "@/types/firestore-order";
import { generateOrderCode } from "@/types/firestore-order";

/**
 * Firestore Order Service for Ghasla Style
 * 
 * Handles order creation, updates, and loyalty points calculation.
 */

/**
 * Create a new order in Firestore
 */
export async function createFirestoreOrder(orderData: CreateFirestoreOrder): Promise<string> {
  const ordersRef = collection(db, "orders");
  
  const newOrder: Omit<FirestoreOrder, "id"> = {
    ...orderData,
    orderCode: generateOrderCode(),
    status: "pending",
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    isPaid: false,
    loyaltyPointsEarned: 0,
    isPointsApplied: false,
    driverId: null,
    cancelReason: null
  };
  
  const docRef = await addDoc(ordersRef, newOrder);
  return docRef.id;
}

/**
 * Update order status
 * If status changes to "completed", automatically calculate and apply loyalty points
 */
export async function updateOrderStatus(
  orderId: string, 
  newStatus: FirestoreOrder["status"],
  driverId?: string,
  cancelReason?: string
): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  
  const updateData: Partial<FirestoreOrder> = {
    status: newStatus,
    updatedAt: serverTimestamp() as any
  };
  
  if (driverId !== undefined) {
    updateData.driverId = driverId;
  }
  
  if (newStatus === "cancelled" && cancelReason) {
    updateData.cancelReason = cancelReason;
  }
  
  await updateDoc(orderRef, updateData);
  
  // If completed, trigger loyalty points calculation
  if (newStatus === "completed") {
    await applyLoyaltyPoints(orderId);
  }
}

/**
 * Apply loyalty points to customer when order is completed
 * 
 * This function uses a transaction to ensure:
 * 1. Points are only added once (checks isPointsApplied flag)
 * 2. Customer's total points are updated atomically
 * 3. Order document is updated with earned points
 * 
 * Default calculation: 35 points per 1 KWD
 */
export async function applyLoyaltyPoints(
  orderId: string,
  pointsPerKD: number = 35
): Promise<number> {
  const orderRef = doc(db, "orders", orderId);
  
  return runTransaction(db, async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error("Order not found");
    }
    
    const orderData = orderDoc.data();
    
    // Prevent double points application
    if (orderData.isPointsApplied) {
      console.log("Points already applied for order:", orderId);
      return orderData.loyaltyPointsEarned || 0;
    }
    
    // Calculate points from total price
    const totalPrice = orderData.totalPrice || 0;
    const pointsEarned = Math.floor(totalPrice * pointsPerKD);
    
    // Update order with earned points
    transaction.update(orderRef, {
      loyaltyPointsEarned: pointsEarned,
      isPointsApplied: true,
      updatedAt: serverTimestamp()
    });
    
    // Update customer's loyalty balance
    if (orderData.customerId) {
      const userRef = doc(db, "users", orderData.customerId);
      const userDoc = await transaction.get(userRef);
      
      if (userDoc.exists()) {
        transaction.update(userRef, {
          loyaltyPoints: increment(pointsEarned),
          totalLoyaltyPointsEarned: increment(pointsEarned),
          lastOrderDate: serverTimestamp()
        });
      }
    }
    
    console.log(`Applied ${pointsEarned} points for order ${orderId}`);
    return pointsEarned;
  });
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string, reason: string): Promise<void> {
  await updateOrderStatus(orderId, "cancelled", undefined, reason);
}

/**
 * Assign driver to order
 */
export async function assignDriver(
  orderId: string, 
  driverId: string, 
  driverName?: string
): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  
  await updateDoc(orderRef, {
    status: "assigned",
    driverId,
    driverName: driverName || null,
    updatedAt: serverTimestamp()
  });
}

/**
 * Start order execution
 */
export async function startOrder(orderId: string): Promise<void> {
  await updateOrderStatus(orderId, "in_progress");
}

/**
 * Complete order
 * Note: updateOrderStatus already handles loyalty points calculation
 * when status changes to "completed", so we don't call applyLoyaltyPoints again
 */
export async function completeOrder(orderId: string): Promise<void> {
  await updateOrderStatus(orderId, "completed");
}

/**
 * Get order details by ID
 */
export async function getOrderById(orderId: string): Promise<FirestoreOrder | null> {
  const orderRef = doc(db, "orders", orderId);
  const orderDoc = await getDoc(orderRef);
  
  if (!orderDoc.exists()) {
    return null;
  }
  
  return {
    ...orderDoc.data(),
    id: orderDoc.id
  } as unknown as FirestoreOrder;
}

/**
 * Generate unique order code
 * Format: GS-XXXX (X = alphanumeric, no ambiguous characters)
 */
export function generateOrderCodeUtil(): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "GS-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
