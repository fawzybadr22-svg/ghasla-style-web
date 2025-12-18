import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  LayoutDashboard, Package, ClipboardList, Clock, MapPin, Phone, 
  User, Car, CheckCircle, Play, Navigation, XCircle, Shield,
  BarChart3, Calendar, DollarSign, TrendingUp, Settings, RefreshCw,
  Star, Camera, MapPinned
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, getAuthHeaders } from "@/lib/queryClient";
import type { Order, User as UserType } from "@shared/schema";

interface EnrichedOrder extends Order {
  serviceName?: string;
  serviceNameAr?: string;
  customerName?: string;
  customerPhone?: string;
  estimatedMinutes?: number;
}

interface DelegateProfile extends UserType {
  autoAcceptOrders: boolean;
  isAvailable: boolean;
  coverageAreas: string[] | null;
  maxActiveOrders: number;
}

interface DelegateStats {
  completedOrdersCount: number;
  totalRevenue: number;
  period: string;
  activeOrdersCount: number;
  avgCompletionMinutes: number;
  avgRating: number;
  totalRatings: number;
}

export default function DelegateDashboard() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/delegate/:section");
  const { user, firebaseUser, loading } = useAuth();
  const { toast } = useToast();
  
  const section = params?.section || "dashboard";

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  const isDelegate = user?.role === "delegate" || user?.role === "admin" || user?.role === "super_admin";

  const { data: profile, isLoading: profileLoading } = useQuery<DelegateProfile>({
    queryKey: ["/api/delegate/profile"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/delegate/profile", { headers });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: isDelegate && !!firebaseUser,
  });

  const { data: availableOrders, isLoading: availableLoading, refetch: refetchAvailable } = useQuery<EnrichedOrder[]>({
    queryKey: ["/api/delegate/orders/available"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/delegate/orders/available", { headers });
      if (!res.ok) throw new Error("Failed to fetch available orders");
      return res.json();
    },
    enabled: isDelegate && !!firebaseUser && (section === "available" || section === "dashboard"),
    refetchInterval: 30000,
  });

  const { data: currentOrders, isLoading: currentLoading, refetch: refetchCurrent } = useQuery<EnrichedOrder[]>({
    queryKey: ["/api/delegate/orders/current"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/delegate/orders/current", { headers });
      if (!res.ok) throw new Error("Failed to fetch current orders");
      return res.json();
    },
    enabled: isDelegate && !!firebaseUser && (section === "current" || section === "dashboard"),
    refetchInterval: 15000,
  });

  const { data: historyOrders, isLoading: historyLoading } = useQuery<EnrichedOrder[]>({
    queryKey: ["/api/delegate/orders/history"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/delegate/orders/history", { headers });
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    enabled: isDelegate && !!firebaseUser && section === "history",
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DelegateStats>({
    queryKey: ["/api/delegate/stats", "month"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/delegate/stats?period=month", { headers });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: isDelegate && !!firebaseUser && (section === "stats" || section === "dashboard"),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { autoAcceptOrders?: boolean; isAvailable?: boolean }) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/delegate/profile", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delegate/profile"] });
      toast({ title: getLocalizedText("تم التحديث", "Updated", "Mis à jour") });
    },
  });

  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/delegate/orders/${orderId}/accept`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to accept order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delegate/orders/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delegate/orders/current"] });
      toast({ title: getLocalizedText("تم قبول الطلب", "Order Accepted", "Commande Acceptée") });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const rejectOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/delegate/orders/${orderId}/reject`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Delegate declined" }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delegate/orders/available"] });
      toast({ title: getLocalizedText("تم رفض الطلب", "Order Rejected", "Commande Rejetée") });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, finalPriceKD, isPaid }: { 
      orderId: string; 
      status: string; 
      finalPriceKD?: number;
      isPaid?: boolean;
    }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/delegate/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status, finalPriceKD, isPaid }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delegate/orders/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delegate/orders/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delegate/stats"] });
      toast({ title: getLocalizedText("تم تحديث الحالة", "Status Updated", "Statut Mis à Jour") });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/delegate/location", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });
      if (!res.ok) throw new Error("Failed to update location");
      return res.json();
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ orderId, beforePhotoUrl, afterPhotoUrl }: { 
      orderId: string; 
      beforePhotoUrl?: string; 
      afterPhotoUrl?: string;
    }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/delegate/orders/${orderId}/photos`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ beforePhotoUrl, afterPhotoUrl }),
      });
      if (!res.ok) throw new Error("Failed to upload photo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delegate/orders/current"] });
      toast({ title: getLocalizedText("تم رفع الصورة", "Photo Uploaded", "Photo Téléchargée") });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  // Start location sharing when going on the way
  const startLocationSharing = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          updateLocationMutation.mutate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isDelegate) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">
            {getLocalizedText("غير مصرح", "Unauthorized", "Non autorisé")}
          </h1>
          <p className="text-muted-foreground mb-4">
            {getLocalizedText(
              "ليس لديك صلاحية للوصول إلى هذه الصفحة",
              "You don't have permission to access this page",
              "Vous n'avez pas l'autorisation d'accéder à cette page"
            )}
          </p>
          <Button onClick={() => setLocation("/")} data-testid="button-go-home">
            {t("nav.home")}
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, labelAr: "الرئيسية", labelEn: "Dashboard", labelFr: "Tableau de bord" },
    { id: "available", icon: Package, labelAr: "الطلبات المتاحة", labelEn: "Available Orders", labelFr: "Commandes Disponibles" },
    { id: "current", icon: ClipboardList, labelAr: "الطلبات الحالية", labelEn: "Current Orders", labelFr: "Commandes Actuelles" },
    { id: "history", icon: Clock, labelAr: "السجل", labelEn: "History", labelFr: "Historique" },
    { id: "stats", icon: BarChart3, labelAr: "الإحصائيات", labelEn: "Statistics", labelFr: "Statistiques" },
    { id: "settings", icon: Settings, labelAr: "الإعدادات", labelEn: "Settings", labelFr: "Paramètres" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: getLocalizedText("قيد الانتظار", "Pending", "En attente"), variant: "secondary" },
      assigned: { label: getLocalizedText("تم التخصيص", "Assigned", "Assigné"), variant: "default" },
      on_the_way: { label: getLocalizedText("في الطريق", "On the Way", "En route"), variant: "default" },
      in_progress: { label: getLocalizedText("قيد التنفيذ", "In Progress", "En cours"), variant: "default" },
      completed: { label: getLocalizedText("مكتمل", "Completed", "Terminé"), variant: "outline" },
      cancelled: { label: getLocalizedText("ملغي", "Cancelled", "Annulé"), variant: "destructive" },
    };
    const { label, variant } = config[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case "assigned":
        return { action: "on_the_way", labelAr: "في الطريق", labelEn: "On the Way", labelFr: "En Route", icon: Navigation };
      case "on_the_way":
        return { action: "in_progress", labelAr: "بدء الغسيل", labelEn: "Start Washing", labelFr: "Commencer", icon: Play };
      case "in_progress":
        return { action: "completed", labelAr: "إنهاء الطلب", labelEn: "Complete Order", labelFr: "Terminer", icon: CheckCircle };
      default:
        return null;
    }
  };

  const openGoogleMaps = (lat?: number | null, lng?: number | null, address?: string) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {getLocalizedText(`مرحباً ${user.name}`, `Welcome ${user.name}`, `Bienvenue ${user.name}`)}
          </h2>
          <p className="text-muted-foreground">
            {getLocalizedText("لوحة تحكم المندوب", "Delegate Dashboard", "Tableau de bord du délégué")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="available"
              checked={profile?.isAvailable ?? true}
              onCheckedChange={(checked) => updateProfileMutation.mutate({ isAvailable: checked })}
              data-testid="switch-availability"
            />
            <Label htmlFor="available">
              {getLocalizedText("متاح للطلبات", "Available", "Disponible")}
            </Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {getLocalizedText("الطلبات النشطة", "Active Orders", "Commandes Actives")}
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeOrdersCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {getLocalizedText("طلبات اليوم", "Today's Orders", "Commandes du jour")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedOrdersCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {getLocalizedText("الإيرادات", "Revenue", "Revenus")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.totalRevenue || 0).toFixed(2)} KD</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {getLocalizedText("الطلبات المتاحة", "Available Orders", "Commandes Disponibles")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableOrders?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {currentOrders && currentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{getLocalizedText("الطلبات الحالية", "Current Orders", "Commandes Actuelles")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{order.id.slice(0, 8)}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {order.customerName} - {order.area}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getNextAction(order.status) && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ 
                          orderId: order.id, 
                          status: getNextAction(order.status)!.action,
                          isPaid: getNextAction(order.status)!.action === "completed" ? true : undefined,
                        })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-status-${order.id}`}
                      >
                        {getLocalizedText(
                          getNextAction(order.status)!.labelAr,
                          getNextAction(order.status)!.labelEn,
                          getNextAction(order.status)!.labelFr
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAvailableOrders = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">
          {getLocalizedText("الطلبات المتاحة", "Available Orders", "Commandes Disponibles")}
        </h2>
        <Button variant="outline" size="sm" onClick={() => refetchAvailable()} data-testid="button-refresh-available">
          <RefreshCw className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {getLocalizedText("تحديث", "Refresh", "Actualiser")}
        </Button>
      </div>

      {availableLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : availableOrders?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {getLocalizedText("لا توجد طلبات متاحة حالياً", "No available orders at the moment", "Aucune commande disponible pour le moment")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {availableOrders?.map((order) => (
            <Card key={order.id} data-testid={`card-order-${order.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg">#{order.id.slice(0, 8)}</span>
                      {getStatusBadge(order.status)}
                      <Badge variant="outline">{order.priceKD.toFixed(2)} KD</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {order.area}
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="h-4 w-4" />
                        {order.carType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {i18n.language === "ar" ? order.serviceNameAr : order.serviceName}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {getLocalizedText("الموعد:", "Scheduled:", "Prévu:")}
                      </span>{" "}
                      {order.preferredDate} - {order.preferredTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openGoogleMaps(order.latitude, order.longitude, order.address)}
                      data-testid={`button-map-${order.id}`}
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectOrderMutation.mutate(order.id)}
                      disabled={rejectOrderMutation.isPending}
                      data-testid={`button-reject-${order.id}`}
                    >
                      <XCircle className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {getLocalizedText("رفض", "Reject", "Rejeter")}
                    </Button>
                    <Button
                      onClick={() => acceptOrderMutation.mutate(order.id)}
                      disabled={acceptOrderMutation.isPending}
                      data-testid={`button-accept-${order.id}`}
                    >
                      {getLocalizedText("قبول", "Accept", "Accepter")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderCurrentOrders = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">
          {getLocalizedText("الطلبات الحالية", "Current Orders", "Commandes Actuelles")}
        </h2>
        <Button variant="outline" size="sm" onClick={() => refetchCurrent()} data-testid="button-refresh-current">
          <RefreshCw className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {getLocalizedText("تحديث", "Refresh", "Actualiser")}
        </Button>
      </div>

      {currentLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : currentOrders?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {getLocalizedText("لا توجد طلبات حالية", "No current orders", "Aucune commande en cours")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {currentOrders?.map((order) => (
            <Card key={order.id} data-testid={`card-current-${order.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2">
                    #{order.id.slice(0, 8)}
                    {getStatusBadge(order.status)}
                  </CardTitle>
                  <Badge variant="outline" className="text-lg">
                    {order.priceKD.toFixed(2)} KD
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{order.customerName}</span>
                    </div>
                    {order.customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${order.customerPhone}`} className="text-primary hover:underline">
                          {order.customerPhone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{order.area} - {order.address}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span>{order.carType} {order.carDetails && `- ${order.carDetails}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{i18n.language === "ar" ? order.serviceNameAr : order.serviceName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{order.preferredDate} - {order.preferredTime}</span>
                    </div>
                  </div>
                </div>

                {/* Photo upload section for in_progress orders */}
                {order.status === "in_progress" && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Camera className="h-4 w-4" />
                      {getLocalizedText("صور الخدمة (اختياري)", "Service Photos (Optional)", "Photos du Service (Optionnel)")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!order.beforePhotoUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = prompt(getLocalizedText("أدخل رابط صورة قبل الخدمة", "Enter before photo URL", "Entrez l'URL de la photo avant"));
                            if (url) uploadPhotoMutation.mutate({ orderId: order.id, beforePhotoUrl: url });
                          }}
                          disabled={uploadPhotoMutation.isPending}
                          data-testid={`button-upload-before-${order.id}`}
                        >
                          <Camera className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                          {getLocalizedText("صورة قبل", "Before Photo", "Photo Avant")}
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {getLocalizedText("قبل: تم الرفع", "Before: Uploaded", "Avant: Téléchargé")}
                        </Badge>
                      )}
                      {!order.afterPhotoUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = prompt(getLocalizedText("أدخل رابط صورة بعد الخدمة", "Enter after photo URL", "Entrez l'URL de la photo après"));
                            if (url) uploadPhotoMutation.mutate({ orderId: order.id, afterPhotoUrl: url });
                          }}
                          disabled={uploadPhotoMutation.isPending}
                          data-testid={`button-upload-after-${order.id}`}
                        >
                          <Camera className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                          {getLocalizedText("صورة بعد", "After Photo", "Photo Après")}
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {getLocalizedText("بعد: تم الرفع", "After: Uploaded", "Après: Téléchargé")}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* On the way indicator with location sharing */}
                {order.status === "on_the_way" && (
                  <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
                    <MapPinned className="h-4 w-4 text-primary animate-pulse" />
                    {getLocalizedText("يتم مشاركة موقعك", "Sharing your location", "Partage de votre position")}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => openGoogleMaps(order.latitude, order.longitude, order.address)}
                    data-testid={`button-navigate-${order.id}`}
                  >
                    <Navigation className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                    {getLocalizedText("فتح الخريطة", "Open Maps", "Ouvrir Maps")}
                  </Button>
                  {order.customerPhone && (
                    <Button variant="outline" asChild>
                      <a href={`tel:${order.customerPhone}`} data-testid={`button-call-${order.id}`}>
                        <Phone className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {getLocalizedText("اتصال", "Call", "Appeler")}
                      </a>
                    </Button>
                  )}
                  {getNextAction(order.status) && (
                    <Button
                      onClick={() => {
                        const nextAction = getNextAction(order.status)!.action;
                        // Start location sharing when going "on the way"
                        if (nextAction === "on_the_way") {
                          startLocationSharing();
                        }
                        updateStatusMutation.mutate({ 
                          orderId: order.id, 
                          status: nextAction,
                          isPaid: nextAction === "completed" ? true : undefined,
                        });
                      }}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-next-${order.id}`}
                    >
                      {(() => {
                        const Icon = getNextAction(order.status)!.icon;
                        return <Icon className="h-4 w-4 ltr:mr-2 rtl:ml-2" />;
                      })()}
                      {getLocalizedText(
                        getNextAction(order.status)!.labelAr,
                        getNextAction(order.status)!.labelEn,
                        getNextAction(order.status)!.labelFr
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        {getLocalizedText("سجل الطلبات", "Order History", "Historique des Commandes")}
      </h2>

      {historyLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : historyOrders?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {getLocalizedText("لا يوجد سجل للطلبات", "No order history", "Aucun historique de commandes")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {historyOrders?.map((order) => (
            <Card key={order.id} data-testid={`card-history-${order.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{order.id.slice(0, 8)}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.area} - {i18n.language === "ar" ? order.serviceNameAr : order.serviceName}
                    </div>
                  </div>
                  <div className="text-right rtl:text-left">
                    <div className="font-bold">{(order.finalPriceKD || order.priceKD).toFixed(2)} KD</div>
                    <div className="text-sm text-muted-foreground">
                      {order.completedAt ? new Date(order.completedAt).toLocaleDateString() : order.preferredDate}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {getLocalizedText("الإحصائيات", "Statistics", "Statistiques")}
      </h2>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {getLocalizedText("الطلبات المكتملة", "Completed Orders", "Commandes Terminées")}
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.completedOrdersCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {getLocalizedText("هذا الشهر", "This Month", "Ce mois")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {getLocalizedText("إجمالي الإيرادات", "Total Revenue", "Revenus Totaux")}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats?.totalRevenue || 0).toFixed(2)} KD</div>
                <p className="text-xs text-muted-foreground">
                  {getLocalizedText("هذا الشهر", "This Month", "Ce mois")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {getLocalizedText("الطلبات النشطة", "Active Orders", "Commandes Actives")}
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeOrdersCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {getLocalizedText("حالياً", "Currently", "Actuellement")}
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {getLocalizedText("متوسط لكل طلب", "Avg per Order", "Moy par Commande")}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.completedOrdersCount ? ((stats.totalRevenue || 0) / stats.completedOrdersCount).toFixed(2) : "0.00"} KD
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {getLocalizedText("متوسط وقت الإنجاز", "Avg Completion Time", "Temps Moyen")}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.avgCompletionMinutes || 0} min</div>
                <p className="text-xs text-muted-foreground">
                  {getLocalizedText("لكل طلب", "per order", "par commande")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {getLocalizedText("متوسط التقييم", "Avg Rating", "Note Moyenne")}
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  {stats?.avgRating || 0}
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalRatings || 0} {getLocalizedText("تقييم", "ratings", "évaluations")}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {getLocalizedText("الإعدادات", "Settings", "Paramètres")}
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>{getLocalizedText("إعدادات الطلبات", "Order Settings", "Paramètres des Commandes")}</CardTitle>
          <CardDescription>
            {getLocalizedText("تحكم في كيفية استقبال الطلبات", "Control how you receive orders", "Contrôlez comment vous recevez les commandes")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{getLocalizedText("القبول التلقائي", "Auto-Accept Orders", "Acceptation Automatique")}</Label>
              <p className="text-sm text-muted-foreground">
                {getLocalizedText(
                  "قبول الطلبات الجديدة تلقائياً",
                  "Automatically accept new orders",
                  "Accepter automatiquement les nouvelles commandes"
                )}
              </p>
            </div>
            <Switch
              checked={profile?.autoAcceptOrders ?? false}
              onCheckedChange={(checked) => updateProfileMutation.mutate({ autoAcceptOrders: checked })}
              data-testid="switch-auto-accept"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{getLocalizedText("متاح للطلبات", "Available for Orders", "Disponible")}</Label>
              <p className="text-sm text-muted-foreground">
                {getLocalizedText(
                  "عند الإيقاف لن تستقبل طلبات جديدة",
                  "When off, you won't receive new orders",
                  "Lorsqu'il est désactivé, vous ne recevrez pas de nouvelles commandes"
                )}
              </p>
            </div>
            <Switch
              checked={profile?.isAvailable ?? true}
              onCheckedChange={(checked) => updateProfileMutation.mutate({ isAvailable: checked })}
              data-testid="switch-available"
            />
          </div>
          <div className="pt-4 border-t">
            <div className="space-y-1">
              <Label>{getLocalizedText("الحد الأقصى للطلبات النشطة", "Max Active Orders", "Commandes Actives Max")}</Label>
              <p className="text-sm text-muted-foreground">
                {getLocalizedText(
                  `يمكنك قبول حتى ${profile?.maxActiveOrders || 3} طلبات في وقت واحد`,
                  `You can accept up to ${profile?.maxActiveOrders || 3} orders at once`,
                  `Vous pouvez accepter jusqu'à ${profile?.maxActiveOrders || 3} commandes à la fois`
                )}
              </p>
            </div>
          </div>
          {profile?.coverageAreas && profile.coverageAreas.length > 0 && (
            <div className="pt-4 border-t">
              <div className="space-y-2">
                <Label>{getLocalizedText("مناطق التغطية", "Coverage Areas", "Zones de Couverture")}</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.coverageAreas.map((area) => (
                    <Badge key={area} variant="secondary">{area}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (section) {
      case "available":
        return renderAvailableOrders();
      case "current":
        return renderCurrentOrders();
      case "history":
        return renderHistory();
      case "stats":
        return renderStats();
      case "settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 shrink-0">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = section === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setLocation(item.id === "dashboard" ? "/delegate" : `/delegate/${item.id}`)}
                        data-testid={`nav-${item.id}`}
                      >
                        <item.icon className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {getLocalizedText(item.labelAr, item.labelEn, item.labelFr)}
                      </Button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
