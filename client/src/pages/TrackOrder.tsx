import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Car, MapPin, Clock, Calendar, Package, Check, ChevronRight, 
  Filter, ArrowLeft, Truck, CircleDot, CheckCircle, XCircle, RefreshCw, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@shared/schema";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

interface OrderWithService extends Order {
  serviceName?: { ar: string; en: string; fr: string };
}

export default function TrackOrder() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithService | null>(null);

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch customer orders with auto-refresh for real-time updates
  const { data: orders = [], isLoading, refetch } = useQuery<OrderWithService[]>({
    queryKey: ["/api/orders/customer", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000, // Auto-refresh every 30 seconds for real-time updates
    refetchOnWindowFocus: true,
  });

  // Manual refresh function
  const handleRefresh = () => {
    refetch();
  };

  // Fetch service packages to get names
  const { data: packages = [] } = useQuery<Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    nameFr: string;
  }>>({
    queryKey: ["/api/packages"],
  });

  // Enrich orders with service names
  const enrichedOrders = orders.map(order => {
    const pkg = packages.find(p => p.id === order.servicePackageId);
    return {
      ...order,
      serviceName: pkg ? { ar: pkg.nameAr, en: pkg.nameEn, fr: pkg.nameFr } : undefined
    };
  });

  // Filter orders
  const filteredOrders = statusFilter === "all" 
    ? enrichedOrders 
    : enrichedOrders.filter(o => {
        if (statusFilter === "active") {
          return ["pending", "assigned", "in_progress"].includes(o.status);
        }
        return o.status === statusFilter;
      });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string; fr: string }> = {
      pending: { ar: "قيد الانتظار", en: "Pending", fr: "En attente" },
      assigned: { ar: "تم التخصيص", en: "Assigned", fr: "Assigné" },
      in_progress: { ar: "قيد التنفيذ", en: "In Progress", fr: "En cours" },
      completed: { ar: "مكتمل", en: "Completed", fr: "Terminé" },
      cancelled: { ar: "ملغي", en: "Cancelled", fr: "Annulé" },
    };
    const label = labels[status] || labels.pending;
    return getLocalizedText(label.ar, label.en, label.fr);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    if (status === "completed") return "default";
    if (status === "cancelled") return "destructive";
    return "secondary";
  };

  const getStatusStep = (status: string) => {
    const steps = ["pending", "assigned", "in_progress", "completed"];
    return steps.indexOf(status) + 1;
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === "ar" ? "ar-KW" : i18n.language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-chart-1/10 border-b">
        <div className="container mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 me-2" />
              {getLocalizedText("العودة للرئيسية", "Back to Home", "Retour à l'accueil")}
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Track Your Orders
          </h1>
          <p className="text-muted-foreground">
            {getLocalizedText(
              "تابع حالة طلبات غسلتك الحالية والسابقة في مكان واحد",
              "Track the status of your current and previous wash orders in one place",
              "Suivez l'état de vos commandes de lavage actuelles et passées en un seul endroit"
            )}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Filter and Refresh */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getLocalizedText("جميع الطلبات", "All Orders", "Toutes les commandes")}</SelectItem>
                  <SelectItem value="active">{getLocalizedText("طلبات نشطة", "Active", "Actives")}</SelectItem>
                  <SelectItem value="completed">{getLocalizedText("مكتملة", "Completed", "Terminées")}</SelectItem>
                  <SelectItem value="cancelled">{getLocalizedText("ملغية", "Cancelled", "Annulées")}</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                title={getLocalizedText("تحديث", "Refresh", "Actualiser")}
                data-testid="button-refresh-orders"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Orders */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {getLocalizedText("لا توجد طلبات", "No orders found", "Aucune commande trouvée")}
                  </p>
                  <Link href="/booking">
                    <Button className="mt-4" data-testid="button-book-now">
                      {getLocalizedText("احجز الآن", "Book Now", "Réserver")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-3"
              >
                {filteredOrders.map((order) => (
                  <motion.div key={order.id} variants={fadeInUp}>
                    <Card 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedOrder?.id === order.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedOrder(order)}
                      data-testid={`order-card-${order.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              {order.serviceName 
                                ? getLocalizedText(order.serviceName.ar, order.serviceName.en, order.serviceName.fr)
                                : "Service"}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                              <span>#{order.id.slice(0, 8)}</span>
                              {order.carDetails && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {order.carDetails}
                                </span>
                              )}
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(order.status)} className="shrink-0">
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {order.preferredDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {order.preferredTime}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold text-primary">
                            {order.priceKD} {getLocalizedText("د.ك", "KD", "KD")}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Order Details */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedOrder ? (
                <motion.div
                  key={selectedOrder.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            {selectedOrder.serviceName 
                              ? getLocalizedText(selectedOrder.serviceName.ar, selectedOrder.serviceName.en, selectedOrder.serviceName.fr)
                              : "Service"}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getLocalizedText("رقم الطلب:", "Order ID:", "Numéro de commande:")} #{selectedOrder.id.slice(0, 8)}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(selectedOrder.status)} className="text-sm">
                          {getStatusLabel(selectedOrder.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Timeline */}
                      {selectedOrder.status !== "cancelled" && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <h3 className="font-medium mb-4">
                            {getLocalizedText("حالة الطلب", "Order Progress", "Progression de la commande")}
                          </h3>
                          <div className="space-y-4">
                            {[
                              { key: "pending", icon: CircleDot, label: { ar: "تم استلام الطلب", en: "Order Received", fr: "Commande reçue" } },
                              { key: "assigned", icon: Truck, label: { ar: "تم تخصيص السائق", en: "Driver Assigned", fr: "Chauffeur assigné" } },
                              { key: "in_progress", icon: Car, label: { ar: "قيد التنفيذ", en: "In Progress", fr: "En cours" } },
                              { key: "completed", icon: CheckCircle, label: { ar: "مكتمل", en: "Completed", fr: "Terminé" } },
                            ].map((step, index) => {
                              const currentStep = getStatusStep(selectedOrder.status);
                              const isCompleted = currentStep > index;
                              const isCurrent = currentStep === index + 1;
                              const StepIcon = step.icon;

                              return (
                                <div key={step.key} className="flex items-start gap-3">
                                  <div className="relative">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isCompleted
                                          ? "bg-primary text-white"
                                          : isCurrent
                                          ? "bg-primary/20 text-primary border-2 border-primary"
                                          : "bg-muted border-2 border-muted-foreground/20 text-muted-foreground"
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <StepIcon className="h-4 w-4" />
                                      )}
                                    </div>
                                    {index < 3 && (
                                      <div
                                        className={`absolute top-8 start-1/2 -translate-x-1/2 w-0.5 h-6 ${
                                          isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                                        }`}
                                      />
                                    )}
                                  </div>
                                  <div className="pt-1">
                                    <p className={`font-medium ${isCurrent ? "text-primary" : ""}`}>
                                      {getLocalizedText(step.label.ar, step.label.en, step.label.fr)}
                                    </p>
                                    {isCurrent && (
                                      <p className="text-xs text-muted-foreground">
                                        {getLocalizedText("الحالة الحالية", "Current status", "Statut actuel")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Cancelled Status */}
                      {selectedOrder.status === "cancelled" && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
                          <XCircle className="h-6 w-6 text-destructive" />
                          <div>
                            <p className="font-medium text-destructive">
                              {getLocalizedText("تم إلغاء الطلب", "Order Cancelled", "Commande annulée")}
                            </p>
                            {selectedOrder.cancelReason && (
                              <p className="text-sm text-muted-foreground">{selectedOrder.cancelReason}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Car className="h-4 w-4" />
                            <span className="text-xs">{getLocalizedText("نوع السيارة", "Car Type", "Type de voiture")}</span>
                          </div>
                          <p className="font-medium">
                            {selectedOrder.carType === "suv" ? "SUV" : getLocalizedText("سيدان", "Sedan", "Berline")}
                          </p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <MapPin className="h-4 w-4" />
                            <span className="text-xs">{getLocalizedText("المنطقة", "Area", "Zone")}</span>
                          </div>
                          <p className="font-medium">{selectedOrder.area}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs">{getLocalizedText("التاريخ", "Date", "Date")}</span>
                          </div>
                          <p className="font-medium">{selectedOrder.preferredDate}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">{getLocalizedText("الوقت", "Time", "Heure")}</span>
                          </div>
                          <p className="font-medium">{selectedOrder.preferredTime}</p>
                        </div>
                      </div>

                      {/* Price & Points */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {getLocalizedText("المبلغ الإجمالي", "Total Amount", "Montant total")}
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {selectedOrder.priceKD} {getLocalizedText("د.ك", "KD", "KD")}
                          </p>
                        </div>
                        {selectedOrder.loyaltyPointsEarned > 0 && (
                          <Badge variant="secondary" className="text-sm">
                            +{selectedOrder.loyaltyPointsEarned} {getLocalizedText("نقطة مكتسبة", "points earned", "points gagnés")}
                          </Badge>
                        )}
                        {selectedOrder.discountApplied > 0 && (
                          <Badge variant="secondary" className="text-sm">
                            -{selectedOrder.discountApplied} {getLocalizedText("د.ك خصم", "KD discount", "KD réduction")}
                          </Badge>
                        )}
                      </div>

                      {/* Order Created Date */}
                      <p className="text-xs text-muted-foreground text-center">
                        {getLocalizedText("تاريخ الطلب:", "Order placed:", "Commande passée:")} {formatDate(selectedOrder.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex items-center justify-center"
                >
                  <Card className="w-full">
                    <CardContent className="p-12 text-center">
                      <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg">
                        {getLocalizedText(
                          "اختر طلباً لعرض التفاصيل",
                          "Select an order to view details",
                          "Sélectionnez une commande pour voir les détails"
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
