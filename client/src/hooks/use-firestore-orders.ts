import { useState, useEffect, useCallback } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc,
  limit,
  Timestamp,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type DocumentData
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { 
  FirestoreOrder, 
  FirestoreOrderWithId, 
  FirestoreOrderStatus 
} from "@/types/firestore-order";

/**
 * Custom hook for real-time Firestore order tracking
 * 
 * Features:
 * - Real-time updates via onSnapshot
 * - Filter by status
 * - Automatic last completed order detection
 * - Loading and error states
 */

// Filter options for orders
export type OrderFilter = "all" | "active" | "completed" | "cancelled";

interface UseFirestoreOrdersReturn {
  orders: FirestoreOrderWithId[];
  filteredOrders: FirestoreOrderWithId[];
  lastCompletedOrder: FirestoreOrderWithId | null;
  isLoading: boolean;
  error: string | null;
  filter: OrderFilter;
  setFilter: (filter: OrderFilter) => void;
  refetch: () => void;
}

export function useFirestoreOrders(): UseFirestoreOrdersReturn {
  const { user } = useAuth();
  const [orders, setOrders] = useState<FirestoreOrderWithId[]>([]);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<FirestoreOrderWithId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Manual refetch function
  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Convert Firestore document to typed order
  const convertToOrder = (docSnapshot: QueryDocumentSnapshot<DocumentData>): FirestoreOrderWithId => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      orderCode: data.orderCode || `GS-${docSnapshot.id.slice(0, 4).toUpperCase()}`,
      customerId: data.customerId,
      status: data.status || "pending",
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: data.updatedAt || Timestamp.now(),
      serviceType: data.serviceType || "",
      servicePackageId: data.servicePackageId || "",
      vehicleInfo: data.vehicleInfo || { make: "", model: "", plateLast: "", color: "" },
      address: data.address || { area: "" },
      totalPrice: data.totalPrice || 0,
      originalPrice: data.originalPrice || data.totalPrice || 0,
      discountApplied: data.discountApplied || 0,
      paymentMethod: data.paymentMethod || "cash",
      isPaid: data.isPaid || false,
      loyaltyPointsEarned: data.loyaltyPointsEarned || 0,
      loyaltyPointsRedeemed: data.loyaltyPointsRedeemed || 0,
      isPointsApplied: data.isPointsApplied || false,
      driverId: data.driverId || null,
      driverName: data.driverName,
      cancelReason: data.cancelReason || null,
      source: data.source || "web_app",
      referralCode: data.referralCode
    };
  };

  // Main orders subscription - real-time updates
  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Query all orders for this customer, ordered by creation date descending
    const ordersRef = collection(db, "orders");
    const ordersQuery = query(
      ordersRef,
      where("customerId", "==", user.id),
      orderBy("createdAt", "desc")
    );

    // Real-time subscription with onSnapshot
    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const ordersData = snapshot.docs.map(convertToOrder);
        setOrders(ordersData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Firestore orders error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount or user change
    return () => unsubscribe();
  }, [user?.id, refreshTrigger]);

  // Last completed order subscription
  useEffect(() => {
    if (!user?.id) {
      setLastCompletedOrder(null);
      return;
    }

    const ordersRef = collection(db, "orders");
    const lastCompletedQuery = query(
      ordersRef,
      where("customerId", "==", user.id),
      where("status", "==", "completed"),
      orderBy("updatedAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      lastCompletedQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          setLastCompletedOrder(convertToOrder(snapshot.docs[0]));
        } else {
          setLastCompletedOrder(null);
        }
      },
      (err) => {
        console.error("Last completed order error:", err);
      }
    );

    return () => unsubscribe();
  }, [user?.id, refreshTrigger]);

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order => {
    switch (filter) {
      case "active":
        return ["pending", "assigned", "in_progress"].includes(order.status);
      case "completed":
        return order.status === "completed";
      case "cancelled":
        return order.status === "cancelled";
      default:
        return true;
    }
  });

  return {
    orders,
    filteredOrders,
    lastCompletedOrder,
    isLoading,
    error,
    filter,
    setFilter,
    refetch
  };
}

/**
 * Hook for tracking a single order in real-time
 * Used in order detail page
 */
export function useFirestoreOrderDetail(orderId: string | null) {
  const [order, setOrder] = useState<FirestoreOrderWithId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const orderRef = doc(db, "orders", orderId);

    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setOrder({
            id: snapshot.id,
            orderCode: data.orderCode || `GS-${snapshot.id.slice(0, 4).toUpperCase()}`,
            customerId: data.customerId,
            status: data.status || "pending",
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || Timestamp.now(),
            serviceType: data.serviceType || "",
            servicePackageId: data.servicePackageId || "",
            vehicleInfo: data.vehicleInfo || { make: "", model: "", plateLast: "", color: "" },
            address: data.address || { area: "" },
            totalPrice: data.totalPrice || 0,
            originalPrice: data.originalPrice || data.totalPrice || 0,
            discountApplied: data.discountApplied || 0,
            paymentMethod: data.paymentMethod || "cash",
            isPaid: data.isPaid || false,
            loyaltyPointsEarned: data.loyaltyPointsEarned || 0,
            loyaltyPointsRedeemed: data.loyaltyPointsRedeemed || 0,
            isPointsApplied: data.isPointsApplied || false,
            driverId: data.driverId || null,
            driverName: data.driverName,
            cancelReason: data.cancelReason || null,
            source: data.source || "web_app",
            referralCode: data.referralCode
          });
        } else {
          setOrder(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Order detail error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  return { order, isLoading, error };
}

/**
 * Calculate loyalty points from order total
 * Default: 35 points per 1 KWD (as per loyalty config)
 */
export function calculateLoyaltyPoints(totalPrice: number, pointsPerKD: number = 35): number {
  return Math.floor(totalPrice * pointsPerKD);
}
