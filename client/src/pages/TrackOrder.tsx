import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Car, MapPin, Clock, Calendar, Package, Check, ChevronRight, 
  Filter, ArrowLeft, Truck, CircleDot, CheckCircle, XCircle, 
  RefreshCw, FileText, CreditCard, Star, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useFirestoreOrders, type OrderFilter } from "@/hooks/use-firestore-orders";
import type { FirestoreOrderWithId } from "@/types/firestore-order";
import { ORDER_STATUS_CONFIG } from "@/types/firestore-order";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function TrackOrder() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<FirestoreOrderWithId | null>(null);

  const { 
    filteredOrders, 
    lastCompletedOrder, 
    isLoading, 
    error,
    filter, 
    setFilter, 
    refetch 
  } = useFirestoreOrders();

  const getLocalizedText = (ar: string, en: string, fr: string) => {
    return i18n.language === "ar" ? ar : i18n.language === "fr" ? fr : en;
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const getStatusLabel = (status: string) => {
    const config = ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG];
    if (!config) return status;
    return getLocalizedText(config.labelAr, config.labelEn, config.labelFr);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    if (status === "completed") return "default";
    if (status === "cancelled") return "destructive";
    return "secondary";
  };

  const getStatusStep = (status: string) => {
    const config = ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG];
    return config?.step || 0;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(i18n.language === "ar" ? "ar-KW" : i18n.language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString(i18n.language === "ar" ? "ar-KW" : i18n.language === "fr" ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isLastCompleted = (order: FirestoreOrderWithId) => {
    return lastCompletedOrder?.id === order.id;
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
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {getLocalizedText("تحديث لحظي", "Real-time updates", "Mises à jour en temps réel")}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Filter and Refresh */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={filter} onValueChange={(v) => setFilter(v as OrderFilter)}>
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
                onClick={refetch}
                title={getLocalizedText("تحديث", "Refresh", "Actualiser")}
                data-testid="button-refresh-orders"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Error State */}
            {error && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="p-4 text-center">
                  <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={refetch}>
                    {getLocalizedText("إعادة المحاولة", "Retry", "Réessayer")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
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
                      } ${isLastCompleted(order) ? "border-green-500/50" : ""}`}
                      onClick={() => setSelectedOrder(order)}
                      data-testid={`order-card-${order.id}`}
                    >
                      <CardContent className="p-4">
                        {/* Last Completed Badge */}
                        {isLastCompleted(order) && (
                          <div className="flex items-center gap-1 mb-2">
                            <Sparkles className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-medium text-green-600">
                              {getLocalizedText("آخر طلب منتهي", "Last Completed", "Dernière terminée")}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              {order.serviceType || "Service"}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                              <span className="font-mono">{order.orderCode}</span>
                              {order.vehicleInfo?.plateLast && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {order.vehicleInfo.plateLast}
                                </span>
                              )}
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(order.status)} className="shrink-0">
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        
                        {/* Vehicle Info */}
                        {order.vehicleInfo && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Car className="h-3 w-3" />
                            <span>
                              {order.vehicleInfo.make} {order.vehicleInfo.model}
                              {order.vehicleInfo.color && ` - ${order.vehicleInfo.color}`}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(order.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold text-primary">
                            {order.totalPrice} {getLocalizedText("د.ك", "KD", "KD")}
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

          {/* Order Details Panel */}
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
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          {isLastCompleted(selectedOrder) && (
                            <Badge className="bg-green-600 mb-2">
                              <Sparkles className="h-3 w-3 me-1" />
                              {getLocalizedText("آخر طلب منتهي", "Last Completed Order", "Dernière commande terminée")}
                            </Badge>
                          )}
                          <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            {selectedOrder.serviceType || "Service"}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1 font-mono">
                            {getLocalizedText("كود الطلب:", "Order Code:", "Code de commande:")} {selectedOrder.orderCode}
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
                              { key: "on_the_way", icon: MapPin, label: { ar: "في الطريق", en: "On The Way", fr: "En Route" } },
                              { key: "in_progress", icon: Car, label: { ar: "قيد التنفيذ", en: "In Progress", fr: "En cours" } },
                              { key: "completed", icon: CheckCircle, label: { ar: "مكتمل", en: "Completed", fr: "Terminé" } },
                            ].map((step, index) => {
                              const statusOrder = ["pending", "assigned", "on_the_way", "in_progress", "completed"];
                              const currentIdx = statusOrder.indexOf(selectedOrder.status);
                              const stepIdx = statusOrder.indexOf(step.key);
                              const isCompleted = stepIdx < currentIdx;
                              const isCurrent = stepIdx === currentIdx;
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
                                        <StepIcon className={`h-4 w-4 ${isCurrent && step.key === "on_the_way" ? "animate-pulse" : ""}`} />
                                      )}
                                    </div>
                                    {index < 4 && (
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
                                    {selectedOrder.driverName && step.key === "assigned" && (
                                      <p className="text-xs text-muted-foreground">
                                        {selectedOrder.driverName}
                                      </p>
                                    )}
                                    {isCurrent && step.key === "on_the_way" && (
                                      <p className="text-xs text-primary">
                                        {getLocalizedText("السائق في الطريق إليك", "Driver is on the way to you", "Le chauffeur est en route")}
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
                        {/* Vehicle */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Car className="h-4 w-4" />
                            <span className="text-xs">{getLocalizedText("السيارة", "Vehicle", "Véhicule")}</span>
                          </div>
                          <p className="font-medium text-sm">
                            {selectedOrder.vehicleInfo?.make} {selectedOrder.vehicleInfo?.model}
                          </p>
                          {selectedOrder.vehicleInfo?.plateLast && (
                            <p className="text-xs text-muted-foreground">{selectedOrder.vehicleInfo.plateLast}</p>
                          )}
                        </div>
                        
                        {/* Area */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <MapPin className="h-4 w-4" />
                            <span className="text-xs">{getLocalizedText("المنطقة", "Area", "Zone")}</span>
                          </div>
                          <p className="font-medium text-sm">{selectedOrder.address?.area}</p>
                          {selectedOrder.address?.block && (
                            <p className="text-xs text-muted-foreground">Block {selectedOrder.address.block}</p>
                          )}
                        </div>
                        
                        {/* Date */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs">{getLocalizedText("التاريخ", "Date", "Date")}</span>
                          </div>
                          <p className="font-medium text-sm">{formatDate(selectedOrder.createdAt)}</p>
                        </div>
                        
                        {/* Payment */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <CreditCard className="h-4 w-4" />
                            <span className="text-xs">{getLocalizedText("الدفع", "Payment", "Paiement")}</span>
                          </div>
                          <p className="font-medium text-sm capitalize">{selectedOrder.paymentMethod.replace("_", " ")}</p>
                        </div>
                      </div>

                      {/* Notes */}
                      {selectedOrder.address?.notes && (
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            {getLocalizedText("ملاحظات", "Notes", "Remarques")}
                          </p>
                          <p className="text-sm">{selectedOrder.address.notes}</p>
                        </div>
                      )}

                      {/* Price & Points */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {getLocalizedText("المبلغ الإجمالي", "Total Amount", "Montant total")}
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {selectedOrder.totalPrice} {getLocalizedText("د.ك", "KD", "KD")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedOrder.loyaltyPointsEarned > 0 && (
                            <Badge variant="secondary" className="text-sm">
                              <Star className="h-3 w-3 me-1" />
                              +{selectedOrder.loyaltyPointsEarned} {getLocalizedText("نقطة مكتسبة", "points earned", "points gagnés")}
                            </Badge>
                          )}
                          {selectedOrder.discountApplied > 0 && (
                            <Badge variant="secondary" className="text-sm">
                              -{selectedOrder.discountApplied} {getLocalizedText("د.ك خصم", "KD discount", "KD réduction")}
                            </Badge>
                          )}
                          {selectedOrder.loyaltyPointsRedeemed > 0 && (
                            <Badge variant="outline" className="text-sm">
                              {selectedOrder.loyaltyPointsRedeemed} {getLocalizedText("نقطة مستخدمة", "points used", "points utilisés")}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Order Timestamps */}
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {getLocalizedText("تاريخ الطلب:", "Created:", "Créé:")} {formatDate(selectedOrder.createdAt)}
                        </span>
                        <span>
                          {getLocalizedText("آخر تحديث:", "Updated:", "Mis à jour:")} {formatDate(selectedOrder.updatedAt)}
                        </span>
                      </div>
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
