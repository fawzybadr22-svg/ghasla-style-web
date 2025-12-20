import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@shared/schema";

export type OrderFilter = "all" | "active" | "completed" | "cancelled";

interface UsePostgresOrdersReturn {
  orders: Order[];
  filteredOrders: Order[];
  lastCompletedOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  filter: OrderFilter;
  setFilter: (filter: OrderFilter) => void;
  refetch: () => void;
}

export function usePostgresOrders(): UsePostgresOrdersReturn {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/orders/customer/${user.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await res.json();
        setOrders(data);

        const completedOrders = data.filter((o: Order) => o.status === "completed");
        if (completedOrders.length > 0) {
          setLastCompletedOrder(completedOrders[0]);
        }
      } catch (err: any) {
        console.error("Error fetching orders:", err);
        setError(err.message || "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id, refreshTrigger]);

  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true;
    if (filter === "active") {
      return !["completed", "cancelled"].includes(order.status);
    }
    if (filter === "completed") return order.status === "completed";
    if (filter === "cancelled") return order.status === "cancelled";
    return true;
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
